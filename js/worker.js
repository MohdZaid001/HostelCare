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

async function getWorker() {
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

  // Defense-in-depth route guard. RLS/RPC remains the real security boundary.
  if (p.role !== "worker") {
    location.replace("dashboard.html");
    return null;
  }

  return { user, profile: p };
}

function card(c, take = false) {
  return `<div class="complaint-item">
    <a href="worker-complaint.html?id=${encodeURIComponent(c.id)}" style="text-decoration:none;color:inherit;display:block">
      <div class="row"><div><h3>#${esc(c.id)} · ${esc(c.title)}</h3>
      <p>${esc(c.category)} · ${esc(c.location)}</p></div>
      <span class="status-text ${statusClass(c.status)}">${esc(c.status)}</span></div>
      <p>${esc(c.priority)} priority · ${new Date(c.created_at).toLocaleDateString()}</p>
    </a>
    ${take ? `<button class="btn btn-small take-btn" data-id="${esc(c.id)}">Take complaint ↗</button>` : ""}
  </div>`;
}

async function takeComplaint(id) {
  const numericId = Number(id);
  if (!Number.isSafeInteger(numericId) || numericId <= 0) return;

  const btn = document.querySelector(`.take-btn[data-id="${CSS.escape(String(id))}"]`);
  if (btn) {
    btn.disabled = true;
    btn.textContent = "Taking...";
  }

  const { error } = await supabase.rpc("take_complaint", { p_complaint_id: numericId });
  if (error) {
    if (btn) {
      btn.disabled = false;
      btn.textContent = "Take complaint ↗";
    }
    alert("Unable to take this complaint. It may already be assigned.");
    return;
  }
  await loadDashboard();
}

async function loadDashboard() {
  const ctx = await getWorker();
  if (!ctx) return;

  const { data: all, error } = await supabase
    .from("complaints")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    $("queueList").innerHTML = `<div class="empty">Unable to load complaints.</div>`;
    return;
  }

  const complaints = all || [];
  const queue = complaints.filter(c => !c.worker_id && c.status === "Pending");
  const mine = complaints.filter(c => c.worker_id === ctx.user.id);

  $("queueCount").textContent = queue.length;
  $("assignedCount").textContent = mine.filter(c => c.status === "Assigned").length;
  $("workerProgress").textContent = mine.filter(c => c.status === "In Progress").length;
  $("workerResolved").textContent = mine.filter(c => c.status === "Resolved").length;

  $("queueList").innerHTML = queue.length
    ? queue.map(c => card(c, true)).join("")
    : `<div class="empty">No new problems right now. 🎉</div>`;
  $("workerList").innerHTML = mine.length
    ? mine.map(c => card(c)).join("")
    : `<div class="empty">You have no assigned complaints yet.</div>`;

  document.querySelectorAll(".take-btn").forEach(b =>
    b.onclick = () => takeComplaint(b.dataset.id)
  );
}

async function loadWorkerDetail() {
  const ctx = await getWorker();
  if (!ctx) return;

  const id = new URLSearchParams(location.search).get("id");
  if (!id || !/^\d+$/.test(id)) {
    $("workerDetail").innerHTML = `<div class="empty">Complaint not found.</div>`;
    return;
  }

  const { data: c, error } = await supabase
    .from("complaints")
    .select("*")
    .eq("id", Number(id))
    .single();

  if (error || !c) {
    $("workerDetail").innerHTML = `<div class="empty">Complaint not found.</div>`;
    return;
  }

  const unassigned = !c.worker_id && c.status === "Pending";
  if (c.worker_id && c.worker_id !== ctx.user.id) {
    $("workerDetail").innerHTML = `<div class="empty">This complaint is assigned to another worker.</div>`;
    return;
  }

  $("workerDetail").innerHTML = `<div class="eyebrow">MANAGE COMPLAINT #${esc(c.id)}</div><div class="detail-card">
    <div class="row"><span class="status-pill progress">${esc(c.status)}</span>
    ${unassigned ? `<button class="btn btn-small" id="takeDetailBtn">Take complaint ↗</button>` : ""}</div>
    <h1 class="detail-title">${esc(c.title)}</h1>
    <div class="detail-meta"><span>${esc(c.category)}</span><span>${esc(c.location)}</span><span>${esc(c.priority)} PRIORITY</span></div>
    <div class="detail-description">${esc(c.description)}</div>
    ${unassigned ? `<div class="message">This problem is waiting for a worker. Take it to start handling it.</div>` :
    `<br><form id="updateForm">
      <label>Update status<select id="status">
      ${["Assigned", "In Progress", "Resolved", "Rejected"].map(s => `<option ${c.status === s ? "selected" : ""}>${s}</option>`).join("")}
      </select></label>
      <label>Resolution notes<textarea id="notes" maxlength="2000" placeholder="What did you do? What was fixed?">${esc(c.resolution_notes || "")}</textarea></label>
      <div id="updateMsg" class="message"></div><button class="btn" type="submit">Save update ↗</button>
    </form>`}
  </div>`;

  if ($("takeDetailBtn")) {
    $("takeDetailBtn").onclick = async () => {
      $("takeDetailBtn").disabled = true;
      $("takeDetailBtn").textContent = "Taking...";
      const { error: takeError } = await supabase.rpc("take_complaint", {
        p_complaint_id: Number(c.id)
      });
      if (takeError) {
        $("takeDetailBtn").disabled = false;
        $("takeDetailBtn").textContent = "Take complaint ↗";
        alert("Unable to take this complaint. It may already be assigned.");
        return;
      }
      await loadWorkerDetail();
    };
  }

  if ($("updateForm")) {
    $("updateForm").onsubmit = async e => {
      e.preventDefault();
      $("updateMsg").textContent = "Saving...";

      const status = $("status").value;
      const notes = $("notes").value.trim();
      if (notes.length > 2000) {
        $("updateMsg").textContent = "Resolution notes must be 2000 characters or less.";
        return;
      }

      // All authorization and status-transition checks happen inside this RPC.
      const { error: updateError } = await supabase.rpc("update_complaint_status", {
        p_complaint_id: Number(c.id),
        p_status: status,
        p_resolution_notes: notes || null
      });

      if (updateError) {
        $("updateMsg").textContent = updateError.message.includes("transition")
          ? updateError.message
          : "Unable to update this complaint.";
        return;
      }

      $("updateMsg").textContent = "Updated. Student tracking now has the new status.";
      setTimeout(() => location.replace("worker.html"), 500);
    };
  }
}

if ($("workerList")) {
  (async () => {
    await loadDashboard();
    $("refreshWorker")?.addEventListener("click", loadDashboard);
    // Worker dashboard polling is retained because it is a work queue; student
    // complaint detail no longer polls and therefore will not refresh the feedback form.
    setInterval(loadDashboard, 10000);
  })();
}
if ($("workerDetail")) loadWorkerDetail();
if ($("logoutBtn")) $("logoutBtn").onclick = async () => {
  await supabase.auth.signOut();
  location.replace("index.html");
};
