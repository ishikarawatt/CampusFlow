// server/src/routes/admin/tests.js
// Admin test approval endpoints
const express = require('express');
const pool = require('../../dbms/db');
const { authenticateToken, requireRole } = require('../../middleware/auth');
const { withTransaction } = require('../../dbms/transactions');
const { notify } = require('../../os/pipeline');

const router = express.Router();
router.use(authenticateToken, requireRole('admin'));

// List drive_tests with optional status filter
router.get('/', async (req, res, next) => {
  try {
    const { status } = req.query;
    const where = status ? 'WHERE dt.test_status = ?' : '';
    const params = status ? [status] : [];
    const [rows] = await pool.query(
      `SELECT dt.*, d.title AS drive_title
         FROM drive_tests dt
         JOIN drives d ON d.id = dt.drive_id
         ${where}
         ORDER BY dt.drive_id`,
      params
    );
    const shape = (r) => ({
      drive_id: r.drive_id,
      drive_title: r.drive_title,
      test_status: r.test_status,
      approval_note: r.approval_note,
      reviewed_by: r.reviewed_by,
      reviewed_at: r.reviewed_at,
      duration_minutes: r.duration_minutes,
    });
    res.json(rows.map(shape));
  } catch (e) {
    next(e);
  }
});

// Approve a pending test
router.post('/:driveId/approve', async (req, res, next) => {
  const driveId = Number(req.params.driveId);
  const { note } = req.body || {};
  if (!note || typeof note !== 'string' || !note.trim()) {
    return res.status(400).json({ error: 'Approval note required.' });
  }
  try {
    await withTransaction(pool, async (conn) => {
      const [tests] = await conn.query(
        'SELECT test_status, company_id FROM drive_tests dt JOIN drives d ON d.id = dt.drive_id WHERE dt.drive_id = ? FOR UPDATE',
        [driveId]
      );
      if (!tests.length) {
        return res.status(404).json({ error: 'Test entry not found.' });
      }
      if (tests[0].test_status !== 'pending_approval') {
        return res.status(409).json({ error: 'Only pending tests can be approved.' });
      }
      await conn.query(
        `UPDATE drive_tests SET test_status = 'approved', approval_note = ?, reviewed_by = ?, reviewed_at = CURRENT_TIMESTAMP WHERE drive_id = ?`,
        [note.trim(), req.user.id, driveId]
      );
      await conn.query(
        `INSERT INTO audit_log (actor_id, action, entity_id, entity_type) VALUES (?, 'test.approve', ?, 'drive_test')`,
        [req.user.id, driveId]
      );
    });
    // Notify company users
    const [drive] = await pool.query('SELECT company_id FROM drives WHERE id = ?', [driveId]);
    if (drive.length) {
      await notify({
        companyId: drive[0].company_id,
        title: 'Test approved',
        body: `Test for drive #${driveId} approved.`,
        link: `/admin/tests/${driveId}`,
      });
    }
    res.json({ success: true, drive_id: driveId });
  } catch (e) {
    next(e);
  }
});

// Reject a pending test
router.post('/:driveId/reject', async (req, res, next) => {
  const driveId = Number(req.params.driveId);
  const { note } = req.body || {};
  if (!note || typeof note !== 'string' || !note.trim()) {
    return res.status(400).json({ error: 'Rejection note required.' });
  }
  try {
    await withTransaction(pool, async (conn) => {
      const [tests] = await conn.query(
        'SELECT test_status FROM drive_tests WHERE drive_id = ? FOR UPDATE',
        [driveId]
      );
      if (!tests.length) {
        return res.status(404).json({ error: 'Test entry not found.' });
      }
      if (tests[0].test_status !== 'pending_approval') {
        return res.status(409).json({ error: 'Only pending tests can be rejected.' });
      }
      await conn.query(
        `UPDATE drive_tests SET test_status = 'rejected', approval_note = ?, reviewed_by = ?, reviewed_at = CURRENT_TIMESTAMP WHERE drive_id = ?`,
        [note.trim(), req.user.id, driveId]
      );
      await conn.query(
        `INSERT INTO audit_log (actor_id, action, entity_id, entity_type) VALUES (?, 'test.reject', ?, 'drive_test')`,
        [req.user.id, driveId]
      );
    });
    const [drive] = await pool.query('SELECT company_id FROM drives WHERE id = ?', [driveId]);
    if (drive.length) {
      await notify({
        companyId: drive[0].company_id,
        title: 'Test rejected',
        body: `Test for drive #${driveId} rejected.`,
        link: `/admin/tests/${driveId}`,
      });
    }
    res.json({ success: true, drive_id: driveId });
  } catch (e) {
    next(e);
  }
});

module.exports = router;

