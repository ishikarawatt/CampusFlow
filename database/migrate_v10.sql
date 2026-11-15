-- migrate_v10.sql – additional reporting views for OS Lab
-- View: per‑branch placement summary
CREATE VIEW v_branch_placement AS
SELECT s.branch,
       COUNT(DISTINCT s.user_id) AS students,
       COUNT(DISTINCT a.id) AS applied,
       COUNT(DISTINCT o.id) AS placed,
       IF(COUNT(DISTINCT a.id) = 0, 0,
          ROUND(COUNT(DISTINCT o.id) / COUNT(DISTINCT a.id) * 100, 2)) AS placement_pct
FROM students s
LEFT JOIN applications a ON a.student_id = s.user_id
LEFT JOIN offers o ON o.application_id = a.id AND o.status = 'accepted'
GROUP BY s.branch;

-- View: company funnel summary
CREATE VIEW v_company_funnel AS
SELECT c.id AS company_id,
       c.name,
       COUNT(DISTINCT d.id) AS drives,
       COUNT(DISTINCT a.id) AS applicants,
       COUNT(DISTINCT CASE WHEN a.status = 'shortlisted' THEN a.id END) AS shortlisted,
       COUNT(DISTINCT CASE WHEN a.status = 'selected' THEN a.id END) AS selected,
       COUNT(DISTINCT o.id) AS offers
FROM companies c
LEFT JOIN drives d ON d.company_id = c.id
LEFT JOIN applications a ON a.drive_id = d.id
LEFT JOIN offers o ON o.drive_id = d.id
GROUP BY c.id, c.name;

-- View: package statistics per drive
CREATE VIEW v_package_stats AS
SELECT d.id AS drive_id,
       d.title,
       MIN(o.package_lpa) AS min_package,
       MAX(o.package_lpa) AS max_package,
       AVG(o.package_lpa) AS avg_package
FROM drives d
LEFT JOIN offers o ON o.drive_id = d.id
GROUP BY d.id, d.title;

