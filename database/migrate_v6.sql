-- ============================================================================
-- CampusFlow OS — database/migrate_v6.sql
-- Phase 5B: Student Profile, Companies metadata, Offers subsystem, Applications withdrawn status.
-- ============================================================================

USE campusflow;

-- 1. Extend applications status enum to include 'withdrawn'
ALTER TABLE applications
  MODIFY COLUMN status ENUM('applied','test_taken','shortlisted','rejected','selected','withdrawn') NOT NULL DEFAULT 'applied';

-- 2. Extend students table with profile fields
ALTER TABLE students
  ADD COLUMN phone VARCHAR(20) NULL,
  ADD COLUMN skills JSON NULL,
  ADD COLUMN projects JSON NULL,
  ADD COLUMN certifications JSON NULL,
  ADD COLUMN resume_path VARCHAR(255) NULL,
  ADD COLUMN resume_original_name VARCHAR(255) NULL,
  ADD COLUMN resume_uploaded_at DATETIME NULL;

-- 3. Extend companies table with profile metadata
ALTER TABLE companies
  ADD COLUMN description TEXT NULL,
  ADD COLUMN location VARCHAR(120) NULL,
  ADD COLUMN industry VARCHAR(80) NULL,
  ADD COLUMN hr_contact_email VARCHAR(255) NULL;

-- 4. Extend users table with company_id for recruiters
ALTER TABLE users
  ADD COLUMN company_id INT NULL,
  ADD CONSTRAINT fk_users_company FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE SET NULL;

-- 5. Create offers table
CREATE TABLE IF NOT EXISTS offers (
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

-- 6. Audit triggers for offers
DROP TRIGGER IF EXISTS trg_offers_audit_ai;
DROP TRIGGER IF EXISTS trg_offers_audit_au;

DELIMITER $$
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
DELIMITER ;

