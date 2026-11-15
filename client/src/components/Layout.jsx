import React, { useState, useEffect } from 'react';
import { NavLink, Outlet, useLocation, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../auth.jsx';
import { useTheme } from '../context/ThemeContext.jsx';
import Badge from './Badge.jsx';
import NotificationsBell from './NotificationsBell.jsx';
import CommandPalette from './CommandPalette.jsx';
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
  MonitorCheck,
  Server,
  Activity,
  Boxes,
  FileBarChart,
  Users as UsersIcon,
  Command,
} from 'lucide-react';

const NAV_GROUPS = {
  student: [
    {
      group: 'Overview',
      items: [{ to: '/student', label: 'Dashboard', end: true, icon: LayoutDashboard }],
    },
    {
      group: 'Placement',
      items: [
        { to: '/student/drives', label: 'Find Drives', icon: Search },
        { to: '/student/bookings', label: 'My Schedule', icon: Calendar },
      ],
    },
  ],
  recruiter: [
    {
      group: 'Overview',
      items: [{ to: '/recruiter', label: 'Dashboard', end: true, icon: LayoutDashboard }],
    },
    {
      group: 'Recruitment Drives',
      items: [
        { to: '/recruiter/drives', label: 'My Drives', icon: Briefcase },
        { to: '/recruiter/drives/new', label: 'Add Drive', highlight: true, icon: PlusCircle },
      ],
    },
  ],
  admin: [
    {
      group: 'Control',
      items: [
        { to: '/admin', label: 'Control Center', end: true, icon: LayoutDashboard },
        { to: '/admin/monitoring', label: 'Exam Monitoring', icon: MonitorCheck },
        { to: '/admin/exam-pcs', label: 'Exam PCs', icon: Server },
      ],
    },
    {
      group: 'Operations',
      items: [
        { to: '/admin/monitor', label: 'Live Monitor', icon: Activity },
        { to: '/admin/scheduling', label: 'Interview Scheduler', icon: Calendar },
        { to: '/admin/resources', label: 'Resources', icon: Boxes },
      ],
    },
    {
      group: 'Analytics & Management',
      items: [
        { to: '/admin/reports', label: 'Reports', icon: FileBarChart },
        { to: '/admin/users', label: 'Users', icon: UsersIcon },
      ],
    },
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

export default function Layout() {
  const { user, logout } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();

  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);

  const role = user?.role ?? 'student';
  const groups = NAV_GROUPS[role] ?? NAV_GROUPS.student;

  const currentTitle =
    TITLES[location.pathname] ??
    Object.entries(TITLES)
      .filter(([p]) => location.pathname.startsWith(p))
      .sort((a, b) => b[0].length - a[0].length)[0]?.[1] ??
    'CampusFlow';

  // Keyboard shortcut listener for Ctrl+K or Cmd+K
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setPaletteOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const onLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen flex bg-[var(--bg-app)] text-[var(--text-primary)] transition-colors duration-200">
      {/* Mobile Drawer Backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-[#0B1F1A]/70 backdrop-blur-sm md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar: Deep Midnight background with hairline borders */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex flex-col bg-[#0B1F1A] text-[#F7F3EA] border-r border-[#1C3A32] transition-all duration-200 ease-in-out md:translate-x-0 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        } ${collapsed ? 'w-20' : 'w-64'}`}
      >
        {/* Brand Header */}
        <div className="flex items-center justify-between px-5 h-20 border-b border-[#1C3A32]">
          <Link to="/" className="flex items-center gap-3 overflow-hidden group">
            <div className="w-9 h-9 rounded-[6px] border border-[#D9B36C]/40 bg-[#112923] flex items-center justify-center shrink-0">
              <span className="font-serif font-bold text-lg text-[#D9B36C]">C</span>
            </div>
            {!collapsed && (
              <div className="min-w-0">
                <span className="font-serif font-bold text-lg tracking-tight text-[#F7F3EA] block truncate">
                  CampusFlow
                </span>
                <span className="text-[10px] text-[#B9C7C1] font-mono tracking-widest uppercase block -mt-0.5">
                  Placement OS
                </span>
              </div>
            )}
          </Link>
          <button
            onClick={() => setMobileOpen(false)}
            className="md:hidden text-[#B9C7C1] hover:text-[#F7F3EA] p-1"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Groups */}
        <nav className="flex-1 px-3 py-5 space-y-6 overflow-y-auto slim-scroll">
          {groups.map((grp, gIdx) => (
            <div key={gIdx} className="space-y-1">
              {!collapsed && (
                <div className="px-3 pb-1.5 text-[10px] font-mono uppercase tracking-widest text-[#7E968F]">
                  {grp.group}
                </div>
              )}
              {grp.items.map((it) => {
                const Icon = it.icon;
                return (
                  <NavLink
                    key={it.to}
                    to={it.to}
                    end={it.end}
                    onClick={() => setMobileOpen(false)}
                    className={({ isActive }) =>
                      `relative flex items-center gap-3 px-3 py-2.5 rounded-[6px] text-sm font-medium transition-colors ${
                        it.highlight
                          ? 'bg-[#D9B36C] text-[#0B1F1A] font-semibold hover:bg-[#E6C98A]'
                          : isActive
                          ? 'bg-[#112923] text-[#F7F3EA] font-semibold'
                          : 'text-[#B9C7C1] hover:bg-[#112923]/60 hover:text-[#F7F3EA]'
                      } ${collapsed ? 'justify-center px-0' : ''}`
                    }
                    title={collapsed ? it.label : undefined}
                  >
                    {({ isActive }) => (
                      <>
                        {/* Signature gold left-edge indicator on active nav item */}
                        {isActive && !it.highlight && (
                          <span className="absolute left-0 top-1.5 bottom-1.5 w-1 bg-[#D9B36C] rounded-r" />
                        )}
                        <Icon className={`w-4 h-4 shrink-0 ${it.highlight ? 'text-[#0B1F1A]' : isActive ? 'text-[#D9B36C]' : ''}`} />
                        {!collapsed && <span className="truncate">{it.label}</span>}
                      </>
                    )}
                  </NavLink>
                );
              })}
            </div>
          ))}
        </nav>

        {/* Sidebar Footer with Collapse Toggle */}
        <div className="p-3.5 border-t border-[#1C3A32] flex items-center justify-between">
          {!collapsed ? (
            <button
              onClick={() => setPaletteOpen(true)}
              className="flex items-center gap-2 text-xs text-[#B9C7C1] hover:text-[#F7F3EA] bg-[#112923] border border-[#1C3A32] px-2.5 py-1.5 rounded-[6px] transition-colors w-full justify-between"
            >
              <div className="flex items-center gap-1.5">
                <Command className="w-3.5 h-3.5 text-[#D9B36C]" />
                <span>Command menu</span>
              </div>
              <kbd className="text-[10px] font-mono opacity-60">⌘K</kbd>
            </button>
          ) : (
            <button
              onClick={() => setPaletteOpen(true)}
              className="mx-auto text-[#B9C7C1] hover:text-[#F7F3EA] p-1.5 rounded-[6px] hover:bg-[#112923]"
              title="Command Menu (Ctrl+K)"
            >
              <Command className="w-4 h-4 text-[#D9B36C]" />
            </button>
          )}

          <button
            onClick={() => setCollapsed(!collapsed)}
            className="hidden md:flex items-center justify-center w-7 h-7 rounded-[6px] text-[#B9C7C1] hover:text-[#F7F3EA] hover:bg-[#112923] ml-2 shrink-0 transition-colors"
            title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>
      </aside>

      {/* Main Content Viewport */}
      <div
        className={`flex-1 flex flex-col min-h-screen transition-all duration-200 ${
          collapsed ? 'md:ml-20' : 'md:ml-64'
        }`}
      >
        {/* Top Bar */}
        <header className="sticky top-0 z-30 bg-[var(--bg-surface)]/95 backdrop-blur-md border-b border-[var(--border-color)] px-4 md:px-8 py-3.5 transition-colors duration-200">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setMobileOpen(true)}
                className="md:hidden p-2 rounded-[6px] border border-[var(--border-color)] text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                aria-label="Open navigation"
              >
                <Menu className="w-5 h-5" />
              </button>
              <div>
                <div className="flex items-center gap-2 text-xs text-[var(--text-muted)] font-mono">
                  <span>Portal</span>
                  <span>/</span>
                  <span className="capitalize">{role}</span>
                </div>
                <h1 className="text-xl font-serif font-bold text-[var(--text-primary)] tracking-tight">
                  {currentTitle}
                </h1>
              </div>
            </div>

            {/* Quick Actions & Profile */}
            <div className="flex items-center gap-2.5 md:gap-3">
              {/* Command Palette Trigger */}
              <button
                onClick={() => setPaletteOpen(true)}
                className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-[6px] border border-[var(--border-color)] bg-[var(--bg-surface)] text-xs text-[var(--text-muted)] hover:border-[var(--brand-accent)] hover:text-[var(--text-primary)] transition-colors"
                title="Search commands (Ctrl+K)"
              >
                <Search className="w-3.5 h-3.5" />
                <span>Search...</span>
                <kbd className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[var(--bg-subtle)] border border-[var(--border-color)]">
                  ⌘K
                </kbd>
              </button>

              {/* Theme Toggle */}
              <button
                onClick={toggleTheme}
                className="w-9 h-9 rounded-[6px] border border-[var(--border-color)] bg-[var(--bg-surface)] flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--brand-accent)] hover:border-[var(--brand-accent)] transition-colors"
                title={`Switch to ${isDark ? 'light' : 'dark'} mode`}
                aria-label="Toggle theme"
              >
                {isDark ? <Sun className="w-4 h-4 text-[#D9B36C]" /> : <Moon className="w-4 h-4 text-[#0B1F1A]" />}
              </button>

              {/* Notifications Bell */}
              <NotificationsBell />

              {/* Role Badge */}
              <div className="hidden sm:block">
                <Badge variant={role === 'admin' ? 'danger' : role === 'recruiter' ? 'gold' : 'success'}>
                  {role.toUpperCase()}
                </Badge>
              </div>

              {/* Profile Menu */}
              <div className="relative">
                <button
                  onClick={() => setProfileOpen(!profileOpen)}
                  className="flex items-center gap-2 p-1.5 rounded-[6px] border border-[var(--border-color)] hover:bg-[var(--bg-subtle)] transition-colors"
                >
                  <div className="w-7 h-7 rounded-[4px] bg-[#0F7B5F] text-[#F7F3EA] flex items-center justify-center font-bold text-xs">
                    {user?.name ? user.name.charAt(0).toUpperCase() : <UserIcon className="w-4 h-4" />}
                  </div>
                  <span className="hidden lg:block text-xs font-semibold text-[var(--text-primary)] pr-1">
                    {user?.name ?? 'User'}
                  </span>
                </button>

                {profileOpen && (
                  <div
                    className="absolute right-0 mt-2 w-52 bg-[var(--bg-surface)] rounded-[8px] border border-[var(--border-color)] shadow-xl py-1.5 z-50 cf-transition"
                    onMouseLeave={() => setProfileOpen(false)}
                  >
                    <div className="px-4 py-2.5 border-b border-[var(--border-color)]">
                      <p className="text-xs font-serif font-bold text-[var(--text-primary)] truncate">
                        {user?.name}
                      </p>
                      <p className="text-[11px] text-[var(--text-muted)] font-mono truncate">
                        {user?.email}
                      </p>
                    </div>
                    <button
                      onClick={onLogout}
                      className="w-full flex items-center gap-2 px-4 py-2 text-xs text-[#9E3524] hover:bg-[#9E3524]/10 transition-colors text-left font-semibold"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      Log out
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </header>

        {/* Page Content Container with subtle Editorial layout */}
        <main className="flex-1 px-4 md:px-8 py-6 max-w-7xl w-full mx-auto">
          <Outlet />
        </main>
      </div>

      {/* Command Palette Modal */}
      <CommandPalette isOpen={paletteOpen} onClose={() => setPaletteOpen(false)} />
    </div>
  );
}
