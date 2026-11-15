# OS Manual

## Subsystem A – Intelligent Recruitment Task Management

### OS 1 – Task Scheduling (Trisha Dabral)
- **Owner:** Trisha Dabral
- **Purpose:** Simulate CPU scheduling algorithms for interview timetable generation.
- **Implementation:** `server/src/os/cpu-scheduler.js` exports `simulate`.
- **Demo Type:** **SIMULATION**
- **Demo Endpoint:** `POST /api/os/schedule/run` (see `server/src/routes/admin/os-schedule.js`).
- **Demo UI Page:** `client/src/pages/admin/SchedulingLab.jsx`
- **Demo Steps:**
  1. Open the Admin sidebar and navigate to **Scheduling Lab**.
  2. Select a drive, choose an algorithm (e.g., `fcfs`), and click **Run Scheduler**.
  3. The UI calls `POST /api/os/schedule/run` which invokes `simulate` and returns a JSON result showing the Gantt chart and average waiting time.
- **Expected Result:** JSON with fields `order`, `gantt`, `avg_waiting_time`, etc., displayed in the page.

### OS 2 – Queue Management (Akansha Parley)
- **Owner:** Akansha Parley
- **Purpose:** Batch‑schedule test‑session queues for drives.
- **Implementation:** `server/src/os/pipeline.js` provides `scheduleTestSessions` and `publishResults`.
- **Demo Type:** **SIMULATION** (uses the same UI as OS 1).
- **Demo UI Page:** `client/src/pages/admin/SchedulingLab.jsx`
- **Demo Steps:**
  1. On the **Scheduling Lab** page, after generating a timetable, click **Compare Algorithms**.
  2. The page calls the `simulate` endpoint for each algorithm; the queue‑management logic is exercised indirectly when the server persists the run.
- **Expected Result:** Comparison table showing average waiting times for each algorithm.

## Subsystem B – Concurrent Recruitment & Conflict Management

### OS 3 – Process Synchronisation (Trisha Dabral)
- **Owner:** Trisha Dabral
- **Purpose:** Ensure exclusive booking of interview slots via DB row locks.
- **Implementation:** `server/src/os/critical-section.js` exports `bookSeat`; `server/src/os/locks.js` exports `logLockEvent`.
- **Demo Type:** **LIVE SYSTEM**
- **Demo Endpoints:**
  - `GET /monitor/locks` – shows recent lock events.
  - `POST /monitor/stress` – fires concurrent booking attempts.
- **Demo UI Page:** `client/src/pages/admin/KernelMonitor.jsx`
- **Demo Steps:**
  1. Open **Live Monitor** in the Admin sidebar.
  2. Observe the lock table refreshes every 2 s (calls `GET /monitor/locks`).
  3. Click **Run Stress Test** to invoke `POST /monitor/stress` which internally calls `bookSeat` many times.
- **Expected Result:** Lock events list updates; stress‑test result shows `confirmed` equals the slot capacity, no oversell.

### OS 4 – Deadlock Management (Ishika Rawat)
- **Owner:** Ishika Rawat
- **Purpose:** Apply Banker's algorithm to avoid unsafe resource allocations.
- **Implementation:** `server/src/os/banker.js` exports `checkAllocation`.
- **Demo Type:** **LIVE SYSTEM**
- **Demo UI Page:** `client/src/pages/admin/Resources.jsx`
- **Demo Steps:**
  1. Navigate to **Resources & Labs**.
  2. Fill the **Allocate Resource** form and submit.
  3. The client calls `POST /resources` which, on the server side, triggers `checkAllocation` via the `banker` module before inserting the allocation.
- **Expected Result:** Success toast if the request is safe; error toast with status 409 and explanation if the allocation would lead to a deadlock.

## Subsystem C – Campus Infrastructure Resource OS

### OS 5 – Resource Allocation (Akshay Singh Gusain)
- **Owner:** Akshay Singh Gusain
- **Purpose:** Allocate a physical exam PC to a student, ensuring mutual exclusion.
- **Implementation:** `server/src/os/pc-allocator.js` exports `allocatePcToStudent` and `startSession`.
- **Demo Type:** **LIVE SYSTEM**
- **Demo UI Page:** `client/src/pages/admin/ExamMonitoring.jsx`
- **Demo Steps:**
  1. In the Admin sidebar, open **Exam Monitoring**.
  2. The page polls `GET /monitor/locks` and the Socket.IO feed for allocation events.
  3. When a student logs in, the backend calls `allocatePcToStudent`; the allocation appears as a new entry in the **Resources** table on the page.
- **Expected Result:** The allocated PC is shown with status **allocated**, and the student name appears beside it.

### OS 6 – Resource Utilisation (Akshay Singh Gusain)
- **Owner:** Akshay Singh Gusain
- **Purpose:** Provide real‑time utilisation statistics for PCs, labs and locks.
- **Implementation:** Statistics gathered via `GET /monitor/stats` (see `server/src/routes/monitor.js`).
- **Demo Type:** **LIVE SYSTEM**
- **Demo UI Page:** `client/src/pages/admin/KernelMonitor.jsx`
- **Demo Steps:**
  1. Open **Live Monitor**.
  2. The top **LedgerStrip** displays values from `GET /monitor/stats` – e.g., active slots, active locks.
- **Expected Result:** Numbers reflect the current database counts; they update on each poll.

## Subsystem D – Campus Test Environment & System Control

### OS 7 – Exam Environment Monitoring (Akansha Parley)
- **Owner:** Akansha Parley
- **Purpose:** Monitor live exam‑PC heartbeats and flagged events.
- **Implementation:** `server/src/routes/monitor.js` provides:
  - `GET /monitor/locks`
  - `GET /monitor/stats`
  - `GET /monitor/activity`
  - `POST /monitor/stress`
- **Demo Type:** **LIVE SYSTEM**
- **Demo UI Page:** `client/src/pages/admin/ExamMonitoring.jsx`
- **Demo Steps:**
  1. Open **Exam Monitoring**.
  2. The page establishes a Socket.IO connection and receives `agent:heartbeat` and `agent:event` messages.
  3. Observe the **PCs** list updating with foreground window titles and processes.
- **Expected Result:** Real‑time table shows each PC’s status, last foreground title, and any new telemetry flags.

### OS 8 – Agent & Device Control (Ishika Rawat)
- **Owner:** Ishika Rawat
- **Purpose:** Enroll Windows agents and receive periodic heartbeat data.
- **Implementation:** `server/src/routes/agent.js` defines:
  - `POST /api/agent/register`
  - `POST /api/agent/heartbeat`
- **Demo Type:** **LIVE SYSTEM**
- **Demo Steps:**
  1. Run the Windows agent binary (`CampusFlowService.exe`) on a test machine with a valid enrollment code.
  2. The agent issues `POST /api/agent/register`; the server returns a token.
  3. The agent then sends heartbeat JSON every few seconds to `POST /api/agent/heartbeat`.
  4. In **Exam Monitoring** UI, the heartbeat updates appear instantly.
- **Expected Result:** The agent appears **online** on the monitor page; any change in foreground window shows up as a telemetry event.

---

## Mapping of OS Concepts to Code

| OS Concept | Code Reference |
|------------|----------------|
| Mutual exclusion / critical section | `bookSeat` in `server/src/os/critical-section.js` (row‑level `SELECT ... FOR UPDATE`) |
| Deadlock avoidance (Banker) | `checkAllocation` in `server/src/os/banker.js` |
| Deadlock detection (safe‑sequence) | Same `checkAllocation` algorithm |
| CPU scheduling algorithms | `simulate` in `server/src/os/cpu-scheduler.js` |
| Queue management | `scheduleTestSessions` / `publishResults` in `server/src/os/pipeline.js` |
| First‑Fit allocation | `firstFitAvailablePc` in `server/src/os/pc-allocator.js` |
| Best‑Fit allocation | `bestFitLab` in `server/src/os/pc-allocator.js` |
| Resource utilisation stats | `GET /monitor/stats` in `server/src/routes/monitor.js` |
| IPC via named pipe (agent ↔ service) | `CampusFlowService.exe` / `CampusFlowMonitor.exe` (see `windows-agent/README.md`) |
| Session‑0 isolation (service vs monitor) | Documented in `windows-agent/README.md` |
| Heartbeat / liveness | `POST /api/agent/heartbeat` and Socket.IO events in `client/src/pages/admin/ExamMonitoring.jsx` |

---

**List of Functions and Endpoints Cited** (for quick reference):

- `simulate` – `server/src/os/cpu-scheduler.js`
- `checkAllocation` – `server/src/os/banker.js`
- `bookSeat` – `server/src/os/critical-section.js`
- `logLockEvent` – `server/src/os/locks.js`
- `allocatePcToStudent` – `server/src/os/pc-allocator.js`
- `startSession` – `server/src/os/pc-allocator.js`
- `firstFitAvailablePc` – `server/src/os/pc-allocator.js`
- `bestFitLab` – `server/src/os/pc-allocator.js`
- `scheduleTestSessions` – `server/src/os/pipeline.js`
- `publishResults` – `server/src/os/pipeline.js`
- `POST /api/os/schedule/run` – `server/src/routes/admin/os-schedule.js`
- `POST /api/os/schedule/compare` – `server/src/routes/admin/os-schedule.js`
- `GET /monitor/locks` – `server/src/routes/monitor.js`
- `GET /monitor/stats` – `server/src/routes/monitor.js`
- `GET /monitor/activity` – `server/src/routes/monitor.js`
- `POST /monitor/stress` – `server/src/routes/monitor.js`
- `POST /api/agent/register` – `server/src/routes/agent.js`
- `POST /api/agent/heartbeat` – `server/src/routes/agent.js`

---

*All claims are grounded in the actual source files listed above.*
