// server/src/routes/admin/resources.js
// Admin resource CRUD with deactivation checks
const express = require('express');
const pool = require('../../dbms/db');
const { authenticateToken, requireRole } = require('../../middleware/auth');
const { withTransaction } = require('../../dbms/transactions');

const router = express.Router();
router.use(authenticateToken, requireRole('admin'));

// List resources, optional type filter
router.get('/', async (req, res, next) => {
  try {
    const { type } = req.query;
    const where = type ? 'WHERE type = ?' : '';
    const params = type ? [type] : [];
    const [rows] = await pool.query(`SELECT * FROM resources ${where} ORDER BY type, name`, params);
    res.json(rows);
  } catch (e) {
    next(e);
  }
});

// Create a new resource
router.post('/', async (req, res, next) => {
  const { name, type, capacity, location } = req.body || {};
  if (!name || !type || capacity == null) {
    return res.status(400).json({ error: 'name, type, and capacity are required.' });
  }
  try {
    const [result] = await pool.query(
      `INSERT INTO resources (name, type, capacity, location) VALUES (?, ?, ?, ?)`,
      [name, type, capacity, location || null]
    );
    res.json({ id: result.insertId });
  } catch (e) {
    next(e);
  }
});

// Update a resource (any mutable fields)
router.patch('/:id', async (req, res, next) => {
  const id = Number(req.params.id);
  const { name, capacity, location, status } = req.body || {};
  const fields = [];
  const params = [];
  if (name) { fields.push('name = ?'); params.push(name); }
  if (capacity != null) { fields.push('capacity = ?'); params.push(capacity); }
  if (location !== undefined) { fields.push('location = ?'); params.push(location); }
  if (status) { fields.push('status = ?'); params.push(status); }
  if (fields.length === 0) return res.status(400).json({ error: 'No fields to update.' });
  params.push(id);
  try {
    const [result] = await pool.query(`UPDATE resources SET ${fields.join(', ')} WHERE id = ?`, params);
    if (result.affectedRows === 0) return res.status(404).json({ error: 'Resource not found.' });
    res.json({ success: true });
  } catch (e) {
    next(e);
  }
});

// Deactivate (set status='maintenance') with checks
router.delete('/:id', async (req, res, next) => {
  const id = Number(req.params.id);
  try {
    await withTransaction(pool, async (conn) => {
      // Future allocations?
      const [alloc] = await conn.query(
        `SELECT COUNT(*) AS cnt FROM allocations WHERE resource_id = ? AND starts_at > NOW()`,
        [id]
      );
      // Active exam sessions?
      const [exam] = await conn.query(
        `SELECT COUNT(*) AS cnt FROM exam_sessions es JOIN computers c ON c.id = es.computer_id WHERE c.resource_id = ? AND es.status = 'scheduled'`,
        [id]
      );
      if (alloc[0].cnt > 0 || exam[0].cnt > 0) {
        return res.status(409).json({ error: 'Resource has future allocations or active exams.' });
      }
      const [upd] = await conn.query(`UPDATE resources SET status = 'maintenance' WHERE id = ?`, [id]);
      if (upd.affectedRows === 0) return res.status(404).json({ error: 'Resource not found.' });
    });
    res.json({ success: true });
  } catch (e) {
    next(e);
  }
});

module.exports = router;

