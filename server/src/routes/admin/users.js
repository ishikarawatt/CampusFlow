// server/src/routes/admin/users.js
// Admin user management (list, activate/deactivate, reset password)
const express = require('express');
const pool = require('../../dbms/db');
const bcrypt = require('bcryptjs');
const { authenticateToken, requireRole } = require('../../middleware/auth');
const { withTransaction } = require('../../dbms/transactions');

const router = express.Router();
router.use(authenticateToken, requireRole('admin'));

// GET /api/admin/users?search=&role=&page=&limit=
router.get('/', async (req, res, next) => {
  try {
    const { search = '', role, page = 1, limit = 20 } = req.query;
    const offset = (Number(page) - 1) * Number(limit);
    const conditions = [];
    const params = [];
    if (search) {
      conditions.push('(u.name LIKE ? OR u.email LIKE ?)');
      const s = `%${search}%`;
      params.push(s, s);
    }
    if (role) {
      conditions.push('u.role = ?');
      params.push(role);
    }
    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    const [rows] = await pool.query(
      `SELECT u.id, u.name, u.email, u.role, u.is_active, u.company_id FROM users u ${where} ORDER BY u.id LIMIT ? OFFSET ?`,
      [...params, Number(limit), offset]
    );
    res.json(rows);
  } catch (e) {
    next(e);
  }
});

// PATCH /api/admin/users/:id/active
router.patch('/:id/active', async (req, res, next) => {
  const targetId = Number(req.params.id);
  const { is_active } = req.body;
  if (typeof is_active !== 'boolean') {
    return res.status(400).json({ error: '`is_active` must be a boolean.' });
  }
  try {
    await withTransaction(pool, async (conn) => {
      if (req.user.id === targetId && is_active === false) {
        return res.status(409).json({ error: 'Admin cannot deactivate themselves.' });
      }
      const [target] = await conn.query('SELECT role FROM users WHERE id = ?', [targetId]);
      if (!target.length) {
        return res.status(404).json({ error: 'User not found.' });
      }
      if (target[0].role === 'admin' && is_active === false) {
        const [admins] = await conn.query('SELECT COUNT(*) AS cnt FROM users WHERE role = \"admin\" AND is_active = 1 AND id <> ?', [targetId]);
        if (admins[0].cnt === 0) {
          return res.status(409).json({ error: 'Cannot deactivate the last active admin.' });
        }
      }
      const [upd] = await conn.query('UPDATE users SET is_active = ? WHERE id = ?', [is_active ? 1 : 0, targetId]);
      if (upd.affectedRows === 0) {
        return res.status(404).json({ error: 'User not found.' });
      }
      await conn.query('INSERT INTO audit_log (actor_id, action, entity_id, entity_type) VALUES (?, ?, ?, \"user\")', [req.user.id, is_active ? \"user.activate\" : \"user.deactivate\", targetId]);
    });
    res.json({ success: true, id: targetId, is_active });
  } catch (e) {
    next(e);
  }
});

// POST /api/admin/users/:id/reset-password
router.post('/:id/reset-password', async (req, res, next) => {
  const targetId = Number(req.params.id);
  try {
    const tempPassword = Math.random().toString(36).slice(-10) + \"A1!\";
    const hash = await bcrypt.hash(tempPassword, 10);
    await withTransaction(pool, async (conn) => {
      const [upd] = await conn.query('UPDATE users SET password_hash = ? WHERE id = ?', [hash, targetId]);
      if (upd.affectedRows === 0) {
        return res.status(404).json({ error: 'User not found.' });
      }
      await conn.query('INSERT INTO audit_log (actor_id, action, entity_id, entity_type) VALUES (?, \"user.reset_password\", ?, \"user\")', [req.user.id, targetId]);
    });
    res.json({ success: true, id: targetId, temporary_password: tempPassword });
  } catch (e) {
    next(e);
  }
});

module.exports = router;

