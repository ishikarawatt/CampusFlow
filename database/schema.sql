-- ============================================================================
-- CampusFlow OS — database/schema.sql
-- MySQL 8 / InnoDB. 3NF. Run:  mysql -u root -p < schema.sql
-- Creates database `campusflow` with all tables, indexes, triggers, procedures.
-- Seed data lives in server/src/seed.js (needs bcrypt for password hashes).
-- ============================================================================

CREATE DATABASE IF NOT EXISTS campusflow
  CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE campusflow;

-- ---------------------------------------------------------------- users --
-- One row per human. Role = privilege ring (admin > recruiter > student).
CREATE TABLE users (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  name          VARCHAR(100) NOT NULL,
  email         VARCHAR(150) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  role          ENUM('student','recruiter','admin') NOT NULL,
  is_active     BOOLEAN NOT NULL DEFAULT 1,
  company_id    INT NULL,
  created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ------------------------------------------------------------- students --
CREATE TABLE students (
  user_id              INT PRIMARY KEY,
  roll_no              VARCHAR(20) NOT NULL UNIQUE,
  branch               VARCHAR(10) NOT NULL,          -- CSE, IT, ECE, ME ...
  cgpa                 DECIMAL(4,2) NOT NULL CHECK (cgpa BETWEEN 0 AND 10),
  backlogs             INT NOT NULL DEFAULT 0 CHECK (backlogs >= 0),
  graduation_year      INT NOT NULL,
  phone                VARCHAR(20) NULL,
  skills               JSON NULL,
  projects             JSON NULL,
  certifications       JSON NULL,
  resume_path          VARCHAR(255) NULL,
  resume_original_name VARCHAR(255) NULL,
  resume_uploaded_at   DATETIME NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_students_branch_cgpa (branch, cgpa)
);

-- ------------------------------------------------------------ companies --
CREATE TABLE companies (
  id               INT AUTO_INCREMENT PRIMARY KEY,
  name             VARCHAR(120) NOT NULL,
  website          VARCHAR(200),
  sector           VARCHAR(80),
  description      TEXT NULL,
  location         VARCHAR(120) NULL,
  industry         VARCHAR(80) NULL,
  hr_contact_email VARCHAR(255) NULL
);

ALTER TABLE users ADD CONSTRAINT fk_users_company FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE SET NULL;

-- --------------------------------------------------------------- drives --
-- A placement drive = a "job" submitted to the system.
CREATE TABLE drives (
  id                   INT AUTO_INCREMENT PRIMARY KEY,
  company_id           INT NOT NULL,
  title                VARCHAR(150) NOT NULL,
  description          TEXT,
  min_cgpa             DECIMAL(4,2) NOT NULL DEFAULT 0,
  allowed_branches     JSON NOT NULL,           -- e.g. ["CSE","IT"]
  max_backlogs         INT NOT NULL DEFAULT 0,
  graduation_year      INT NOT NULL,
  application_deadline DATETIME NOT NULL,
  -- Pipeline configuration (v2): the system manages test & interview
  -- sessions from these settings — the recruiter never books rooms.
  test_date            DATE NULL,
  interview_date       DATE NULL,
  test_duration_min    INT NOT NULL DEFAULT 60,
  interview_duration_min INT NOT NULL DEFAULT 20,
  num_interviewers     INT NOT NULL DEFAULT 2,
  min_test_score       DECIMAL(5,2) NOT NULL DEFAULT 50.00,  -- % needed to qualify
  max_shortlist        INT NOT NULL DEFAULT 20,              -- cap on interview shortlist
  status               ENUM('draft','open','testing','interviews','closed','pending_approval','approved','rejected') NOT NULL DEFAULT 'open',
  approval_note VARCHAR(500) NULL,
  reviewed_by INT NULL,
  reviewed_at DATETIME NULL,
  created_by           INT NOT NULL,
  created_at           TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (company_id) REFERENCES companies(id),
  FOREIGN KEY (created_by) REFERENCES users(id),
  INDEX idx_drives_status_deadline (status, application_deadline)
);

-- --------------------------------------------------------- applications --
CREATE TABLE applications (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  drive_id   INT NOT NULL,
  student_id INT NOT NULL,                      -- FK -> students.user_id
  status     ENUM('applied','test_taken','shortlisted','rejected','selected','withdrawn') NOT NULL DEFAULT 'applied',
  applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_application (drive_id, student_id),
  FOREIGN KEY (drive_id)   REFERENCES drives(id)   ON DELETE CASCADE,
  FOREIGN KEY (student_id) REFERENCES students(user_id) ON DELETE CASCADE,
  INDEX idx_applications_drive (drive_id, status)
);

-- --------------------------------------------------------------- offers --
CREATE TABLE offers (
  id             INT AUTO_INCREMENT PRIMARY KEY,
  application_id INT NOT NULL UNIQUE,
  drive_id       INT NOT NULL,
  student_id     INT NOT NULL,
  company_id     INT NOT NULL,
  package_lpa    DECIMAL(6,2) NOT NULL CHECK (package_lpa > 0),
  joining_date   DATE NULL,
  note           VARCHAR(500) NULL,
  status         ENUM('offered','accepted','declined','withdrawn') NOT NULL DEFAULT 'offered',
  created_by     INT NOT NULL,
  created_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  responded_at   DATETIME NULL,
  FOREIGN KEY (application_id) REFERENCES applications(id)  ON DELETE CASCADE,
  FOREIGN KEY (drive_id)       REFERENCES drives(id)        ON DELETE CASCADE,
  FOREIGN KEY (student_id)     REFERENCES students(user_id) ON DELETE CASCADE,
  FOREIGN KEY (company_id)     REFERENCES companies(id)     ON DELETE CASCADE,
  FOREIGN KEY (created_by)     REFERENCES users(id),
  INDEX idx_offers_student_status (student_id, status),
  INDEX idx_offers_drive (drive_id)
);

-- ------------------------------------------------------------ resources --
-- Physical resources managed by the allocator (labs, rooms, interviewers).
CREATE TABLE resources (
  id       INT AUTO_INCREMENT PRIMARY KEY,
  name     VARCHAR(120) NOT NULL,
  type     ENUM('lab','room','interviewer') NOT NULL,
  capacity INT NOT NULL DEFAULT 1 CHECK (capacity > 0),  -- seats for labs, 1 for rooms/interviewers
  location VARCHAR(120),
  status   ENUM('available','maintenance') NOT NULL DEFAULT 'available',
  INDEX idx_resources_type (type, status)
);

-- ---------------------------------------------------------------- slots --
-- Test / interview slots = schedulable resources with finite capacity.
CREATE TABLE slots (
  id           INT AUTO_INCREMENT PRIMARY KEY,
  drive_id     INT NOT NULL,
  resource_id  INT NULL,                          -- venue: lab for tests, room for interviews
  type         ENUM('test','interview') NOT NULL,
  title        VARCHAR(150) NOT NULL,
  starts_at    DATETIME NOT NULL,
  ends_at      DATETIME NOT NULL,
  capacity     INT NOT NULL CHECK (capacity > 0),
  booked_count INT NOT NULL DEFAULT 0 CHECK (booked_count >= 0),
  auto_scheduled TINYINT(1) NOT NULL DEFAULT 0,  -- 1 = generated by POST /schedule/auto
  CHECK (booked_count <= capacity),
  CHECK (ends_at > starts_at),
  FOREIGN KEY (drive_id) REFERENCES drives(id) ON DELETE CASCADE,
  FOREIGN KEY (resource_id) REFERENCES resources(id) ON DELETE SET NULL,
  INDEX idx_slots_drive (drive_id, starts_at),
  INDEX idx_slots_resource (resource_id),
  INDEX idx_slots_auto (drive_id, auto_scheduled)
);

-- ------------------------------------------------------------- bookings --
-- Booking a seat = entering the critical section. One transaction in app code:
--   BEGIN; SELECT ... FOR UPDATE; INSERT; UPDATE booked_count; COMMIT;
CREATE TABLE bookings (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  slot_id    INT NOT NULL,
  student_id INT NOT NULL,
  status     ENUM('confirmed','cancelled','waitlist') NOT NULL DEFAULT 'confirmed',
  booked_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_booking (slot_id, student_id),
  FOREIGN KEY (slot_id)    REFERENCES slots(id) ON DELETE CASCADE,
  FOREIGN KEY (student_id) REFERENCES students(user_id) ON DELETE CASCADE,
  INDEX idx_bookings_slot (slot_id)
);


-- ---------------------------------------------------------- allocations --
CREATE TABLE allocations (
  id           INT AUTO_INCREMENT PRIMARY KEY,
  resource_id  INT NOT NULL,
  slot_id      INT NULL,                          -- optional link to a test/interview slot
  purpose      VARCHAR(200) NOT NULL,
  seats_needed INT NOT NULL DEFAULT 1,           -- for labs: how many seats of capacity
  starts_at    DATETIME NOT NULL,
  ends_at      DATETIME NOT NULL,
  allocated_by INT NOT NULL,
  created_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CHECK (ends_at > starts_at),
  FOREIGN KEY (resource_id)  REFERENCES resources(id),
  FOREIGN KEY (slot_id)      REFERENCES slots(id) ON DELETE SET NULL,
  FOREIGN KEY (allocated_by) REFERENCES users(id),
  INDEX idx_allocations_resource_time (resource_id, starts_at, ends_at)
);

-- ------------------------------------------------------- test_questions --
-- Recruiter-uploaded MCQs for a drive's aptitude test.
CREATE TABLE test_questions (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  drive_id      INT NOT NULL,
  question_text TEXT NOT NULL,
  options       JSON NOT NULL,                 -- ["opt A","opt B","opt C","opt D"]
  correct_index TINYINT NOT NULL,              -- 0..3
  marks         INT NOT NULL DEFAULT 1,
  created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (drive_id) REFERENCES drives(id) ON DELETE CASCADE,
  INDEX idx_tq_drive (drive_id);

-- ------------------------------------------------------- drive_tests --
-- Admin approval data for each drive's test
CREATE TABLE drive_tests (
  drive_id INT PRIMARY KEY,
  test_status ENUM('draft','pending_approval','approved','rejected') NOT NULL DEFAULT 'approved',
  approval_note VARCHAR(500) NULL,
  reviewed_by INT NULL,
  reviewed_at DATETIME NULL,
  duration_minutes INT NOT NULL DEFAULT 60,
  FOREIGN KEY (drive_id) REFERENCES drives(id) ON DELETE CASCADE
);

-- Populate drive_tests for existing drives (seed will also do this)
INSERT INTO drive_tests (drive_id)
  SELECT id FROM drives;
);

-- --------------------------------------------------------- test_results --
-- One row per student per drive: the auto-graded outcome.
CREATE TABLE test_results (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  drive_id    INT NOT NULL,
  student_id  INT NOT NULL,                    -- FK -> students.user_id
  score       DECIMAL(6,2) NOT NULL,
  total       DECIMAL(6,2) NOT NULL,
  percentage  DECIMAL(5,2) NOT NULL,
  answers     JSON NULL,                       -- {question_id: chosen_index}
  submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_test_result (drive_id, student_id),
  FOREIGN KEY (drive_id)   REFERENCES drives(id)   ON DELETE CASCADE,
  FOREIGN KEY (student_id) REFERENCES students(user_id) ON DELETE CASCADE,
  INDEX idx_tr_drive (drive_id, percentage)
);

-- -------------------------------------------------------- notifications --
-- In-app inbox: the system tells students about test sessions, results,
-- and interview schedules. Links are client routes (e.g. /student/tests/3).
CREATE TABLE notifications (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  user_id    INT NOT NULL,
  title      VARCHAR(200) NOT NULL,
  body       TEXT,
  link       VARCHAR(200) NULL,
  is_read    TINYINT(1) NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_notif_user (user_id, is_read, created_at)
);

-- ------------------------------------------------------------ audit_log --
-- Written by triggers below. The DB telling on us: every mutation recorded.
CREATE TABLE audit_log (
  id         BIGINT AUTO_INCREMENT PRIMARY KEY,
  actor_id   INT NULL,
  action     VARCHAR(60) NOT NULL,               -- INSERT.booking, UPDATE.application ...
  entity     VARCHAR(60) NOT NULL,
  entity_id  INT NULL,
  details    JSON NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (actor_id) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_audit_entity (entity, entity_id),
  INDEX idx_audit_time (created_at)
);

-- ---------------------------------------------------------- lock_events --
-- Written by the API's lock manager. Powers the Kernel Monitor's lock table.
CREATE TABLE lock_events (
  id         BIGINT AUTO_INCREMENT PRIMARY KEY,
  lock_name  VARCHAR(100) NOT NULL,              -- e.g. "slot:7"
  holder     VARCHAR(150) NOT NULL,              -- user email / "stress-test"
  action     ENUM('acquire','wait','release') NOT NULL,
  wait_ms    INT NOT NULL DEFAULT 0,
  created_at TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP(3),
  INDEX idx_lock_time (created_at),
  INDEX idx_lock_name (lock_name)
);

-- ------------------------------------------------------------ computers --
-- Physical machines in computer labs mapped to lab resources.
CREATE TABLE computers (
  id              INT AUTO_INCREMENT PRIMARY KEY,
  resource_id     INT NOT NULL,
  pc_code         VARCHAR(50) NOT NULL UNIQUE,
  enrollment_code VARCHAR(64) NOT NULL UNIQUE,
  status          ENUM('available','allocated','maintenance') NOT NULL DEFAULT 'available',
  created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (resource_id) REFERENCES resources(id) ON DELETE CASCADE,
  INDEX idx_computers_resource (resource_id),
  INDEX idx_computers_status (status)
);

-- -------------------------------------------------------- agent_devices --
-- Windows agent installation instances authenticated via SHA-256 token hash.
CREATE TABLE agent_devices (
  id                 INT AUTO_INCREMENT PRIMARY KEY,
  computer_id        INT NOT NULL UNIQUE,
  token_hash         VARCHAR(64) NOT NULL,
  hostname           VARCHAR(150) NULL,
  agent_version      VARCHAR(50) NULL,
  status             ENUM('online','offline') NOT NULL DEFAULT 'offline',
  last_heartbeat_at      TIMESTAMP NULL,
  last_foreground_title  VARCHAR(255) NULL,
  last_foreground_process VARCHAR(255) NULL,
  registered_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (computer_id) REFERENCES computers(id) ON DELETE CASCADE,
  INDEX idx_agent_devices_heartbeat (status, last_heartbeat_at),
  INDEX idx_agent_devices_token (token_hash)
);

-- -------------------------------------------------------- exam_sessions --
-- PC-student exam allocations. Concurrency rule: at most one active session per PC.
CREATE TABLE exam_sessions (
  id                   INT AUTO_INCREMENT PRIMARY KEY,
  computer_id          INT NOT NULL,
  student_id           INT NOT NULL,
  drive_id             INT NULL,
  status               ENUM('scheduled','active','ended') NOT NULL DEFAULT 'scheduled',
  exam_window_keyword  VARCHAR(100) NOT NULL DEFAULT 'CampusFlow',
  starts_at            DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  ends_at              DATETIME NULL,
  ended_at             DATETIME NULL,
  created_by           INT NULL,
  active_computer_id   INT GENERATED ALWAYS AS (IF(status IN ('scheduled', 'active'), computer_id, NULL)) STORED,
  UNIQUE KEY uq_active_computer_session (active_computer_id),
  FOREIGN KEY (computer_id) REFERENCES computers(id),
  FOREIGN KEY (student_id)  REFERENCES students(user_id) ON DELETE CASCADE,
  FOREIGN KEY (drive_id)    REFERENCES drives(id) ON DELETE SET NULL,
  FOREIGN KEY (created_by)  REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_exam_sessions_student (student_id),
  INDEX idx_exam_sessions_computer_status (computer_id, status)
);

-- ------------------------------------------------- prohibited_processes --
-- Blacklisted processes during exam sessions (communication/remote access apps).
CREATE TABLE prohibited_processes (
  id           INT AUTO_INCREMENT PRIMARY KEY,
  process_name VARCHAR(100) NOT NULL UNIQUE,
  added_by     INT NULL,
  created_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (added_by) REFERENCES users(id) ON DELETE SET NULL
);

-- ---------------------------------------------------- monitoring_events --
-- Agent-reported telemetry events (focus loss, window switch, forbidden process).
CREATE TABLE monitoring_events (
  id              BIGINT AUTO_INCREMENT PRIMARY KEY,
  exam_session_id INT NULL,
  computer_id     INT NOT NULL,
  event_type      ENUM('FOCUS_LOST','WINDOW_SWITCH','WINDOW_MINIMIZED','WINDOW_CLOSED','PROHIBITED_PROCESS','AGENT_DISCONNECTED','AGENT_RECONNECTED') NOT NULL,
  window_title    VARCHAR(255) NULL,
  process_name    VARCHAR(255) NULL,
  occurred_at     DATETIME(3) NOT NULL,
  received_at     TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP(3),
  review_status   ENUM('new','reviewed','dismissed') NOT NULL DEFAULT 'new',
  reviewed_by     INT NULL,
  review_note     TEXT NULL,
  FOREIGN KEY (exam_session_id) REFERENCES exam_sessions(id) ON DELETE SET NULL,
  FOREIGN KEY (computer_id)     REFERENCES computers(id) ON DELETE CASCADE,
  FOREIGN KEY (reviewed_by)     REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_events_session_occurred (exam_session_id, occurred_at),
  INDEX idx_events_computer_occurred (computer_id, occurred_at),
  INDEX idx_events_status (review_status)
);

-- ============================================================ TRIGGERS ==
DELIMITER $$

CREATE TRIGGER trg_bookings_audit_ai AFTER INSERT ON bookings FOR EACH ROW BEGIN
  INSERT INTO audit_log (action, entity, entity_id, details)
  VALUES ('INSERT', 'booking', NEW.id,
          JSON_OBJECT('slot_id', NEW.slot_id, 'student_id', NEW.student_id, 'status', NEW.status));
END$$

CREATE TRIGGER trg_bookings_audit_au AFTER UPDATE ON bookings FOR EACH ROW BEGIN
  INSERT INTO audit_log (action, entity, entity_id, details)
  VALUES ('UPDATE', 'booking', NEW.id,
          JSON_OBJECT('old_status', OLD.status, 'new_status', NEW.status));
END$$

CREATE TRIGGER trg_bookings_audit_ad AFTER DELETE ON bookings FOR EACH ROW BEGIN
  INSERT INTO audit_log (action, entity, entity_id, details)
  VALUES ('DELETE', 'booking', OLD.id,
          JSON_OBJECT('slot_id', OLD.slot_id, 'student_id', OLD.student_id));
END$$

CREATE TRIGGER trg_applications_audit_ai AFTER INSERT ON applications FOR EACH ROW BEGIN
  INSERT INTO audit_log (action, entity, entity_id, details)
  VALUES ('INSERT', 'application', NEW.id,
          JSON_OBJECT('drive_id', NEW.drive_id, 'student_id', NEW.student_id, 'status', NEW.status));
END$$

CREATE TRIGGER trg_applications_audit_au AFTER UPDATE ON applications FOR EACH ROW BEGIN
  INSERT INTO audit_log (action, entity, entity_id, details)
  VALUES ('UPDATE', 'application', NEW.id,
          JSON_OBJECT('old_status', OLD.status, 'new_status', NEW.status, 'drive_id', NEW.drive_id));
END$$

CREATE TRIGGER trg_allocations_audit_ai AFTER INSERT ON allocations FOR EACH ROW BEGIN
  INSERT INTO audit_log (action, entity, entity_id, details)
  VALUES ('INSERT', 'allocation', NEW.id,
          JSON_OBJECT('resource_id', NEW.resource_id, 'purpose', NEW.purpose,
                      'seats_needed', NEW.seats_needed));
END$$

CREATE TRIGGER trg_allocations_audit_au AFTER UPDATE ON allocations FOR EACH ROW BEGIN
  INSERT INTO audit_log (action, entity, entity_id, details)
  VALUES ('UPDATE', 'allocation', NEW.id,
          JSON_OBJECT('resource_id', NEW.resource_id, 'purpose', NEW.purpose,
                      'seats_needed', NEW.seats_needed, 'starts_at', NEW.starts_at, 'ends_at', NEW.ends_at));
END$$

CREATE TRIGGER trg_allocations_audit_ad AFTER DELETE ON allocations FOR EACH ROW BEGIN
  INSERT INTO audit_log (action, entity, entity_id, details)
  VALUES ('DELETE', 'allocation', OLD.id,
          JSON_OBJECT('resource_id', OLD.resource_id, 'purpose', OLD.purpose));
END$$

CREATE TRIGGER trg_exam_sessions_audit_ai AFTER INSERT ON exam_sessions FOR EACH ROW BEGIN
  INSERT INTO audit_log (action, entity, entity_id, details)
  VALUES ('INSERT', 'exam_session', NEW.id,
          JSON_OBJECT('computer_id', NEW.computer_id, 'student_id', NEW.student_id, 'status', NEW.status));
END$$

CREATE TRIGGER trg_exam_sessions_audit_au AFTER UPDATE ON exam_sessions FOR EACH ROW BEGIN
  INSERT INTO audit_log (action, entity, entity_id, details)
  VALUES ('UPDATE', 'exam_session', NEW.id,
          JSON_OBJECT('old_status', OLD.status, 'new_status', NEW.status, 'computer_id', NEW.computer_id));
END$$

CREATE TRIGGER trg_offers_audit_ai AFTER INSERT ON offers FOR EACH ROW BEGIN
  INSERT INTO audit_log (action, entity, entity_id, details)
  VALUES ('INSERT', 'offer', NEW.id,
          JSON_OBJECT('application_id', NEW.application_id, 'student_id', NEW.student_id, 'drive_id', NEW.drive_id, 'package_lpa', NEW.package_lpa, 'status', NEW.status));
END$$

CREATE TRIGGER trg_offers_audit_au AFTER UPDATE ON offers FOR EACH ROW BEGIN
  INSERT INTO audit_log (action, entity, entity_id, details)
  VALUES ('UPDATE', 'offer', NEW.id,
          JSON_OBJECT('old_status', OLD.status, 'new_status', NEW.status, 'application_id', NEW.application_id, 'student_id', NEW.student_id));
END$$

-- ============================================== STORED PROCEDURE: shortlist ==
-- The Eligibility Engine. One call shortlists a whole drive.
-- Usage: CALL sp_generate_shortlist(1, @n); SELECT @n;
CREATE PROCEDURE sp_generate_shortlist(IN p_drive_id INT, OUT p_count INT)
BEGIN
  UPDATE applications a
  JOIN students s ON s.user_id = a.student_id
  JOIN drives   d ON d.id = a.drive_id
  SET a.status = CASE
    WHEN s.cgpa >= d.min_cgpa
     AND s.backlogs <= d.max_backlogs
     AND s.graduation_year = d.graduation_year
     AND JSON_CONTAINS(d.allowed_branches, JSON_QUOTE(s.branch)) = 1
    THEN 'shortlisted' ELSE 'rejected'
  END
  WHERE a.drive_id = p_drive_id AND a.status = 'applied';

  SELECT ROW_COUNT() INTO p_count;
END$$

DELIMITER ;

-- ================================================================= VIEWS ==
-- Recruiter pipeline report: one row per drive.
CREATE OR REPLACE VIEW v_drive_report AS
SELECT d.id AS drive_id, d.title AS drive_title, c.name AS company,
       SUM(a.status='applied')     AS applied,
       SUM(a.status='shortlisted')  AS shortlisted,
       SUM(a.status='selected')     AS selected,
       ROUND(AVG(CASE WHEN a.status IN ('shortlisted','selected') THEN s.cgpa END), 2)
                                   AS avg_cgpa_shortlisted
FROM drives d
JOIN companies c ON c.id = d.company_id
LEFT JOIN applications a ON a.drive_id = d.id
LEFT JOIN students s ON s.user_id = a.student_id
GROUP BY d.id, d.title, c.name;
