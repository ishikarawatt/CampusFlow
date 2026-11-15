// Phase 5B Automated Verification Test Runner
require('dotenv').config();
const http = require('http');
const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'secret';
const BASE_URL = 'http://localhost:5000/api';

function makeToken(user) {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role, company_id: user.company_id || null },
    JWT_SECRET,
    { expiresIn: '1h' }
  );
}

async function request(method, urlPath, token = null, data = null, headers = {}) {
  return new Promise((resolve, reject) => {
    const fullUrl = new URL(BASE_URL + urlPath);
    const options = {
      method,
      hostname: fullUrl.hostname,
      port: fullUrl.port,
      path: fullUrl.pathname + fullUrl.search,
      headers: {
        ...headers,
      },
    };
    if (token) options.headers['Authorization'] = `Bearer ${token}`;

    let bodyStr = null;
    if (data && !(data instanceof Buffer) && !headers['Content-Type']?.includes('multipart')) {
      bodyStr = JSON.stringify(data);
      options.headers['Content-Type'] = 'application/json';
      options.headers['Content-Length'] = Buffer.byteLength(bodyStr);
    } else if (data instanceof Buffer) {
      options.headers['Content-Length'] = data.length;
    }

    const req = http.request(options, (res) => {
      const chunks = [];
      res.on('data', (c) => chunks.push(c));
      res.on('end', () => {
        const raw = Buffer.concat(chunks);
        let parsed = null;
        try {
          parsed = JSON.parse(raw.toString());
        } catch (_) {
          parsed = raw;
        }
        resolve({ status: res.statusCode, headers: res.headers, data: parsed });
      });
    });

    req.on('error', reject);
    if (bodyStr) req.write(bodyStr);
    else if (data instanceof Buffer) req.write(data);
    req.end();
  });
}

function buildMultipart(fieldName, filename, mimetype, contentBuffer) {
  const boundary = '----CampusFlowBoundary' + Math.random().toString(16).slice(2);
  const header = `--${boundary}\r\nContent-Disposition: form-data; name="${fieldName}"; filename="${filename}"\r\nContent-Type: ${mimetype}\r\n\r\n`;
  const footer = `\r\n--${boundary}--\r\n`;
  const total = Buffer.concat([
    Buffer.from(header, 'utf8'),
    contentBuffer,
    Buffer.from(footer, 'utf8'),
  ]);
  return { boundary, body: total };
}

async function run() {
  console.log('=== CAMPUSFLOW PHASE 5B VERIFICATION TESTS ===\n');

  // Test 1: Health check
  console.log('--- Test 1: API Health ---');
  const health = await request('GET', '/health');
  console.log('Health status:', health.status, health.data);
  if (health.status !== 200 || !health.data.ok) throw new Error('Health check failed');

  // Load Users from DB
  const pool = await mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: 'campusflow',
  });

  const [users] = await pool.query('SELECT id, name, email, role, company_id FROM users');
  const admin = users.find((u) => u.role === 'admin');
  const priya = users.find((u) => u.email === 'priya@techcorp.com'); // Recruiter A (TechCorp, drive 1)
  const rahul = users.find((u) => u.email === 'rahul@finserve.com'); // Recruiter B (FinServe, drive 2)
  const aarav = users.find((u) => u.email === 'aarav@student.local'); // Student A
  const diya = users.find((u) => u.email === 'diya@student.local'); // Student B

  const tAdmin = makeToken(admin);
  const tPriya = makeToken(priya);
  const tRahul = makeToken(rahul);
  const tAarav = makeToken(aarav);
  const tDiya = makeToken(diya);

  console.log(`Loaded test accounts: admin=${admin.id}, priya=${priya.id}, rahul=${rahul.id}, aarav=${aarav.id}, diya=${diya.id}`);

  // Test 2: Resume Upload, Magic Bytes, Access Control, Replace, Delete
  console.log('\n--- Test 2: Resume Subsystem ---');
  // Valid PDF
  const validPdfBytes = Buffer.from('%PDF-1.4\n%âãÏÓ\n1 0 obj\n<<>>\nendobj\ntrailer\n<</Root 1 0 R>>\n%%EOF');
  const mp1 = buildMultipart('resume', 'my_resume.pdf', 'application/pdf', validPdfBytes);
  const rUploadValid = await request('POST', '/student/resume', tAarav, mp1.body, {
    'Content-Type': `multipart/form-data; boundary=${mp1.boundary}`,
  });
  console.log('Valid PDF upload status:', rUploadValid.status, rUploadValid.data);
  if (rUploadValid.status !== 200) throw new Error('Valid PDF upload failed');

  // Verify file in storage and row in DB
  const [sRow] = await pool.query('SELECT resume_path, resume_original_name FROM students WHERE user_id = ?', [aarav.id]);
  console.log('DB row after upload:', sRow[0]);
  if (!sRow[0].resume_path || !fs.existsSync(sRow[0].resume_path)) throw new Error('File not found in storage');

  // Fake PDF (renamed .exe or plain text)
  const fakePdfBytes = Buffer.from('MZ\x90\x00\x03\x00\x00\x00FAKE_EXE_HEADER');
  const mpFake = buildMultipart('resume', 'malicious.pdf', 'application/pdf', fakePdfBytes);
  const rUploadFake = await request('POST', '/student/resume', tAarav, mpFake.body, {
    'Content-Type': `multipart/form-data; boundary=${mpFake.boundary}`,
  });
  console.log('Fake PDF upload rejection status:', rUploadFake.status, rUploadFake.data);
  if (rUploadFake.status !== 400) throw new Error('Fake PDF was not rejected with 400');

  // Oversized file (> 5MB)
  const bigBytes = Buffer.alloc(5.5 * 1024 * 1024);
  bigBytes.write('%PDF-');
  const mpBig = buildMultipart('resume', 'huge.pdf', 'application/pdf', bigBytes);
  const rUploadBig = await request('POST', '/student/resume', tAarav, mpBig.body, {
    'Content-Type': `multipart/form-data; boundary=${mpBig.boundary}`,
  });
  console.log('Oversized file rejection status:', rUploadBig.status, rUploadBig.data);
  if (rUploadBig.status !== 400) throw new Error('Big file was not rejected with 400');

  // Access control on GET /api/resumes/:studentId
  const rSelf = await request('GET', `/resumes/${aarav.id}`, tAarav);
  console.log('Self resume download status:', rSelf.status);
  if (rSelf.status !== 200) throw new Error('Self download failed');

  const rPriya = await request('GET', `/resumes/${aarav.id}`, tPriya);
  console.log('Authorized recruiter (Priya) download status:', rPriya.status);
  if (rPriya.status !== 200) throw new Error('Priya download failed');

  // Recruiter B (Rahul) - does student 12 (Pooja Reddy) have an app on Rahul's drive? Let's check a student who didn't apply to Rahul
  // Rahul's drive is drive 2. Drive 2 has students 0..7. Students 8..11 did not apply to drive 2. Student 9 is Rohan Gupta (id=12)
  const [nonApplied] = await pool.query(
    'SELECT user_id FROM students WHERE user_id NOT IN (SELECT student_id FROM applications a JOIN drives d ON d.id = a.drive_id WHERE d.company_id = ? OR d.created_by = ?) LIMIT 1',
    [rahul.company_id, rahul.id]
  );
  if (nonApplied.length > 0) {
    const unauthId = nonApplied[0].user_id;
    // Set a dummy resume for this student
    await pool.query('UPDATE students SET resume_path = ?, resume_original_name = ? WHERE user_id = ?', [sRow[0].resume_path, 'test.pdf', unauthId]);
    const rRahulUnauth = await request('GET', `/resumes/${unauthId}`, tRahul);
    console.log('Unauthorized recruiter (Rahul) download status on non-applied student:', rRahulUnauth.status, rRahulUnauth.data);
    if (rRahulUnauth.status !== 403) throw new Error('Expected 403 Forbidden for unauthorized recruiter');
    await pool.query('UPDATE students SET resume_path = NULL, resume_original_name = NULL WHERE user_id = ?', [unauthId]);
  }

  const rAdmin = await request('GET', `/resumes/${aarav.id}`, tAdmin);
  console.log('Admin resume download status:', rAdmin.status);
  if (rAdmin.status !== 200) throw new Error('Admin download failed');

  const rAnon = await request('GET', `/resumes/${aarav.id}`, null);
  console.log('Unauthenticated resume download status:', rAnon.status);
  if (rAnon.status !== 401) throw new Error('Unauthenticated download expected 401');

  // Replace resume: upload new PDF and ensure old file was unlinked
  const oldPath = sRow[0].resume_path;
  const newPdfBytes = Buffer.from('%PDF-1.7\nNEW_VERSION');
  const mpNew = buildMultipart('resume', 'version2.pdf', 'application/pdf', newPdfBytes);
  const rReplace = await request('POST', '/student/resume', tAarav, mpNew.body, {
    'Content-Type': `multipart/form-data; boundary=${mpNew.boundary}`,
  });
  console.log('Replace resume status:', rReplace.status, rReplace.data);
  const oldExists = fs.existsSync(oldPath);
  console.log('Old file unlinked after replace:', !oldExists);
  if (oldExists) throw new Error('Old resume file was not unlinked on replacement');

  // DELETE /api/student/resume
  const [sRow2] = await pool.query('SELECT resume_path FROM students WHERE user_id = ?', [aarav.id]);
  const newPath = sRow2[0].resume_path;
  const rDel = await request('DELETE', '/student/resume', tAarav);
  console.log('Delete resume status:', rDel.status, rDel.data);
  const newExists = fs.existsSync(newPath);
  const [sRowDel] = await pool.query('SELECT resume_path, resume_original_name FROM students WHERE user_id = ?', [aarav.id]);
  console.log('Resume deleted from disk:', !newExists, 'DB columns NULL:', sRowDel[0].resume_path === null);
  if (newExists || sRowDel[0].resume_path !== null) throw new Error('Delete resume failed');

  // Re-upload valid resume for Aarav so subsequent tests have it
  await request('POST', '/student/resume', tAarav, mp1.body, {
    'Content-Type': `multipart/form-data; boundary=${mp1.boundary}`,
  });

  // Test 3: Profile Updates & Completeness
  console.log('\n--- Test 3: Profile Validation & Completeness ---');
  const rProfValid = await request('PUT', '/student/profile', tAarav, {
    phone: '+91 99999 88888',
    skills: ['Node.js', 'Go', 'Kubernetes'],
    projects: [{ title: 'CampusFlow Kernel', desc: 'Placement Engine', link: 'https://campusflow.local' }],
    certifications: [{ name: 'Certified Kubernetes Administrator', issuer: 'CNCF', year: 2026 }],
  });
  console.log('Valid profile update status:', rProfValid.status, 'completeness:', rProfValid.data?.profile_completeness);
  if (rProfValid.status !== 200 || rProfValid.data?.profile_completeness === undefined) throw new Error('Valid profile update failed');

  // Invalid phone test
  const rBadPhone = await request('PUT', '/student/profile', tAarav, { phone: 'abc' });
  console.log('Invalid phone rejection status:', rBadPhone.status, rBadPhone.data);
  if (rBadPhone.status !== 400) throw new Error('Invalid phone was not rejected with 400');

  // Excessive skills test (> 30)
  const tooManySkills = Array.from({ length: 35 }, (_, i) => `Skill${i}`);
  const rBadSkills = await request('PUT', '/student/profile', tAarav, { skills: tooManySkills });
  console.log('Excessive skills rejection status:', rBadSkills.status, rBadSkills.data);
  if (rBadSkills.status !== 400) throw new Error('Excessive skills was not rejected with 400');

  const rProfGet = await request('GET', '/student/profile', tAarav);
  console.log('GET profile completeness:', rProfGet.data?.profile_completeness, '%');

  // Test 4: Recruiter Drive Ownership
  console.log('\n--- Test 4: Recruiter Drive Ownership ---');
  // Priya owns drive 1. Rahul owns drive 2.
  // Rahul tries to access drive 1
  const r403_apps = await request('GET', '/drives/1/applications', tRahul);
  const r403_sched = await request('POST', '/drives/1/schedule-tests', tRahul, {});
  const r403_pub = await request('POST', '/drives/1/publish-results', tRahul, {});
  const r403_sel = await request('POST', '/drives/1/select', tRahul, { student_id: aarav.id });
  const r403_q = await request('POST', '/drives/1/questions', tRahul, { questions: [{ text: 'Q1', options: ['A', 'B'], correct_index: 0, marks: 1 }] });
  console.log('Rahul on Drive 1 checks (expect 403):', {
    applications: r403_apps.status,
    scheduleTests: r403_sched.status,
    publishResults: r403_pub.status,
    select: r403_sel.status,
    questions: r403_q.status,
  });
  if (r403_apps.status !== 403 || r403_sched.status !== 403 || r403_pub.status !== 403 || r403_sel.status !== 403 || r403_q.status !== 403) {
    throw new Error('Recruiter B was not rejected with 403 on Recruiter A drive');
  }

  // Priya on her own drive 1
  const r200_apps = await request('GET', '/drives/1/applications', tPriya);
  console.log('Priya on Drive 1 applications (expect 200):', r200_apps.status);
  if (r200_apps.status !== 200) throw new Error('Priya on own drive failed');

  // Admin on Drive 1
  const rAdmin_apps = await request('GET', '/drives/1/applications', tAdmin);
  console.log('Admin on Drive 1 applications (expect 200):', rAdmin_apps.status);
  if (rAdmin_apps.status !== 200) throw new Error('Admin on drive 1 failed');

  // Test 5: Offer Flow (Happy + Sad Path)
  console.log('\n--- Test 5: Offer Flow ---');
  // Priya creates offer for Diya on Drive 1 (first shortlist Diya on drive 1)
  const [diyaApp1] = await pool.query('SELECT id, status FROM applications WHERE drive_id = 1 AND student_id = ?', [diya.id]);
  await pool.query('UPDATE applications SET status = \'shortlisted\' WHERE id = ?', [diyaApp1[0].id]);

  const rOfferCreate = await request('POST', '/recruiter/drives/1/offers', tPriya, {
    application_id: diyaApp1[0].id,
    package_lpa: 16.0,
    joining_date: '2027-08-01',
    note: 'Welcome to TechCorp!',
  });
  console.log('Create offer for Diya status:', rOfferCreate.status, rOfferCreate.data);
  if (rOfferCreate.status !== 201) throw new Error('Offer creation failed');

  // Diya checks offers
  const rDiyaOffers = await request('GET', '/student/offers', tDiya);
  console.log('Diya offers count:', rDiyaOffers.data?.offers?.length);
  const diyaOffer1 = rDiyaOffers.data?.offers?.find((o) => o.application_id === diyaApp1[0].id);
  if (!diyaOffer1) throw new Error('Diya offer not found');

  // Diya accepts offer 1
  const rDiyaAccept = await request('POST', `/student/offers/${diyaOffer1.id}/accept`, tDiya);
  console.log('Diya accepts offer 1 status:', rDiyaAccept.status, rDiyaAccept.data);
  if (rDiyaAccept.status !== 200) throw new Error('Accept offer failed');

  // Now Rahul creates offer on Drive 2 for Diya
  const [diyaApp2] = await pool.query('SELECT id FROM applications WHERE drive_id = 2 AND student_id = ?', [diya.id]);
  await pool.query('UPDATE applications SET status = \'shortlisted\' WHERE id = ?', [diyaApp2[0].id]);
  const rOffer2Create = await request('POST', '/recruiter/drives/2/offers', tRahul, {
    application_id: diyaApp2[0].id,
    package_lpa: 14.5,
  });
  console.log('Rahul creates second offer for Diya status:', rOffer2Create.status);

  const [diyaOffer2Rows] = await pool.query('SELECT id FROM offers WHERE application_id = ?', [diyaApp2[0].id]);
  const diyaOffer2Id = diyaOffer2Rows[0].id;

  // Diya attempts to accept offer 2 -> MUST GET 409 Conflict!
  const rDiyaAccept2 = await request('POST', `/student/offers/${diyaOffer2Id}/accept`, tDiya);
  console.log('Diya accepts second offer status (expect 409 Conflict):', rDiyaAccept2.status, rDiyaAccept2.data);
  if (rDiyaAccept2.status !== 409) throw new Error('Expected 409 Conflict on second offer acceptance');

  // Aarav attempts to accept Diya's offer -> MUST GET 403 Forbidden!
  const rAaravSteal = await request('POST', `/student/offers/${diyaOffer2Id}/accept`, tAarav);
  console.log('Aarav accepts Diya offer status (expect 403):', rAaravSteal.status, rAaravSteal.data);
  if (rAaravSteal.status !== 403) throw new Error('Expected 403 on other student offer');

  // Recruiter withdraws offer 2
  const rWithdrawOffer2 = await request('POST', `/recruiter/offers/${diyaOffer2Id}/withdraw`, tRahul);
  console.log('Rahul withdraws offer 2 status:', rWithdrawOffer2.status, rWithdrawOffer2.data);
  if (rWithdrawOffer2.status !== 200) throw new Error('Withdraw offer failed');

  // Recruiter attempts to withdraw offer 1 (already accepted) -> MUST GET 400!
  const rWithdrawAccepted = await request('POST', `/recruiter/offers/${diyaOffer1.id}/withdraw`, tPriya);
  console.log('Priya withdraws accepted offer status (expect 400):', rWithdrawAccepted.status, rWithdrawAccepted.data);
  if (rWithdrawAccepted.status !== 400) throw new Error('Expected 400 on withdrawing accepted offer');

  // Test 6: Application Withdraw
  console.log('\n--- Test 6: Application Withdraw ---');
  // Student 5 (Sneha Kulkarni) applied to Drive 1
  const sneha = users.find((u) => u.email === 'sneha@student.local');
  const tSneha = makeToken(sneha);
  const [snehaApp] = await pool.query('SELECT id, status FROM applications WHERE drive_id = 1 AND student_id = ?', [sneha.id]);
  await pool.query('UPDATE applications SET status = \'applied\' WHERE id = ?', [snehaApp[0].id]);

  const rWithdrawApp = await request('PATCH', `/student/applications/${snehaApp[0].id}/withdraw`, tSneha);
  console.log('Sneha withdraws application status:', rWithdrawApp.status, rWithdrawApp.data);
  if (rWithdrawApp.status !== 200) throw new Error('Application withdraw failed');

  // Attempt to withdraw an application with status 'selected'
  const rWithdrawSelected = await request('PATCH', `/student/applications/${diyaApp1[0].id}/withdraw`, tDiya);
  console.log('Withdraw selected application status (expect 400):', rWithdrawSelected.status, rWithdrawSelected.data);
  if (rWithdrawSelected.status !== 400) throw new Error('Expected 400 on withdrawing selected application');

  // Other student attempts to withdraw Sneha's application
  const rSnehaSteal = await request('PATCH', `/student/applications/${snehaApp[0].id}/withdraw`, tAarav);
  console.log('Aarav withdraws Sneha app status (expect 403):', rSnehaSteal.status, rSnehaSteal.data);
  if (rSnehaSteal.status !== 403) throw new Error('Expected 403 on withdrawing another student application');

  // Test 7: Bulk Shortlist / Reject & Transaction Rollback
  console.log('\n--- Test 7: Bulk Shortlist / Reject & Transaction Rollback ---');
  // Pick 3 applications in drive 1
  const [drive1Apps] = await pool.query('SELECT id FROM applications WHERE drive_id = 1 AND status != \'selected\' LIMIT 3');
  const d1Ids = drive1Apps.map((a) => a.id);
  const rBulkOk = await request('POST', '/recruiter/drives/1/applicants/bulk', tPriya, {
    application_ids: d1Ids,
    action: 'shortlist',
  });
  console.log('Bulk shortlist 3 apps status:', rBulkOk.status, rBulkOk.data);
  if (rBulkOk.status !== 200 || rBulkOk.data?.count !== 3) throw new Error('Bulk shortlist failed');

  // Mixed drive IDs: include an application from drive 2 into drive 1 bulk call -> MUST ROLLBACK!
  const [drive2App] = await pool.query('SELECT id FROM applications WHERE drive_id = 2 LIMIT 1');
  const mixedIds = [...d1Ids.slice(0, 2), drive2App[0].id];
  const rBulkRollback = await request('POST', '/recruiter/drives/1/applicants/bulk', tPriya, {
    application_ids: mixedIds,
    action: 'reject',
  });
  console.log('Bulk with foreign drive ID status (expect 400):', rBulkRollback.status, rBulkRollback.data);
  if (rBulkRollback.status !== 400) throw new Error('Expected 400 rejection and rollback on foreign application ID');

  // Verify none of the mixed IDs were changed to rejected
  const [checkRows] = await pool.query('SELECT status FROM applications WHERE id = ?', [d1Ids[0]]);
  console.log('Verified application still shortlisted (transaction rolled back):', checkRows[0].status === 'shortlisted');
  if (checkRows[0].status !== 'shortlisted') throw new Error('Transaction was not rolled back');

  await pool.end();
  console.log('\n=== ALL PHASE 5B VERIFICATION TESTS PASSED SUCCESSFULLY! ===\n');
}

run().catch((err) => {
  console.error('\nVerification failed:', err);
  process.exit(1);
});

