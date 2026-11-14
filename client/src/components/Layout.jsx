import React, { useState } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth.jsx';
import { useTheme } from '../context/ThemeContext.jsx';
import Badge from './Badge.jsx';
import NotificationsBell from './NotificationsBell.jsx';
import {
  Sun,
  Moon,
  Menu,
  X,
  ChevronLeft,
  ChevronRight,
  LogOut,
  User as UserIcon,
  LayoutDashboard,
  Search,
  Calendar,
  Briefcase,
  PlusCircle,
  ShieldAlert,
  MonitorCheck,
  Server,
  Activity,
  Cpu,
  Boxes,
  FileBarChart,
  Users as UsersIcon,
} from 'lucide-react';

const NAV = {
  student: [
    { to: '/student', label: 'Dashboard', end: true, icon: LayoutDashboard },
    { to: '/student/drives', label: 'Find Drives', icon: Search },
    { to: '/student/bookings', label: 'My Schedule', icon: Calendar },
  ],
  recruiter: [
    { to: '/recruiter', label: 'Dashboard', end: true, icon: LayoutDashboard },
    { to: '/recruiter/drives', label: 'My Drives', icon: Briefcase },
    { to: '/recruiter/drives/new', label: 'Add Drive', highlight: true, icon: PlusCircle },
  ],
  admin: [
    { to: '/admin', label: 'Control Center', end: true, icon: LayoutDashboard },
    { to: '/admin/monitoring', label: 'Exam Monitoring', icon: MonitorCheck },
    { to: '/admin/exam-pcs', label: 'Exam PCs', icon: Server },
    { to: '/admin/monitor', label: 'Live Monitor', icon: Activity },
    { to: '/admin/scheduling', label: 'Interview Scheduler', icon: Calendar },
    { to: '/admin/resources', label: 'Resources', icon: Boxes },
    { to: '/admin/reports', label: 'Reports', icon: FileBarChart },
    { to: '/admin/users', label: 'Users', icon: UsersIcon },
  ],
};

const TITLES = {
  '/student': 'Dashboard',
  '/student/drives': 'Find Drives',
  '/student/bookings': 'My Schedule',
  '/recruiter': 'Dashboard',
  '/recruiter/drives': 'My Drives',
  '/recruiter/drives/new': 'Add Drive',
  '/admin': 'Control Center',
  '/admin/monitoring': 'Exam Monitoring',
  '/admin/exam-pcs': 'Exam PCs',
  '/admin/monitor': 'Live Monitor',
  '/admin/scheduling': 'Interview Scheduler',
  '/admin/resources': 'Resources',
  '/admin/reports': 'Reports',
  '/admin/users': 'Users',
};

function LogoMark() {
  return (
    <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#101D29] via-[#1C3444] to-[#26BFD0] p-[1.5px] shrink-0 shadow-sm">
      <div className="w-full h-full bg-[#101D29] rounded-[10px] flex items-center justify-center">
        <span className="font-brand font-bold text-lg text-[#26BFD0]">C</span>
      </div>
    </div>
  );
}

export default function Layout() {
  const { user, logout } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();

  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  const role = user?.role ?? 'student';
  const items = NAV[role] ?? NAV.student;

  const title =
    TITLES[location.pathname] ??
    Object.entries(TITLES)
      .filter(([p]) => location.pathname.startsWith(p))
      .sort((a, b) => b[0].length - a[0].length)[0]?.[1] ??
    'CampusFlow';

  const onLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen flex bg-[var(--color-bg)] text-[var(--color-text-primary)] transition-colors duration-200">
      {/* Mobile Drawer Backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex flex-col bg-[#101D29] text-white border-r border-[#1C3444] transition-all duration-200 ease-in-out md:translate-x-0 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        } ${collapsed ? 'w-20' : 'w-64'}`}
      >
        {/* Brand header */}
        <div className="flex items-center justify-between px-5 h-20 border-b border-[#1C3444]">
          <div className="flex items-center gap-3 overflow-hidden">
            <LogoMark />
            {!collapsed && (
              <div className="min-w-0">
                <span className="font-brand font-bold text-lg tracking-tight text-white block truncate">
                  CampusFlow
                </span>
                <span className="text-[11px] text-[#26BFD0] font-mono block -mt-0.5">
                  OS v2.0
                </span>
              </div>
            )}
          </div>
          {/* Close for mobile */}
          <button
            onClick={() => setMobileOpen(false)}
            className="md:hidden text-slate-400 hover:text-white p-1"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 px-3 py-6 space-y-1.5 overflow-y-auto slim-scroll">
          {items.map((it) => {
            const Icon = it.icon;
            return (
              <NavLink
                key={it.to}
                to={it.to}
                end={it.end}
                onClick={() => setMobileOpen(false)}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 ${
                    it.highlight
                      ? 'bg-[#26BFD0] text-[#101D29] font-semibold hover:bg-[#20a8b7] shadow-sm'
                      : isActive
                      ? 'bg-[#1C3444] text-[#26BFD0] shadow-inner font-semibold border-l-2 border-[#26BFD0]'
                      : 'text-slate-300 hover:bg-[#1C3444]/60 hover:text-white'
                  } ${collapsed ? 'justify-center px-0' : ''}`
                }
                title={collapsed ? it.label : undefined}
              >
                {Icon && <Icon className={`w-5 h-5 shrink-0 ${it.highlight ? 'text-[#101D29]' : ''}`} />}
                {!collapsed && <span className="truncate">{it.label}</span>}
              </NavLink>
            );
          })}
        </nav>

        {/* Sidebar Footer */}
        <div className="p-4 border-t border-[#1C3444] flex items-center justify-between">
          {!collapsed ? (
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <span className="w-2 h-2 rounded-full bg-[#26BFD0] animate-pulse" />
              <span className="font-mono text-[11px]">System Online</span>
            </div>
          ) : (
            <div className="mx-auto">
              <span className="w-2.5 h-2.5 rounded-full bg-[#26BFD0] block" />
            </div>
          )}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="hidden md:flex items-center justify-center w-8 h-8 rounded-lg text-slate-400 hover:text-white hover:bg-[#1C3444] transition-colors"
            title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div
        className={`flex-1 flex flex-col min-h-screen transition-all duration-200 ${
          collapsed ? 'md:ml-20' : 'md:ml-64'
        }`}
      >
        {/* Top Navbar */}
        <header className="sticky top-0 z-30 bg-[var(--color-surface)]/95 backdrop-blur-md border-b border-[var(--color-border)] px-4 md:px-8 py-3.5 transition-colors duration-200">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setMobileOpen(true)}
                className="md:hidden p-2 rounded-xl border border-[var(--color-border)] text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]"
                aria-label="Open navigation"
              >
                <Menu className="w-5 h-5" />
              </button>
              <h1 className="text-xl font-brand font-bold text-[var(--color-text-primary)] tracking-tight">
                {title}
              </h1>
            </div>

            {/* Topbar Actions */}
            <div className="flex items-center gap-2.5 md:gap-3">
              {/* Theme Toggle Button */}
              <button
                onClick={toggleTheme}
                className="w-10 h-10 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] flex items-center justify-center text-[var(--color-text-muted)] hover:text-[#26BFD0] hover:border-[#26BFD0]/40 transition-colors"
                title={`Switch to ${isDark ? 'light' : 'dark'} mode`}
                aria-label="Toggle theme"
              >
                {isDark ? <Sun className="w-4 h-4 text-[#26BFD0]" /> : <Moon className="w-4 h-4 text-slate-700" />}
              </button>

              {/* Notifications */}
              <NotificationsBell />

              {/* Role Badge */}
              <div className="hidden sm:block">
                <Badge variant={role === 'admin' ? 'danger' : role === 'recruiter' ? 'cyan' : 'success'}>
                  {role.toUpperCase()}
                </Badge>
              </div>

              {/* Profile Dropdown */}
              <div className="relative">
                <button
                  onClick={() => setProfileOpen(!profileOpen)}
                  className="flex items-center gap-2 p-1.5 rounded-xl border border-[var(--color-border)] hover:bg-[var(--color-bg)] transition-colors"
                >
                  <div className="w-7 h-7 rounded-lg bg-[#26BFD0]/10 text-[#26BFD0] flex items-center justify-center font-bold text-xs">
                    {user?.name ? user.name.charAt(0).toUpperCase() : <UserIcon className="w-4 h-4" />}
                  </div>
                  <span className="hidden lg:block text-sm font-medium text-[var(--color-text-primary)] pr-1">
                    {user?.name ?? 'User'}
                  </span>
                </button>

                {profileOpen && (
                  <div
                    className="absolute right-0 mt-2 w-48 bg-[var(--color-surface)] rounded-2xl border border-[var(--color-border)] shadow-xl py-1.5 z-50 cf-rise"
                    onMouseLeave={() => setProfileOpen(false)}
                  >
                    <div className="px-4 py-2 border-b border-[var(--color-border)]">
                      <p className="text-xs font-semibold text-[var(--color-text-primary)] truncate">
                        {user?.name}
                      </p>
                      <p className="text-[11px] text-[var(--color-text-muted)] truncate">
                        {user?.email}
                      </p>
                    </div>
                    <button
                      onClick={onLogout}
                      className="w-full flex items-center gap-2 px-4 py-2 text-sm text-rose-500 hover:bg-rose-500/10 transition-colors text-left font-medium"
                    >
                      <LogOut className="w-4 h-4" />
                      Log out
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </header>

        {/* Main Content Body */}
        <main className="flex-1 px-4 md:px-8 py-6 max-w-7xl w-full mx-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
