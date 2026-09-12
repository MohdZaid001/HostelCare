import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm";
import { SUPABASE_URL, SUPABASE_ANON_KEY } from "./config.js";

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true }
});
const $ = id => document.getElementById(id);
const esc = x => String(x ?? "").replace(/[&<>"']/g, m => ({
  "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;"
}[m]));
const statusClass = s => String(s || "").toLowerCase().replaceAll(" ", "-");

async function current() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    location.replace("login.html");
    return null;
  }

  const { data: p, error } = await supabase
    .from("profiles")
    .select("full_name, role")
    .eq("user_id", user.id)
    .single();

  if (error || !p) {
    await supabase.auth.signOut();
    location.replace("login.html");
    return null;
  }

  // A worker must never use student routes, even by manually entering a URL.
  if (p.role !== "student") {
    location.replace("worker.html");
    return null;
  }

  return { user, profile: p };
}

function card(c) {
  return `<a class="complaint-item" href="complaint.html?id=${encodeURIComponent(c.id)}">
    <div class="row"><div><h3>#${esc(c.id)} · ${esc(c.title)}</h3>
    <p>${esc(c.category)} · ${esc(c.location)}</p></div>
    <span class="status-text ${statusClass(c.status)}">${esc(c.status)}</span></div>
    <p>${esc(c.priority)} priority · ${new Date(c.created_at).toLocaleDateString()}</p>
  </a>`;
}

async function loadDashboard() {
  const ctx = await current();
  if (!ctx) return;

  const { user, profile } = ctx;
  if ($("userName")) $("userName").textContent = (profile.full_name || "there").split(" ")[0] + ".";

  const { data: c, error } = await supabase
    .from("complaints")
    .select("*")
    .eq("student_id", user.id)
    .order("created_at", { ascending: false });

  if (error) {
    if ($("complaintList")) $("complaintList").innerHTML = `<div class="empty">${esc("Unable to load complaints.")}</div>`;
    return;
  }

  const complaints = c || [];
  if ($("totalCount")) {
    $("totalCount").textContent = complaints.length;
    $("progressCount").textContent = complaints.filter(x => x.status === "In Progress").length;
    $("resolvedCount").textContent = complaints.filter(x => x.status === "Resolved").length;
  }

  if ($("complaintList")) {
    $("complaintList").innerHTML = complaints.length
      ? complaints.slice(0, 5).map(card).join("")
      : `<div class="empty">Nothing here yet. <a href="report.html">Report a problem →</a></div>`;
  }

  if ($("allComplaints")) {
    const render = arr => {
      $("allComplaints").innerHTML = arr.length
        ? arr.map(card).join("")
        : `<div class="empty">No complaints in this category.</div>`;
    };
    document.querySelectorAll(".filter").forEach(b => b.onclick = () => {
      document.querySelectorAll(".filter").forEach(x => x.classList.remove("active"));
      b.classList.add("active");
      render(b.dataset.filter === "All" ? complaints : complaints.filter(x => x.status === b.dataset.filter));
    });
    render(complaints);
  }
}

if ($("complaintForm")) {
  (async () => {
    const ctx = await current();
    if (!ctx) return;

    $("complaintForm").onsubmit = async e => {
      e.preventDefault();
      const formMessage = $("formMessage");
      formMessage.textContent = "Submitting...";

      const title = $("title").value.trim();
      const category = $("category").value;
      const locationValue = $("location").value.trim();
      const priority = $("priority").value;
      const description = $("description").value.trim();

      if (title.length < 3 || title.length > 100) return formMessage.textContent = "Title must be 3–100 characters.";
      if (locationValue.length < 2 || locationValue.length > 150) return formMessage.textContent = "Location must be 2–150 characters.";
      if (description.length < 10 || description.length > 2000) return formMessage.textContent = "Description must be 10–2000 characters.";

      const { data, error } = await supabase.from("complaints").insert({
        student_id: ctx.user.id,
        title,
        category,
        location,
        priority,
        description,
        status: "Pending"
      }).select("id").single();

      if (error) {
        formMessage.textContent = "Unable to submit the complaint. Please try again.";
        return;
      }
      location.replace(`complaint.html?id=${encodeURIComponent(data.id)}`);
    };
  })();
}

async function loadDetail() {
  const ctx = await current();
  if (!ctx) return;

  const id = new URLSearchParams(location.search).get("id");
  if (!id || !/^\d+$/.test(id)) {
    $("detailContent").innerHTML = `<div class="empty">Complaint not found.</div>`;
    return;
  }

  const { data: c, error } = await supabase
    .from("complaints")
    .select("*")
    .eq("id", Number(id))
    .eq("student_id", ctx.user.id)
    .single();

  if (error || !c) {
    $("detailContent").innerHTML = `<div class="empty">Complaint not found.</div>`;
    return;
  }
  renderDetail(c, ctx.user);
}

function renderDetail(c, user) {
  const statuses = ["Pending", "Assigned", "In Progress", "Resolved"];
  const index = Math.max(0, statuses.indexOf(c.status));

  $("detailContent").innerHTML = `<div class="eyebrow">COMPLAINT #${esc(c.id)}</div><div class="detail-card">
    <div class="row"><span class="status-pill progress">${esc(c.status)}</span>
    <button class="btn btn-small" id="refreshStatus">↻</button></div>
    <h1 class="detail-title">${esc(c.title)}</h1>
    <p class="muted">${esc(c.category)} · ${esc(c.location)} · ${esc(c.priority)} priority</p>
    <div class="detail-description">${esc(c.description)}</div>
    <div class="timeline detail-timeline">${statuses.map((s, i) => {
      const done = i <= index;
      const active = i === index && c.status !== "Resolved";
      return `<div class="time-item ${done ? "done" : ""} ${active ? "active" : ""}">
        <i>${done ? "✓" : "○"}</i><span><b>${s}</b>
        <small>${i === index ? (c.status === "Resolved" ? "Completed" : "Current status") : i < index ? "Completed" : "Waiting"}</small>
        </span></div>`;
    }).join("")}</div>
    <div class="worker-row"><span class="avatar">WC</span><div><small>WORKER ASSIGNMENT</small>
    <strong>${c.worker_id ? "Worker assigned" : "Waiting for assignment"}</strong>
    <small>${c.worker_id ? "Your complaint has an active worker." : "A worker can take this from the worker queue."}</small></div></div>
    ${c.resolution_notes ? `<div class="feedback-box"><div class="eyebrow">WORKER UPDATE</div>
      <p>${esc(c.resolution_notes)}</p><small class="muted">Last updated: ${new Date(c.updated_at).toLocaleString()}</small></div>` : ""}
    ${c.status === "Resolved" ? `<div class="feedback-box"><div class="eyebrow">FEEDBACK</div>
      <h3>Was this issue resolved properly?</h3>
      <div class="stars">${[1,2,3,4,5].map(n => `<span class="star" data-rating="${n}">★</span>`).join("")}</div>
      <textarea id="feedbackComment" maxlength="1000" placeholder="Tell us about your experience..."></textarea><br><br>
      <button class="btn" id="feedbackBtn">Submit feedback ↗</button><div id="feedbackMsg" class="message"></div></div>` : ""}
  </div>`;

  $("refreshStatus")?.addEventListener("click", loadDetail);

  if (c.status === "Resolved" && $("feedbackBtn")) {
    let rating = 0;
    document.querySelectorAll(".star").forEach(s => s.onclick = () => {
      rating = Number(s.dataset.rating);
      document.querySelectorAll(".star").forEach(x =>
        x.classList.toggle("active", Number(x.dataset.rating) <= rating)
      );
    });

    $("feedbackBtn").onclick = async () => {
      if (!rating) return $("feedbackMsg").textContent = "Please select a rating.";
      const comment = $("feedbackComment").value.trim();
      if (comment.length > 1000) return $("feedbackMsg").textContent = "Feedback must be 1000 characters or less.";

      $("feedbackBtn").disabled = true;
      const { error } = await supabase.from("feedback").insert({
        complaint_id: c.id,
        student_id: user.id,
        rating,
        comment: comment || null
      });

      if (error) {
        $("feedbackBtn").disabled = false;
        $("feedbackMsg").textContent = error.code === "23505"
          ? "Feedback already submitted."
          : "Unable to submit feedback. Please try again.";
        return;
      }
      $("feedbackMsg").textContent = "Thanks for your feedback!";
    };
  }
}

// No polling here. The student refreshes manually using the existing button.
if ($("detailContent")) loadDetail();
if ($("complaintList") || $("allComplaints")) loadDashboard();
if ($("logoutBtn")) $("logoutBtn").onclick = async () => {
  await supabase.auth.signOut();
  location.replace("index.html");
};
