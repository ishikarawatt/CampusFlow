-- ============================================================================
-- CampusFlow OS — database/migrate_v4.sql
-- Adds missing lifecycle audit triggers:
--   * trg_applications_audit_ai (AFTER INSERT ON applications)
--   * trg_allocations_audit_au  (AFTER UPDATE ON allocations)
--   * trg_allocations_audit_ad  (AFTER DELETE ON allocations)
-- Fresh installs don't need this file — database/schema.sql already includes
-- them. Existing installs:  mysql -u root -p campusflow < migrate_v4.sql
-- (or run: npm run db:migrate).
-- ============================================================================

USE campusflow;

DELIMITER $$

CREATE TRIGGER trg_applications_audit_ai AFTER INSERT ON applications FOR EACH ROW BEGIN
  INSERT INTO audit_log (action, entity, entity_id, details)
  VALUES ('INSERT', 'application', NEW.id,
          JSON_OBJECT('drive_id', NEW.drive_id, 'student_id', NEW.student_id, 'status', NEW.status));
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

DELIMITER ;

