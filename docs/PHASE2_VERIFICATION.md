# CampusFlow OS — Phase 2 Verification & Stabilization Report

> **Branch:** `phase-2-stabilize`  
> **Environment:** Node.js v22.20.0, npm 10.9.3, MySQL 8.0.46 on Windows  
> **Date:** November 2026  
> **Execution Status:** All 8 Verification Checks Passed (100% Success)

---

## 1. Baseline Findings (Pre-Fix Assessment)

Prior to implementing the Phase 2 fixes, the application was run against baseline test fixtures. The following defects were actively reproduced:

| Test / Area | Baseline Result | Defect / Vulnerability Confirmed |
|---|---|---|
| **`npm run db:migrate`** after reset | **FATAL ERROR**: `ER_DUP_FIELDNAME: Duplicate column name 'test_date'` | **Bug B Confirmed**: `seed.js` applied `schema.sql` (which incorporates v2/v3 schema changes) but never populated `schema_migrations`. Running `npm run db:migrate` attempted to re-apply `migrate_v2.sql`. |
| **Public Registration** | `POST /api/auth/register` with `role: "admin"` returned HTTP 201 with role `admin` | **Vulnerability D Confirmed**: Anonymous users could register accounts with arbitrary administrative privilege. |
| **Telemetry & Monitor Endpoints** | `GET /api/monitor/locks`, `GET /api/monitor/stats`, `GET /api/resources` accessible without auth | **Security Gap E Confirmed**: Unauthenticated requests could inspect lock tables, student identifiers, and campus lab inventories. |
| **Stress Test & Data Pollution** | `POST /api/monitor/stress` with 100 requests created permanent users | **Bug G Confirmed**: Synthetic students (`stress<tag><id>@test.local`) accumulated permanently in `users` and `students` tables (+100 rows per run). |
| **Connection Pool Starvation** | Baseline stress test experienced pool contention (exceeded 4 minutes due to nested `pool.query` inside connection transactions) | **Bug F Confirmed**: Connection transactions in `critical-section.js` acquired secondary pool connections for logging before returning checked-out connections. |
| **Auto-Scheduled Interviews** | `POST /api/schedule/auto` inserted slots with `auto_scheduled=1` but 0 bookings | **Bug C Confirmed**: Shortlisted students saw `interview: null` on `/student/journey` because journey queries join on `bookings`. |
| **Kernel Monitor Visual Queue** | Monitor displayed "Nobody booking right now" and "No queue" | **Bug A Confirmed**: `KernelMonitor.jsx` mapped `acquired`/`waiting`/`released`, whereas the backend telemetry emitted `acquire`/`wait`/`release`. |

---

## 2. Summary of Applied Fixes

### Fix A: Live Monitor Action Strings
- **Files Modified:** `client/src/pages/admin/KernelMonitor.jsx`
- **Changes:** Updated `ACTION_PILL` and `ACTION_LABEL` mappings from `'acquired'`/`'waiting'`/`'released'` to `'acquire'`/`'wait'`/`'release'`. Updated filtering checks `l.action === 'wait'` and `l.action === 'acquire'`. Preserved database enum values intact.

### Fix B: Migration Synchronization
- **Files Modified:** `server/src/seed.js`
- **Changes:** Integrated `ensureMigrationsTable()` and `discoverMigrations()` from `dbms/migrations.js` into `seed.js`. Upon schema generation, all migration files (`migrate_v2.sql`, `migrate_v3.sql`, `migrate_v4.sql`) are recorded into `schema_migrations`. Consequently, running `npm run db:migrate` immediately after a reset reports `Database is already up to date — no pending migrations.`

### Fix C: Auto-Scheduled Interview Bookings
- **Files Modified:** `server/src/routes/schedule.js`
- **Changes:** Inside the scheduler's existing database transaction, each auto-scheduled interview slot (`capacity=1`, `booked_count=1`, `auto_scheduled=1`) now inserts a corresponding confirmed booking into `bookings` (`slot_id`, `student_id`, `'confirmed'`). Respects `uq_booking`, fires `trg_bookings_audit_ai`, avoids nested transactions, and ensures student journey pages display the interview session details (venue, time, title).

### Fix D: Public Registration Privilege Escalation Hardening
- **Files Modified:** `server/src/routes/auth.js`, `server/src/routes/users.js`, `client/src/api.js`, `client/src/pages/admin/Users.jsx`
- **Changes:**
  - `server/src/routes/auth.js`: Public `POST /api/auth/register` ignores any body `role` and strictly forces `role = 'student'`. Roll number, branch, CGPA, and graduation year validation are enforced.
  - `server/src/routes/users.js`: Added authenticated admin-only `POST /api/users` endpoint to securely provision `recruiter` and `admin` accounts with bcrypt password hashing.
  - `client/src/pages/admin/Users.jsx`: Added a clean, minimal "Add Staff Account" form allowing admins to create recruiter and admin accounts directly in the UI.

### Fix E: Unauthenticated Endpoint Authorization
- **Files Modified:** `server/src/routes/monitor.js`, `server/src/routes/resources.js`
- **Changes:**
  - `server/src/routes/monitor.js`: Restricted all routes (`/locks`, `/stats`, `/activity`, `/stress`) to `authenticateToken, requireRole('admin')`.
  - `server/src/routes/resources.js`: Secured `GET /resources` and `GET /allocations` with `authenticateToken, requireRole('admin', 'recruiter')`. Write operations remain admin-only for resources and admin/recruiter for allocations. Verified no student frontend workflows break.

### Fix F: Ghost Lock Telemetry & Connection Safety
- **Files Modified:** `server/src/os/critical-section.js`
- **Changes:** Replaced manual release telemetry calls with a guaranteed `finally` block execution guarded by `lockLogged && !lockReleased`. Immediately returned `conn.release()` to the pool before telemetry dispatch, and replaced `pool.query` inside transaction blocks with `conn.query` to completely eliminate connection pool deadlocks.

### Fix G: Stress-Test Data Pollution Elimination
- **Files Modified:** `server/src/routes/monitor.js`
- **Changes:** Added a strict `finally` block to `POST /api/monitor/stress` that executes `DELETE FROM students WHERE user_id IN (?)` and `DELETE FROM users WHERE id IN (?)` targeting the exact IDs generated for that run. Verified table row counts for `users` and `students` remain identical before and after test execution.

### Fix H: JWT Secret Enforcement
- **Files Modified:** `server/src/index.js`, `server/src/routes/auth.js`, `server/src/middleware/auth.js`, `server/.env.example`, `.gitignore`
- **Changes:** Removed all hardcoded `'change-me'` defaults. Added startup fail-fast check in `index.js` terminating the process if `JWT_SECRET` is unset. Documented placeholder in `server/.env.example` and verified `.gitignore` covers `.env` files.

### Fix I: Missing Relational Audit Triggers
- **Files Modified:** `database/schema.sql`, `database/migrate_v4.sql`
- **Changes:**
  - Created `trg_applications_audit_ai` (`AFTER INSERT ON applications`) recording initial student drive applications.
  - Created `trg_allocations_audit_au` (`AFTER UPDATE ON allocations`) recording reservation shifts.
  - Created `trg_allocations_audit_ad` (`AFTER DELETE ON allocations`) recording resource release/cancellations.
  - Created `database/migrate_v4.sql` and incorporated triggers into `database/schema.sql`.

---

## 3. Definitive Verification Matrix

All 8 prompt verification checks were executed against the live application.

| # | Verification Check | Command / Operation | Observed Output | Status |
|---|---|---|---|:---:|
| **1** | Database Reset & Clean Migration | `npm run db:reset && npm run db:migrate` in `server/` | `Recorded 3 migration(s) in schema_migrations.`<br>`Database is already up to date — no pending migrations.` (Exit code 0) | **PASSED** |
| **2** | Registration Privilege Escalation Prevention | `POST /api/auth/register` with `{ role: "admin" }` | HTTP 201: Account created with `role: "student"`. Admin creation via `POST /api/users` requires admin JWT. | **PASSED** |
| **3** | Telemetry & Monitor RBAC | Anonymous and student requests to `/api/monitor/*` and `/api/resources` | Anonymous $\rightarrow$ HTTP 401<br>Student $\rightarrow$ HTTP 403<br>Admin $\rightarrow$ HTTP 200 (returns lock rows and inventory) | **PASSED** |
| **4** | Concurrency Stress Test & Hygiene | `POST /api/monitor/stress` (100 attempts, slot capacity 10) | `attempted: 100, confirmed: 10, rejected: 90`<br>Execution time: `558 ms`<br>Pre-test students: 13, Post-test students: 13 (0 rows leaked)<br>`active_locks: 0` | **PASSED** |
| **5** | Live Monitor Action Telemetry | Polling `/api/monitor/locks` and verifying event actions | Distinct actions in telemetry: `acquire`, `wait`, `release`. Mapped cleanly in UI (`Booking`, `In queue`, `Done`). Zero ghost locks. | **PASSED** |
| **6** | Auto-Scheduled Interview Visibility | Shortlist candidate, call `POST /schedule/auto`, check `GET /api/student/journey` | Student Aarav's journey returns: `interview: { booking_id: 11, title: 'Interview — Aarav Sharma', venue: 'Lab B', starts_at: ... }` | **PASSED** |
| **7** | Client Production Build & Server Launch | `npm run build` in `client/` and startup in `server/` | `vite build` completed in 6.55s with 0 errors.<br>Server starts cleanly: `CampusFlow API listening on http://localhost:5000/api` | **PASSED** |
| **8** | Audit Trigger Execution | Register student, apply to Drive 2, inspect `audit_log` | New row created in `audit_log`: `{ action: 'INSERT', entity: 'application', entity_id: 25, details: { drive_id: 2, student_id: 118, status: 'applied' } }` | **PASSED** |

---

## 4. Endpoints Recommended for Future Hardening (Informational Only)

Per instructions, the following endpoints were left untouched in this phase but are cataloged for review in future iterations:

1. **`GET /api/drives` & `GET /api/companies`**:
   - *Current state*: Public access without authentication.
   - *Recommendation*: Allow public access to view open placement drives, but require authentication to see closed drives or recruiter contact details.
2. **`GET /api/slots`**:
   - *Current state*: Public access without authentication.
   - *Recommendation*: Require at least student authentication (`authenticateToken`) so unauthenticated external scrapers cannot map internal campus interview schedules.
3. **`GET /api/reports/placement`**:
   - *Current state*: Public access to aggregated placement conversion statistics (`v_drive_report`).
   - *Recommendation*: Consider restricting full company conversion analytics to authenticated students and staff.

