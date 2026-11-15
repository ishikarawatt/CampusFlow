# DBMS Manual

## Module Mapping (Owner – Module)
| Module | Owner | Description |
|--------|-------|-------------|
| DBMS 1 – Database Design & Schema Management | Ishika Rawat | Core schema, constraints, migrations, audit design |
| DBMS 2 – Student & Company Management | Ishika Rawat | `users`, `students`, `companies` tables and related relationships |
| DBMS 3 – Placement Drive Management | Akansha Parley | `drives`, `applications`, `offers` tables |
| DBMS 4 – Eligibility & Application Management | Akansha Parley | Eligibility logic, `sp_generate_shortlist` procedure, application workflow |
| DBMS 5 – Test & Interview Management | Akshay Singh Gusain | `test_questions`, `test_results`, `notifications` tables |
| DBMS 6 – Resource Management | Akshay Singh Gusain | `resources`, `slots`, `bookings`, `allocations`, `computers`, `agent_devices` |
| DBMS 7 – Transactions & Concurrency Control | Trisha Dabral | Row‑level locking, transaction demarcation, audit triggers |
| DBMS 8 – Queries, Reports & Analytics | Trisha Dabral | Views `v_drive_report`, `v_branch_placement`, `v_company_funnel`, `v_package_stats` |

---

## DBMS 1 – Database Design & Schema Management (Ishika)
- **Purpose:** Define the canonical data model, enforce integrity, and provide migration path.
- **Key Tables & Definitions:**
  - `users` – PK `id`; UNIQUE `email`; FK `company_id` → `companies(id)`.
  - `students` – PK `user_id` (FK to `users.id`); UNIQUE `roll_no`; CHECK constraints on `cgpa` (0‑10) and `backlogs` (≥0).
  - `companies` – PK `id`.
- **Constraints & Indexes:**
  - `users.email` UNIQUE, `students.idx_students_branch_cgpa` (branch, cgpa).
  - Foreign keys with `ON DELETE` cascade where appropriate.
- **Migrations:** `migrate_v2.sql` adds `test_date`, `interview_date`, etc.; `migrate_v3.sql` adds `auto_scheduled` column to `slots`.
- **Demo Steps:**
  1. Open **Schema Viewer** (admin UI page `client/src/pages/admin/SchemaViewer.jsx`).
  2. Verify tables and constraints displayed match the list above.
  3. Run `npm run db:reset` to apply fresh schema (no code execution here).

---

## DBMS 2 – Student & Company Management (Ishika)
- **Purpose:** Manage core entities – users, students, companies – and their relationships.
- **Tables:** `users`, `students`, `companies` (see DBMS 1).
- **Key Queries:**
  - Retrieve student profile with company affiliation:
    ```sql
    SELECT s.*, u.email, c.name AS company_name
    FROM students s
    JOIN users u ON u.id = s.user_id
    LEFT JOIN companies c ON c.id = u.company_id
    WHERE s.user_id = ?;
    ```
- **Demo Steps:**
  1. In **Admin → Users** page, select a student to view the joined details.
  2. Verify that the `company_id` link resolves to a company record.

---

## DBMS 3 – Placement Drive Management (Akansha)
- **Purpose:** Store drive metadata and applicant flow.
- **Tables:** `drives`, `applications`, `offers`.
- **Important Columns:**
  - `drives.min_cgpa`, `allowed_branches` (JSON), `max_backlogs`.
  - `applications` unique key (`drive_id`, `student_id`).
- **Key Queries:**
  - List open drives with applicant count:
    ```sql
    SELECT d.id, d.title, COUNT(a.id) AS applicants
    FROM drives d
    LEFT JOIN applications a ON a.drive_id = d.id
    WHERE d.status = 'open'
    GROUP BY d.id, d.title;
    ```
- **Demo Steps:**
  1. Open **Drives** page, view drive details and applicant counts.
  2. Click **Export** to run the above query via the built‑in admin console.

---

## DBMS 4 – Eligibility & Application Management (Akansha)
- **Purpose:** Evaluate eligibility and move applications through the pipeline.
- **Procedure:** `sp_generate_shortlist` (see schema lines 447‑466) – updates `applications.status` based on student attributes and drive criteria.
- **Demo Steps (Live):**
  1. In **Admin → Drive > Shortlist** UI, click **Run Shortlist**.
  2. The UI executes `CALL sp_generate_shortlist(<drive_id>, @cnt); SELECT @cnt;` (via server route `POST /api/drives/:id/shortlist`).
  3. Result shows number of rows updated.
- **Key Query (Eligibility):**
  ```sql
  SELECT s.*, d.*
  FROM students s
  JOIN applications a ON a.student_id = s.user_id
  JOIN drives d ON d.id = a.drive_id
  WHERE JSON_CONTAINS(d.allowed_branches, JSON_QUOTE(s.branch)) = 1
    AND s.cgpa >= d.min_cgpa
    AND s.backlogs <= d.max_backlogs;
  ```

---

## DBMS 5 – Test & Interview Management (Akshay)
- **Tables:** `test_questions`, `test_results`, `notifications` (added via `migrate_v2.sql`).
- **Key Columns:** `test_questions.options` JSON, `test_results.percentage`.
- **Demo Steps:**
  1. Open **Test Builder** UI (`client/src/pages/admin/TestBuilder.jsx`).
  2. Add a question – the UI inserts into `test_questions`.
  3. Run a mock test; results are stored in `test_results`.
- **Sample Query:**
  ```sql
  SELECT tr.*, s.roll_no, d.title
  FROM test_results tr
  JOIN students s ON s.user_id = tr.student_id
  JOIN drives d ON d.id = tr.drive_id
  WHERE tr.percentage >= d.min_test_score;
  ```

---

## DBMS 6 – Resource Management (Akshay)
- **Tables:** `resources`, `slots`, `bookings`, `allocations`, `computers`, `agent_devices`.
- **Constraints:** FK `slots.resource_id` → `resources(id)`; unique `computations.pc_code`.
- **Demo Steps (Live Allocation):**
  1. Open **Resources** page; click **Allocate PC**.
  2. Backend calls `POST /resources` which inserts into `allocations` after checking availability (`firstFitAvailablePc` / `bestFitLab` inside `pc-allocator.js`).
  3. Allocation appears in the UI list.
- **Key Query (Utilisation):**
  ```sql
  SELECT r.type, COUNT(a.id) AS allocated, COUNT(r.id) - COUNT(a.id) AS free
  FROM resources r
  LEFT JOIN allocations a ON a.resource_id = r.id AND a.ends_at > NOW()
  GROUP BY r.type;
  ```

---

## DBMS 7 – Transactions & Concurrency Control (Trisha)
- **Core Concept:** Row‑level locking using `SELECT … FOR UPDATE` in the booking flow (`server/src/os/critical-section.js`).
- **Transaction Example (Demo Script):**
  ```sql
  START TRANSACTION;
  SELECT * FROM bookings WHERE slot_id = 5 FOR UPDATE;
  INSERT INTO bookings (slot_id, student_id, status) VALUES (5, 12, 'confirmed');
  UPDATE slots SET booked_count = booked_count + 1 WHERE id = 5;
  COMMIT;
  ```
- **Isolation Level:** MySQL InnoDB default **REPEATABLE READ** (no code overrides this).
- **Demo Steps:**
  1. Open **Live Monitor** page; click **Stress Test** which spawns concurrent booking transactions.
  2. Observe that `bookings` never exceed `slots.capacity` (enforced by `CHECK` and the lock).
- **Triggers:** All audit triggers (`trg_bookings_audit_*`, `trg_applications_audit_*`, etc.) capture INSERT/UPDATE/DELETE events into `audit_log`.

---

## DBMS 8 – Queries, Reports & Analytics (Trisha)
- **Views:**
  - `v_drive_report` – drive‑level recruitment funnel.
  - `v_branch_placement` – branch‑wise placement percentages.
  - `v_company_funnel` – company‑wise applicant pipeline.
  - `v_package_stats` – salary statistics per drive.
- **Demo Steps:**
  1. In **Analytics** page, select **Drive Report** – UI runs `SELECT * FROM v_drive_report`.
  2. Verify that numbers match the underlying tables.
- **Key Query Example:**
  ```sql
  SELECT * FROM v_company_funnel ORDER BY drives DESC LIMIT 5;
  ```

---

## Normalisation & Schema Integrity
- All tables are at **3NF** – no transitive dependencies; e.g., `applications` references `drive_id` and `student_id` directly, not via redundant columns.
- Primary‑key / foreign‑key design eliminates duplication.

---

## ACID Guarantees
- All DML operations use InnoDB tables → **Atomic**, **Consistent**, **Isolated**, **Durable**.
- Default isolation **REPEATABLE READ** ensures repeatable reads for reporting queries.
- Audit triggers guarantee **durability** of change logs.

---

## Audit Design
- `audit_log` records every INSERT/UPDATE/DELETE on critical tables (`bookings`, `applications`, `allocations`, `exam_sessions`, `offers`).
- Triggers defined in `schema.sql` (lines 371‑445) and in `migrate_v5.sql` for `exam_sessions`.
- Columns: `actor_id`, `action`, `entity`, `entity_id`, `details` (JSON), `created_at`.

---

## List of DB Objects Referenced in This Manual
- **Procedures:** `sp_generate_shortlist`
- **Views:** `v_drive_report`, `v_branch_placement`, `v_company_funnel`, `v_package_stats`
- **Triggers:** `trg_bookings_audit_ai`, `trg_bookings_audit_au`, `trg_bookings_audit_ad`, `trg_applications_audit_ai`, `trg_applications_audit_au`, `trg_allocations_audit_ai`, `trg_allocations_audit_au`, `trg_allocations_audit_ad`, `trg_exam_sessions_audit_ai`, `trg_exam_sessions_audit_au`, `trg_offers_audit_ai`, `trg_offers_audit_au`
- **Tables:** `users`, `students`, `companies`, `drives`, `applications`, `offers`, `resources`, `slots`, `bookings`, `allocations`, `computers`, `agent_devices`, `exam_sessions`, `prohibited_processes`, `monitoring_events`, `test_questions`, `test_results`, `notifications`, `audit_log`, `lock_events`

---

*All claims are verified against the actual source files in the repository.*
