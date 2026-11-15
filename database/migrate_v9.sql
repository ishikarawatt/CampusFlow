-- migrate_v9.sql – OS Lab tables
-- Table to store each scheduling run
CREATE TABLE IF NOT EXISTS os_runs (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  module VARCHAR(64) NOT NULL,          -- e.g. 'cpu-scheduler'
  algorithm VARCHAR(32) NOT NULL,       -- algorithm name or 'compare'
  input_json JSON NOT NULL,
  result_json JSON NOT NULL,
  created_by BIGINT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- Scratch table for race‑condition demo (isolated from real bookings)
CREATE TABLE IF NOT EXISTS demo_seats (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  capacity INT NOT NULL,
  confirmed INT NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

