# CampusFlow OS

**The operating system for campus placements.** A complete placement pipeline — drives, aptitude
tests, shortlisting and interviews — where the *system* does the scheduling and students just
show up. Built with real OS concepts (locks, critical sections, scheduling, Banker's algorithm)
running on a real database.

Built by a 4-member team for an undergraduate PBL evaluation (Operating Systems + DBMS).

---

## ✨ Features implemented

### 🎓 Student portal
- **Find drives** — only drives matching your profile (CGPA, branch, backlogs, graduation year) are shown
- **1-click apply** — eligibility is checked instantly, with reasons if you're not eligible
- **My Applications** — every application as a visual progress tracker: Applied → Test → Result → Interview
- **In-app aptitude test** — timed, one question at a time, auto-submits, instantly graded
- **Auto-assigned sessions** — test venue/date/time and interview slot appear automatically; nothing to book
- **Notifications bell** — test schedules, results and interview invites land in your inbox
- **My Schedule** — all upcoming tests and interviews in one place

### 💼 Recruiter portal
- **Add Drive wizard** — 4 guided steps: drive details + eligibility → test questions builder → interview setup (number of interviewers, qualifying score, shortlist cap) → review with a live count of eligible students
- **Drive dashboard** — pipeline tracker (Applications → Test → Results → Interviews) with funnel stats
- **Schedule tests** (one click) — the system batches applicants into labs by capacity and notifies everyone
- **Publish results** (one click) — shortlists by test score (cutoff + top-N cap) and auto-builds the full interview timetable across panels and rooms
- **Eligible students, results leaderboard, final selection** — per-student views with test scores

### 🛠️ Admin — Control Center
- **All drives** — every drive's stage and progress (applied → tested → shortlisted) with one-click next steps
- **Full schedule** — every test and interview session across all drives, with venues and seat counts
- **Resources** — add labs (with seating capacity) and interview rooms; the auto-scheduler plans against this inventory. Allocations run the Banker's safety check that refuses unsafe allocations with an explanation
- **System Monitor** — live view of lock acquisitions, queue waits and audit log as the system works
- **Scheduling Lab** — interview scheduler simulation comparing FCFS vs. Non-preemptive Priority algorithms *(Note: Round Robin was intentionally removed because preemptive time-slicing is conceptually invalid for physical human interviews)*
- **Reports** — placement progress per drive and per company via the `v_drive_report` database view
- **Users** — directory of accounts with admin capability to create new recruiter and admin accounts

### ⚙️ The pipeline engine & DBMS architecture
- **Row-Level Mutual Exclusion**: Every seat booking enters a serialized database critical section using `SELECT … FOR UPDATE` inside a transaction.
- **Deadlock Avoidance**: Resource allocations evaluate the Banker's Algorithm against available units and upcoming demands.
- **CPU Scheduling**: Auto-scheduler orders interviews using Non-preemptive Priority (highest CGPA first) or FCFS (application order).
- **Audit Triggers**: Database lifecycle mutations (`INSERT`/`UPDATE`/`DELETE` on `bookings`, `applications`, and `allocations`) write directly to `audit_log`.
- **Stored Procedure Note**: The schema includes `sp_generate_shortlist`, a direct SQL stored procedure for criteria-based shortlisting (executable directly via MySQL: `CALL sp_generate_shortlist(drive_id, @count)`). The web application uses score-based test pipeline evaluation (`publishResults()` in `pipeline.js`).

---

## 🚀 Run it locally

Detailed step-by-step instructions for Windows plain install and troubleshooting are in **[docs/03_INSTALLATION.md](docs/03_INSTALLATION.md)**.

### Prerequisites
- Node.js 18+ (`node --version`)
- MySQL 8.0+ running locally on port 3306 (or via Docker as optional)

### Quick Start

```bash
# 1. Backend setup
cd server
cp .env.example .env
# Edit .env: set DB_PASSWORD and a long random JWT_SECRET
npm install
npm run db:reset            # builds schema, triggers, seed data & records migrations
npm run dev                 # API starts on http://localhost:5000/api

# 2. Frontend setup (in a separate terminal)
cd ../client
npm install
npm run dev                 # Client starts on http://localhost:5173
```

*(Docker is optional: `docker compose up -d` can be used instead of a local MySQL install).*

---

## 🔑 Demo logins (password: `password123`)

| Role | Email | Lands on |
|---|---|---|
| Admin | `admin@campusflow.local` | Control Center |
| Recruiter | `priya@techcorp.com` | Hiring dashboard |
| Student | `aarav@student.local` | My Applications |

One-click demo buttons are provided on the login page.

---

## 📚 Docs

| Doc | What it covers |
|---|---|
| [docs/01_TEAM_CONTRIBUTIONS.md](docs/01_TEAM_CONTRIBUTIONS.md) | What each team member built |
| [docs/02_PHASE2_PLAN.md](docs/02_PHASE2_PLAN.md) | Phase 2 stabilization and roadmap |
| [docs/03_INSTALLATION.md](docs/03_INSTALLATION.md) | Complete installation & setup guide |
| [docs/AUDIT_REPORT.md](docs/AUDIT_REPORT.md) | Phase 0 comprehensive codebase audit report |
| [docs/PHASE2_VERIFICATION.md](docs/PHASE2_VERIFICATION.md) | Phase 2 stabilization test results & verification matrix |

Older working documents are preserved in `docs/archive/`.

---

## 🛠️ Tech stack

- **Frontend:** React 18 + Vite + Tailwind CSS, React Router DOM, Axios
- **Backend:** Node.js + Express, JWT authentication, bcryptjs, mysql2
- **Database:** MySQL 8 (InnoDB) — 3NF schema, declarative CHECK constraints, triggers, stored procedure, view

---

## 👥 Team

- **Ishika Rawat** (Lead) — M1 Platform Core & Data Foundation
- **Akansha Parley** — M2 Drives, Eligibility & Interview Scheduling
- **Trisha Dabral** — M3 Synchronization & Concurrency Control
- **Akshay Singh Gusain** — M4 Resource Allocation & Control Center
