# 🏠 HostelCare

### **Report it. Track it. Fix it.**

HostelCare is a web-based hostel and mess service management platform designed to bridge the gap between **student complaints and actual service improvement**.

Students can report problems, workers can take and resolve complaints, and students can track the complete progress of their complaint from submission to resolution.

---

## 🚨 Problem Statement

In large residential campuses, students frequently face problems related to:

- 🚿 Water supply and leakage
- ⚡ Electricity
- 🧹 Cleaning
- 📶 Wi-Fi
- 🛠️ Hostel maintenance
- 🍽️ Mess and dining services
- 🏠 General hostel facilities

The main problem is not always the absence of a complaint system. The bigger issue is the gap between:

> **Student reports a problem → Someone actually takes responsibility → Problem gets resolved → Student knows what happened**

HostelCare focuses on closing this complete loop.

---

## 💡 Our Solution

HostelCare creates a simple service workflow:

```text
Student
   ↓
Report Problem
   ↓
Pending
   ↓
Worker Takes Complaint
   ↓
Assigned
   ↓
In Progress
   ↓
Resolved
   ↓
Student Feedback
```

Every complaint has a visible status and an assigned worker, making the process more transparent.

---

# ✨ Key Features

## 👨‍🎓 Student Features

### 1. Create Complaint

Students can report a hostel or mess-related problem by providing:

- Complaint title
- Description
- Category
- Location
- Priority

Example:

> **Water leakage in Block 32, Room 204**

---

### 2. Complaint Tracking

Students can track their complaint through a visual status timeline:

```text
● Pending
│
● Assigned
│
● In Progress
│
● Resolved
```

The student does not have to repeatedly ask staff about the complaint.

---

### 3. Complaint History

Students can view their previous complaints and filter them based on their status.

---

### 4. Worker Updates

Once a worker works on a complaint, they can add resolution notes.

Example:

> "Leak repaired and the area was checked."

The student can see this update from the complaint tracking page.

---

### 5. Feedback

After a complaint is resolved, students can provide:

- ⭐ 1–5 star rating
- Written feedback

This creates a feedback loop after the actual service has been delivered.

---

# 👷 Worker Features

## 1. New Problems Queue

Workers can see complaints that have not yet been assigned.

```text
NEW PROBLEMS

#104  Water leakage
Block 32

[ Take Complaint ]
```

---

## 2. Take Complaint

Instead of manually assigning workers through the database, a worker can simply click:

**Take Complaint**

The system automatically:

```text
worker_id = logged-in worker
status = Assigned
```

This makes the assignment process simple and practical.

---

## 3. Update Complaint Status

Workers can update complaints through:

```text
Assigned
     ↓
In Progress
     ↓
Resolved
```

---

## 4. Resolution Notes

Workers can explain what action was taken.

This gives students visibility into the actual resolution.

---

## 5. Worker Dashboard

Workers can see:

- New complaints
- Assigned complaints
- In-progress complaints
- Resolved complaints

---

# 🔐 Authentication & Roles

HostelCare supports two roles:

### Student

Can:

- Create complaints
- View own complaints
- Track complaints
- Submit feedback

### Worker

Can:

- View available complaints
- Take complaints
- Update assigned complaints
- Add resolution notes
- Resolve complaints

There is intentionally **no separate admin role** in the current MVP.

---

### Frontend

```text
HTML
CSS
JavaScript
```

### Data / Security Layer

```text
Supabase Auth
        +
Supabase PostgreSQL
        +
Row Level Security (RLS)
        +
Secure RPC functions
```

The Python service in `backend/main.py` is only a local health-check endpoint. It does
not contain database credentials or accept application SQL/data. The browser talks to
Supabase using the publishable/anon key, while PostgreSQL RLS and RPC authorization
enforce access control.

---

# 📁 Project Structure

```text
HostelCare/
│
│
├── backend/
│   ├── main.py
│   └── requirements.txt
│
├── css/
│   └── style.css
│
├── js/
│   ├── auth.js
│   ├── config.example.js
│   ├── config.js
│   ├── main.js
│   ├── student.js
│   └── worker.js
│
├── .gitignore
│
├── complaint.html
├── complaints.html
├── dashboard.html
├── favicon.svg
├── index.html
├── login.html
├── profile.html
├── README.md
├── report.html
├── signup.html
├── SUPABASE_SCHEMA.sql
├── worker-complaint.html
└── worker.html
```

---

# 🗄️ Database Structure

HostelCare primarily uses three tables.

## `profiles`

Stores user information.

```text
profiles
├── id
├── user_id
├── full_name
├── email
├── role
└── created_at
```

Roles:

```text
student
worker
```

---

## `complaints`

Stores reported problems.

```text
complaints
├── id
├── student_id
├── worker_id
├── title
├── description
├── category
├── location
├── priority
├── status
├── resolution_notes
├── created_at
└── updated_at
```

---

## `feedback`

Stores student feedback after resolution.

```text
feedback
├── id
├── complaint_id
├── student_id
├── rating
├── comment
└── created_at
```

---

# ⚙️ Setup

## 1. Clone / Download Project

Open the project in VS Code.

---

## 2. Create Supabase Project

Create a project in Supabase.

Then open:

```text
Supabase
→ SQL Editor
```

Run:

```text
SUPABASE_SCHEMA.sql
```

---

## 3. Configure Supabase

Open:

```text
js/config.js
```

Add your:

```javascript
SUPABASE_URL
SUPABASE_ANON_KEY
```

Use the **anon/publishable key**.

Do not put your Supabase `service_role` key in frontend JavaScript.

---

## 4. Enable Authentication

In Supabase:

```text
Authentication
→ Providers
→ Email
```

Enable Email authentication.

For a hackathon demo, email confirmation can be disabled temporarily to make testing faster.

---

# ▶️ Running the Project

The easiest way is using **VS Code Live Server**.

Open:

```text
index.html
```

Then:

```text
Open with Live Server
```

The application will open in your browser.

---

# 🧪 Demo Flow

For a hackathon presentation, use two accounts.

### Account 1 — Student

```text
Student
```

### Account 2 — Worker

```text
Worker
```

---

## Step 1 — Student Reports

Student logs in and creates:

```text
Title:
Water Leakage in Block 32

Category:
Water

Location:
Block 32

Priority:
High
```

Complaint status:

```text
Pending
```

---

## Step 2 — Worker Receives Problem

Worker logs in.

Worker dashboard shows:

```text
NEW PROBLEMS

Water Leakage in Block 32

[ Take Complaint ]
```

Worker clicks:

**Take Complaint**

Status becomes:

```text
Assigned
```

---

## Step 3 — Worker Starts Work

Worker opens the complaint and changes:

```text
Assigned
      ↓
In Progress
```

---

## Step 4 — Worker Resolves

Worker adds:

```text
Resolution Notes:

Leak repaired and the area was checked.
```

Then changes:

```text
In Progress
      ↓
Resolved
```

---

## Step 5 — Student Tracks

Student's complaint page now displays:

```text
✓ Pending
│
✓ Assigned
│
✓ In Progress
│
● Resolved
```

The resolution note is also visible.

---

## Step 6 — Student Gives Feedback

Student can provide:

```text
★★★★★

"The issue was resolved quickly."
```

This completes the service loop.

---


# 🔐 Security Model

HostelCare is designed so that frontend JavaScript is **not the security boundary**.

### SQL Injection

The application does not concatenate user input into SQL statements. Supabase client
queries are parameterized through its API, and the two privileged database operations
are implemented as PostgreSQL functions with typed parameters.

### Authorization

- Students can read only their own complaints.
- Students can create complaints only for their own account.
- Workers can read the unassigned Pending queue and their own assigned complaints.
- Workers cannot directly update complaints; status changes use an authorized RPC.
- A worker cannot claim a complaint already claimed by another worker.
- Feedback is accepted only from the student who owns a Resolved complaint.
- Public signup always creates a `student` profile.
- Users cannot change their own role from `student` to `worker`.

### Input Validation

Frontend validation improves usability, while PostgreSQL constraints enforce maximum
lengths and valid enum values at the database layer.

### XSS Protection

User-controlled values rendered into HTML are escaped before interpolation.

### Secrets

Only the Supabase publishable/anon key belongs in frontend configuration. Never put
`service_role`, database passwords, private API keys, or other secrets in JavaScript,
HTML, GitHub, or the client bundle.

### Student Tracking

The student complaint detail page no longer polls every few seconds. The existing
manual **Refresh status** button is used when the student wants to check progress, so
the feedback UI is not unexpectedly rebuilt.

### Role-based Navigation

Student and worker pages perform role checks. Worker profiles do not expose student
navigation, and direct URL attempts to the other role's pages are redirected.

# 📊 Why HostelCare Is Different

Traditional complaint systems often stop at:

```text
Complaint Submitted
```

HostelCare focuses on the complete lifecycle:

```text
REPORT
   ↓
ASSIGN
   ↓
ACTION
   ↓
RESOLVE
   ↓
TRACK
   ↓
FEEDBACK
```

The important part is **accountability**.

A complaint is not simply stored.

It gets:

- An owner
- A status
- A resolution
- Student visibility
- Post-resolution feedback

---

# 👨‍💻 Project

**Project Name:** HostelCare

**Tagline:**  
> **Report it. Track it. Fix it.**

**Domain:**  
Hostel & Mess Services

**Built With:**  
HTML · CSS · JavaScript · Python · Supabase

---

## ⭐ Core Idea

> **A complaint is not complete when it is submitted. It is complete when the student knows it was resolved.**

---

## 👨‍💻 Developer

Team Leader: ***Mohd Zaid***

Team Mates: ***Abhi Choudhary, Bhavya Mundhra***

**CodeFlux Hackathon**
