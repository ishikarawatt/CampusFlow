// server/src/routes/admin/drives.js
// Admin drive approval endpoints
const express = require('express');
const pool = require('../../dbms/db');
const { authenticateToken, requireRole } = require('../../middleware/auth');
const { withTransaction } = require('../../dbms/transactions');
const { notify } = require('../../os/pipeline');

const router = express.Router();
router.use(authenticateToken, requireRole('admin'));

// List drives (optional status filter)
router.get('/', async (req, res, next) => {
  try {
    const { status } = req.query;
    const where = status ? 'WHERE d.status = ?' : '';
    const params = status ? [status] : [];
    const [rows] = await pool.query(
      `SELECT d.*, c.name AS company_name
         FROM drives d
         JOIN companies c ON c.id = d.company_id
         ${where}
         ORDER BY d.application_deadline DESC`,
      params
    );
    const shape = (r) => ({
      id: r.id,
      title: r.title,
      company: { id: r.company_id, name: r.company_name },
      status: r.status,
      approval_note: r.approval_note,
      reviewed_by: r.reviewed_by,
      reviewed_at: r.reviewed_at,
    });
    res.json(rows.map(shape));
  } catch (e) {
    next(e);
  }
});

// Approve a pending drive
router.post('/:id/approve', async (req, res, next) => {
  const driveId = Number(req.params.id);
  const { note } = req.body || {};
  if (!note || typeof note !== 'string' || !note.trim()) {
    return res.status(400).json({ error: 'Approval note is required.' });
  }
  try {
    await withTransaction(pool, async (conn) => {
      const [drives] = await conn.query(
        'SELECT status, company_id FROM drives WHERE id = ? FOR UPDATE',
        [driveId]
      );
      if (!drives.length) {
        return res.status(404).json({ error: 'Drive not found.' });
      }
      if (drives[0].status !== 'pending_approval') {
        return res.status(409).json({ error: 'Only pending drives can be approved.' });
      }
      await conn.query(
        `UPDATE drives SET status = 'approved', approval_note = ?, reviewed_by = ?, reviewed_at = CURRENT_TIMESTAMP WHERE id = ?`,
        [note.trim(), req.user.id, driveId]
      );
      await conn.query(
        `INSERT INTO audit_log (actor_id, action, entity_id, entity_type) VALUES (?, 'drive.approve', ?, 'drive')`,
        [req.user.id, driveId]
      );
    });
    // Notify company users
    const [drive] = await pool.query('SELECT company_id FROM drives WHERE id = ?', [driveId]);
    if (drive.length) {
      await notify({
        companyId: drive[0].company_id,
        title: 'Drive approved',
        body: `Drive #${driveId} has been approved.`,
        link: `/admin/drives/${driveId}`,
      });
    }
    res.json({ success: true, id: driveId });
  } catch (e) {
    next(e);
  }
});

// Reject a pending drive
router.post('/:id/reject', async (req, res, next) => {
  const driveId = Number(req.params.id);
  const { note } = req.body || {};
  if (!note || typeof note !== 'string' || !note.trim()) {
    return res.status(400).json({ error: 'Rejection note is required.' });
  }
  try {
    await withTransaction(pool, async (conn) => {
      const [drives] = await conn.query(
        'SELECT status, company_id FROM drives WHERE id = ? FOR UPDATE',
        [driveId]
      );
      if (!drives.length) {
        return res.status(404).json({ error: 'Drive not found.' });
      }
      if (drives[0].status !== 'pending_approval') {
        return res.status(409).json({ error: 'Only pending drives can be rejected.' });
      }
      await conn.query(
        `UPDATE drives SET status = 'rejected', approval_note = ?, reviewed_by = ?, reviewed_at = CURRENT_TIMESTAMP WHERE id = ?`,
        [note.trim(), req.user.id, driveId]
      );
      await conn.query(
        `INSERT INTO audit_log (actor_id, action, entity_id, entity_type) VALUES (?, 'drive.reject', ?, 'drive')`,
        [req.user.id, driveId]
      );
    });
    const [drive] = await pool.query('SELECT company_id FROM drives WHERE id = ?', [driveId]);
    if (drive.length) {
      await notify({
        companyId: drive[0].company_id,
        title: 'Drive rejected',
        body: `Drive #${driveId} was rejected.`,
        link: `/admin/drives/${driveId}`,
      });
    }
    res.json({ success: true, id: driveId });
  } catch (e) {
    next(e);
  }
});

module.exports = router;

