# CampusFlow OS — Phase 0 Codebase Audit Report

> **Audit Date:** November 2026  
> **Repository:** `CampusFlow` (`https://github.com/trishadabral/CampusFlow.git`)  
> **Audit Type:** Phase 0 Deep Codebase Audit (Read-Only Baseline Assessment)  
> **Scope:** Full-stack architecture, OS/DBMS concept verification, database schema & migrations, API routes, security posture, frontend client, and viva readiness.

---

## 1. Executive Summary

**CampusFlow OS** is an integrated campus placement management platform architected as a tangible operating system. The platform models placement drives as batch jobs, students as processes, and physical interview rooms/computer labs as finite shared hardware resources managed by concurrency primitives, schedulers, and deadlock avoidance algorithms.

The project is built by a 4-member student team (**Ishika Rawat**, **Akansha Parley**, **Trisha Dabral**, and **Akshay Singh Gusain**) for an undergraduate project-based learning (PBL) evaluation spanning **Operating Systems** and **Database Management Systems (DBMS)**.

### Subsystem Health Overview

| Dimension | Rating | Verdict | Summary |
|---|:---:|:---:|---|
| **OS Concept Rigor** | **9.2 / 10** | **Exceptional** | Real row-level locking (`SELECT … FOR UPDATE`), Banker's algorithm safe-sequence check, CPU scheduling (FCFS / Priority), and concurrency stress testing. |
| **DBMS Architecture** | **8.8 / 10** | **Strong** | Clean 3NF schema, declarative CHECK constraints, JSON column indexing, trigger-based audit trail, and ACID transactions. |
| **Full-Stack Execution** | **8.9 / 10** | **Strong** | Polished React 18 frontend with role-specific portals (Student, Recruiter, Admin), custom design system, and Express REST API. |
| **Code Hygiene & Clarity** | **8.5 / 10** | **Good** | Zero stack trace leakage to clients, modular separation (`os/`, `dbms/`, `routes/`), clear documentation. |
| **Security & Auth Posture** | **6.5 / 10** | **Needs Hardening** | Public privilege escalation vulnerability in `/api/auth/register`, hardcoded default JWT secret, and unauthenticated monitor endpoints. |
| **Test Automation** | **3.0 / 10** | **Deficient** | Zero automated unit/integration test suites (Jest/Vitest/Supertest); only manual stress testing exists. |
| **Overall Health Score** | **8.2 / 10** | **Production Prototype Ready** | High educational and conceptual caliber; requires bug fixes in live monitor bindings and migration tracking before viva. |

---

## 2. Codebase Topology & Volume Metrics

The repository is organized as a clean JavaScript monorepo with an Express server, React/Vite client, and MySQL database configuration:

```
CampusFlow/
├── client/                     # React 18 + Vite + Tailwind CSS frontend
│   ├── src/
│   │   ├── components/         # 9 reusable UI components
│   │   ├── pages/
│   │   │   ├── admin/          # 6 Admin screens (Monitor, Lab, Resources, Reports, Users, Overview)
│   │   │   ├── recruiter/      # 4 Recruiter screens (Wizard, Dashboard, Drive Detail, Drives)
│   │   │   └── student/        # 5 Student screens (Dashboard, Drives, Detail, TestTaker, Schedule)
│   │   ├── api.js              # Centralized Axios API client
│   │   ├── App.jsx             # Role-based route definitions
│   │   └── auth.jsx            # Authentication React context provider
├── server/                     # Node.js + Express backend
│   ├── src/
│   │   ├── dbms/               # 6 DBMS concept modules (db, transactions, audit, eligibility, reports, migrations)
│   │   ├── os/                 # 5 OS concept modules (critical-section, locks, cpu-scheduler, banker, pipeline)
│   │   ├── middleware/         # JWT and RBAC privilege ring middleware
│   │   ├── routes/             # 13 REST API route controllers
│   │   ├── index.js            # Express server entry point
│   │   ├── seed.js             # Database reset & seed fixture script
│   │   └── migrate.js          # DDL migration execution script
├── database/                   # Relational persistence layer
│   ├── schema.sql              # Complete 3NF DDL schema, triggers, procedure, view
│   ├── migrate_v2.sql          # Incremental migration v2 (pipeline & tests)
│   └── migrate_v3.sql          # Incremental migration v3 (auto-scheduled flag)
├── docs/                       # Project documentation & archived blueprint
│   ├── 01_TEAM_CONTRIBUTIONS.md
│   ├── 02_PHASE2_PLAN.md
│   ├── 03_INSTALLATION.md
│   └── archive/                # Legacy blueprints, API contracts, and viva prep
└── docker-compose.yml          # MySQL 8.0 container service definition
```

### Quantitative Metrics

- **Total Source Files:** 75 (excluding `.git` and `node_modules`)
- **Total Lines of Code:** **7,760 LOC**
  - **Client (Frontend):** 3,422 LOC across 31 files
  - **Server (Backend):** 3,133 LOC across 31 files
  - **Database (SQL):** 359 LOC across 3 files
  - **Documentation:** 770 LOC across 13 markdown files
  - **Configuration:** 76 LOC across 6 configuration files

---

## 3. Team Member Module Allocation & Concept Mapping

The project follows a 4-way vertical slice architecture where each contributor owns both an OS and a DBMS concept, backed by dedicated backend logic and frontend surfaces.

| Team Member | Module Title | OS Concept Implemented | DBMS Concept Implemented | Backend Code Owned | Frontend Screens Owned |
|---|---|---|---|---|---|
| **Ishika Rawat** *(Lead)* | **M1: Platform Core & Data Foundation** | Privilege rings (RBAC), Request-as-process model, Connection pool resource management, Deadlock avoidance (Banker's Algorithm) | ER modeling, 3NF schema, Constraints, DDL migrations, Connection pooling & Census | [server/src/os/banker.js](file:///c:/dev/CampusFlow/server/src/os/banker.js), [server/src/dbms/db.js](file:///c:/dev/CampusFlow/server/src/dbms/db.js), [server/src/dbms/migrations.js](file:///c:/dev/CampusFlow/server/src/dbms/migrations.js), [server/src/middleware/auth.js](file:///c:/dev/CampusFlow/server/src/middleware/auth.js), [server/src/seed.js](file:///c:/dev/CampusFlow/server/src/seed.js) | [client/src/pages/Login.jsx](file:///c:/dev/CampusFlow/client/src/pages/Login.jsx), [client/src/pages/admin/Users.jsx](file:///c:/dev/CampusFlow/client/src/pages/admin/Users.jsx), [client/src/components/Layout.jsx](file:///c:/dev/CampusFlow/client/src/components/Layout.jsx), App Shell |
| **Akansha Parley** | **M2: Drives, Eligibility & Interview Scheduling** | Batch-job queue scheduling (draining applicants into batched sessions) | Stored procedures (`sp_generate_shortlist`), Set-based JSON queries (`JSON_CONTAINS`), Indexed queries | [server/src/dbms/eligibility.js](file:///c:/dev/CampusFlow/server/src/dbms/eligibility.js), [server/src/os/pipeline.js](file:///c:/dev/CampusFlow/server/src/os/pipeline.js), [server/src/routes/drives.js](file:///c:/dev/CampusFlow/server/src/routes/drives.js) | [client/src/pages/recruiter/NewDriveWizard.jsx](file:///c:/dev/CampusFlow/client/src/pages/recruiter/NewDriveWizard.jsx), [client/src/pages/recruiter/RecruiterDashboard.jsx](file:///c:/dev/CampusFlow/client/src/pages/recruiter/RecruiterDashboard.jsx), [client/src/pages/student/TestTaker.jsx](file:///c:/dev/CampusFlow/client/src/pages/student/TestTaker.jsx), [client/src/pages/student/Drives.jsx](file:///c:/dev/CampusFlow/client/src/pages/student/Drives.jsx) |
| **Trisha Dabral** | **M3: Synchronization & Concurrency Control** | Mutex & Critical Section (`SELECT … FOR UPDATE`), Concurrency Stress Testing, CPU Scheduling (FCFS / Priority) | ACID transactions, Row-level locking, Isolation levels, Aggregate reporting views (`v_drive_report`) | [server/src/os/critical-section.js](file:///c:/dev/CampusFlow/server/src/os/critical-section.js), [server/src/os/cpu-scheduler.js](file:///c:/dev/CampusFlow/server/src/os/cpu-scheduler.js), [server/src/dbms/reports.js](file:///c:/dev/CampusFlow/server/src/dbms /reports.js), [server/src/routes/monitor.js](file:///c:/dev/CampusFlow/server/src/routes/monitor.js), [server/src/routes/schedule.js](file:///c:/dev/CampusFlow/server/src/routes/schedule.js) | [client/src/pages/admin/KernelMonitor.jsx](file:///c:/dev/CampusFlow/client/src/pages/admin/KernelMonitor.jsx), [client/src/pages/admin/SchedulingLab.jsx](file:///c:/dev/CampusFlow/client/src/pages/admin/SchedulingLab.jsx), [client/src/components/NotificationsBell.jsx](file:///c:/dev/CampusFlow/client/src/components/NotificationsBell.jsx) |
| **Akshay Singh Gusain** | **M4: Resource Allocation & Control Center** | Resource-allocation graph, Lock observability (acquire/wait/release latency tracking) | ACID transaction abstraction (`withTransaction`), Audit-trail queries (`audit_log`), Triggers | [server/src/os/locks.js](file:///c:/dev/CampusFlow/server/src/os/locks.js), [server/src/dbms/transactions.js](file:///c:/dev/CampusFlow/server/src/dbms/transactions.js), [server/src/dbms/audit.js](file:///c:/dev/CampusFlow/server/src/dbms/audit.js), [server/src/routes/resources.js](file:///c:/dev/CampusFlow/server/src/routes/resources.js), [server/src/routes/admin.js](file:///c:/dev/CampusFlow/server/src/routes/admin.js) | [client/src/pages/admin/AdminDashboard.jsx](file:///c:/dev/CampusFlow/client/src/pages/admin/AdminDashboard.jsx), [client/src/pages/admin/Resources.jsx](file:///c:/dev/CampusFlow/client/src/pages/admin/Resources.jsx), [client/src/pages/admin/Reports.jsx](file:///c:/dev/CampusFlow/client/src/pages/admin/Reports.jsx) |

---

## 4. Deep Technical Audit: Database Layer

### 4.1 Schema Normalization & Integrity
The database schema defined in [database/schema.sql](file:///c:/dev/CampusFlow/database/schema.sql#L1-L296) exhibits rigorous 3NF normalization across 14 tables:
- **`users` & `students`**: Implements class table inheritance. `students.user_id` acts simultaneously as Primary Key and Foreign Key referencing `users.id` with `ON DELETE CASCADE`.
- **Integrity Constraints**:
  - `CHECK (cgpa BETWEEN 0 AND 10)` in `students`
  - `CHECK (backlogs >= 0)` in `students`
  - `CHECK (booked_count <= capacity)` in `slots`
  - `CHECK (ends_at > starts_at)` in `slots` and `allocations`
  - `UNIQUE KEY uq_application (drive_id, student_id)` preventing duplicate student applications
  - `UNIQUE KEY uq_booking (slot_id, student_id)` preventing duplicate bookings per slot
  - `UNIQUE KEY uq_test_result (drive_id, student_id)` guaranteeing single attempt per drive test

### 4.2 Index Optimization
Index coverage directly matches access paths in queries:
- `idx_students_branch_cgpa (branch, cgpa)` supports eligibility queries.
- `idx_drives_status_deadline (status, application_deadline)` optimizes active drive listings.
- `idx_allocations_resource_time (resource_id, starts_at, ends_at)` speeds up Banker's time-window overlap checks.
- `idx_audit_entity (entity, entity_id)` enables indexed lookup for record change history.

### 4.3 Database Triggers
Three audit triggers in [database/schema.sql](file:///c:/dev/CampusFlow/database/schema.sql#L228-L260) record row mutations directly inside `audit_log`:
1. `trg_bookings_audit_ai`: Captures slot reservations (`INSERT`).
2. `trg_bookings_audit_au`: Captures status changes (`UPDATE`).
3. `trg_bookings_audit_ad`: Captures booking deletions (`DELETE`).
4. `trg_applications_audit_au`: Captures application status progressions (`UPDATE`).
5. `trg_allocations_audit_ai`: Captures physical resource allocations (`INSERT`).

> [!WARNING]
> **Audit Trigger Gap Identified:**
> - No `AFTER INSERT` trigger exists on `applications` (`trg_applications_audit_ai` is absent). Initial student applications are therefore not captured in `audit_log`.
> - No `UPDATE` or `DELETE` trigger exists on `allocations`. Deallocations or schedule shifts bypass the audit log.

### 4.4 Stored Procedure vs. Application Pipeline Divergence
- **Stored Procedure (`sp_generate_shortlist`)**: Located at [database/schema.sql](file:///c:/dev/CampusFlow/database/schema.sql#L264-L280). Executes a single set-based SQL `UPDATE` joining `applications`, `students`, and `drives`, using `JSON_CONTAINS(d.allowed_branches, JSON_QUOTE(s.branch))` to shortlist all qualifying students.
- **V2 Pipeline Shift**: In the v2 architecture, recruiters do not run direct eligibility shortlists; instead, candidates sit for an aptitude test. Shortlisting is carried out in [server/src/os/pipeline.js](file:///c:/dev/CampusFlow/server/src/os/pipeline.js#L215-L235) (`publishResults`), which shortlists based on `min_test_score` and `max_shortlist`.
- **Finding**: While `sp_generate_shortlist` remains functional in the MySQL schema, **no Express endpoint in the backend currently invokes it**.

### 4.5 Migration Runner vs. Schema Desync Hazard
- In [server/src/dbms/migrations.js](file:///c:/dev/CampusFlow/server/src/dbms/migrations.js#L20-L97), migrations track applied files in `schema_migrations`.
- When running `npm run db:reset` via [server/src/seed.js](file:///c:/dev/CampusFlow/server/src/seed.js#L230-L255), the database is built directly from `database/schema.sql`. `schema.sql` already contains all columns and tables from `migrate_v2.sql` and `migrate_v3.sql`.
- However, `seed.js` **does not create or populate `schema_migrations`**.
- If a developer or evaluator subsequently runs `npm run db:migrate`, the migration runner attempts to apply `migrate_v2.sql`, resulting in fatal MySQL errors (`Duplicate column name 'test_date'` or `Table 'test_questions' already exists`).

---

## 5. Deep Technical Audit: Operating Systems Layer

### 5.1 Mutex & Critical Section (`critical-section.js`)
Located at [server/src/os/critical-section.js](file:///c:/dev/CampusFlow/server/src/os/critical-section.js#L18-L103).
- **The Mutex**: The database row in `slots` is the mutex. The code initiates a transaction with `conn.beginTransaction()` and issues:
  ```sql
  SELECT id, capacity, booked_count FROM slots WHERE id = ? FOR UPDATE
  ```
- **Serialization**: Any concurrent transaction attempting to read that slot with `FOR UPDATE` is put into a wait state by the InnoDB lock manager until the first transaction commits or rolls back.
- **Race Condition Immunity**: When 100 students race for 10 seats, exactly 10 transactions succeed. The 11th sees `slot.booked_count >= slot.capacity`, triggers `conn.rollback()`, and returns HTTP 409 (`Slot is full`).
- **Connection Leak Safety**: The `conn.release()` call is enclosed in a strict `finally` block, ensuring no database connections are leaked even on uncaught exceptions.

### 5.2 Deadlock Avoidance / Banker's Algorithm (`banker.js`)
Located at [server/src/os/banker.js](file:///c:/dev/CampusFlow/server/src/os/banker.js#L34-L149).
- **Resource Types (Classes)**:
  - `lab`: Vector measured in total seating capacity (`SUM(capacity)` of all available labs).
  - `room`: Vector measured in room units (`COUNT(*)` of interview rooms).
  - `interviewer`: Vector measured in personnel units (`COUNT(*)` of available interviewers).
- **Algorithm Flow**:
  1. Verifies target resource exists and is in `available` state.
  2. Checks individual resource time overlap (`starts_at < ? AND ends_at > ?`).
  3. Computes `Total` vector and currently `Allocated` vector across all active allocations overlapping the window.
  4. Computes tentative `Remaining` vector (`Available - Request`). If any component $< 0$, rejects immediately with an over-allocation explanation.
  5. Computes pending future demands from all scheduled upcoming slots (`starts_at >= requested_starts_at`).
  6. Runs the classic **Banker's Safe Sequence Algorithm**: sets `Work = Remaining`. Loops through pending demands. If a demand $\le Work$, marks it runnable and increments `Work`. If unfulfilled demands remain when no progress can be made, the state is declared **unsafe**.
  7. Rejection returns HTTP 409 with a human-readable explanation explaining which future slot would starve.

### 5.3 CPU Scheduling Simulator (`cpu-scheduler.js`)
Located at [server/src/os/cpu-scheduler.js](file:///c:/dev/CampusFlow/server/src/os/cpu-scheduler.js#L17-L88).
- Implements two deterministic scheduling algorithms:
  1. **FCFS (First-Come, First-Served)**: Dispatches in order of arrival time, breaking ties by process ID.
  2. **Non-preemptive Priority**: Evaluates all arrived candidates, selecting the lowest priority integer (highest priority). Idles the CPU if arrival gap exists.
- Calculates waiting time ($\text{firstStart} - \text{arrival}$) and turnaround time ($\text{end} - \text{arrival}$), returning averages rounded to 1 decimal place.
- **Architectural Decision**: Round-Robin was intentionally removed in commit `c7b926d` because preemptive time-slicing is conceptually invalid for physical human interviews.

### 5.4 Batch-Job Scheduling Engine (`pipeline.js`)
Located at [server/src/os/pipeline.js](file:///c:/dev/CampusFlow/server/src/os/pipeline.js#L83-L187).
- Models candidate applications as an incoming batch queue.
- `scheduleTestSessions`:
  - Queries available labs ordered by capacity descending.
  - Batches students into lab capacities across standard working hours (10:00 to 18:00) with a 15-minute inter-batch changeover gap.
  - Automatically provisions overflow sessions if applicant volume exceeds total daily lab capacity.
  - Generates `slots` and serializes seat bookings using the `bookSeat` critical section.
  - Emits in-app student notifications for test venue, date, and reporting time.

### 5.5 Lock Observability (`locks.js`)
Located at [server/src/os/locks.js](file:///c:/dev/CampusFlow/server/src/os/locks.js#L7-L17).
- Records `lock_events` (`acquire`, `wait`, `release`) alongside wait duration in milliseconds.
- Completely non-blocking: wrapped in internal try/catch so telemetry failures never disrupt production critical sections.

---

## 6. Deep Technical Audit: DBMS Layer

### 6.1 ACID Transactions Helper (`transactions.js`)
Located at [server/src/dbms/transactions.js](file:///c:/dev/CampusFlow/server/src/dbms/transactions.js#L18-L35).
- Provides `withTransaction(work)` wrapper managing `beginTransaction()`, execution, `commit()`, automatic `rollback()` on failure, and guaranteed `release()`.
- Implements two multi-statement write operations requiring all-or-nothing atomicity:
  1. `replaceQuestionSet`: Atomically purges previous questions (`DELETE`) and inserts the new question array (`INSERT`). Prevents partial question sets or empty exams on failure.
  2. `recordTestResult`: Atomically inserts `test_results` and updates `applications.status = 'test_taken'`. Prevents desynchronization where a score exists without application state progression.

### 6.2 Set-Based Eligibility Engine (`eligibility.js`)
Located at [server/src/dbms/eligibility.js](file:///c:/dev/CampusFlow/server/src/dbms/eligibility.js#L46-L75).
- Replaces procedural node-side array filtering with a single indexed MySQL query:
  ```sql
  SELECT u.id, u.name, u.email, s.roll_no, s.branch, s.cgpa, s.backlogs, s.graduation_year
  FROM students s
  JOIN users u ON u.id = s.user_id
  WHERE s.cgpa >= ?
    AND s.backlogs <= ?
    AND s.graduation_year = ?
    AND JSON_CONTAINS(?, JSON_QUOTE(s.branch)) = 1
  ORDER BY s.cgpa DESC
  ```
- Uses MySQL's native `JSON_CONTAINS()` function to match the student's branch against the drive's allowed branch JSON array.

### 6.3 Aggregation & Analytical Queries (`reports.js`)
Located at [server/src/dbms/reports.js](file:///c:/dev/CampusFlow/server/src/dbms/reports.js#L10-L79).
- `driveOverview`: Comprehensive multi-join analytical query grouping by drive to calculate applicant funnels, tests taken, shortlists, test sessions, and interview counts using conditional aggregation (`COUNT(DISTINCT CASE WHEN …)`).
- `driveRoster`: Detailed per-applicant roster query performing 6 joins (`applications`, `students`, `users`, `test_results`, `bookings`, `slots`, `resources`) to produce an end-to-end audit of each student's journey.
- `placementReport`: Queries the `v_drive_report` database view to produce high-level company and drive conversion statistics.

---

## 7. Deep Technical Audit: API & Routing Layer

The API exposes 42 endpoints mounted across 13 route files in `server/src/routes/`:

```
Endpoint Group             Mount Path       Controller File
----------------------------------------------------------------------
Authentication             /api/auth        server/src/routes/auth.js
Drives & Pipeline          /api/drives      server/src/routes/drives.js
Slots Management           /api/slots       server/src/routes/slots.js
Seat Bookings              /api/bookings    server/src/routes/bookings.js
Resources & Allocations    /api             server/src/routes/resources.js
Interview Scheduler        /api/schedule    server/src/routes/schedule.js
Kernel Monitor             /api/monitor     server/src/routes/monitor.js
Placement Reports          /api/reports     server/src/routes/reports.js
Admin Directory            /api/users       server/src/routes/users.js
Student Journey            /api/student     server/src/routes/student.js
In-App Notifications       /api/notif...    server/src/routes/notifications.js
Admin Control Center       /api/admin       server/src/routes/admin.js
Companies                  /api/companies   server/src/routes/companies.js
```

### Complete Route Inventory & RBAC Matrix

| Route Method & Path | Auth Required | Role Ring | Purpose | Query / Mutation Type |
|---|:---:|:---:|---|---|
| `POST /api/auth/register` | No | Public | Register new user + student record | Transactional `INSERT` |
| `POST /api/auth/login` | No | Public | Authenticate and issue JWT | `SELECT` + bcrypt |
| `GET /api/auth/me` | Yes | Any | Retrieve current session profile | `SELECT` |
| `GET /api/drives` | No | Public | Browse all drives (filter by status) | Aggregated `SELECT` |
| `POST /api/drives/preview-eligibility` | Yes | Recruiter, Admin | Live count of eligible students | Set-based `JSON_CONTAINS` |
| `POST /api/drives` | Yes | Recruiter, Admin | Create drive with pipeline config | `INSERT` |
| `GET /api/drives/:id` | Optional | Public/Auth | Drive details + student eligibility | Multi-table `SELECT` |
| `POST /api/drives/:id/apply` | Yes | Student | Apply to drive (eligibility checked) | `INSERT INTO applications` |
| `GET /api/drives/:id/applications` | Yes | Recruiter, Admin | View applicant list for drive | `SELECT` |
| `GET /api/drives/:id/pipeline` | Yes | Recruiter, Admin | Funnel stage counts | Aggregated `SELECT` |
| `GET /api/drives/:id/eligible-students`| Yes | Recruiter, Admin | Filtered list of passing students | Single indexed `SELECT` |
| `POST /api/drives/:id/schedule-tests` | Yes | Recruiter, Admin | Auto-batch students into lab sessions| Batching + `bookSeat()` |
| `POST /api/drives/:id/publish-results`| Yes | Recruiter, Admin | Shortlist cutoff + interview timetable| Timetabling + `bookSeat()` |
| `POST /api/drives/:id/select` | Yes | Recruiter, Admin | Mark student as final selection | `UPDATE applications` |
| `POST /api/drives/:id/questions` | Yes | Recruiter, Admin | Upload/replace question set | Transactional `replaceQuestionSet`|
| `GET /api/drives/:id/questions` | Yes | Recruiter, Admin | Retrieve questions for recruiter | `SELECT` |
| `GET /api/drives/:id/test` | Yes | Student | Retrieve test paper for applicant | `SELECT` (options stripped of key)|
| `POST /api/drives/:id/test/submit` | Yes | Student | Auto-grade and record MCQ submission | Transactional `recordTestResult` |
| `GET /api/slots` | No | Public | List slots for a drive | `SELECT` |
| `POST /api/slots` | Yes | Recruiter, Admin | Create manual slot | `INSERT` |
| `POST /api/bookings` | Yes | Student | Book seat manually | Mutex critical section `bookSeat` |
| `GET /api/bookings/me` | Yes | Student | View student's booked sessions | `SELECT` |
| `DELETE /api/bookings/:id` | Yes | Student, Admin | Cancel booking (revives capacity) | Transactional `UPDATE` |
| `GET /api/resources` | No | Public | List labs and rooms | `SELECT` |
| `POST /api/resources` | Yes | Admin | Add physical lab or room | `INSERT` |
| `GET /api/allocations` | No | Public | List resource reservations | `SELECT` |
| `POST /api/allocations` | Yes | Recruiter, Admin | Allocate resource with Banker check | Banker's Algorithm + `INSERT` |
| `POST /api/schedule/simulate` | No | Public | CPU scheduling simulation | FCFS / Priority simulator |
| `POST /api/schedule/auto` | Yes | Recruiter, Admin | Generate interview timetable | CPU Priority + Banker check |
| `GET /api/schedule/auto/:drive_id` | Yes | Any | Retrieve generated timetable | `SELECT` |
| `DELETE /api/schedule/auto/:drive_id` | Yes | Recruiter, Admin | Delete generated timetable | Transactional `DELETE` |
| `GET /api/monitor/locks` | No | Public | Tail lock events for monitor | `SELECT` |
| `GET /api/monitor/stats` | No | Public | Database census + active locks | Sub-select census + `SELECT` |
| `GET /api/monitor/activity` | No | Public | Audit log tail | Trigger audit read |
| `POST /api/monitor/stress` | Yes | Admin | Concurrency stress test (1-200) | Concurrent `bookSeat` race |
| `GET /api/reports/placement` | No | Public | View placement progress report | `v_drive_report` View |
| `GET /api/users` | Yes | Admin | List all user accounts | `SELECT` |
| `GET /api/student/journey` | Yes | Student | Full student journey tracker | Multi-query pipeline assembler |
| `GET /api/notifications` | Yes | Any | View student inbox | `SELECT` |
| `POST /api/notifications/read-all`| Yes | Any | Mark all notifications read | `UPDATE` |
| `PATCH /api/notifications/:id/read`| Yes | Any | Mark single notification read | `UPDATE` |
| `GET /api/admin/overview` | Yes | Admin | Control center pipeline overview | Multi-join funnel query |
| `GET /api/admin/schedule` | Yes | Admin | Master session schedule | Multi-join schedule query |
| `GET /api/admin/drive/:id/roster` | Yes | Admin | Full applicant roster with results | 6-table join query |
| `GET /api/companies` | No | Public | List companies | `SELECT` |
| `POST /api/companies` | Yes | Recruiter, Admin | Register company | `INSERT` |

---

## 8. Deep Technical Audit: Frontend Client Architecture

### 8.1 Technology Stack & Setup
- **Framework:** React 18.3.1 with React Router DOM 6.26.2
- **Build Tool:** Vite 5.4.8 (configured with backend proxy `/api` $\rightarrow$ `http://localhost:5000`)
- **Styling:** Tailwind CSS 3.4.13 with custom components and micro-animations defined in [client/src/index.css](file:///c:/dev/CampusFlow/client/src/index.css#L1-L113)

### 8.2 Client Design System & Reusable Components
The UI kit is modularized into 9 standalone components:
1. [Layout.jsx](file:///c:/dev/CampusFlow/client/src/components/Layout.jsx): Role-based navigation sidebar, topbar, mobile drawer, and notification bell.
2. [NotificationsBell.jsx](file:///c:/dev/CampusFlow/client/src/components/NotificationsBell.jsx): Header dropdown with unread badge counter and auto-refresh polling every 30s.
3. [Stepper.jsx](file:///c:/dev/CampusFlow/client/src/components/Stepper.jsx): Supports both horizontal process steppers and vertical student journey progress trackers.
4. [DataTable.jsx](file:///c:/dev/CampusFlow/client/src/components/DataTable.jsx): Generalized data table with empty-state handling.
5. [Badge.jsx](file:///c:/dev/CampusFlow/client/src/components/Badge.jsx): Status pills with semantic variants (`success`, `warning`, `danger`, `info`, `neutral`).
6. [StatCard.jsx](file:///c:/dev/CampusFlow/client/src/components/StatCard.jsx): Metrics card with subtle hover transitions.
7. [Toast.jsx](file:///c:/dev/CampusFlow/client/src/components/Toast.jsx): Global toast notification system with context dispatch.
8. [EmptyState.jsx](file:///c:/dev/CampusFlow/client/src/components/EmptyState.jsx): Standardized empty state graphic and action handler.
9. [GanttChart.jsx](file:///c:/dev/CampusFlow/client/src/components/GanttChart.jsx): Lightweight CSS-based timeline visualizer. *(Note: currently orphaned as identified in Section 9).*

### 8.3 Student Journey Experience
- **Progress Tracking**: [StudentDashboard.jsx](file:///c:/dev/CampusFlow/client/src/pages/student/StudentDashboard.jsx) renders visual vertical steppers displaying exact stage progression (`Applied` $\rightarrow$ `Test session` $\rightarrow$ `Test result` $\rightarrow$ `Interview`).
- **In-App Aptitude Test**: [TestTaker.jsx](file:///c:/dev/CampusFlow/client/src/pages/student/TestTaker.jsx) delivers a timed test environment. Questions appear sequentially with a progress indicator, visual countdown clock, auto-submission when timer hits zero, and immediate post-submission grading.

### 8.4 Recruiter Command View & Add Drive Wizard
- **4-Step Wizard**: [NewDriveWizard.jsx](file:///c:/dev/CampusFlow/client/src/pages/recruiter/NewDriveWizard.jsx) guides drive creation through criteria setup, test MCQ authoring, interview parameters, and a live eligibility preview querying the database before publishing.
- **Pipeline Controller**: [RecruiterDriveDetail.jsx](file:///c:/dev/CampusFlow/client/src/pages/recruiter/RecruiterDriveDetail.jsx) empowers recruiters to advance hiring stages with two primary system actions: **Schedule tests** (batching applicants into labs) and **Publish results** (shortlisting and generating the interview timetable).

### 8.5 Admin Control Center & Live Systems
- **Master Timetable**: [AdminDashboard.jsx](file:///c:/dev/CampusFlow/client/src/pages/admin/AdminDashboard.jsx) aggregates pipeline progress across all drives, showing next recommended actions.
- **Scheduling Lab**: [SchedulingLab.jsx](file:///c:/dev/CampusFlow/client/src/pages/admin/SchedulingLab.jsx) simulates interview timetables comparing highest-marks-first vs. application-order waiting times, complete with Banker's algorithm lab reservations.

---

## 9. Critical Findings, Bugs & Architectural Discrepancies

During the deep-dive audit, 10 specific code anomalies, bugs, and architectural discrepancies were discovered.

---

### Finding 1: [HIGH SEVERITY BUG] Action String Mismatch Breaks Live Monitor Queue
- **Location:** [client/src/pages/admin/KernelMonitor.jsx](file:///c:/dev/CampusFlow/client/src/pages/admin/KernelMonitor.jsx#L13-L21) & [server/src/os/critical-section.js](file:///c:/dev/CampusFlow/server/src/os/critical-section.js#L22-L33)
- **Root Cause:**
  - In backend `critical-section.js` and `schema.sql`, lock event actions are logged as `'acquire'`, `'wait'`, and `'release'`.
  - In frontend `KernelMonitor.jsx`, the code expects past-tense strings:
    ```javascript
    const ACTION_PILL = { acquired: 'success', waiting: 'warning', released: 'neutral' };
    const ACTION_LABEL = { acquired: 'Booking', waiting: 'In queue', released: 'Done' };
    ```
  - Furthermore, queue filtering logic checks:
    ```javascript
    if (l.action === 'waiting') waiting.push(l);
    else if (l.action === 'acquired') running.push(l);
    ```
- **Impact:**
  Because the backend sends `'acquire'`, `'wait'`, and `'release'`, `l.action === 'acquired'` and `l.action === 'waiting'` **never evaluate to true**.
  In the Live Monitor UI, the *"Who's booking right now"* panel (`Getting a seat` and `In line`) **always displays "Nobody booking right now" and "No queue"**, even during a live 100-student stress test. Badges also display raw unmapped action strings.
- **Required Remediation:** Update `KernelMonitor.jsx` to match backend actions:
  ```javascript
  const ACTION_PILL = { acquire: 'success', wait: 'warning', release: 'neutral' };
  const ACTION_LABEL = { acquire: 'Booking', wait: 'In queue', release: 'Done' };
  ...
  if (l.action === 'wait') waiting.push(l);
  else if (l.action === 'acquire') running.push(l);
  ```

---

### Finding 2: [HIGH SEVERITY BUG] Database Migration vs. Schema Desync
- **Location:** [server/src/seed.js](file:///c:/dev/CampusFlow/server/src/seed.js#L230-L255) & [server/src/dbms/migrations.js](file:///c:/dev/CampusFlow/server/src/dbms/migrations.js#L78-L96)
- **Root Cause:**
  - `database/schema.sql` creates all v1, v2, and v3 tables and columns.
  - When setting up via `npm run db:reset`, `seed.js` executes `schema.sql` but leaves `schema_migrations` unpopulated.
  - When running `npm run db:migrate`, `migrations.js` discovers `migrate_v2.sql` and `migrate_v3.sql`, finds no record of them in `schema_migrations`, and attempts to execute them on the already-upgraded schema.
- **Impact:**
  `npm run db:migrate` fails fatally with MySQL duplicate column/table errors:
  `ER_DUP_FIELDNAME: Duplicate column name 'test_date'`.
- **Required Remediation:** Update `server/src/seed.js` to automatically insert `migrate_v2.sql` and `migrate_v3.sql` into `schema_migrations` upon completing the schema build.

---

### Finding 3: [MEDIUM SEVERITY BUG] Scheduling Lab Auto-Scheduler Omits Bookings
- **Location:** [server/src/routes/schedule.js](file:///c:/dev/CampusFlow/server/src/routes/schedule.js#L191-L208) vs. [server/src/routes/student.js](file:///c:/dev/CampusFlow/server/src/routes/student.js#L34-L42)
- **Root Cause:**
  - When `POST /schedule/auto` creates the interview timetable, it inserts records into `slots` (`auto_scheduled = 1`), but **never creates corresponding rows in `bookings`** for the shortlisted students.
  - However, `student.js` (`/student/journey`) and `bookings.js` locate upcoming interviews by executing `JOIN bookings b ON b.slot_id = s.id WHERE b.student_id = ?`.
- **Impact:**
  Interviews scheduled via the Admin Scheduling Lab do not appear on the student's *"My Journey"* dashboard or *"My Schedule"* page.
- **Required Remediation:** In `schedule.js`, invoke `bookSeat(slotId, studentId, 'scheduler')` inside the transaction for each generated slot.

---

### Finding 4: [SECURITY VULNERABILITY] Unrestricted Privilege Escalation in Registration
- **Location:** [server/src/routes/auth.js](file:///c:/dev/CampusFlow/server/src/routes/auth.js#L24-L31)
- **Root Cause:**
  The registration endpoint extracts `role` directly from `req.body` without verifying existing administrative credentials:
  ```javascript
  const { name, email, password, role, ... } = req.body || {};
  if (!VALID_ROLES.includes(role)) { ... }
  ```
- **Impact:**
  Any anonymous client can register an account with `role: "admin"` or `role: "recruiter"`, instantly obtaining complete control over the system.
- **Required Remediation:** Restrict self-registration to `role: 'student'` only, or require an admin secret key/invitation token for administrative accounts.

---

### Finding 5: [SECURITY CONCERN] Unauthenticated Telemetry & Audit Endpoints
- **Location:** [server/src/routes/monitor.js](file:///c:/dev/CampusFlow/server/src/routes/monitor.js#L19-L81) & [server/src/routes/resources.js](file:///c:/dev/CampusFlow/server/src/routes/resources.js#L10-L73)
- **Root Cause:**
  Endpoints `/api/monitor/locks`, `/api/monitor/activity`, `/api/monitor/stats`, `/api/resources`, and `/api/allocations` lack authentication middleware.
- **Impact:**
  Anonymous callers can view student email addresses in the lock table, read detailed database audit mutation history, and inspect college resource inventories.
- **Required Remediation:** Protect monitoring and internal inventory endpoints with `authenticateToken` and `requireRole('admin', 'recruiter')`.

---

### Finding 6: [OBSERVABILITY FLAW] Incomplete Lock Release Telemetry on Unexpected Errors
- **Location:** [server/src/os/critical-section.js](file:///c:/dev/CampusFlow/server/src/os/critical-section.js#L22-L99)
- **Root Cause:**
  `releaseLock()` is manually invoked before `return` and inside handled error branches (`slot full`, `duplicate booking`). However, if an unhandled database exception occurs during `conn.query()`, execution bypasses `releaseLock()` and jumps directly to `catch` and `finally`.
- **Impact:**
  Connection is properly closed in `finally`, but `lock_events` is left with an open `acquire`/`wait` event without a matching `release`, causing `GET /api/monitor/stats` (`active_locks`) to report ghost locks indefinitely.
- **Required Remediation:** Move `releaseLock()` into the `finally` block conditioned on `lockLogged && !lockReleased`.

---

### Finding 7: [DATA HYGIENE] Stress-Test User Accumulation in Production Tables
- **Location:** [server/src/routes/monitor.js](file:///c:/dev/CampusFlow/server/src/routes/monitor.js#L106-L133)
- **Root Cause:**
  Every invocation of `POST /api/monitor/stress` inserts `count` permanent student accounts (`Stress Student N`, `stress<tag><id>@test.local`) into `users` and `students` tables to guarantee clean race conditions.
- **Impact:**
  Repeatedly running stress tests pollutes the database with hundreds of dummy student rows that clutter user tables and reports.
- **Required Remediation:** Add a cleanup query at the end of the stress test endpoint (`DELETE FROM users WHERE email LIKE 'stress%@test.local'`) or flag synthetic stress test accounts.

---

### Finding 8: [DOCUMENTATION DRIFT] Orphaned `sp_generate_shortlist` and `GanttChart.jsx`
- **Location:** [database/schema.sql](file:///c:/dev/CampusFlow/database/schema.sql#L264-L280) & [client/src/components/GanttChart.jsx](file:///c:/dev/CampusFlow/client/src/components/GanttChart.jsx)
- **Root Cause:**
  - The stored procedure `sp_generate_shortlist` is documented in `01_TEAM_CONTRIBUTIONS.md` and `server/src/dbms/README.md`, but replaced in v2 by `publishResults()` in `pipeline.js`.
  - `GanttChart.jsx` exists in the component library and is promised in blueprints, but is not imported or rendered in `SchedulingLab.jsx`.
- **Impact:**
  Risk of confusion during viva examination if evaluators ask to see `sp_generate_shortlist` triggered over HTTP network traces or request the interactive Gantt chart.
- **Required Remediation:** Document that `sp_generate_shortlist` represents the direct Phase 1 criteria engine (executable in MySQL CLI via `CALL sp_generate_shortlist(1, @count)`), and wire `GanttChart.jsx` into `SchedulingLab.jsx` or archive it cleanly.

---

### Finding 9: [DBMS AUDIT GAP] Missing Audit Triggers on Application & Allocation Lifecycle
- **Location:** [database/schema.sql](file:///c:/dev/CampusFlow/database/schema.sql#L248-L260)
- **Root Cause:**
  - `applications` only has `AFTER UPDATE` trigger; `AFTER INSERT` and `AFTER DELETE` are absent.
  - `allocations` only has `AFTER INSERT` trigger; `AFTER UPDATE` and `AFTER DELETE` are absent.
- **Impact:**
  Initial application submissions and resource cancellations/deallocations leave no audit trail in `audit_log`.
- **Required Remediation:** Add `trg_applications_audit_ai`, `trg_allocations_audit_au`, and `trg_allocations_audit_ad` triggers to `database/schema.sql`.

---

### Finding 10: [TESTING DEFICIENCY] Absence of Automated Test Harness
- **Location:** [server/package.json](file:///c:/dev/CampusFlow/server/package.json#L17-L23) & [client/package.json](file:///c:/dev/CampusFlow/client/package.json#L1)
- **Root Cause:**
  Neither project contains a `test` npm script or testing framework dependency (such as Jest, Vitest, Supertest, or Cypress).
- **Impact:**
  Verification relies completely on manual interaction and browser testing. Regressions in Banker's matrix arithmetic or critical section transaction logic cannot be automatically detected in CI.
- **Required Remediation:** Introduce Vitest/Supertest integration suites for `os/banker.js`, `os/critical-section.js`, and `dbms/transactions.js`.

---

## 10. Viva Readiness & Syllabus Defense Guide

Below is the definitive cross-examination guide for the upcoming viva evaluation, detailing what each student owns, how their code proves their concept, and how to defend against examiner challenges.

```
                         ┌─────────────────────────────────────────────────────────┐
                         │                     CampusFlow OS                       │
                         │              Full Monorepo Architecture                 │
                         └────────────────────────────┬────────────────────────────┘
                                                      │
         ┌──────────────────────────┬─────────────────┴────────────┬─────────────────────────┐
         ▼                          ▼                              ▼                         ▼
 ┌───────────────┐          ┌───────────────┐              ┌───────────────┐         ┌───────────────┐
 │ Ishika Rawat  │          │Akansha Parley │              │ Trisha Dabral │         │ Akshay Gusain │
 │  M1: Platform │          │  M2: Pipeline │              │M3: Concurrency│         │ M4: Resources │
 ├───────────────┤          ├───────────────┤              ├───────────────┤         ├───────────────┤
 │• 3NF Schema   │          │• Batch Jobs   │              │• Row Mutex    │         │• Lock Metrics │
 │• Migrations   │          │• Set Queries  │              │• Stress Test  │         │• ACID Helper  │
 │• DB Pool      │          │• Test Taker   │              │• CPU Scheduler│         │• Audit Reader │
 │• Banker's Alg │          │• Wizard UI    │              │• Reports View │         │• Control UI   │
 └───────────────┘          └───────────────┘              └───────────────┘         └───────────────┘
```

### 10.1 Ishika Rawat — M1: Platform Core & Data Foundation
- **Core OS Defense:** *Why does the Banker's algorithm operate on resource types rather than individual rooms?*
  - **Answer:** Classic Banker's algorithm operates on vectors of identical resource units (resource classes). In our model, any lab can fulfill lab seat demand and any interview room can fulfill room demand. Evaluating against aggregate capacity while maintaining time-window overlap checks accurately enforces deadlock avoidance.
- **Core DBMS Defense:** *Why use schema migrations instead of `db:reset` in production?*
  - **Answer:** `db:reset` drops and recreates tables, destroying live production data. Migrations version the schema incrementally using DDL statements, recording applied files in `schema_migrations`.
- **Code Walkthrough Points:**
  - Show [server/src/os/banker.js](file:///c:/dev/CampusFlow/server/src/os/banker.js#L120-L146) to demonstrate the safe-sequence loop over remaining capacity.
  - Show [database/schema.sql](file:///c:/dev/CampusFlow/database/schema.sql#L23-L33) to explain 3NF normalization on `students` with table inheritance from `users`.

### 10.2 Akansha Parley — M2: Drives, Eligibility & Interview Scheduling
- **Core OS Defense:** *How does the placement pipeline map to batch-job scheduling?*
  - **Answer:** Individual student applications are not scheduled on-demand (which would fragment lab utilization). Instead, applications accumulate in a queue. When the drive closes, the batch scheduler drains the queue as a batch job, packing students into labs sorted by capacity descending, taking into account lunch breaks and changeover gaps.
- **Core DBMS Defense:** *Why is eligibility checked via a single SQL query rather than fetching students into Node?*
  - **Answer:** Set-based operations belong in the database where data lives. Fetching 1,000 students into Node memory incurs network serialization overhead and defeats database indexes. `findEligibleStudents()` runs one indexed pass using `JSON_CONTAINS()` directly in MySQL.
- **Code Walkthrough Points:**
  - Show [server/src/dbms/eligibility.js](file:///c:/dev/CampusFlow/server/src/dbms/eligibility.js#L46-L75) demonstrating the indexed single-pass query.
  - Show [server/src/os/pipeline.js](file:///c:/dev/CampusFlow/server/src/os/pipeline.js#L127-L156) demonstrating the lab batching algorithm.

### 10.3 Trisha Dabral — M3: Synchronization & Concurrency Control
- **Core OS Defense:** *Why is the database row lock the mutex rather than an in-memory Node mutex?*
  - **Answer:** In modern microservices or clustered Node environments, multiple server instances run concurrently with separate memory heaps. An in-memory JavaScript mutex (or Node event loop) only serializes requests inside a single process. The database is the single shared source of truth; only InnoDB's row-level lock can guarantee serialization across all application instances.
- **Core DBMS Defense:** *What happens without `FOR UPDATE` in the booking transaction?*
  - **Answer:** Under standard `READ COMMITTED` or `REPEATABLE READ`, concurrent transactions read the same `booked_count` simultaneously before either commits. Both see available seats, insert a booking, and increment the count, causing overselling beyond physical capacity. `SELECT … FOR UPDATE` acquires an exclusive lock that forces contenders into a wait queue until the first transaction commits.
- **Code Walkthrough Points:**
  - Show [server/src/os/critical-section.js](file:///c:/dev/CampusFlow/server/src/os/critical-section.js#L27-L35) highlighting `SELECT … FOR UPDATE` inside `beginTransaction()`.
  - Demonstrate the Rush-Hour stress test in [server/src/routes/monitor.js](file:///c:/dev/CampusFlow/server/src/routes/monitor.js#L86-L144), proving that `confirmed = min(attempted, capacity)`.

### 10.4 Akshay Singh Gusain — M4: Resource Allocation & Control Center
- **Core OS Defense:** *How does lock observability differ from mutual exclusion itself?*
  - **Answer:** Mutual exclusion guarantees correctness (preventing two processes from entering the critical section simultaneously). Lock observability measures the cost of that correctness (recording who holds the resource, who is waiting, and wait duration in milliseconds). `locks.js` writes events to `lock_events` so administrators can analyze lock contention and wait latency in the Live Monitor.
- **Core DBMS Defense:** *Why wrap multi-statement writes in `withTransaction()`?*
  - **Answer:** In `replaceQuestionSet`, we delete previous questions and insert new ones. If an insert fails halfway through without a transaction, the drive is corrupted with a partial exam. `withTransaction()` guarantees Atomicity: either all statements commit, or the database rolls back to the prior clean state.
- **Code Walkthrough Points:**
  - Show [server/src/dbms/transactions.js](file:///c:/dev/CampusFlow/server/src/dbms/transactions.js#L18-L35) explaining the try/catch/rollback wrapper.
  - Show [server/src/dbms/audit.js](file:///c:/dev/CampusFlow/server/src/dbms/audit.js#L20-L57) explaining index-backed audit history reads.

---

## 11. Actionable Roadmap & Priority Remediation

To elevate the repository from its current strong prototype state to evaluation perfection, the team should execute these prioritized actions:

### Immediate Phase 0 Polish (Before Evaluation Demo)
1. **Fix KernelMonitor Action Strings**: Update `KernelMonitor.jsx` line 14 & line 98 to match backend actions (`acquire`, `wait`, `release`) so the Live Monitor queue cards display active contenders during the viva stress test demo.
2. **Sync Seed with Migrations**: Add an `INSERT INTO schema_migrations` statement in `server/src/seed.js` for `migrate_v2.sql` and `migrate_v3.sql` to avoid errors if evaluators test `npm run db:migrate`.
3. **Connect Scheduling Lab to Bookings**: In `server/src/routes/schedule.js`, ensure auto-scheduled interview slots call `bookSeat()` so student users see their interviews on their dashboard.
4. **Update Documentation Copies**: Update `README.md` to reflect that Round-Robin was intentionally retired in favor of FCFS and Priority algorithms.

### Phase 2 Implementation Priorities (Post-Phase 1 Evaluation)
1. **Security Hardening**: Enforce student-only registration in `auth.js`; add secret invite tokens for recruiters and admins; secure monitor endpoints behind role checks.
2. **Test Automation Suite**: Introduce a Vitest test suite covering:
   - Concurrency race conditions in `critical-section.js`
   - Unsafe state detection in `banker.js`
   - Mathematical averages in `cpu-scheduler.js`
3. **Database Audit Coverage**: Implement missing triggers on `applications` (`INSERT`) and `allocations` (`UPDATE`, `DELETE`).
4. **Automated Stress Account Cleanup**: Add automatic deletion of temporary `stress%` student accounts post-test.
5. **Phase 2 Feature Roadmap**: As detailed in `docs/02_PHASE2_PLAN.md`:
   - Ishika: Email SMTP notifications, profile PDF uploads, live WebSocket dashboard updates.
   - Akansha: Multi-round interview rubrics, interviewer feedback scorecards, offer letter generator.
   - Trisha: C++ lab monitoring daemon, deadlock demonstration suite, admin audit log UI viewer.
   - Akshay: Test waitlist management, resource calendar week-view, CSV/PDF report exports.

---

*Report compiled and certified under Phase 0 Read-Only Codebase Audit standards.*

