// M1 — admin user directory.
const express = require('express');
const bcrypt = require('bcryptjs');
const pool = require('../dbms/db');
const { authenticateToken, requireRole } = require('../middleware/auth');

const router = express.Router();

// GET /users — admin only
router.get('/', authenticateToken, requireRole('admin'), async (req, res, next) => {
  try {
    const [rows] = await pool.query(
      `SELECT u.id, u.name, u.email, u.role, u.created_at,
              s.roll_no, s.branch, s.cgpa
       FROM users u
       LEFT JOIN students s ON s.user_id = u.id
       ORDER BY u.created_at DESC`
    );
    res.json(
      rows.map((r) => ({
        id: r.id,
        name: r.name,
        email: r.email,
        role: r.role,
        roll_no: r.roll_no,
        branch: r.branch,
        cgpa: r.cgpa == null ? null : Number(r.cgpa),
        created_at: r.created_at,
      }))
    );
  } catch (err) {
    next(err);
  }
});

// POST /users — admin only: create recruiter or admin accounts
router.post('/', authenticateToken, requireRole('admin'), async (req, res, next) => {
  try {
    const { name, email, password, role } = req.body || {};
    if (!name || !email || !password || !role) {
      return res.status(400).json({ error: 'Name, email, password and role are required.' });
    }
    if (!['recruiter', 'admin'].includes(role)) {
      return res.status(400).json({ error: 'Role must be recruiter or admin.' });
    }

    const [dup] = await pool.query('SELECT id FROM users WHERE email = ?', [email]);
    if (dup.length) {
      return res.status(409).json({ error: 'This email is already registered.' });
    }

    const hash = await bcrypt.hash(password, 10);
    const [result] = await pool.query(
      'INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)',
      [name, email, hash, role]
    );

    res.status(201).json({
      user: { id: result.insertId, name, email, role },
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
