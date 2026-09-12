import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm";
import { SUPABASE_URL, SUPABASE_ANON_KEY } from "./config.js";

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true }
});
const $ = id => document.getElementById(id);

function msg(text) {
  if ($("authMessage")) $("authMessage").textContent = text;
}

async function getProfile(userId) {
  return supabase
    .from("profiles")
    .select("user_id, full_name, email, role")
    .eq("user_id", userId)
    .single();
}

async function currentContext() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data: profile, error } = await getProfile(user.id);
  if (error || !profile) return null;
  return { user, profile };
}

if ($("signupForm")) {
  // Public signup is student-only. Worker accounts are provisioned separately.
  $("signupForm").onsubmit = async e => {
    e.preventDefault();
    msg("Creating account...");

    const name = $("name").value.trim();
    const email = $("email").value.trim().toLowerCase();
    const password = $("password").value;
    const confirm = $("confirm").value;

    if (name.length < 2 || name.length > 100) return msg("Enter a valid name.");
    if (password !== confirm) return msg("Passwords do not match.");
    if (password.length < 8) return msg("Password must be at least 8 characters.");

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: name } }
    });

    if (error) return msg(error.message);

    // The database trigger creates the student profile from auth metadata.
    // No client-side role/profile write is trusted here.
    msg("Account created. Check your email if confirmation is enabled.");
    setTimeout(() => location.replace("login.html"), 1000);
  };
}

if ($("loginForm")) {
  $("loginForm").onsubmit = async e => {
    e.preventDefault();
    msg("Logging in...");

    const email = $("email").value.trim().toLowerCase();
    const password = $("password").value;

    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return msg(error.message);

    const { data: p, error: pErr } = await getProfile(data.user.id);
    if (pErr || !p) {
      await supabase.auth.signOut();
      return msg("Your account profile is missing. Please contact support.");
    }

    location.replace(p.role === "worker" ? "worker.html" : "dashboard.html");
  };
}

if ($("logoutBtn")) {
  $("logoutBtn").onclick = async () => {
    await supabase.auth.signOut();
    location.replace("index.html");
  };
}

if ($("profileName")) {
  (async () => {
    const ctx = await currentContext();
    if (!ctx) {
      location.replace("login.html");
      return;
    }

    const { user, profile: p } = ctx;
    $("profileName").textContent = p.full_name;
    $("profileEmail").textContent = p.email;
    $("profileRole").textContent = p.role.toUpperCase();
    $("avatar").textContent = p.full_name
      .split(/\s+/)
      .map(x => x[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();

    // Keep the same visual design, but make profile navigation role-aware.
    const dashboardLink = document.querySelector('a[data-nav="dashboard"]');
    const complaintsLink = document.querySelector('a[data-nav="complaints"]');
    const reportLink = document.querySelector('a[data-nav="report"]');
    const brandLink = document.querySelector(".brand");

    if (p.role === "worker") {
      if (dashboardLink) dashboardLink.href = "worker.html";
      if (complaintsLink) complaintsLink.remove();
      if (reportLink) reportLink.remove();
      if (brandLink) brandLink.href = "worker.html";
    } else {
      if (dashboardLink) dashboardLink.href = "dashboard.html";
      if (complaintsLink) complaintsLink.href = "complaints.html";
      if (reportLink) reportLink.href = "report.html";
      if (brandLink) brandLink.href = "dashboard.html";
    }
  })();
}
