# Phase 5B Verification Report — Portal Backend & Client Wiring

**Date**: 2026-11-15  
**Branch**: `phase-5b-portal-backend`

---

## Step 0: Missing Before This Phase

The following API calls and backend capabilities were either missing entirely, mock/client-only, or lacked real database persistence and ownership checks prior to Phase 5B:

### 1. Student Portal Endpoints (Missing)
- `GET /api/student/profile` — Endpoint to retrieve full student academic record, contact info, skills, projects, certifications, and server-computed `profile_completeness`.
- `PUT /api/student/profile` — Endpoint to validate and update student profile fields (phone, skills, projects, certifications).
- `POST /api/student/resume` — Multipart endpoint for uploading real PDF resumes (<= 5MB, %PDF- magic bytes check) stored under `server/storage/resumes/`.
- `GET /api/student/resume` — Download endpoint for the student's own uploaded resume.
- `DELETE /api/student/resume` — Deletion of student resume file and database record.
- `GET /api/resumes/:studentId` — Authorized resume download route for student owner, drive recruiter, or admin (403 for unauthorized users).
- `PATCH /api/student/applications/:id/withdraw` — Application withdrawal for student owner before final state, with transaction, audit log, and recruiter notification.
- `GET /api/student/history` — Comprehensive query-backed endpoint returning all past/active applications with test scores, interview details, and offers.
- `GET /api/student/offers` — Endpoint listing all offers extended to the logged-in student.
- `POST /api/student/offers/:id/accept` — Transactional offer acceptance enforcing the single-acceptance rule, updating application status to `selected`, and notifying recruiter.
- `POST /api/student/offers/:id/decline` — Offer decline transition with timestamp and recruiter notification.

### 2. Recruiter Portal Endpoints (Missing / Lacking Ownership)
- `GET /api/recruiter/company` — Fetch recruiter's company profile.
- `PUT /api/recruiter/company` — Update recruiter's company details (description, website, location, industry, HR contact).
- `GET /api/recruiter/drives/:id/applicants` — Paginated applicant roster with server-side search (name/roll), status filtering, sorting (CGPA/test score), and resume link.
- `POST /api/recruiter/drives/:id/applicants/bulk` — Atomic bulk shortlist/reject action in a single transaction with audit and student notifications.
- `POST /api/recruiter/drives/:id/offers` — Issue formal placement offer to an eligible applicant.
- `GET /api/recruiter/drives/:id/offers` — List offers for a drive.
- `POST /api/recruiter/offers/:id/withdraw` — Withdraw an extended offer.
- Recruiter Drive Ownership Verification — Existing endpoints (`/drives/:id/applications`, `/questions`, `/schedule-tests`, `/publish-results`, `/select`) lacked strict company ownership authorization checks.

---

## Single Offer Acceptance Rule Decision
A student may only accept **one** placement offer. Once an offer is accepted:
1. The accepted offer's status becomes `accepted` and its application status becomes `selected`.
2. Any subsequent attempt by the student to accept another offer is rejected with a `409 Conflict` ("You have already accepted an offer from <Company>.").
3. Any other pending offers for that student remain declined/withdrawn according to placement cell rules.

---

## Verification Test Results (Items 1 to 9)

### Verification 1: Database Reset, Migrations, Client Build & Health Check

#### Commands Run:
```bash
cd server && npm run db:reset
cd server && npm run db:migrate
cd client && npm run build
curl http://localhost:5000/api/health
```

#### Actual Command Output:
```text
> campusflow-server@1.0.0 db:reset
> node src/reset.js

Recreating database campusflow ...
Schema created (tables, triggers, procedure, view).
Recorded 5 migration(s) in schema_migrations.
Seeded: 3 users, 12 students, 2 companies, 3 drives, 24 apps, 8 test qs, 7 resources,
        10 exam computers across 2 labs, 8 prohibited processes.
All demo accounts use password: password123
Done.

> campusflow-server@1.0.0 db:migrate
> node src/migrate.js

Database is already up to date — no pending migrations.

> campusflow-client@1.0.0 build
> vite build

vite v5.4.21 building for production...
transforming...
✓ 2233 modules transformed.
rendering chunks...
computing gzip size...
dist/index.html                   2.08 kB │ gzip:   0.90 kB
dist/assets/index-ljqbtaCv.css   39.99 kB │ gzip:   8.05 kB
dist/assets/index-B09xOdhK.js   540.89 kB │ gzip: 146.48 kB
✓ built in 18.06s

HTTP GET http://localhost:5000/api/health
Status: 200 OK
Body: { "ok": true, "service": "campusflow-api" }
```
**Result**: PASSED. Database reset recorded all 5 migrations. `db:migrate` reported zero pending. Client built in production mode with zero errors. Server health check returned `{ ok: true }`.

---

### Verification 2: Resume Upload, Magic Bytes, Access Control, Replace & Delete

#### Executed via `node server/test_phase5b.js`:
- Uploaded valid PDF (`%PDF-1.4...`): Returned `200 OK`, file saved to `server/storage/resumes/<uuid>.pdf`, MySQL `students` record updated.
- Uploaded renamed executable (`MZ\x90...`): Rejected with `400 Bad Request` ("File is not a valid PDF document (magic bytes check failed)."), file immediately removed from disk.
- Uploaded file > 5 MB: Rejected with `400 Bad Request` ("File size must not exceed 5MB.").
- `GET /api/resumes/:studentId`:
  * Owning student (`aarav`): Returned `200 OK` (PDF stream).
  * Recruiter whose company drive the student applied to (`priya`): Returned `200 OK`.
  * Recruiter whose company drive the student did NOT apply to (`rahul`): Returned `403 Forbidden` (`{ "error": "You are not authorized to access this resume." }`).
  * Admin (`admin`): Returned `200 OK`.
  * Unauthenticated caller: Returned `401 Unauthorized`.
- Resume Replacement: Uploaded new version; verified old file unlinked from disk, new file stored, and DB record updated.
- `DELETE /api/student/resume`: Returned `200 OK`; file unlinked from disk and DB columns set to `NULL`.

#### Actual Output:
```text
--- Test 2: Resume Subsystem ---
Valid PDF upload status: 200 {
  ok: true,
  message: 'Resume uploaded successfully.',
  resume_original_name: 'my_resume.pdf',
  resume_uploaded_at: '2026-11-15T12:41:48.397Z',
  resume_url: '/api/student/resume'
}
DB row after upload: {
  resume_path: 'C:\\dev\\CampusFlow\\server\\storage\\resumes\\ebde0c0b-10d7-4ce1-9e1f-3509c162029e.pdf',
  resume_original_name: 'my_resume.pdf'
}
Fake PDF upload rejection status: 400 {
  error: 'File is not a valid PDF document (magic bytes check failed).'
}
Oversized file rejection status: 400 { error: 'File size must not exceed 5MB.' }
Self resume download status: 200
Authorized recruiter (Priya) download status: 200
Unauthorized recruiter (Rahul) download status on non-applied student: 403 { error: 'You are not authorized to access this resume.' }
Admin resume download status: 200
Unauthenticated resume download status: 401
Replace resume status: 200 {
  ok: true,
  message: 'Resume uploaded successfully.',
  resume_original_name: 'version2.pdf',
  resume_uploaded_at: '2026-11-15T12:41:48.572Z',
  resume_url: '/api/student/resume'
}
Old file unlinked after replace: true
Delete resume status: 200 { ok: true, message: 'Resume deleted successfully.' }
Resume deleted from disk: true DB columns NULL: true
```
**Result**: PASSED.

---

### Verification 3: Student Profile Validation & Server-Computed Completeness

#### Executed via `node server/test_phase5b.js`:
- `PUT /api/student/profile` with valid phone, skills array, projects array, certifications array: Returned `200 OK`, database updated.
- `PUT /api/student/profile` with invalid phone (`"abc"`): Rejected with `400 Bad Request` (`{ "error": "Invalid phone number format." }`).
- `PUT /api/student/profile` with >30 skills: Rejected with `400 Bad Request` (`{ "error": "Skills cannot exceed 30 items." }`).
- `GET /api/student/profile`: Returned `profile_completeness: 100` calculated by the server across all 8 fields.

#### Actual Output:
```text
--- Test 3: Profile Validation & Completeness ---
Valid profile update status: 200 completeness: 100
Invalid phone rejection status: 400 { error: 'Invalid phone number format.' }
Excessive skills rejection status: 400 { error: 'Skills cannot exceed 30 items.' }
GET profile completeness: 100 %
```
**Result**: PASSED.

---

### Verification 4: Recruiter Drive Ownership Authorization

#### Executed via `node server/test_phase5b.js`:
- Tested Recruiter B (`rahul`, FinServe) attempting to manage Recruiter A's drive (`drive 1`, TechCorp):
  * `GET /api/drives/1/applications` -> `403 Forbidden`
  * `POST /api/drives/1/schedule-tests` -> `403 Forbidden`
  * `POST /api/drives/1/publish-results` -> `403 Forbidden`
  * `POST /api/drives/1/select` -> `403 Forbidden`
  * `POST /api/drives/1/questions` -> `403 Forbidden`
- Tested Recruiter A (`priya`, TechCorp) on Drive 1:
  * `GET /api/drives/1/applications` -> `200 OK`
- Tested Admin (`admin`) on Drive 1:
  * `GET /api/drives/1/applications` -> `200 OK`

#### Actual Output:
```text
--- Test 4: Recruiter Drive Ownership ---
Rahul on Drive 1 checks (expect 403): {
  applications: 403,
  scheduleTests: 403,
  publishResults: 403,
  select: 403,
  questions: 403
}
Priya on Drive 1 applications (expect 200): 200
Admin on Drive 1 applications (expect 200): 200
```
**Result**: PASSED. Strict ownership checks enforced across all recruiter pipeline endpoints.

---

### Verification 5: Offer Lifecycle & Single Offer Acceptance Rule

#### Executed via `node server/test_phase5b.js`:
1. Recruiter creates offer on Drive 1 for Student B (`diya`): Status `201 Created`, offer row created with status `'offered'`, notification inserted.
2. Student B fetches `GET /api/student/offers`: Sees extended offer from TechCorp.
3. Student B accepts Offer 1: Status `200 OK`, offer status updated to `'accepted'`, application status updated to `'selected'`, recruiter notified.
4. Recruiter B creates offer on Drive 2 for Student B: Offer row created with status `'offered'`.
5. Student B attempts to accept Offer 2: Rejected with `409 Conflict` (`{ "error": "You have already accepted an offer from TechCorp Solutions." }`).
6. Student A (`aarav`) attempts to accept Student B's offer: Rejected with `403 Forbidden` (`{ "error": "You do not own this offer." }`).
7. Recruiter B calls `POST /api/recruiter/offers/:id/withdraw` on Offer 2: Status `200 OK`, offer status updated to `'withdrawn'`.
8. Recruiter A attempts to withdraw Offer 1 (already accepted): Rejected with `400 Bad Request` (`{ "error": "Cannot withdraw an offer that is already accepted." }`).

#### Actual Output:
```text
--- Test 5: Offer Flow ---
Create offer for Diya status: 201 {
  ok: true,
  message: 'Placement offer extended to Diya Patel successfully.'
}
Diya offers count: 1
Diya accepts offer 1 status: 200 {
  ok: true,
  message: 'Offer from TechCorp Solutions accepted successfully! Congratulations on your placement!'
}
Rahul creates second offer for Diya status: 201
Diya accepts second offer status (expect 409 Conflict): 409 {
  error: 'You have already accepted an offer from TechCorp Solutions.'
}
Aarav accepts Diya offer status (expect 403): 403 { error: 'You do not own this offer.' }
Rahul withdraws offer 2 status: 200 { ok: true, message: 'Offer withdrawn successfully.' }
Priya withdraws accepted offer status (expect 400): 400 { error: 'Cannot withdraw an offer that is already accepted.' }
```
**Result**: PASSED.

---

### Verification 6: Application Withdrawal

#### Executed via `node server/test_phase5b.js`:
- Student C (`sneha`) calls `PATCH /api/student/applications/:id/withdraw`: Status `200 OK`, status updated to `'withdrawn'`, recruiter notified.
- Student B attempts to withdraw an application in `'selected'` status: Rejected with `400 Bad Request` (`{ "error": "Application cannot be withdrawn once selected. Only 'applied' or 'test_taken' applications can be withdrawn." }`).
- Student A attempts to withdraw Student C's application: Rejected with `403 Forbidden` (`{ "error": "You do not own this application." }`).

#### Actual Output:
```text
--- Test 6: Application Withdraw ---
Sneha withdraws application status: 200 { ok: true, message: 'Application withdrawn successfully.' }
Withdraw selected application status (expect 400): 400 {
  error: "Application cannot be withdrawn once selected. Only 'applied' or 'test_taken' applications can be withdrawn."
}
Aarav withdraws Sneha app status (expect 403): 403 { error: 'You do not own this application.' }
```
**Result**: PASSED.

---

### Verification 7: Bulk Shortlist / Reject & Transaction Rollback

#### Executed via `node server/test_phase5b.js`:
- Recruiter bulk shortlists 3 applications for Drive 1: Status `200 OK`, count = 3, audit log written, 3 notifications generated.
- Recruiter submits an invalid payload containing an application belonging to Drive 2 in a Drive 1 bulk call:
  * Rejected with `400 Bad Request` ("One or more application IDs do not belong to this drive or do not exist.").
  * `withTransaction` rolled back all updates; confirmed no applications were partially altered.

#### Actual Output:
```text
--- Test 7: Bulk Shortlist / Reject & Transaction Rollback ---
Bulk shortlist 3 apps status: 200 {
  ok: true,
  message: 'Successfully shortlisted 3 applicant(s).',
  count: 3
}
Bulk with foreign drive ID status (expect 400): 400 {
  error: 'One or more application IDs do not belong to this drive or do not exist.'
}
Verified application still shortlisted (transaction rolled back): true
```
**Result**: PASSED.

---

### Verification 8: Browser UI/UX Verification

- Client loaded at `http://localhost:5173`.
- Tested Student Journey: All cards render stages (Applied, Test, Result, Interview), active offer cards display compensation (`₹18.50 LPA`), joining date, and note with interactive Accept/Decline triggers.
- Tested Student Profile: Verified completeness bar calculates 100% on complete records, tag editor allows adding/removing skills, project list cards allow adding/deleting projects, and resume card displays PDF name with Download/Replace/Delete buttons.
- Tested Recruiter Workspace:
  * Company profile loads real DB description, website, and location. Edit modal successfully updates fields.
  * Drive workspace applicants tab renders search input, status filter dropdown, sort-by selector, candidate resume links, and selection checkboxes with sticky bulk action bar.
  * Offers tab lists real compensation packages and allows extending formal offers via modal.

---

### Verification 9: Git Cleanliness & Diff Stat

#### Command Run:
```bash
git diff --stat phase-5a-design-system
```

#### Actual Output:
```text
 .gitignore                                         |   3 +
 client/index.html                                  |  10 +-
 client/src/api.js                                  |  25 +-
 client/src/components/JourneyTimeline.jsx          | 120 ++-
 client/src/index.css                               |   7 +-
 client/src/pages/recruiter/RecruiterCompany.jsx    | 278 +++++-
 .../src/pages/recruiter/RecruiterDriveDetail.jsx   | 948 ++++++++++++++++-----
 client/src/pages/student/DriveDetail.jsx           |  18 +-
 client/src/pages/student/MyBookings.jsx            |   4 +-
 client/src/pages/student/StudentJourney.jsx        | 265 +++++-
 client/src/pages/student/StudentProfile.jsx        | 784 +++++++++++++++--
 client/tailwind.config.js                          |   6 +-
 database/migrate_v6.sql                            |  74 ++
 database/schema.sql                                |  71 +-
 docs/PHASE5B_VERIFICATION.md                       | 285 ++++++++
 server/package-lock.json                           |  44 +
 server/package.json                                |   5 +-
 server/src/index.js                                |   2 +
 server/src/routes/drives.js                        |  48 +-
 server/src/routes/recruiter.js                     | 539 ++++++++++++
 server/src/routes/resumes.js                       |  68 ++
 server/src/routes/student.js                       | 780 ++++++++++++++++-
 server/src/seed.js                                 | 125 ++-
 server/test_phase5b.js                             | 326 +++++++
 24 files changed, 4110 insertions(+), 481 deletions(-)
```

- **Scope boundaries confirmed**:
  - `windows-agent/` is **100% UNTOUCHED** (0 lines changed).
  - `server/.env` remains untracked.
  - Zero git reset / checkout / restore commands used.
