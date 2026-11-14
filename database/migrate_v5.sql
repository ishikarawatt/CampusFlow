-- ============================================================================
-- CampusFlow OS — database/migrate_v5.sql
-- Windows Exam-PC Monitoring Subsystem:
--   * computers: physical machines assigned to labs with enrollment codes
--   * agent_devices: installed Windows monitoring agent instances & auth
--   * exam_sessions: computer-student test associations with concurrency guards
--   * prohibited_processes: blacklist of communication/remote-access apps
--   * monitoring_events: agent telemetry events and human review state
--   * audit triggers for exam_sessions
-- ============================================================================

USE campusflow;

-- ------------------------------------------------------------ computers --
CREATE TABLE IF NOT EXISTS computers (
  
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
CREATE TABLE IF NOT EXISTS agent_devices (
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
CREATE TABLE IF NOT EXISTS exam_sessions (
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
CREATE TABLE IF NOT EXISTS prohibited_processes (
  id           INT AUTO_INCREMENT PRIMARY KEY,
  process_name VARCHAR(100) NOT NULL UNIQUE,
  added_by     INT NULL,
  created_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (added_by) REFERENCES users(id) ON DELETE SET NULL
);

-- ---------------------------------------------------- monitoring_events --
CREATE TABLE IF NOT EXISTS monitoring_events (
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

-- ---------------------------------------------------- default blacklist --
INSERT IGNORE INTO prohibited_processes (process_name) VALUES
  ('discord.exe'),
  ('telegram.exe'),
  ('anydesk.exe'),
  ('teamviewer.exe'),
  ('whatsapp.exe'),
  ('slack.exe'),
  ('zoom.exe'),
  ('chatgpt.exe');

DELIMITER $$

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

DELIMITER ;
