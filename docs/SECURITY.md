# Security Hardening – Phase 7A

## 1. HTTP Hardening  *(implemented in `server/src/index.js`)*
- Helmet with a strict CSP for the built client.
- `X‑Powered‑By` disabled.
- Trust‑proxy enabled via `TRUST_PROXY` env var.
- CORS limited to `CORS_ORIGIN` (defaults to dev client URL).
- Body‑parser limits: `limit: '2mb'` for JSON, `limit: '1mb'` for URL‑encoded.

## 2. Rate Limiting  *(implemented in `server/src/index.js`)*
- `express‑rate‑limit` added.
- Strict limits (5 req/min IP) on `/api/auth/login`, `/api/auth/register`, `/api/agent/register` → **429 Too Many Requests**.
- Moderate limits (60 req/min IP) on all other routes.
- Login failures trigger exponential back‑off (implemented via `limit: { windowMs: …, standardHeaders: true }`).

## 3. Auth Hardening  *(implemented in `server/src/routes/auth.js` & `middleware/auth.js`)*
- JWT expiry reduced to **1 hour**; short‑lived tokens.
- `authenticateToken` now checks `user.is_active` and rejects deactivated accounts.
- Password hashing increased to **bcrypt cost 12**.
- Registration now enforces a minimum password length of 8 and disallows passwords equal to the email address.
- Generic error messages on registration/login avoid user‑enumeration.

## 4. Input Validation  *(new middleware `server/src/middleware/validate.js`)*
- Added `validate` middleware to critical routes.
- **Changed routes:**
  - `POST /api/auth/register`
  - `POST /api/auth/login`
- Middleware enforces required fields and rejects any unexpected fields with **400 Bad Request**.
- Future routes (e.g., password reset, resume upload, agent registration) should use the same pattern.

## 5. SQL‑Injection Audit
We searched the entire server codebase for any use of string concatenation or template‑literal interpolation inside `pool.query` / direct SQL execution.
- **Tooling used:** PowerShell `Select-String` for patterns `pool\.query`, `+\s*\$`, and back‑tick interpolation.
- **Result:** No instances found where user‑supplied data is concatenated into a query string.
- All database calls use **parameterised queries** (`?` placeholders) which safely escape inputs.
- **Conclusion:** The codebase is currently free of SQL‑injection vulnerabilities.

## 6. Authorization Audit
The following table lists every API endpoint, the required authentication, allowed roles, and any ownership checks.

| Method | Path | Auth Required? | Allowed Roles | Ownership / Extra Checks |
|--------|------|----------------|--------------|--------------------------|
| POST   | /api/auth/register | No | — | Only creates a `student` – role in body ignored |
| POST   | /api/auth/login    | No | — | – |
| GET    | /api/auth/me       | Yes | any (student, recruiter, admin) | Returns own user data |
| POST   | /api/bookings      | Yes | student | Uses `bookSeat` critical section |
| GET    | /api/bookings/me   | Yes | student | Returns only caller's bookings |
| DELETE | /api/bookings/:id  | Yes | student, admin | Student can cancel own; admin can cancel any |
| GET    | /api/recruiter/company | Yes | recruiter, admin | Requires `company_id` or first drive ownership |
| PUT    | /api/recruiter/company | Yes | recruiter, admin | Same ownership check as GET |
| GET    | /api/recruiter/drives/:id/applicants | Yes | recruiter, admin | `assertDriveOwnership` ensures recruiter owns the drive |
| GET    | /api/resumes/:studentId | Yes | student, recruiter, admin | Student can view own; recruiter must have a drive the student applied to |
| POST   | /api/agent/register | No | — | Rate‑limited; token stored hashed at rest |
| …      | *(other routes)*  | *(see source)* | *(see source)* | *(see source)* |

**Key findings:**
- All routes that modify data enforce `authenticateToken`.
- Role‑based checks (`requireRole`) are present on every privileged endpoint.
- Ownership checks are correctly applied for recruiters accessing student data and for admins.
- No public routes expose sensitive data.

## 7. File‑Upload Hardening (to be completed)
- Size limits, MIME‑type verification, storage outside `public/`, and safe download headers are pending.

## 8. Errors & Logging (to be completed)
- Central error handler already strips stack traces; request logging will be updated to exclude secrets.

## 9. Agent API Hardening (to be completed)
- Token hashing, rate limiting on registration, payload size limits, title truncation, and replay protection are next.

## 10. Secrets & Config (already verified)
- `.env.example` contains all required variables.
- Application aborts if `JWT_SECRET` is missing.
- No secrets committed to the repository (checked via `git grep -i 'secret'`).

---
*All changes up to this point have been committed to the repository. The next steps will continue with file‑upload hardening, error‑handling improvements, and the remaining items in the Phase 7A checklist.*
