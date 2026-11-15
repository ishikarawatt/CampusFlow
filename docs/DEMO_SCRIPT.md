# CampusFlow 15–20 Minute Master Choreographed Viva Demo Script

This document details the live demonstration script for the CampusFlow project defense. It is choreographed for a team of four: **Ishika Rawat** (Lead), **Akansha Parley**, **Trisha Dabral**, and **Akshay Singh Gusain**.

---

## 1. Demo Credentials & Pre-Flight Setup

Open three browser profiles or incognito windows before the examiners arrive:

| Persona | Seed Email | Password | Target URL | Purpose |
|---|---|---|---|---|
| **Admin** | `admin@campusflow.local` | `password123` | `http://localhost:5173/admin` | Control Center, Live Lock Monitor, Exam Seat Map, Lab Allocations |
| **Recruiter** | `priya@techcorp.com` | `password123` | `http://localhost:5173/recruiter` | Drive Creation, Eligibility Wizard, Question Paper Setup |
| **Student** | `aarav@student.local` | `password123` | `http://localhost:5173/student` | Drive Application, Timed MCQ Test, Interview Slot Booking |

### Pre-Flight Verification Checklist
- [ ] Backend running in terminal: `cd server && npm run dev` (Port 5000)
- [ ] Frontend running in terminal: `cd client && npm run dev` (Port 5173)
- [ ] Database seeded: `npm run db:reset` was executed previously
- [ ] MySQL CLI or Workbench open in the background with `USE campusflow;` ready
- [ ] Fallback screenshots located in `docs/` (`exam_monitoring_online.png`, `exam_monitoring_session.png`)

---

## 2. Minute-by-Minute Choreographed Flow

| Timing | Speaker / Member | Segment & Feature | Click Sequence & Actions | "Wow Moment" & Expected Outcome | Fallback Action (If Live Fails) |
|---|---|---|---|---|---|
| **0:00 – 1:30** | **Ishika Rawat** | **Team Introduction & Architecture Overview** | 1. Stand before the committee.<br/>2. Open `docs/ARCHITECTURE.md` or present high-level slide.<br/>3. Outline the 4 subsystems: Task Management, Concurrency Control, Infrastructure OS, and Windows Device Control. | Sets a formal, confident tone; establishes that every module maps to real OS and DBMS principles. | Display system diagram from `docs/ARCHITECTURE.md`. |
| **1:30 – 3:30** | **Ishika Rawat** | **Banker's Algorithm & Resource Safety (OS 4)** | 1. In Admin window, navigate to `/admin/resources`.<br/>2. Click **Allocate Resource**.<br/>3. Request allocation of *Lab 1* with 999 seats or overlapping duration.<br/>4. Submit the modal form. | **WOW MOMENT 1:** Instant HTTP 409 Conflict toast with explanatory safety vector failure: *"Banker's Safety Check: Allocation would leave the campus in an unsafe deadlock state."* | Run `checkAllocation` test script or run `database/demo/member1_ishika.sql` in MySQL. |
| **3:30 – 4:30** | **Ishika Rawat** | **Schema Integrity & Constraints (DBMS 1, 2)** | 1. Switch to MySQL CLI window.<br/>2. Execute Section 2 of `database/demo/member1_ishika.sql` (inserting CGPA = 11.50).<br/>3. Show MySQL Error 3819 (`students_chk_1`).<br/>4. Hand over to Akansha. | Examiner observes engine-level domain integrity: *"MySQL directly prevents invalid student metrics at the storage layer."* | Show `database/schema.sql` line 30 with the CHECK constraint. |
| **4:30 – 6:30** | **Akansha Parley** | **Placement Drive Pipeline & JSON Eligibility (DBMS 3, 4)** | 1. Switch to Recruiter window (`priya@techcorp.com`).<br/>2. Navigate to `/recruiter/drives/new`.<br/>3. Walk through 4-step wizard: Title, CGPA cutoff (7.5), Allowed Branches (`["CSE", "IT"]`).<br/>4. On Step 4, click **Preview Eligibility**. | Recruiter UI calls `POST /drives/preview-eligibility` using `JSON_CONTAINS`, showing live count of qualifying students dynamically. | Run Section 1 of `database/demo/member2_akansha.sql` showing JSON query output. |
| **6:30 – 8:00** | **Akansha Parley** | **Batch Shortlisting Stored Procedure (DBMS 4)** | 1. Switch to MySQL terminal.<br/>2. Execute Section 2 of `database/demo/member2_akansha.sql`: `CALL sp_generate_shortlist(1, @count); SELECT @count;`<br/>3. Show updated application records. | **WOW MOMENT 2:** Atomic set-based evaluation of 100+ candidates in <5ms without transferring rows to application memory. | Show `sp_generate_shortlist` definition in `database/schema.sql` (lines 447-466). |
| **8:00 – 9:00** | **Akansha Parley** | **Exam Proctoring & Human Review Flow (OS 7)** | 1. In Admin window, open `/admin/monitoring`.<br/>2. Show incident feed with `FOCUS_LOST` and `WINDOW_SWITCH` events.<br/>3. Click **Review** on an incident, enter note *"Legitimate dialog"*, and click **Dismiss**. | State transitions immediately from `new` to `dismissed`, demonstrating human-in-the-loop proctoring. | Refer to `docs/exam_monitoring_session.png`. |
| **9:00 – 11:00** | **Trisha Dabral** | **CPU Scheduling Simulation Lab (OS 1)** | 1. In Admin window, navigate to `/admin/scheduling`.<br/>2. Select Drive #1, select algorithm **Round Robin (Quantum = 2)**.<br/>3. Click **Run Scheduler**.<br/>4. Click **Compare All Algorithms**. | **WOW MOMENT 3:** High-fidelity interactive Gantt chart renders with turnaround time and waiting time calculations, followed by comparative bar metrics. | Display pre-generated simulation output table from `docs/OS_MANUAL.md`. |
| **11:00 – 12:30** | **Trisha Dabral** | **Critical Section & Row Lock Stress Test (OS 3, DBMS 7)** | 1. In Admin window, navigate to `/admin/monitor`.<br/>2. Show live lock timeline (updating via Socket.IO/polling).<br/>3. Click **Run Stress Test** (fires concurrent requests at a single slot). | Zero overselling: Confirmed bookings exactly equal slot capacity; remaining concurrent requests are cleanly rejected. | Run Experiment 1.1 in `database/demo/member3_trisha.sql` across two MySQL tabs. |
| **12:30 – 13:30** | **Trisha Dabral** | **Analytical Reporting Views (DBMS 8)** | 1. In Admin window, navigate to `/admin/reports`.<br/>2. Display Company Funnel and Salary Distribution tables.<br/>3. Show that these are powered by database views (`v_company_funnel`, `v_package_stats`). | Clean separation of analytical aggregation from transactional write tables; handover to Akshay. | Run `SELECT * FROM v_package_stats;` in MySQL CLI. |
| **13:30 – 15:30** | **Akshay Singh Gusain** | **Resource Placement (Best Fit & First Fit) (OS 5)** | 1. In Admin window, navigate to `/admin/resources`.<br/>2. Explain lab placement logic in `server/src/os/pc-allocator.js`.<br/>3. Show how a batch of 25 candidates is assigned to a 30-seat lab rather than a 120-seat lab to minimize external fragmentation. | Clear OS memory-partitioning analogy applied to physical computer lab management. | Show `bestFitLab` code in `server/src/os/pc-allocator.js`. |
| **15:30 – 16:30** | **Akshay Singh Gusain** | **Single Active PC Session Constraint (DBMS 6)** | 1. Open MySQL CLI.<br/>2. Run Section 2 of `database/demo/member4_akshay.sql`.<br/>3. Attempt inserting two active sessions on Computer #1. | **WOW MOMENT 4:** MySQL rejects the second active session with duplicate key on virtual stored column `active_computer_id`. Zero double-booking possible. | Show `schema.sql` lines 328-329 (`active_computer_id STORED UNIQUE`). |
| **16:30 – 18:00** | **Akshay Singh Gusain** | **Database Audit Triggers & MCQ Engine (DBMS 5, 6)** | 1. Switch to Student window (`aarav@student.local`), navigate to `/student/drives`.<br/>2. Click **Take Test** on Drive #1 (`/student/tests/1`).<br/>3. Submit answers; show instant auto-grading.<br/>4. In MySQL, run `SELECT * FROM audit_log ORDER BY id DESC LIMIT 1;`. | The database trigger recorded the test submission and application status transition autonomously. | Run Section 1 of `database/demo/member4_akshay.sql`. |
| **18:00 – 20:00** | **All Members** | **Summary, Known Limitations & Committee Q&A** | 1. Ishika summarizes key accomplishments (full OS/DBMS integration).<br/>2. Team invites committee questions.<br/>3. Reference `docs/KNOWN_ISSUES.md` if edge cases or limitations are probed. | Professional, honest handling of engineering constraints leaves the committee thoroughly impressed. | Use `docs/VIVA_GUIDE.md` for answers to difficult examiner questions. |

---

## 3. The 4 "Wow Moments" Summary (What Teachers Love)

1. **Banker's Algorithm Rejecting Real Allocations (HTTP 409):**  
   Teachers rarely see abstract algorithms like Banker's applied outside of textbook math problems. Seeing a live web form return a 409 Conflict with a calculated unsafe vector proves genuine engineering mastery.
2. **Database Stored Procedure with Native JSON Filtering (`sp_generate_shortlist`):**  
   Proves the team understands database performance: instead of pulling all rows into Node.js to filter in memory, the evaluation executes entirely within MySQL.
3. **Interactive CPU Scheduling Simulation with Gantt Charts:**  
   Visually demonstrates all standard OS scheduling algorithms (FCFS, Priority, SJF, SRTF, RR) with turnaround and waiting time analytics in a sleek dashboard.
4. **Triple-Layer Double-Booking Defense:**  
   Showing the teacher that a physical PC cannot be double-allocated—not because of UI validation, but because of MySQL row-level exclusive locks AND a virtual stored column unique constraint (`active_computer_id`)—proves rigorous defense-in-depth system design.

---

## 4. Emergency Fallback Playbook

If something unexpected happens during the live viva:

| Scenario | Symptom | Immediate Fallback Action | What to Tell the Examiner |
|---|---|---|---|
| **Port 5000 Already in Use** | `EADDRINUSE` in backend terminal | Run `Stop-Process -Name node -Force` in PowerShell, then `npm run dev`. | *"We are clearing a background worker process from a previous test run."* |
| **WiFi / Localhost Glitch** | Browser displays network error | Check `http://127.0.0.1:5173` instead of `localhost`. | *"Local DNS resolution delay; switching to direct loopback IP."* |
| **Windows Agent Not Running on Demo Laptop** | Exam Monitoring shows no agent online | Use `windows-agent/tools/mock-server.js` or refer to `docs/exam_monitoring_online.png`. | *"The native C++ Windows agent runs as a Windows Service in our lab environment; we have mock telemetry scripts and screenshot evidence for portable laptop defense."* |
| **Stress Test Exhausts DB Connections** | `ER_CON_COUNT_ERROR` in API log | Restart backend: `npm run dev`. | *"The stress test saturated connection pool limits, proving the need for connection throttles under extreme concurrency."* |

