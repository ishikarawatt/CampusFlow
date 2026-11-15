import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../auth.jsx';
import { useTheme } from '../context/ThemeContext.jsx';
import {
  Search,
  LayoutDashboard,
  Calendar,
  Briefcase,
  PlusCircle,
  MonitorCheck,
  Server,
  Activity,
  Boxes,
  FileBarChart,
  Users as UsersIcon,
  Sun,
  Moon,
  LogOut,
  ArrowRight,
} from 'lucide-react';

const NAV_BY_ROLE = {
  student: [
    { to: '/student', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/student/drives', label: 'Find Drives', icon: Search },
    { to: '/student/bookings', label: 'My Schedule', icon: Calendar },
  ],
  recruiter: [
    { to: '/recruiter', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/recruiter/drives', label: 'My Drives', icon: Briefcase },
    { to: '/recruiter/drives/new', label: 'Add Drive', icon: PlusCircle },
  ],
  admin: [
    { to: '/admin', label: 'Control Center', icon: LayoutDashboard },
    { to: '/admin/monitoring', label: 'Exam Monitoring', icon: MonitorCheck },
    { to: '/admin/exam-pcs', label: 'Exam PCs', icon: Server },
    { to: '/admin/monitor', label: 'Live Monitor', icon: Activity },
    { to: '/admin/scheduling', label: 'Interview Scheduler', icon: Calendar },
    { to: '/admin/resources', label: 'Resources', icon: Boxes },
    { to: '/admin/reports', label: 'Reports', icon: FileBarChart },
    { to: '/admin/users', label: 'Users', icon: UsersIcon },
  ],
};

export default function CommandPalette({ isOpen, onClose }) {
  const { user, logout } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);

  const role = user?.role ?? 'student';
  const roleNav = NAV_BY_ROLE[role] ?? NAV_BY_ROLE.student;

  const items = useMemo(() => {
    const navItems = roleNav.map((it) => ({
      id: `nav-${it.to}`,
      label: it.label,
      category: 'Navigation',
      icon: it.icon,
      action: () => {
        navigate(it.to);
        onClose();
      },
    }));

    const actions = [
      {
        id: 'action-theme',
        label: isDark ? 'Switch to Light Theme' : 'Switch to Dark Theme',
        category: 'Preferences',
        icon: isDark ? Sun : Moon,
        action: () => {
          toggleTheme();
          onClose();
        },
      },
      {
        id: 'action-logout',
        label: 'Log Out of Account',
        category: 'Account',
        icon: LogOut,
        action: () => {
          logout();
          navigate('/login');
          onClose();
        },
      },
    ];

    const all = [...navItems, ...actions];
    if (!query.trim()) return all;

    const q = query.toLowerCase();
    return all.filter((it) => it.label.toLowerCase().includes(q) || it.category.toLowerCase().includes(q));
  }, [roleNav, isDark, toggleTheme, logout, navigate, onClose, query]);

  // Reset index when search changes
  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  // Keyboard navigation & Shortcuts
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev + 1) % Math.max(1, items.length));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev - 1 + items.length) % Math.max(1, items.length));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (items[selectedIndex]) {
          items[selectedIndex].action();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, items, selectedIndex, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-[#0B1F1A]/75 backdrop-blur-sm transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Palette Container */}
      <div className="relative w-full max-w-xl bg-[var(--bg-surface)] border border-[var(--border-color)] rounded-[10px] shadow-2xl overflow-hidden z-10 cf-transition">
        {/* Input Bar */}
        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-[var(--border-color)]">
          <Search className="w-5 h-5 text-[var(--brand-accent)] shrink-0" />
          <input
            type="text"
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Type a page name or command..."
            className="w-full bg-transparent text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none"
          />
          <kbd className="hidden sm:inline-block px-2 py-0.5 text-[10px] font-mono rounded bg-[var(--bg-subtle)] text-[var(--text-muted)] border border-[var(--border-color)]">
            ESC
          </kbd>
        </div>

        {/* Results List */}
        <div className="max-h-80 overflow-y-auto slim-scroll p-2">
          {items.length === 0 ? (
            <div className="py-8 text-center text-sm text-[var(--text-muted)]">
              No matching commands found.
            </div>
          ) : (
            items.map((item, index) => {
              const Icon = item.icon;
              const isSelected = index === selectedIndex;
              return (
                <button
                  key={item.id}
                  onClick={item.action}
                  onMouseEnter={() => setSelectedIndex(index)}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-[6px] text-sm text-left transition-colors ${
                    isSelected
                      ? 'bg-[var(--brand-primary)]/15 text-[var(--text-primary)] font-medium'
                      : 'text-[var(--text-secondary)] hover:bg-[var(--bg-subtle)]'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className={`w-4 h-4 ${isSelected ? 'text-[var(--brand-accent)]' : 'text-[var(--text-muted)]'}`} />
                    <span>{item.label}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-mono text-[var(--text-muted)]">{item.category}</span>
                    {isSelected && <ArrowRight className="w-3.5 h-3.5 text-[var(--brand-accent)]" />}
                  </div>
                </button>
              );
            })
          )}
        </div>

        {/* Footer info */}
        <div className="px-4 py-2 border-t border-[var(--border-color)] bg-[var(--bg-subtle)]/50 flex items-center justify-between text-[11px] font-mono text-[var(--text-muted)]">
          <span>Navigate with ↑ / ↓</span>
          <span>Select with ↵</span>
        </div>
      </div>
    </div>
  );
}
