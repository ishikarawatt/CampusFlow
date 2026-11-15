# CampusFlow — Known Issues, Scope Boundaries & Honest Disclosures

This document candidly lists architectural limitations, scope boundaries, and features intentionally left unbuilt or separated in CampusFlow. In a viva examination, admitting these design boundaries honestly and presenting the rationale demonstrates maturity and technical integrity.

---

## 1. Stored Procedure Integration (`sp_generate_shortlist`)
- **Status in Database:** Fully implemented in `database/schema.sql` (lines 447–466). Evaluates applicants using `JSON_CONTAINS` and set-based bulk `UPDATE` operations.
- **Status in API:** Currently, the Express web application executes eligibility checks and status updates via JavaScript in `server/src/dbms/eligibility.js` and `server/src/os/pipeline.js` rather than calling `CALL sp_generate_shortlist()`.
- **Reason & Defense:** The stored procedure was developed to demonstrate in-database batch processing for high-volume viva demonstrations (`database/demo/member2_akansha.sql`). In the web layer, keeping eligibility logic in Node.js allows emitting fine-grained Socket.IO progress events for individual candidate status transitions.
- **Future Work:** Expose an admin trigger endpoint (`POST /api/drives/:id/shortlist/proc`) that invokes the procedure directly via `pool.query('CALL sp_generate_shortlist(?, @count)', [driveId])`.

---

## 2. Platform-Specific Native Agent (Windows Only)
- **Status:** The native C++17 agent (`CampusFlowService.exe` and `CampusFlowMonitor.exe` in `windows-agent/`) is compiled exclusively for 64-bit Windows environments (Windows 10/11).
- **Limitation:** Campus laboratories utilizing Linux (Ubuntu LTS) or macOS workstations cannot run the native agent.
- **Mitigation & Defense:** Linux and macOS client workstations rely on browser-level focus events (`window.onblur`, `document.onvisibilitychange`). For development, testing, and Linux server deployments, we provide an in-memory mock agent server (`windows-agent/tools/mock-server.js`) to generate authentic telemetry packets without requiring physical Windows hardware.

---

## 3. Simulation vs. Production Scheduling Engine Separation
- **Status:** CPU scheduling algorithms (FCFS, Non-Preemptive SJF, Preemptive SRTF, Priority, and Round Robin) are implemented in `server/src/os/cpu-scheduler.js` and visualized in `client/src/pages/admin/SchedulingLab.jsx`.
- **Scope Boundary:** These algorithms operate on synthetic or simulated process workloads rather than directly mutating the production `slots` and `bookings` database tables.
- **Reason & Defense:** Standard CPU scheduling algorithms are mathematical abstractions designed for millisecond CPU bursts and single-core or multi-core processors. Real campus interview scheduling involves human constraints (interviewer lunch breaks, multi-room physical logistics, candidate travel times). Production timetable generation uses batch time-partitioning in `server/src/os/pipeline.js`, while the Scheduling Lab serves as an analytical pedagogical tool.

---

## 4. Proctoring Privacy Limits (No Webcam or Keylogging)
- **Status:** The agent monitors only active foreground window titles (`GetForegroundWindow`) and blacklisted executable names (`EnumProcesses`).
- **Scope Boundary:** CampusFlow intentionally captures zero keystrokes, zero webcam feeds, zero microphone audio, and zero continuous full-desktop video streams.
- **Reason & Defense:**
  1. **Bandwidth:** Streaming 500 concurrent 720p video feeds across a campus LAN requires 500+ Mbps of continuous switch throughput, saturating local infrastructure.
  2. **Privacy:** Students take tests in institutional computer laboratories. Capturing background windows or personal device files introduces severe legal and privacy liabilities under IT and data protection regulations. Focus detection and prohibited process polling provide effective academic integrity enforcement with minimal overhead.

---

## 5. Fallback HTTP Polling Alongside WebSockets
- **Status:** Real-time lock events and agent heartbeats are transmitted via Socket.IO.
- **Limitation:** If a firewall, proxy, or unstable network drops the WebSocket connection, the React client falls back to 2-second HTTP polling on endpoints like `/monitor/locks` and `/monitor/stats`.
- **Impact:** In high-concurrency stress tests, dozens of simultaneous browser tabs polling every 2 seconds increase connection pool utilization. In production, dedicated WebSocket load balancers or longer polling backoffs should be used.

---

## 6. Single Active Session Constraint Edge Case
- **Status:** Enforced at the database level by virtual stored column `active_computer_id` with `UNIQUE KEY uq_active_computer_session` in `exam_sessions`.
- **Limitation:** If an administrator forcibly terminates an exam session out-of-band by killing the agent process without updating the database status from `'active'` to `'ended'`, the computer remains marked as occupied until an admin clicks **End Session** in the UI.
- **Mitigation:** The heartbeat deadman detector marks agent devices as `'offline'` after 30 seconds of silence, visually alerting the proctor to clear or reassign the seat.

