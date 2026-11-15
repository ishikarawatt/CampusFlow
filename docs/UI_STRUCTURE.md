# CampusFlow UI Structure & Route Migration Mapping

This document provides a mapping of all existing routes, pages, and features to their new Information Architecture (IA) locations. **No feature is removed.** Every page either maps to a redesigned top-level route, an embedded workspace tab, a URL-addressable Slide-Over panel, or has an automatic route redirect for bookmark preservation.

---

## 1. Student Portal (`/student/*`)

| Old Route | Old Page Component | New Location in IA | Mode / Access | Notes |
|---|---|---|---|---|
| `/student` | `StudentDashboard.jsx` | `/student` (Home) | Direct Top-level page | "Next up" card (next test/interview), active journey stepper, matching drives, notifications. |
| `/student/drives` | `Drives.jsx` | `/student/drives` (Drives) | Direct Top-level page | Tabs (Eligible / Applied / Closed), package & branch filters. |
| `/student/drives/:id` | `DriveDetail.jsx` | `/student/drives?panel=drive-:id` | URL-addressable SlideOver | Opens in right slide-over with plain-language eligibility breakdown & 1-click apply. Redirect preserves old URL. |
| `/student/bookings` | `MyBookings.jsx` | `/student/journey` (My Journey) | Direct Top-level page | Merged with timeline cards (Applied > Test > Result > Interview > Offer). `/student/bookings` redirects here. |
| `/student/tests/:driveId` | `TestTaker.jsx` | `/student/tests/:driveId` (Tests) | Distraction-free Full-Screen | Full-screen focus mode with countdown timer, question navigator, and submit modal dialog. |
| *New* | Profile view | `/student/profile` (Profile) | Direct Top-level page | Completeness meter, academic record, and resume card. |

---

## 2. Recruiter Portal (`/recruiter/*`)

| Old Route | Old Page Component | New Location in IA | Mode / Access | Notes |
|---|---|---|---|---|
| `/recruiter` | `RecruiterDashboard.jsx` | `/recruiter` (Overview) | Direct Top-level page | Hiring funnel, key KPIs, "Needs your action" queue. |
| `/recruiter/drives` | `MyDrives.jsx` | `/recruiter/drives` (Drives) | Direct Top-level page | Drive cards with status chips, applicant counts, and stage badges. |
| `/recruiter/drives/new` | `NewDriveWizard.jsx` | `/recruiter/drives/new` (Add Drive) | Modal / Dedicated Sub-route | Multi-step drive creation wizard restyled in Midnight/Gold. |
| `/recruiter/drives/:id` | `RecruiterDriveDetail.jsx` | `/recruiter/drives/:id` (Drive Workspace) | Tabbed Workspace Page | Tabs: Overview, Eligibility, Applicants (table with filters), Test (questions & schedule), Interviews, Results. |
| *New / Shared* | Company Profile | `/recruiter/company` (Company) | Direct Top-level page | Company overview, contact info, and active recruitment drives. |
| *New / Shared* | Notifications Inbox | `/recruiter/inbox` (Inbox) | Direct Top-level page | Full-page inbox feed complementing the header bell. |

---

## 3. Admin Portal (`/admin/*`)

| Old Route | Old Page Component | New Sidebar Group | New Location in IA | Notes |
|---|---|---|---|---|
| `/admin` | `AdminDashboard.jsx` | Command Center | `/admin` (Command Center) | Stat strip, "Needs attention" queue, today's schedule, pipeline stage actions. |
| `/admin/monitoring` | `ExamMonitoring.jsx` | Exams & Labs | `/admin/monitoring` | Live Socket.IO workstation grid, terminal pulse states, side drawer for human review. |
| `/admin/exam-pcs` | `ExamPcs.jsx` | Exams & Labs | `/admin/exam-pcs` | Enrollment codes, PC allocation, prohibited process list, reset actions. |
| `/admin/monitor` | `KernelMonitor.jsx` | Resources | `/admin/monitor` | Live kernel/lock telemetry, transaction lock viewer, system health. |
| `/admin/resources` | `Resources.jsx` | Resources | `/admin/resources` | Lab seating capacities, interviewer pool, room reservation tables. |
| `/admin/scheduling` | `SchedulingLab.jsx` | OS Lab | `/admin/scheduling` | Algorithmic timetable generator (FCFS vs Priority comparison), viva demonstration group. |
| `/admin/reports` | `Reports.jsx` | Reports | `/admin/reports` | Funnel drop-off analytics, branch-wise placement statistics. |
| `/admin/users` | `Users.jsx` | People | `/admin/users` | User management, staff account generation, role administration. |

---

## 4. Redirect Preservation Table

To ensure zero broken bookmarks or links, `App.jsx` handles redirects:
- `/student/applications` → `/student/journey`
- `/student/bookings` → `/student/journey`
- `/student/drives/:id` → `/student/drives?panel=drive-:id`
- `/admin/schedule` → `/admin/scheduling`
- `/recruiter/applicants` → `/recruiter/drives`
