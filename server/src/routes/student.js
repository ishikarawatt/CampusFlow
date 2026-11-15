// Student journey & portal API: profile, resume upload/download, applications withdraw, history, offers.

const express = require('express');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const multer = require('multer');
const pool = require('../dbms/db');
const { withTransaction } = require('../dbms/transactions');
const { authenticateToken, requireRole } = require('../middleware/auth');
const { fmtWhen } = require('../os/pipeline');

const router = express.Router();

// Ensure resume storage directory exists
const RESUME_DIR = path.join(__dirname, '..', '..', 'storage', 'resumes');
if (!fs.existsSync(RESUME_DIR)) {
  fs.mkdirSync(RESUME_DIR, { recursive: true });
}

// Multer storage engine
const upload = multer({
  storage: multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, RESUME_DIR),
    filename: (_req, file, cb) => {
      const ext = path.extname(file.originalname).toLowerCase() || '.pdf';
      cb(null, `${crypto.randomUUID()}${ext}`);
    },
  }),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB max
  fileFilter: (_req, file, cb) => {
    // Basic mimetype check (detailed magic bytes check performed after upload)
    if (file.mimetype !== 'application/pdf') {
      const err = new Error('Only PDF files are allowed.');
      err.status = 400;
      return cb(err);
    }
    cb(null, true);
  },
});

// Helper: Calculate profile completeness (0..100)
function computeCompleteness(student) {
  let score = 0;
  const total = 8;

  if (student.roll_no) score++;
  if (student.branch) score++;
  if (student.cgpa != null && !isNaN(student.cgpa)) score++;
  if (student.phone && String(student.phone).trim().length > 0) score++;

  const skills = Array.isArray(student.skills)
    ? student.skills
    : typeof student.skills === 'string'
    ? JSON.parse(student.skills || '[]')
    : [];
  if (skills.length > 0) score++;

  const projects = Array.isArray(student.projects)
    ? student.projects
    : typeof student.projects === 'string'
    ? JSON.parse(student.projects || '[]')
    : [];
  if (projects.length > 0) score++;

  const certs = Array.isArray(student.certifications)
    ? student.certifications
    : typeof student.certifications === 'string'
    ? JSON.parse(student.certifications || '[]')
    : [];
  if (certs.length > 0) score++;

  if (student.resume_path) score++;

  return Math.round((score / total) * 100);
}

function parseJsonField(val) {
  if (!val) return [];
  if (Array.isArray(val)) return val;
  try {
    return JSON.parse(val);
  } catch (_) {
    return [];
  }
}

// ---------------------------------------------------------------------------
// GET /api/student/profile
// ---------------------------------------------------------------------------
router.get('/profile', authenticateToken, requireRole('student'), async (req, res, next) => {
  try {
    const [rows] = await pool.query(
      `SELECT s.user_id, s.roll_no, s.branch, s.cgpa, s.backlogs, s.graduation_year,
              s.phone, s.skills, s.projects, s.certifications,
              s.resume_path, s.resume_original_name, s.resume_uploaded_at,
              u.name, u.email
       FROM students s
       JOIN users u ON u.id = s.user_id
       WHERE s.user_id = ?`,
      [req.user.id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Student record not found.' });
    }

    const s = rows[0];
    const skills = parseJsonField(s.skills);
    const projects = parseJsonField(s.projects);
    const certifications = parseJsonField(s.certifications);
    const completeness = computeCompleteness({ ...s, skills, projects, certifications });

    const profileData = {
      user_id: s.user_id,
      name: s.name,
      email: s.email,
      roll_no: s.roll_no,
      branch: s.branch,
      cgpa: Number(s.cgpa),
      backlogs: s.backlogs,
      graduation_year: s.graduation_year,
      phone: s.phone || null,
      skills,
      projects,
      certifications,
      has_resume: !!s.resume_path,
      resume_original_name: s.resume_original_name || null,
      resume_uploaded_at: s.resume_uploaded_at || null,
      resume_url: s.resume_path ? '/api/student/resume' : null,
      profile_completeness: completeness,
    };

    res.json({
      ok: true,
      ...profileData,
      profile: profileData,
      student: profileData,
    });
  } catch (err) {
    next(err);
  }
});

// ---------------------------------------------------------------------------
// PUT /api/student/profile
// Updates editable fields: phone, skills, projects, certifications
// ---------------------------------------------------------------------------
router.put('/profile', authenticateToken, requireRole('student'), async (req, res, next) => {
  try {
    const { phone, skills, projects, certifications } = req.body;

    // 1. Phone validation
    let validatedPhone = null;
    if (phone !== undefined && phone !== null && String(phone).trim() !== '') {
      const p = String(phone).trim();
      const phoneRegex = /^[+0-9\s\-()]{7,20}$/;
      if (!phoneRegex.test(p)) {
        return res.status(400).json({ error: 'Invalid phone number format.' });
      }
      validatedPhone = p;
    }

    // 2. Skills validation (max 30 strings, each max 40 chars)
    let validatedSkills = null;
    if (skills !== undefined && skills !== null) {
      if (!Array.isArray(skills)) {
        return res.status(400).json({ error: 'Skills must be an array of strings.' });
      }
      if (skills.length > 30) {
        return res.status(400).json({ error: 'Skills cannot exceed 30 items.' });
      }
      for (const item of skills) {
        if (typeof item !== 'string' || item.trim().length === 0 || item.length > 40) {
          return res.status(400).json({ error: 'Each skill must be a non-empty string under 40 characters.' });
        }
      }
      validatedSkills = JSON.stringify(skills.map((s) => s.trim()));
    }

    // 3. Projects validation (max 10 objects { title, desc, link? })
    let validatedProjects = null;
    if (projects !== undefined && projects !== null) {
      if (!Array.isArray(projects)) {
        return res.status(400).json({ error: 'Projects must be an array of objects.' });
      }
      if (projects.length > 10) {
        return res.status(400).json({ error: 'Projects cannot exceed 10 items.' });
      }
      for (const p of projects) {
        if (!p || typeof p !== 'object' || !p.title || typeof p.title !== 'string') {
          return res.status(400).json({ error: 'Each project must include a valid title.' });
        }
        if (p.title.length > 100) {
          return res.status(400).json({ error: 'Project title cannot exceed 100 characters.' });
        }
        if (p.desc && (typeof p.desc !== 'string' || p.desc.length > 500)) {
          return res.status(400).json({ error: 'Project description cannot exceed 500 characters.' });
        }
        if (p.link && (typeof p.link !== 'string' || p.link.length > 255)) {
          return res.status(400).json({ error: 'Project link cannot exceed 255 characters.' });
        }
      }
      validatedProjects = JSON.stringify(projects);
    }

    // 4. Certifications validation (max 10 objects { name, issuer, year? })
    let validatedCerts = null;
    if (certifications !== undefined && certifications !== null) {
      if (!Array.isArray(certifications)) {
        return res.status(400).json({ error: 'Certifications must be an array of objects.' });
      }
      if (certifications.length > 10) {
        return res.status(400).json({ error: 'Certifications cannot exceed 10 items.' });
      }
      for (const c of certifications) {
        if (!c || typeof c !== 'object' || !c.name || typeof c.name !== 'string') {
          return res.status(400).json({ error: 'Each certification must include a name.' });
        }
        if (c.name.length > 100) {
          return res.status(400).json({ error: 'Certification name cannot exceed 100 characters.' });
        }
        if (c.issuer && (typeof c.issuer !== 'string' || c.issuer.length > 100)) {
          return res.status(400).json({ error: 'Certification issuer cannot exceed 100 characters.' });
        }
      }
      validatedCerts = JSON.stringify(certifications);
    }

    await pool.query(
      `UPDATE students
       SET phone = COALESCE(?, phone),
           skills = COALESCE(?, skills),
           projects = COALESCE(?, projects),
           certifications = COALESCE(?, certifications)
       WHERE user_id = ?`,
      [validatedPhone, validatedSkills, validatedProjects, validatedCerts, req.user.id]
    );

    // Fetch updated record to compute completeness
    const [updatedRows] = await pool.query(
      `SELECT s.user_id, s.roll_no, s.branch, s.cgpa, s.backlogs, s.graduation_year,
              s.phone, s.skills, s.projects, s.certifications,
              s.resume_path, s.resume_original_name, s.resume_uploaded_at,
              u.name, u.email
       FROM students s
       JOIN users u ON u.id = s.user_id
       WHERE s.user_id = ?`,
      [req.user.id]
    );

    const s = updatedRows[0];
    const parsedSkills = parseJsonField(s.skills);
    const parsedProjects = parseJsonField(s.projects);
    const parsedCerts = parseJsonField(s.certifications);
    const completeness = computeCompleteness({ ...s, skills: parsedSkills, projects: parsedProjects, certifications: parsedCerts });

    const profileData = {
      user_id: s.user_id,
      name: s.name,
      email: s.email,
      roll_no: s.roll_no,
      branch: s.branch,
      cgpa: Number(s.cgpa),
      backlogs: s.backlogs,
      graduation_year: s.graduation_year,
      phone: s.phone,
      skills: parsedSkills,
      projects: parsedProjects,
      certifications: parsedCerts,
      has_resume: !!s.resume_path,
      resume_original_name: s.resume_original_name,
      resume_uploaded_at: s.resume_uploaded_at,
      resume_url: s.resume_path ? '/api/student/resume' : null,
      profile_completeness: completeness,
    };

    res.json({
      ok: true,
      message: 'Profile updated successfully.',
      ...profileData,
      profile: profileData,
    });
  } catch (err) {
    next(err);
  }
});

// ---------------------------------------------------------------------------
// POST /api/student/resume (Multer upload + magic bytes check + replace old)
// ---------------------------------------------------------------------------
router.post('/resume', authenticateToken, requireRole('student'), (req, res, next) => {
  upload.single('resume')(req, res, async (uploadErr) => {
    if (uploadErr) {
      if (uploadErr.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ error: 'File size must not exceed 5MB.' });
      }
      return res.status(400).json({ error: uploadErr.message || 'Failed to upload resume file.' });
    }

    if (!req.file) {
      return res.status(400).json({ error: 'No resume file provided. Please attach a PDF file.' });
    }

    try {
      // Magic bytes verification: read first 4 bytes of uploaded file
      const filePath = req.file.path;
      const fd = fs.openSync(filePath, 'r');
      const buffer = Buffer.alloc(5);
      const bytesRead = fs.readSync(fd, buffer, 0, 5, 0);
      fs.closeSync(fd);

      if (bytesRead < 4 || buffer.toString('utf8', 0, 4) !== '%PDF') {
        // Not a real PDF! Remove uploaded file immediately
        try { fs.unlinkSync(filePath); } catch (_) {}
        return res.status(400).json({ error: 'File is not a valid PDF document (magic bytes check failed).' });
      }

      // Check if student already has a resume on disk; unlink it
      const [existing] = await pool.query(
        'SELECT resume_path FROM students WHERE user_id = ?',
        [req.user.id]
      );
      if (existing.length > 0 && existing[0].resume_path && fs.existsSync(existing[0].resume_path)) {
        try {
          fs.unlinkSync(existing[0].resume_path);
        } catch (_) {}
      }

      // Update student table with new resume info
      await pool.query(
        `UPDATE students
         SET resume_path = ?,
             resume_original_name = ?,
             resume_uploaded_at = NOW()
         WHERE user_id = ?`,
        [filePath, req.file.originalname, req.user.id]
      );

      res.json({
        ok: true,
        message: 'Resume uploaded successfully.',
        resume_original_name: req.file.originalname,
        resume_uploaded_at: new Date(),
        resume_url: '/api/student/resume',
      });
    } catch (err) {
      if (req.file?.path && fs.existsSync(req.file.path)) {
        try { fs.unlinkSync(req.file.path); } catch (_) {}
      }
      next(err);
    }
  });
});

// ---------------------------------------------------------------------------
// GET /api/student/resume (Stream own resume)
// ---------------------------------------------------------------------------
router.get('/resume', authenticateToken, requireRole('student'), async (req, res, next) => {
  try {
    const [rows] = await pool.query(
      'SELECT resume_path, resume_original_name FROM students WHERE user_id = ?',
      [req.user.id]
    );

    if (rows.length === 0 || !rows[0].resume_path) {
      return res.status(404).json({ error: 'No resume uploaded.' });
    }

    const filePath = rows[0].resume_path;
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'Resume file not found on disk.' });
    }

    const filename = rows[0].resume_original_name || 'resume.pdf';
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="${encodeURIComponent(filename)}"`);
    fs.createReadStream(filePath).pipe(res);
  } catch (err) {
    next(err);
  }
});

// ---------------------------------------------------------------------------
// DELETE /api/student/resume
// ---------------------------------------------------------------------------
router.delete('/resume', authenticateToken, requireRole('student'), async (req, res, next) => {
  try {
    const [rows] = await pool.query(
      'SELECT resume_path FROM students WHERE user_id = ?',
      [req.user.id]
    );

    if (rows.length > 0 && rows[0].resume_path && fs.existsSync(rows[0].resume_path)) {
      try {
        fs.unlinkSync(rows[0].resume_path);
      } catch (_) {}
    }

    await pool.query(
      `UPDATE students
       SET resume_path = NULL,
           resume_original_name = NULL,
           resume_uploaded_at = NULL
       WHERE user_id = ?`,
      [req.user.id]
    );

    res.json({ ok: true, message: 'Resume deleted successfully.' });
  } catch (err) {
    next(err);
  }
});

// ---------------------------------------------------------------------------
// PATCH /api/student/applications/:id/withdraw
// ---------------------------------------------------------------------------
router.patch('/applications/:id/withdraw', authenticateToken, requireRole('student'), async (req, res, next) => {
  try {
    const appId = parseInt(req.params.id, 10);
    if (!appId || isNaN(appId)) {
      return res.status(400).json({ error: 'Invalid application ID.' });
    }

    const [rows] = await pool.query(
      `SELECT a.id, a.status, a.student_id, a.drive_id,
              d.title AS drive_title, d.created_by AS recruiter_id,
              u.name AS student_name
       FROM applications a
       JOIN drives d ON d.id = a.drive_id
       JOIN users u ON u.id = a.student_id
       WHERE a.id = ?`,
      [appId]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Application not found.' });
    }

    const app = rows[0];
    if (app.student_id !== req.user.id) {
      return res.status(403).json({ error: 'You do not own this application.' });
    }

    if (app.status !== 'applied' && app.status !== 'test_taken') {
      return res.status(400).json({
        error: `Application cannot be withdrawn once ${app.status}. Only 'applied' or 'test_taken' applications can be withdrawn.`,
      });
    }

    await withTransaction(async (conn) => {
      await conn.query('UPDATE applications SET status = \'withdrawn\' WHERE id = ?', [app.id]);
      await conn.query(
        'INSERT INTO audit_log (action, entity, entity_id, details) VALUES (?, ?, ?, ?)',
        ['UPDATE', 'application', app.id, JSON.stringify({ old_status: app.status, new_status: 'withdrawn', student_id: req.user.id })]
      );
      await conn.query(
        'INSERT INTO notifications (user_id, title, body, link) VALUES (?, ?, ?, ?)',
        [
          app.recruiter_id,
          'Application Withdrawn',
          `${app.student_name} withdrew their application for "${app.drive_title}".`,
          `/recruiter/drives/${app.drive_id}`,
        ]
      );
    });

    res.json({ ok: true, message: 'Application withdrawn successfully.' });
  } catch (err) {
    next(err);
  }
});

// ---------------------------------------------------------------------------
// GET /api/student/history
// Returns all applications with drive details, test score/result, interview slot, offer
// ---------------------------------------------------------------------------
router.get('/history', authenticateToken, requireRole('student'), async (req, res, next) => {
  try {
    const [apps] = await pool.query(
      `SELECT a.id AS application_id, a.drive_id, a.status AS application_status, a.applied_at,
              d.title AS drive_title, d.status AS drive_status, d.min_test_score,
              c.id AS company_id, c.name AS company_name, c.sector AS company_sector, c.location AS company_location,
              tr.score AS test_score, tr.total AS test_total, tr.percentage AS test_percentage, tr.submitted_at AS test_submitted_at,
              o.id AS offer_id, o.package_lpa, o.joining_date, o.note AS offer_note, o.status AS offer_status,
              o.created_at AS offer_created_at, o.responded_at AS offer_responded_at
       FROM applications a
       JOIN drives d ON d.id = a.drive_id
       JOIN companies c ON c.id = d.company_id
       LEFT JOIN test_results tr ON tr.drive_id = a.drive_id AND tr.student_id = a.student_id
       LEFT JOIN offers o ON o.application_id = a.id
       WHERE a.student_id = ?
       ORDER BY a.applied_at DESC`,
      [req.user.id]
    );

    const [bookings] = await pool.query(
      `SELECT b.id AS booking_id, b.status AS booking_status,
              s.id AS slot_id, s.type AS slot_type, s.title AS slot_title,
              s.starts_at, s.ends_at, s.drive_id,
              r.name AS venue_name
       FROM bookings b
       JOIN slots s ON s.id = b.slot_id
       LEFT JOIN resources r ON r.id = s.resource_id
       WHERE b.student_id = ? AND b.status = 'confirmed'
       ORDER BY s.starts_at`,
      [req.user.id]
    );

    const history = apps.map((a) => {
      const interviewSlot = bookings.find((b) => b.drive_id === a.drive_id && b.slot_type === 'interview') || null;
      const testSlot = bookings.find((b) => b.drive_id === a.drive_id && b.slot_type === 'test') || null;

      return {
        application_id: a.application_id,
        drive_id: a.drive_id,
        status: a.application_status,
        applied_at: a.applied_at,
        drive: {
          id: a.drive_id,
          title: a.drive_title,
          status: a.drive_status,
          min_test_score: a.min_test_score,
        },
        company: {
          id: a.company_id,
          name: a.company_name,
          sector: a.company_sector,
          location: a.company_location,
        },
        test_result: a.test_percentage != null ? {
          score: Number(a.test_score),
          total: Number(a.test_total),
          percentage: Number(a.test_percentage),
          submitted_at: a.test_submitted_at,
        } : null,
        test_slot: testSlot,
        interview: interviewSlot ? {
          booking_id: interviewSlot.booking_id,
          title: interviewSlot.slot_title,
          starts_at: interviewSlot.starts_at,
          ends_at: interviewSlot.ends_at,
          venue: interviewSlot.venue_name,
        } : null,
        offer: a.offer_id ? {
          id: a.offer_id,
          package_lpa: Number(a.package_lpa),
          joining_date: a.joining_date,
          note: a.offer_note,
          status: a.offer_status,
          created_at: a.offer_created_at,
          responded_at: a.offer_responded_at,
        } : null,
      };
    });

    res.json({ ok: true, history });
  } catch (err) {
    next(err);
  }
});

// ---------------------------------------------------------------------------
// GET /api/student/offers
// ---------------------------------------------------------------------------
router.get('/offers', authenticateToken, requireRole('student'), async (req, res, next) => {
  try {
    const [offers] = await pool.query(
      `SELECT o.id, o.application_id, o.drive_id, o.company_id,
              o.package_lpa, o.joining_date, o.note, o.status,
              o.created_at, o.responded_at,
              d.title AS drive_title,
              c.name AS company_name, c.location AS company_location
       FROM offers o
       JOIN drives d ON d.id = o.drive_id
       JOIN companies c ON c.id = o.company_id
       WHERE o.student_id = ?
       ORDER BY o.created_at DESC`,
      [req.user.id]
    );

    res.json({
      ok: true,
      offers: offers.map((o) => ({
        id: o.id,
        application_id: o.application_id,
        drive_id: o.drive_id,
        company_id: o.company_id,
        company_name: o.company_name,
        company_location: o.company_location,
        drive_title: o.drive_title,
        package_lpa: Number(o.package_lpa),
        joining_date: o.joining_date,
        note: o.note,
        status: o.status,
        created_at: o.created_at,
        responded_at: o.responded_at,
      })),
    });
  } catch (err) {
    next(err);
  }
});

// ---------------------------------------------------------------------------
// POST /api/student/offers/:id/accept
// Transactional; enforces single-acceptance rule across all offers
// ---------------------------------------------------------------------------
router.post('/offers/:id/accept', authenticateToken, requireRole('student'), async (req, res, next) => {
  try {
    const offerId = parseInt(req.params.id, 10);
    if (!offerId || isNaN(offerId)) {
      return res.status(400).json({ error: 'Invalid offer ID.' });
    }

    const result = await withTransaction(async (conn) => {
      // 1. Lock and fetch target offer
      const [offerRows] = await conn.query(
        `SELECT o.*, c.name AS company_name, d.title AS drive_title, d.created_by AS recruiter_id, u.name AS student_name
         FROM offers o
         JOIN companies c ON c.id = o.company_id
         JOIN drives d ON d.id = o.drive_id
         JOIN users u ON u.id = o.student_id
         WHERE o.id = ? FOR UPDATE`,
        [offerId]
      );

      if (offerRows.length === 0) {
        const err = new Error('Offer not found.');
        err.status = 404;
        throw err;
      }

      const offer = offerRows[0];
      if (offer.student_id !== req.user.id) {
        const err = new Error('You do not own this offer.');
        err.status = 403;
        throw err;
      }

      if (offer.status !== 'offered') {
        const err = new Error(`Cannot accept an offer that is already ${offer.status}.`);
        err.status = 400;
        throw err;
      }

      // 2. Enforce single-acceptance rule
      const [existingAccepted] = await conn.query(
        `SELECT o.id, c.name AS company_name
         FROM offers o
         JOIN companies c ON c.id = o.company_id
         WHERE o.student_id = ? AND o.status = 'accepted' AND o.id != ?
         LIMIT 1`,
        [req.user.id, offerId]
      );

      if (existingAccepted.length > 0) {
        const err = new Error(`You have already accepted an offer from ${existingAccepted[0].company_name}.`);
        err.status = 409;
        throw err;
      }

      // 3. Accept offer
      await conn.query(
        'UPDATE offers SET status = \'accepted\', responded_at = NOW() WHERE id = ?',
        [offerId]
      );

      // 4. Update matching application to 'selected'
      await conn.query(
        'UPDATE applications SET status = \'selected\' WHERE id = ?',
        [offer.application_id]
      );

      // 5. Audit log
      await conn.query(
        'INSERT INTO audit_log (action, entity, entity_id, details) VALUES (?, ?, ?, ?)',
        ['UPDATE', 'offer', offerId, JSON.stringify({ action: 'accept', student_id: req.user.id, application_id: offer.application_id })]
      );

      // 6. Notify recruiter
      await conn.query(
        'INSERT INTO notifications (user_id, title, body, link) VALUES (?, ?, ?, ?)',
        [
          offer.recruiter_id,
          'Offer Accepted! 🎉',
          `${offer.student_name} has accepted the placement offer from ${offer.company_name} (${offer.package_lpa} LPA) for "${offer.drive_title}".`,
          `/recruiter/drives/${offer.drive_id}?tab=offers`,
        ]
      );

      return { company_name: offer.company_name, package_lpa: offer.package_lpa };
    });

    res.json({
      ok: true,
      message: `Offer from ${result.company_name} accepted successfully! Congratulations on your placement!`,
    });
  } catch (err) {
    next(err);
  }
});

// ---------------------------------------------------------------------------
// POST /api/student/offers/:id/decline
// ---------------------------------------------------------------------------
router.post('/offers/:id/decline', authenticateToken, requireRole('student'), async (req, res, next) => {
  try {
    const offerId = parseInt(req.params.id, 10);
    if (!offerId || isNaN(offerId)) {
      return res.status(400).json({ error: 'Invalid offer ID.' });
    }

    await withTransaction(async (conn) => {
      const [offerRows] = await conn.query(
        `SELECT o.*, c.name AS company_name, d.title AS drive_title, d.created_by AS recruiter_id, u.name AS student_name
         FROM offers o
         JOIN companies c ON c.id = o.company_id
         JOIN drives d ON d.id = o.drive_id
         JOIN users u ON u.id = o.student_id
         WHERE o.id = ? FOR UPDATE`,
        [offerId]
      );

      if (offerRows.length === 0) {
        const err = new Error('Offer not found.');
        err.status = 404;
        throw err;
      }

      const offer = offerRows[0];
      if (offer.student_id !== req.user.id) {
        const err = new Error('You do not own this offer.');
        err.status = 403;
        throw err;
      }

      if (offer.status !== 'offered') {
        const err = new Error(`Cannot decline an offer that is already ${offer.status}.`);
        err.status = 400;
        throw err;
      }

      await conn.query(
        'UPDATE offers SET status = \'declined\', responded_at = NOW() WHERE id = ?',
        [offerId]
      );

      await conn.query(
        'INSERT INTO audit_log (action, entity, entity_id, details) VALUES (?, ?, ?, ?)',
        ['UPDATE', 'offer', offerId, JSON.stringify({ action: 'decline', student_id: req.user.id, application_id: offer.application_id })]
      );

      await conn.query(
        'INSERT INTO notifications (user_id, title, body, link) VALUES (?, ?, ?, ?)',
        [
          offer.recruiter_id,
          'Offer Declined',
          `${offer.student_name} declined the offer for "${offer.drive_title}".`,
          `/recruiter/drives/${offer.drive_id}?tab=offers`,
        ]
      );
    });

    res.json({ ok: true, message: 'Offer declined.' });
  } catch (err) {
    next(err);
  }
});

// ---------------------------------------------------------------------------
// GET /api/student/journey (Keep existing endpoint intact)
// ---------------------------------------------------------------------------
function step(key, label, state, detail) {
  return { key, label, state, detail: detail || null };
}

router.get('/journey', authenticateToken, requireRole('student'), async (req, res, next) => {
  try {
    const [apps] = await pool.query(
      `SELECT a.id, a.status, a.applied_at,
              d.id AS drive_id, d.title AS drive_title, d.status AS drive_status,
              c.name AS company_name
       FROM applications a
       JOIN drives d ON d.id = a.drive_id
       JOIN companies c ON c.id = d.company_id
       WHERE a.student_id = ?
       ORDER BY a.applied_at DESC`,
      [req.user.id]
    );

    const journey = [];
    for (const a of apps) {
      const [sessions] = await pool.query(
        `SELECT b.id AS booking_id, s.type, s.title, s.starts_at, s.ends_at,
                r.name AS venue
         FROM bookings b
         JOIN slots s ON s.id = b.slot_id
         LEFT JOIN resources r ON r.id = s.resource_id
         WHERE b.student_id = ? AND s.drive_id = ? AND b.status = 'confirmed'
         ORDER BY s.starts_at`,
        [req.user.id, a.drive_id]
      );
      const testSession = sessions.find((s) => s.type === 'test') || null;
      const interviewRaw = sessions.find((s) => s.type === 'interview') || null;
      const [results] = await pool.query(
        'SELECT score, total, percentage, submitted_at FROM test_results WHERE drive_id = ? AND student_id = ?',
        [a.drive_id, req.user.id]
      );
      const result = results[0] || null;

      let interview = null;
      if (interviewRaw) {
        const m = /Panel (\d+)/.exec(interviewRaw.title || '');
        interview = { ...interviewRaw, panel: m ? Number(m[1]) : null };
      }

      const steps = [];
      steps.push(step('applied', 'Applied', 'done', `Applied ${fmtWhen(a.applied_at)}`));

      if (testSession) {
        steps.push(step('test', 'Test session', result ? 'done' : 'current', `${testSession.title}`));
      } else {
        steps.push(step(
          'test', 'Test session', 'todo',
          a.drive_status === 'open' ? 'Scheduled automatically once applications close' : 'Not scheduled yet'
        ));
      }

      if (result) {
        steps.push(step(
          'result', 'Test result',
          a.status === 'shortlisted' || a.status === 'selected' ? 'done' : 'current',
          `Scored ${Number(result.percentage).toFixed(1)}% (${Number(result.score)}/${Number(result.total)})`
        ));
      } else {
        steps.push(step('result', 'Test result', 'todo', testSession ? 'Take the test to unlock your score' : null));
      }

      if (interview) {
        steps.push(step(
          'interview', 'Interview', 'current',
          `${interview.title}${interview.venue ? ` · ${interview.venue}` : ''}`
        ));
      } else if (a.status === 'shortlisted' || a.status === 'selected') {
        steps.push(step('interview', 'Interview', 'current', 'Shortlisted — schedule coming soon'));
      } else if (a.status === 'rejected') {
        steps.push(step('interview', 'Interview', 'todo', 'Not shortlisted for this drive'));
      } else {
        steps.push(step('interview', 'Interview', 'todo', null));
      }

      journey.push({
        application: { id: a.id, status: a.status, applied_at: a.applied_at },
        drive: { id: a.drive_id, title: a.drive_title, company: a.company_name, status: a.drive_status },
        testSession,
        result: result
          ? { score: Number(result.score), total: Number(result.total), percentage: Number(result.percentage), submitted_at: result.submitted_at }
          : null,
        interview,
        steps,
      });
    }
    res.json(journey);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
