# Installation & Setup Guide — CampusFlow OS

Everything runs locally on `localhost`: the relational database, Express REST API, and Vite React client. No external cloud dependencies or internet access are required after installing packages.

---

## 1. System Requirements

| Tool | Minimum Version | Verification Command | Notes |
|---|---|---|---|
| **Node.js** | v18.0.0+ (LTS recommended) | `node --version` | Ships with `npm` (`npm --version`) |
| **MySQL** | 8.0+ | `mysql --version` | Standard local installation (or Docker optional) |
| **Git** | 2.x+ | `git --version` | For branch management |

---

## 2. Windows Plain Installation (Recommended)

### Step 2.1: MySQL 8 Installation & PATH Configuration
1. If not already installed, download [MySQL 8.0 Community Server](https://dev.mysql.com/downloads/mysql/).
2. Run the MySQL installer with default port `3306` and InnoDB enabled. Note your chosen root password.
3. Verify that the MySQL Windows service is active:
   ```powershell
   Get-Service *mysql*
   ```
   (Should display `Running`).
4. **Add MySQL binary to Windows PATH** (optional but recommended for CLI access):
   - Typical path: `C:\Program Files\MySQL\MySQL Server 8.0\bin`
   - Test in a new PowerShell window:
     ```powershell
     & "C:\Program Files\MySQL\MySQL Server 8.0\bin\mysql.exe" -u root -p
     ```

*(Alternative: Docker is supported as an optional setup using `docker compose up -d`).*

### Step 2.2: Backend Environment Configuration
1. Navigate to the `server/` directory:
   ```powershell
   cd c:\dev\CampusFlow\server
   ```
2. Copy `.env.example` to create `.env`:
   ```powershell
   Copy-Item .env.example .env
   ```
   *(Note: `server/.env` is gitignored to protect local credentials).*
3. Open `server/.env` and configure:
   ```ini
   PORT=5000
   DB_HOST=localhost
   DB_PORT=3306
   DB_USER=root
   DB_PASSWORD=your_mysql_password
   DB_NAME=campusflow
   JWT_SECRET=your_32_character_long_random_secret_string
   ```
   > ⚠️ **Important**: `JWT_SECRET` is strictly required. The backend will refuse to start if `JWT_SECRET` is missing.

### Step 2.3: Database Initialization & Seed
Run the database reset script inside `server/`:
```powershell
npm install
npm run db:reset
```
This performs a full idempotent rebuild:
1. Recreates the `campusflow` database with UTF-8 character encoding.
2. Applies `database/schema.sql` (14 tables, 8 audit triggers, stored procedure, view).
3. Records all discovered migrations (`migrate_v2.sql`, `migrate_v3.sql`, `migrate_v4.sql`) in `schema_migrations`.
4. Seeds 3 staff accounts, 12 student profiles, 2 companies, 3 drives, test questions, and resource inventory.

Verify migration status:
```powershell
npm run db:migrate
```
Expected output: `Database is already up to date — no pending migrations.`

### Step 2.4: Start Backend API
```powershell
npm run dev
```
The API server listens on `http://localhost:5000/api`.

### Step 2.5: Install & Start Frontend Client
Open a second PowerShell terminal:
```powershell
cd c:\dev\CampusFlow\client
npm install
npm run dev
```
The Vite development server will start on `http://localhost:5173`. Open this URL in your web browser.

---

## 3. Seed Accounts & Portals (Password: `password123`)

| Role | Email | Portal Surface | Capabilities |
|---|---|---|---|
| **Admin** | `admin@campusflow.local` | Control Center (`/admin`) | Master timetable, resource allocations, live lock monitor, scheduling simulation, user management |
| **Recruiter** | `priya@techcorp.com` | Recruiter Dashboard (`/recruiter`) | Create placement drives, configure aptitude tests, schedule batches, publish shortlists |
| **Student** | `aarav@student.local` | Student Dashboard (`/student`) | Explore drives, 1-click apply, take timed aptitude tests, view auto-scheduled interviews |

*(One-click demo login buttons are available directly on the login page).*

---

## 4. Key Architectural Notes for Evaluators

1. **CPU Scheduling Algorithms**:
   The interview scheduler implements **FCFS (First-Come, First-Served)** and **Non-preemptive Priority** (highest CGPA interviewed first). Round Robin was intentionally removed in this release because preemptive time-slicing is physically inapplicable to human interview panels.
2. **Stored Procedure (`sp_generate_shortlist`)**:
   `database/schema.sql` defines `sp_generate_shortlist(IN p_drive_id, OUT p_count)`. This is a direct set-based SQL procedure for criteria-based shortlisting. In the v2/v3 architecture, web drive workflows use score-based shortlisting (`publishResults` in `pipeline.js`). Evaluators can execute the procedure directly in MySQL:
   ```sql
   CALL sp_generate_shortlist(1, @count);
   SELECT @count;
   ```
3. **Serialized Critical Section**:
   All seat reservations serialize through `SELECT … FOR UPDATE` inside `server/src/os/critical-section.js`. Connection leaks and ghost locks are prevented via guaranteed `finally` block cleanup and telemetry flags.

---

## 5. Troubleshooting & FAQ

- **`FATAL: JWT_SECRET environment variable is missing`**: Ensure `server/.env` contains a non-empty `JWT_SECRET=...` definition.
- **`Access denied for user 'root'@'localhost'`**: Verify password in `server/.env` matches your MySQL root account.
- **`Port 5000 is already in use`**: Terminate any lingering Node processes (`Stop-Process -Name node`) or change `PORT` in `server/.env`.
- **`Duplicate column name / table exists` during `npm run db:migrate`**: Run `npm run db:reset` first. The reset script records all migration versions in `schema_migrations`.
