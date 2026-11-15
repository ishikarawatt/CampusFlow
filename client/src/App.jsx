// CampusFlow OS — router. Role-protected portals: /student/*, /recruiter/*, /admin/*.
// New IA: merged pages, redirects for old URLs, slide-over panels via ?panel= params.

import React from 'react';
import { Routes, Route, Navigate, useParams, useSearchParams } from 'react-router-dom';
import { useAuth } from './auth.jsx';
import Layout from './components/Layout.jsx';
import Login from './pages/Login.jsx';
import StudentDashboard from './pages/student/StudentDashboard.jsx';
import Drives from './pages/student/Drives.jsx';
import StudentJourney from './pages/student/StudentJourney.jsx';
import StudentProfile from './pages/student/StudentProfile.jsx';
import TestTaker from './pages/student/TestTaker.jsx';
import RecruiterDashboard from './pages/recruiter/RecruiterDashboard.jsx';
import MyDrives from './pages/recruiter/MyDrives.jsx';
import RecruiterDriveDetail from './pages/recruiter/RecruiterDriveDetail.jsx';
import NewDriveWizard from './pages/recruiter/NewDriveWizard.jsx';
import RecruiterCompany from './pages/recruiter/RecruiterCompany.jsx';
import RecruiterInbox from './pages/recruiter/RecruiterInbox.jsx';
import AdminDashboard from './pages/admin/AdminDashboard.jsx';
import KernelMonitor from './pages/admin/KernelMonitor.jsx';
import SchedulingLab from './pages/admin/SchedulingLab.jsx';
import Resources from './pages/admin/Resources.jsx';
import Reports from './pages/admin/Reports.jsx';
import Users from './pages/admin/Users.jsx';
import ExamMonitoring from './pages/admin/ExamMonitoring.jsx';
import ExamPcs from './pages/admin/ExamPcs.jsx';

const HOME = { admin: '/admin', recruiter: '/recruiter', student: '/student' };

function ProtectedRoute({ role, children }) {
  const { user, ready } = useAuth();
  if (!ready) return <div className="min-h-screen flex items-center justify-center text-sm text-[var(--text-muted)]">Loading…</div>;
  if (!user) return <Navigate to="/login" replace />;
  if (role && user.role !== role) return <Navigate to={HOME[user.role] ?? '/student'} replace />;
  return children;
}

function RoleRedirect() {
  const { user, ready } = useAuth();
  if (!ready) return <div className="min-h-screen flex items-center justify-center text-sm text-[var(--text-muted)]">Loading…</div>;
  return <Navigate to={user ? HOME[user.role] ?? '/student' : '/login'} replace />;
}

// Redirect old /student/drives/:id to /student/drives?panel=drive-:id
function DriveDetailRedirect() {
  const { id } = useParams();
  return <Navigate to={`/student/drives?panel=drive-${id}`} replace />;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />

      <Route path="/student" element={<ProtectedRoute role="student"><Layout /></ProtectedRoute>}>
        <Route index element={<StudentDashboard />} />
        <Route path="drives" element={<Drives />} />
        <Route path="drives/:id" element={<DriveDetailRedirect />} />
        <Route path="journey" element={<StudentJourney />} />
        <Route path="profile" element={<StudentProfile />} />
        <Route path="tests/:driveId" element={<TestTaker />} />
        {/* Old routes redirect */}
        <Route path="bookings" element={<Navigate to="/student/journey" replace />} />
        <Route path="applications" element={<Navigate to="/student/journey" replace />} />
      </Route>

      <Route path="/recruiter" element={<ProtectedRoute role="recruiter"><Layout /></ProtectedRoute>}>
        <Route index element={<RecruiterDashboard />} />
        <Route path="drives" element={<MyDrives />} />
        <Route path="drives/new" element={<NewDriveWizard />} />
        <Route path="drives/:id" element={<RecruiterDriveDetail />} />
        <Route path="company" element={<RecruiterCompany />} />
        <Route path="inbox" element={<RecruiterInbox />} />
        {/* Old routes redirect */}
        <Route path="applicants" element={<Navigate to="/recruiter/drives" replace />} />
      </Route>

      <Route path="/admin" element={<ProtectedRoute role="admin"><Layout /></ProtectedRoute>}>
        <Route index element={<AdminDashboard />} />
        <Route path="monitoring" element={<ExamMonitoring />} />
        <Route path="exam-pcs" element={<ExamPcs />} />
        <Route path="monitor" element={<KernelMonitor />} />
        <Route path="scheduling" element={<SchedulingLab />} />
        <Route path="resources" element={<Resources />} />
        <Route path="reports" element={<Reports />} />
        <Route path="users" element={<Users />} />
        {/* Old routes redirect */}
        <Route path="schedule" element={<Navigate to="/admin/scheduling" replace />} />
      </Route>

      <Route path="*" element={<RoleRedirect />} />
    </Routes>
  );
}
