# CampusFlow Phase 3 Verification Report: Exam-PC Monitoring Subsystem

- **Date**: 2026-11-14
- **Branch**: `phase-3-agent-backend`
- **Scope**: Physical PC Supervision, Agent Protocol, Concurrency Control, Real-Time Socket.IO, Admin Dashboard

---

## Verification Matrix

| # | Check Description | Result | Details |
|---|---|---|---|
| 1 | `db:reset` and `db:migrate` clean execution | **PASS** | Recreated schema, recorded all migrations including `migrate_v5.sql` in `schema_migrations`, seeded 10 computers & 8 prohibited processes. |
| 2 | 50 Parallel Allocations Mutex (`SELECT ... FOR UPDATE`) | **PASS** | Exactly 1 succeeded (HTTP 201), 49 rejected (HTTP 409 Conflict). `computers.status='allocated'`. No duplicate active sessions. |
| 3 | Agent Simulator Registration & Socket.IO Broadcast | **PASS** | Real-time `agent:status` emitted to `admins` room with `status: 'online'` within 5s of heartbeat. |
| 4 | Active Session Telemetry Enforcement & Live Alerts | **PASS** | Events without active session rejected (HTTP 400). With active session, events accepted (HTTP 200), stored in MySQL, and emitted via `agent:event`. |
| 5 | Sweeper Offline Timeout & Reconnect Lifecycle | **PASS** | Heartbeat absence (>15s) triggered sweeper to mark PC offline and create `AGENT_DISCONNECTED`. Subsequent heartbeat created `AGENT_RECONNECTED`. |
| 6 | Role Security & Token Boundary Isolation | **PASS** | Student JWT rejected on admin route (403); Agent Bearer token rejected on admin route (401); User JWT rejected on agent route (401); Invalid token rejected (401). |
| 7 | Human Review State Persistence | **PASS** | Admin `PATCH /api/admin/monitoring/events/:id` persisted `review_status='reviewed'`, `reviewed_by`, and `review_note` in MySQL. |
| 8 | Client Production Build & Server Health | **PASS** | Client `npm run build` succeeded (`147 modules transformed`); server boots cleanly with Socket.IO and sweeper active. |

---

## Detailed Real Outputs from Verification Suite

### Check 1: Database Reset & Migrations
```
Applied migrations recorded in schema_migrations:
  - migrate_v2.sql (applied at Sat Nov 14 2026 19:35:03 GMT+0530)
  - migrate_v3.sql (applied at Sat Nov 14 2026 19:35:03 GMT+0530)
  - migrate_v4.sql (applied at Sat Nov 14 2026 19:35:03 GMT+0530)
  - migrate_v5.sql (applied at Sat Nov 14 2026 19:35:03 GMT+0530)
DB Counts: 10 computers, 8 prohibited processes seeded.
Database is already up to date — no pending migrations.
```

### Check 2: 50 Parallel Allocations (Critical Section Race Test)
Target PC: ID 1 (`LAB-A-PC01`)
```
50 concurrent POST /api/admin/exam-sessions dispatched via Promise.all
Results:
  - 201 Created: 1
  - 409 Conflict: 49
  - Other errors: 0
Database state:
  computers.status: 'allocated'
  active_sessions_count: 1
```

### Check 3: Simulator Registration & Socket.IO Feed
Target PC: ID 2 (`LAB-A-PC02`)
```
POST /api/agent/register
Response:
{
  agent_token: "<sha256-backed-raw-token>",
  computer: { id: 2, pc_code: "LAB-A-PC02" }
}

POST /api/agent/heartbeat
Response:
{
  server_time: "2026-11-14T14:14:42.348Z",
  session: null,
  prohibited_processes: [
    "anydesk.exe", "chatgpt.exe", "discord.exe", "slack.exe",
    "teamviewer.exe", "telegram.exe", "whatsapp.exe", "zoom.exe"
  ]
}

Socket.IO Event Received ('agent:status'):
{
  computer_id: 2,
  pc_code: "LAB-A-PC02",
  status: "online",
  hostname: "WIN11-LAB-PC02",
  agent_version: "1.0.0-test"
}
```

### Check 4: Telemetry Gating (Active Session Requirement)
```
1. Attempt without active session:
   POST /api/agent/events -> HTTP 400 Bad Request
   { error: "Events rejected: this computer does not have an active exam session." }

2. Session created and started:
   POST /api/admin/exam-sessions -> 201 Created (Session ID: 2)
   POST /api/admin/exam-sessions/2/start -> 200 OK

3. Attempt with active session:
   POST /api/agent/events (FOCUS_LOST, PROHIBITED_PROCESS: discord.exe)
   Response: 200 OK { accepted: 2 }

4. Socket.IO Event Received ('agent:event'):
   event_type: "PROHIBITED_PROCESS"
   process_name: "discord.exe"
   computer_id: 2
   review_status: "new"
```

### Check 5: Heartbeat Timeout Sweeper & Automatic Event Lifecycle
```
1. Simulating silent agent death by aging heartbeat > 15s.
2. Server-side sweeper (runs every 5s) detects timeout:
   Device status updated to 'offline' in agent_devices
   Inserted event into monitoring_events:
   {
     event_type: "AGENT_DISCONNECTED",
     window_title: "Heartbeat timeout (>15s)",
     process_name: "agent_sweeper"
   }
3. Agent restarts and sends heartbeat:
   POST /api/agent/heartbeat -> HTTP 200
   Inserted event into monitoring_events:
   {
     event_type: "AGENT_RECONNECTED",
     occurred_at: "2026-11-14T14:14:49.443Z"
   }
```

### Check 6: Role Security & Token Boundary Isolation
```
1. Admin route with Student JWT:
   GET /api/admin/monitoring/pcs -> HTTP 403 Forbidden
2. Admin route with Agent Bearer Token:
   GET /api/admin/monitoring/pcs -> HTTP 401 Unauthorized
3. Agent route with User JWT:
   POST /api/agent/heartbeat -> HTTP 401 Unauthorized
4. Agent route with Invalid Bearer Token:
   POST /api/agent/heartbeat -> HTTP 401 Unauthorized
```

### Check 7: Event Review State Persistence
```
PATCH /api/admin/monitoring/events/1
Payload:
{
  review_status: "reviewed",
  review_note: "Verified legitimate practice exam window switch."
}
Response: HTTP 200 OK
MySQL Query Verification:
SELECT review_status, review_note, reviewed_by FROM monitoring_events WHERE id = 1;
Result:
  review_status: "reviewed"
  review_note: "Verified legitimate practice exam window switch."
  reviewed_by: 1
```

### Check 8: Client Build & Server Start
```
Client: vite v5.4.21 building for production...
✓ 147 modules transformed.
dist/index.html                   0.70 kB │ gzip:   0.39 kB
dist/assets/index-Cauwuxg_.css   38.37 kB │ gzip:   7.02 kB
dist/assets/index-CVR2gniP.js   401.00 kB │ gzip: 119.59 kB
✓ built in 6.98s (Exit code: 0)

Server:
CampusFlow API listening on http://localhost:5000/api
Socket.IO initialized.
Agent sweeper active (5s interval).
```

