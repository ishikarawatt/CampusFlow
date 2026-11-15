# CampusFlow Comprehensive Viva Voce Guide

This guide prepares the four team members—**Ishika Rawat**, **Akansha Parley**, **Trisha Dabral**, and **Akshay Singh Gusain**—for academic and technical viva examinations. Every answer, code reference, and defense is grounded directly in the verified source code of CampusFlow.

---

## 1. Ishika Rawat (Project Lead)
**Assigned Modules:**
- **OS 4:** Deadlock Management (Banker's Algorithm & Safety Vectors)
- **OS 8:** Agent & Device Control (Windows Service, Session 0, Pipe IPC)
- **DBMS 1:** Database Design & Schema Management (3NF, Integrity, Constraints)
- **DBMS 2:** Student & Company Management (Users, RBAC, Profiles)

### 1.1 30-Second Elevator Pitch
> *"I am Ishika Rawat, team lead on CampusFlow. I architected our 3NF relational database schema, established domain constraints and cascading referential integrity, and implemented role-based privilege rings. On the operating systems side, I built the deadlock avoidance engine using Dijkstra's Banker's algorithm in `server/src/os/banker.js` to ensure multi-resource campus reservations remain in safe states, and architected the Windows agent service in `windows-agent/` to bridge Session 0 system isolation with our central control plane."*

### 1.2 10 Likely Viva Questions & Answers
1. **Q: How does CampusFlow prevent deadlocks during room and lab allocations?**  
   *A:* We implement Dijkstra's Banker's Algorithm in `server/src/os/banker.js` (`checkAllocation`). When an admin requests a resource allocation for a given time window, we compute available capacity vectors, evaluate maximum future demands of ongoing drives, and run a safety sequence check. If granting the request leaves the system in an unsafe state where circular wait could occur, the API immediately rejects the request with HTTP 409 Conflict.
2. **Q: How is our database schema normalized, and why stop at 3NF?**  
   *A:* All tables (`users`, `students`, `companies`, `applications`, etc.) satisfy 1NF (atomic values), 2NF (no partial key dependencies), and 3NF (no transitive dependencies). We stopped at 3NF because recruitment data models do not contain multi-valued dependencies that would warrant 4NF, preserving clean relational joins without over-sharding queries.
3. **Q: Why are `users` and `students` split into two tables?**  
   *A:* This implements table inheritance and single-identity authentication. `users` stores system-wide credentials (`email`, `password_hash`, `role`), while `students` stores academic profile details (`roll_no`, `branch`, `cgpa`, `backlogs`) keyed by `user_id` with `ON DELETE CASCADE`. This allows administrators and recruiters to exist as users without polluting academic profile fields.
4. **Q: What is Session 0 isolation on Windows and how did you overcome it?**  
   *A:* Since Windows Vista, Windows services execute in Session 0, which has no graphical desktop or interactive window manager. A service cannot call `GetForegroundWindow()` to see what application the student is viewing. We architected a two-process agent: `CampusFlowService.exe` runs in Session 0 with elevated SYSTEM privileges, while `CampusFlowMonitor.exe` is spawned in the student's interactive session (Session 1+) to poll GUI window handles, communicating over a named pipe (`\\.\pipe\CampusFlow`).
5. **Q: How does the agent authenticate with the central server?**  
   *A:* The agent registers with an enrollment code via `POST /api/agent/register` (`server/src/routes/agent.js`). The server issues an agent token, stores its SHA-256 hash in `agent_devices.token_hash`, and the agent passes this token as a Bearer header in all subsequent heartbeat and event requests.
6. **Q: How are domain constraints enforced on student data?**  
   *A:* In `database/schema.sql`, we define `CHECK (cgpa BETWEEN 0 AND 10)` and `CHECK (backlogs >= 0)`. Any attempt to insert out-of-range academic scores is blocked directly by MySQL InnoDB with Error 3819.
7. **Q: What role-based access controls (RBAC) exist in the backend?**  
   *A:* In `server/src/middleware/auth.js`, we use `authenticateToken` to decode the JWT and `requireRole('admin', 'recruiter', 'student')` to protect routes. For example, student registration and test taking are restricted to students, while allocation and scheduler controls require admin privilege.
8. **Q: What happens if an agent machine stops sending heartbeats?**  
   *A:* `agent_devices` tracks `last_heartbeat_at`. In `server/src/routes/monitor.js`, heartbeats older than 30 seconds mark the device status as `'offline'`, which is reflected in the admin proctoring grid with an amber/red disconnected indicator.
9. **Q: Why do we use JSON columns for student skills and projects?**  
   *A:* Student portfolios are variable-length semi-structured documents. Storing skills, projects, and certifications as JSON (`schema.sql` lines 34-36) avoids creating separate join tables for display purposes while keeping the core eligibility filters (`branch`, `cgpa`, `backlogs`) in indexed relational columns.
10. **Q: What is the difference between deadlock avoidance and deadlock detection?**  
    *A:* Deadlock avoidance (Banker's Algorithm in `banker.js`) dynamically analyzes every resource request *before* granting it, guaranteeing that the system never enters an unsafe state. Deadlock detection allows requests to proceed and checks for cycles in the wait-for graph periodically or upon blocking (which MySQL InnoDB does internally for row locks).

### 1.3 5 Hard "Why Did You Do It This Way?" Defenses
1. **Why use Banker's algorithm instead of a simple capacity check?**  
   *Defense:* A simple capacity check only verifies if resources are free right now. If Company A books 80% of lab PCs and Company B books 80% of interview rooms, neither can complete their scheduled round without the other's resources, creating an operational deadlock. Banker's algorithm evaluates the maximum resource claims of the entire drive before approving allocations.
2. **Why store SHA-256 token hashes rather than encrypting tokens reversibly?**  
   *Defense:* Cryptographic hashes are one-way. Even if an attacker dumps the `agent_devices` table through a database breach, they cannot reverse the hashes to impersonate lab workstations, conforming to OWASP credential storage standards.
3. **Why use Named Pipes instead of local TCP sockets for agent IPC?**  
   *Defense:* Local TCP loopback ports (`127.0.0.1:port`) can conflict with developer tools, require firewall rule approvals, and allow any unprivileged local executable to connect. Named Pipes support native Windows kernel security descriptors (DACLs), allowing only our authenticated service and monitor processes to exchange data.
4. **Why enforce CHECK constraints in SQL when Express can validate them?**  
   *Defense:* Defense in depth. Application code can have bugs, and direct database operations (seeds, admin scripts, migrations) bypass Express entirely. Enforcing constraints in MySQL ensures data integrity cannot be corrupted regardless of the entry vector.
5. **Why use cascading deletes (`ON DELETE CASCADE`) between `users` and `students`?**  
   *Defense:* `students` is a dependent subtype entity that has no meaning without the parent user account. Cascading ensures that removing a student user automatically cleans up profile, resume, and application records without leaving orphan child records.

### 1.4 3 On-the-Fly Demo Tasks
1. **Run Banker's Safety Allocation:** Open Admin UI `Resources.jsx`, attempt an allocation that exceeds safety vectors, and show the resulting HTTP 409 toast.
2. **Demonstrate Constraint Failure:** Run `database/demo/member1_ishika.sql` in MySQL Workbench to show MySQL rejecting a CGPA of 11.50.
3. **Inspect Agent Registry:** Call `GET /api/monitor/activity` or query `SELECT * FROM agent_devices` to show active Windows agent registrations.

---

## 2. Akansha Parley
**Assigned Modules:**
- **OS 2:** Queue Management (Batch Scheduling Queue in `pipeline.js`)
- **OS 7:** Exam Environment Monitoring (Agent Telemetry & Review Queue)
- **DBMS 3:** Placement Drive Management (Drives, Applications, Offers)
- **DBMS 4:** Eligibility & Application Management (JSON Matching, Stored Procedure)

### 2.1 30-Second Elevator Pitch
> *"I am Akansha Parley. I own the recruitment pipeline queue management and applicant evaluation subsystems. On the OS side, I built the batch scheduling queue in `server/src/os/pipeline.js` and real-time proctoring telemetry in `client/src/pages/admin/ExamMonitoring.jsx`. On the DBMS side, I designed the placement drive workflow and wrote the set-based eligibility engine, including the `sp_generate_shortlist` stored procedure that qualifies hundreds of applicants in a single atomic database operation using native JSON queries."*

### 2.2 10 Likely Viva Questions & Answers
1. **Q: How does CampusFlow match student branches against drive criteria?**  
   *A:* Drives store eligible branches as a JSON array (e.g. `["CSE","IT"]`). We evaluate branch eligibility using MySQL's native function: `JSON_CONTAINS(d.allowed_branches, JSON_QUOTE(s.branch)) = 1`. This allows flexible multi-branch filtering without needing join tables.
2. **Q: What does the stored procedure `sp_generate_shortlist` do?**  
   *A:* Defined in `database/schema.sql` (lines 447-466), it takes `p_drive_id` and executes an atomic `UPDATE applications a JOIN students s JOIN drives d` setting `a.status = 'shortlisted'` or `'rejected'` based on CGPA, backlogs, graduation year, and branch matching. It returns the affected row count via an `OUT` parameter.
3. **Q: What is the application status lifecycle in the database?**  
   *A:* Applications follow an ENUM state machine: `'applied' → 'test_taken' → 'shortlisted' → 'selected'` (or `'rejected'`/`'withdrawn'`). Transitions are audited automatically by MySQL triggers.
4. **Q: How does the queue manager prevent test session overload?**  
   *A:* In `server/src/os/pipeline.js` (`scheduleTestSessions`), shortlisted students are partitioned into fixed-capacity batches matching lab seat limits and assigned non-overlapping time slices.
5. **Q: What events are captured by the exam monitoring subsystem?**  
   *A:* `monitoring_events` captures 7 event types: `FOCUS_LOST`, `WINDOW_SWITCH`, `WINDOW_MINIMIZED`, `WINDOW_CLOSED`, `PROHIBITED_PROCESS`, `AGENT_DISCONNECTED`, and `AGENT_RECONNECTED`.
6. **Q: How does proctor review work for flagged students?**  
   *A:* Events are inserted with `review_status = 'new'`. In `ExamMonitoring.jsx`, proctors review incidents and update status to `'reviewed'` or `'dismissed'` with a written note via `POST /api/monitor/events/:id/review`.
7. **Q: Why are blacklisted processes stored in a database table?**  
   *A:* `prohibited_processes` allows administrators to dynamically add forbidden software (e.g., `discord.exe`, `teamviewer.exe`, `anydesk.exe`) through the UI without recompiling or redeploying the Windows agent binary.
8. **Q: How does the system handle students with active backlogs?**  
   *A:* Each drive specifies `max_backlogs` (default 0). Both the Node eligibility checker (`server/src/dbms/eligibility.js`) and the stored procedure enforce `s.backlogs <= d.max_backlogs`.
9. **Q: What index optimizes drive listings by deadline?**  
   *A:* `idx_drives_status_deadline` on `(status, application_deadline)` allows fast retrieval of currently open drives sorted by upcoming deadline.
10. **Q: How does `drives` track approval status?**  
    *A:* Drives have a status ENUM including `'pending_approval'`, `'approved'`, and `'rejected'`, with audit columns `reviewed_by`, `reviewed_at`, and `approval_note`.

### 2.3 5 Hard "Why Did You Do It This Way?" Defenses
1. **Why execute shortlisting in a stored procedure rather than in JavaScript?**  
   *Defense:* Transferring 1,000 applicant records over the network to Node.js to evaluate eligibility and sending 1,000 individual SQL update queries creates severe latency and connection saturation. `sp_generate_shortlist` performs the joins and bulk updates inside the database kernel in a single round trip.
2. **Why use `JSON_CONTAINS` instead of a traditional junction table `drive_branches`?**  
   *Defense:* Branch eligibility is static per drive and read frequently in candidate listings. A JSON array column eliminates an expensive join across millions of rows while remaining fully queryable using MySQL's JSON indexing capabilities.
3. **Why do we flag process violations rather than instantly terminating the exam?**  
   *Defense:* Operating systems frequently trigger background processes or transient window focus switches (antivirus notifications, OS system dialogs). Auto-terminating exams results in false positives. Treating telemetry as evidence for human proctor review avoids unjust disqualifications.
4. **Why allow an application status of `withdrawn`?**  
   *Defense:* Students who accept offers from one company must be permitted to withdraw pending applications from other drives, preventing deadlocks in campus recruitment slot commitments.
5. **Why store prohibited processes in the DB rather than hardcoding in C++?**  
   *Defense:* New remote assistance and AI cheat tools emerge constantly. Storing names in `prohibited_processes` enables instant campus-wide policy updates fetched dynamically by agents during heartbeats.

### 2.4 3 On-the-Fly Demo Tasks
1. **Run Eligibility Evaluation Query:** Execute the `JSON_CONTAINS` query from `database/demo/member2_akansha.sql` and explain the EXPLAIN output.
2. **Execute Stored Procedure:** Run `CALL sp_generate_shortlist(1, @cnt); SELECT @cnt;` inside a transaction in MySQL CLI.
3. **Simulate Proctor Review:** Open `ExamMonitoring.jsx`, filter events by `review_status = 'new'`, and submit a proctor review action.

---

## 3. Trisha Dabral
**Assigned Modules:**
- **OS 1:** Task Scheduling (CPU Scheduling Algorithms in `cpu-scheduler.js`)
- **OS 3:** Process Synchronization (Critical Section, Row Locks, Stress Test)
- **DBMS 7:** Transactions & Concurrency Control (ACID, FOR UPDATE, Isolation)
- **DBMS 8:** Queries, Reports & Analytics (Analytical Views & Statistics)

### 3.1 30-Second Elevator Pitch
> *"I am Trisha Dabral. I own CPU scheduling, process synchronization, and database transaction concurrency in CampusFlow. On the OS side, I developed `server/src/os/cpu-scheduler.js` simulating FCFS, Priority, SJF, SRTF, and Round Robin scheduling algorithms to optimize candidate interview sequencing in `SchedulingLab.jsx`. On the DBMS side, I implemented our critical section locking in `critical-section.js` using MySQL `SELECT ... FOR UPDATE` to prevent seat overselling, proved InnoDB ACID guarantees under high-concurrency stress testing, and authored our analytical reporting views."*

### 3.2 10 Likely Viva Questions & Answers
1. **Q: How does CampusFlow implement mutual exclusion during slot booking?**  
   *A:* In `server/src/os/critical-section.js` (`bookSeat`), we start an InnoDB transaction and execute `SELECT id, capacity, booked_count FROM slots WHERE id = ? FOR UPDATE`. This acquires an exclusive row lock (X-lock), forcing all concurrent transactions for the same slot to block until the lock holder commits.
2. **Q: What is a lost update anomaly and how do we prevent it?**  
   *A:* If two users read `booked_count = 10` simultaneously and both execute `UPDATE slots SET booked_count = 11`, one booking is lost. Our `FOR UPDATE` lock serializes access: User 1 increments to 11 and commits; User 2's blocked query then unblocks and reads 11, incrementing to 12.
3. **Q: What CPU scheduling algorithms are implemented in `cpu-scheduler.js`?**  
   *A:* We implement 5 standard OS scheduling algorithms: First-Come First-Served (FCFS), Shortest Job First (SJF Non-preemptive), Shortest Remaining Time First (SRTF Preemptive), Priority Scheduling, and Round Robin (RR) with configurable time quantum.
4. **Q: What metrics does the scheduler compute?**  
   *A:* Turnaround time ($T_{completion} - T_{arrival}$), waiting time ($T_{turnaround} - T_{burst}$), response time, and averages across all processes, alongside a Gantt chart array.
5. **Q: What is the default transaction isolation level in CampusFlow?**  
   *A:* MySQL InnoDB's default **REPEATABLE READ**. Nothing in our application overrides it. It uses Multi-Version Concurrency Control (MVCC) consistent snapshots to guarantee that reads within a transaction are repeatable without locking readers.
6. **Q: How do we reproduce and handle deadlocks in MySQL?**  
   *A:* A deadlock occurs when Transaction A locks Row 1 and requests Row 2, while Transaction B locks Row 2 and requests Row 1. InnoDB's background lock manager detects the cycle in its wait-for graph and rolls back the transaction with fewer undo log records, returning Error 1213.
7. **Q: What does the analytical view `v_drive_report` show?**  
   *A:* `database/schema.sql` (lines 470-483) defines `v_drive_report`, which aggregates applicants, shortlisted counts, selected counts, and average CGPA per drive by joining `drives`, `companies`, `applications`, and `students`.
8. **Q: What does `v_branch_placement` calculate?**  
   *A:* It computes department-level placement percentage (`COUNT(distinct accepted offers) / COUNT(distinct applicants) * 100`) grouped by `students.branch`.
9. **Q: Where can administrators see real-time lock contention?**  
   *A:* In `client/src/pages/admin/KernelMonitor.jsx`, which displays real-time telemetry from `lock_events` and supports triggering concurrent booking bursts via `POST /monitor/stress`.
10. **Q: How does Round Robin handle remaining burst times?**  
    *A:* In `cpu-scheduler.js`, processes are queued in a ready queue. Each process executes for at most `quantum` time units; if its remaining burst time exceeds 0, it is pushed to the back of the queue.

### 3.3 5 Hard "Why Did You Do It This Way?" Defenses
1. **Why use MySQL row locks instead of a Redis distributed lock?**  
   *Defense:* Adding Redis introduces an extra infrastructure dependency and network hop. Since our seat data already resides in MySQL, using InnoDB's native row locks guarantees ACID compliance directly at the storage engine level without split-brain cache sync issues.
2. **Why use REPEATABLE READ instead of READ COMMITTED?**  
   *Defense:* In placement reporting, queries execute complex multi-table aggregations. Under READ COMMITTED, concurrent updates cause phantom reads and non-repeatable calculations within the same reporting pass. REPEATABLE READ guarantees snapshot consistency.
3. **Why keep CPU scheduling simulation isolated from live interview tables?**  
   *Defense:* Simulation algorithms require synthetic workloads to demonstrate edge cases (like convoy effects in FCFS or starvation in SJF). Running simulation under `/api/os/schedule/run` allows interactive testing in `SchedulingLab.jsx` without generating corrupt test rows in live recruitment records.
4. **Why log lock events to a database table (`lock_events`)?**  
   *Defense:* Standard OS kernels maintain telemetry on semaphore wait times. Logging lock acquisition, wait duration, and release events in `lock_events` enables students and teachers to observe OS lock contention visually in `KernelMonitor.jsx`.
5. **Why compute placement statistics in SQL Views rather than in Node controllers?**  
   *Defense:* SQL views (`v_company_funnel`, `v_package_stats`) allow the database query engine to optimize joins, utilize composite indexes, and aggregate data directly on disk, transmitting only the final computed summary rows to the client.

### 3.4 3 On-the-Fly Demo Tasks
1. **Run Two-Session Row Lock Demo:** Open two MySQL command windows and execute Experiment 1.1 from `database/demo/member3_trisha.sql` to demonstrate lock blocking.
2. **Execute Scheduler Simulation:** Open `SchedulingLab.jsx` in the browser, choose Round Robin with Quantum = 2, click Run, and explain the generated Gantt chart.
3. **Query Reporting Views:** Execute `SELECT * FROM v_package_stats;` in MySQL to demonstrate salary distribution metrics.

---

## 4. Akshay Singh Gusain
**Assigned Modules:**
- **OS 5:** Resource Allocation (First Fit, Best Fit in `pc-allocator.js`)
- **OS 6:** Resource Utilization (Capacity Metrics, Ledger Strips)
- **DBMS 5:** Test & Interview Management (Questions, Results, Slots, Grading)
- **DBMS 6:** Resource Management (Resources, Computers, Audit Triggers)

### 4.1 30-Second Elevator Pitch
> *"I am Akshay Singh Gusain. I designed CampusFlow's resource allocation algorithms and testing subsystems. On the OS side, I developed `server/src/os/pc-allocator.js`, implementing First Fit and Best Fit memory placement heuristics to assign campus computer labs and workstations without external fragmentation, and built real-time hardware utilization monitors. On the DBMS side, I designed the MCQ test engine, automated grading pipeline, computer inventory schema, and database audit triggers that record every critical state change."*

### 4.2 10 Likely Viva Questions & Answers
1. **Q: How does the Best Fit algorithm work in `pc-allocator.js`?**  
   *A:* `bestFitLab` queries all available computer labs whose total capacity is greater than or equal to the requested candidate batch. It sorts labs by `(capacity - requested_seats) ASC`, selecting the lab with the minimum excess capacity to prevent external fragmentation.
2. **Q: What is the difference between First Fit and Best Fit in our system?**  
   *A:* First Fit scans available machines sequentially and selects the first free PC ($O(1)$ fast lookup). Best Fit evaluates all partition candidates and chooses the tightest fit, preserving large contiguous labs for major hiring drives.
3. **Q: How does CampusFlow prevent double-booking an exam PC?**  
   *A:* In `database/schema.sql` (lines 328-329), `exam_sessions` contains a virtual stored column:  
   `active_computer_id INT GENERATED ALWAYS AS (IF(status IN ('scheduled', 'active'), computer_id, NULL)) STORED`  
   with `UNIQUE KEY uq_active_computer_session (active_computer_id)`. MySQL rejects any second active or scheduled session for the same PC with Error 1062.
4. **Q: How does automated test grading work?**  
   *A:* When a student submits MCQ answers via `POST /api/drives/:id/test/submit`, the engine in `server/src/os/pipeline.js` (`submitTest`) compares submitted answers against `test_questions.correct_index`, computes the score, percentage, and inserts the outcome into `test_results`.
5. **Q: How is test question integrity protected?**  
   *A:* `test_questions` stores options as a JSON array and `correct_index` (0..3). The API strips `correct_index` when delivering the test paper to student clients, preventing client-side inspection cheating.
6. **Q: What do our database audit triggers log?**  
   *A:* Triggers on `bookings`, `applications`, `allocations`, `exam_sessions`, and `offers` write into `audit_log` with columns `actor_id`, `action` ('INSERT', 'UPDATE', 'DELETE'), `entity`, `entity_id`, and `details` (JSON object of old and new values).
7. **Q: How does the system detect allocation collisions in lab schedules?**  
   *A:* In `server/src/routes/resources.js`, before adding an allocation, we check existing time windows: $A_{start} < B_{end} \land B_{start} < A_{end}$. If an overlap exists and capacity would be breached, the allocation is rejected.
8. **Q: What hardware status values can a computer have?**  
   *A:* ENUM `'available'`, `'allocated'`, and `'maintenance'`. Computers in maintenance are excluded from allocator algorithms.
9. **Q: What is `auto_scheduled` on the `slots` table?**  
   *A:* Added in `migrate_v3.sql`, it is a `TINYINT(1)` boolean flag indicating whether the slot was generated algorithmically by the batch scheduler or manually created by an admin.
10. **Q: How is lab hardware utilization computed?**  
    *A:* In `server/src/routes/monitor.js` (`GET /monitor/stats`), utilization is computed as $\frac{\text{Allocated PCs}}{\text{Total Registered PCs}} \times 100\%$.

### 4.3 5 Hard "Why Did You Do It This Way?" Defenses
1. **Why use a virtual stored generated column instead of an application check for PC sessions?**  
   *Defense:* Application checks (`SELECT COUNT(*) WHERE status = 'active'`) are subject to race conditions under concurrent requests. A unique constraint on a generated column enforces the business rule inside the database engine itself, guaranteeing zero race conditions.
2. **Why use Best Fit when First Fit is faster?**  
   *Defense:* In campus environments, allocating a 120-seat computer lab to a 10-person test causes external fragmentation, leaving no large space available when a company like TCS visits with 100 candidates. Best Fit reserves large capacity blocks.
3. **Why store MCQ options as JSON rather than an `options` table?**  
   *Defense:* Each question has a fixed set of 4 choices that are always fetched and displayed together. Storing options as JSON (`test_questions.options`) eliminates 4 foreign key joins per question, speeding up test paper generation.
4. **Why use database triggers for audit logs instead of Express middleware?**  
   *Defense:* Express middleware only logs actions routed through HTTP requests. Direct database updates by administrators, background workers, or migrations would escape audit. Triggers guarantee that every database mutation is logged regardless of how it occurred.
5. **Why maintain both `resources` and `computers` tables?**  
   *Defense:* `resources` represents high-level facilities (computer labs, interview rooms) with aggregate seat counts. `computers` models individual physical workstations mapped to specific lab resources with hardware codes and agent enrollment tokens.

### 4.4 3 On-the-Fly Demo Tasks
1. **Fire Audit Trigger:** Execute Section 1 of `database/demo/member4_akshay.sql` to demonstrate an application status change writing directly to `audit_log`.
2. **Demonstrate Active Session Rejection:** Execute Section 2 of `database/demo/member4_akshay.sql` to show MySQL rejecting a second active session on the same PC.
3. **Show Hardware Utilization:** Open `KernelMonitor.jsx` and explain the real-time capacity and utilization numbers in the top ledger strip.

---

## 5. Team-Wide Core Architectural Concepts

Every member of the team must be prepared to answer questions on these 5 fundamental architectural pillars:

### 5.1 Windows Session 0 Isolation
- **The Problem:** Since Windows Vista, system services run in Session 0, which has no GUI access. An exam monitoring service running as a Windows Service cannot read the student's active window title using `GetForegroundWindow()`.
- **CampusFlow's Solution:** Two-process split architecture. `CampusFlowService.exe` runs in Session 0 (elevated privileges, network transmission, auto-start). `CampusFlowMonitor.exe` runs in the student's interactive desktop session (Session 1+) and observes window focus.
- **The Bridge:** High-performance local Named Pipe (`\\.\pipe\CampusFlow`) secured with Windows DACLs.

### 5.2 Server Authority vs. Agent Sensor
- **The Rule:** The central Node.js server is the sole authority on exam session state, timings, and candidate submissions.
- **Why:** Physical lab machines can be tampered with. If the local client held authority, candidates could modify local memory or fake test submissions. The agent is strictly a passive observation sensor; it cannot declare cheating or alter test results.

### 5.3 Double-Allocation Prevention (Defense in Depth)
Double-booking a computer terminal or interview seat is prevented at three distinct layers:
1. **OS Layer (Mutex):** `SELECT ... FOR UPDATE` serializes concurrent transactions on the computer or slot row.
2. **Application Layer:** State checks verify `status === 'available'` and `existingSessions.length === 0`.
3. **Database Layer (Storage Constraint):** Virtual generated column `active_computer_id` with `UNIQUE KEY uq_active_computer_session` rejects duplicate active sessions at the InnoDB engine level.

### 5.4 Simulation vs. Live Engine Separation
- **Simulation:** Analytical algorithms (FCFS, SJF, SRTF, RR in `cpu-scheduler.js`) run in an isolated lab sandbox via `/api/os/schedule/run` to demonstrate scheduling heuristics under synthetic workloads in `SchedulingLab.jsx`.
- **Live System:** Production bookings and allocations (`critical-section.js`, `pc-allocator.js`) operate on live database entities (`slots`, `computers`, `allocations`) backed by row locks and audit triggers.

### 5.5 Known Limitations & Honesty in the Viva
If asked whether any feature is incomplete, refer to `docs/KNOWN_ISSUES.md`:
- Windows agent currently targets Windows 10/11; Linux and macOS lab terminals require web-only browser proctoring.
- Stored procedure `sp_generate_shortlist` is currently executed via database CLI or direct query; full UI button integration is in development.
- In-memory mock server (`windows-agent/tools/mock-server.js`) is provided for Linux/Mac developer testing without physical Windows machines.

