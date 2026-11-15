# Project Map

## Authoritative Distribution (Team Members → Modules)

| Member | OS Modules (2) | DBMS Modules (2) |
|--------|----------------|------------------|
| **Ishika Rawat** (lead) | 4 Deadlock Management (Banker's algorithm, deadlock demo) – `server/src/os/banker.js` (exports `checkAllocation`) <br> 8 Agent & Device Control – `windows-agent/src/service/http_client.cpp`, `server/src/os/agent.js` (agent registration, token auth, heartbeat) | 1 Database Design & Schema Management – `database/schema.sql`, migration scripts (`database/migrate_v2.sql`, `server/src/dbms/migrations.js`) <br> 2 Student & Company Management – `server/src/routes/auth.js`, `server/src/routes/recruiter.js`, `server/src/routes/companies.js`, tables `users`, `students`, `companies` | 

| **Akansha Parley** | 2 Queue Management – `server/src/os/pipeline.js` (batch scheduling of interview pipelines) <br> 7 Exam Environment Monitoring – `server/src/os/monitor.js` (lock events, activity), `windows-agent/src/service/http_client.cpp` (focus/foreground telemetry) | 3 Placement Drive Management – `server/src/routes/drives.js`, tables `drives`, `applications` <br> 4 Eligibility & Application Management – `server/src/dbms/eligibility.js` (functions `checkEligibility`, `findEligibleStudents`), stored procedure `sp_generate_shortlist` (referenced in docs) | 

| **Trisha Dabral** | 1 Task Scheduling – `server/src/os/cpu-scheduler.js` (functions `simulate`) <br> 3 Process Synchronization – `server/src/os/critical-section.js` (`bookSeat`), `server/src/os/locks.js` (`logLockEvent`) | 7 Transactions & Concurrency Control – `server/src/dbms/transactions.js` (`withTransaction`), `server/src/dbms/audit.js` (triggers, `recentActivity`) <br> 8 Queries, Reports & Analytics – `server/src/dbms/reports.js`, view `v_drive_report` (used in admin UI) | 

| **Akshay Singh Gusain** | 5 Resource Allocation – `server/src/os/pc-allocator.js` (`allocatePcToStudent`, `startSession`) <br> 6 Resource Utilization – `server/src/os/pc-allocator.js` (allocation stats), UI pages under `client/src/pages/admin/Resources.jsx` | 5 Test & Interview Management – tables `test_questions`, `test_results`, `applications` (status flow) <br> 6 Resource Management – tables `resources`, `allocations`, `computers`, `exam_sessions`, `monitoring_events` | 

## Real Files, Functions, Tables, Endpoints, UI Pages

- **OS Functions**: `checkAllocation` (banker), `simulate` (CPU scheduler), `bookSeat` (critical section), `logLockEvent`, `allocatePcToStudent`, `startSession`, `pipeline` (queue manager).
- **DBMS Functions**: `tableCounts`, `healthCheck`, `findEligibleStudents`, `checkEligibility`, `withTransaction`, `recentActivity`.
- **Endpoints** (selected):
  - `POST /api/auth/register` – registration (auth module).
  - `POST /api/auth/login` – login.
  - `GET /api/recruiter/company` – recruiter company profile.
  - `GET /api/monitor/locks` – lock events (admin).
  - `POST /api/monitor/stress` – stress test.
  - `POST /api/agent/register` – agent registration.
- **UI Pages** (client):
  - `StudentDashboard.jsx` – student view.
  - `Admin/Resources.jsx` – resource inventory.
  - `Admin/ControlCenter.jsx` – system monitor.
  - `Recruiter/DriveDashboard.jsx` – drive pipeline.

These mappings will be referenced throughout the documentation to ensure every claim is verifiable.

