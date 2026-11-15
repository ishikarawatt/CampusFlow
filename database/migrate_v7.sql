-- Migration v7: Add is_active to users, extend drives status enum and add review columns, create drive_tests table and populate it

-- 1. Add is_active to users
ALTER TABLE users ADD COLUMN is_active BOOLEAN NOT NULL DEFAULT 1;

-- 2. Extend drives status enum and add review columns
ALTER TABLE drives MODIFY COLUMN status ENUM('draft','open','testing','interviews','closed','pending_approval','approved','rejected') NOT NULL DEFAULT 'open',
  ADD COLUMN approval_note VARCHAR(500) NULL,
  ADD COLUMN reviewed_by INT NULL,
  ADD COLUMN reviewed_at DATETIME NULL;

-- 3. Create drive_tests table
CREATE TABLE drive_tests (
  drive_id INT PRIMARY KEY,
  test_status ENUM('draft','pending_approval','approved','rejected') NOT NULL DEFAULT 'approved',
  approval_note VARCHAR(500) NULL,
  reviewed_by INT NULL,
  reviewed_at DATETIME NULL,
  duration_minutes INT NOT NULL DEFAULT 60,
  FOREIGN KEY (drive_id) REFERENCES drives(id) ON DELETE CASCADE
);

-- 4. Populate drive_tests for existing drives
INSERT INTO drive_tests (drive_id)
  SELECT id FROM drives;

