// Admin Users Directory — Privilege rings: admin > recruiter > student.
// Account creation and role management.

import React, { useEffect, useState } from 'react';
import { users as usersApi, errMsg } from '../../api.js';
import { useToast } from '../../components/Toast.jsx';
import PageHeader from '../../components/PageHeader.jsx';
import EmptyState from '../../components/EmptyState.jsx';
import Button from '../../components/Button.jsx';
import Skeleton from '../../components/Skeleton.jsx';
import { StampBadge, LedgerTable, MarginNote } from '../../components/signature';
import { Users as UsersIcon, UserPlus, Shield } from 'lucide-react';

const ROLE_PILL = { admin: 'danger', recruiter: 'gold', student: 'success' };

export default function Users() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState([]);
  const [unavailable, setUnavailable] = useState(false);

  // Form state for creating staff accounts
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('recruiter');
  const [creating, setCreating] = useState(false);
  const [showForm, setShowForm] = useState(false);

  const fetchUsers = async () => {
    try {
      const { data } = await usersApi.list();
      setRows(data ?? []);
    } catch (err) {
      if (err?.response?.status === 404) {
        setUnavailable(true);
      } else {
        toast(errMsg(err, 'Could not load users.'), 'error');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!name || !email || !password || !role) {
      toast('Please fill in all account fields.', 'error');
      return;
    }
    setCreating(true);
    try {
      await usersApi.create({ name, email, password, role });
      toast(`User ${name} created successfully.`, 'success');
      setName('');
      setEmail('');
      setPassword('');
      setRole('recruiter');
      setShowForm(false);
      fetchUsers();
    } catch (err) {
      toast(errMsg(err, 'Failed to create user account.'), 'error');
    } finally {
      setCreating(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-16 w-full rounded-[10px]" />
        <Skeleton className="h-64 w-full rounded-[10px]" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="User Administration"
        subtitle="Manage access control, staff credentials, and role privileges."
        breadcrumbs={[
          { label: 'Admin', to: '/admin' },
          { label: 'People' },
          { label: 'Users' },
        ]}
        actions={
          <Button
            variant="primary"
            size="sm"
            onClick={() => setShowForm((v) => !v)}
            icon={<UserPlus className="w-4 h-4" />}
          >
            Create Staff Account
          </Button>
        }
      />

      {showForm && (
        <form
          onSubmit={handleCreate}
          className="bg-[var(--bg-surface)] rounded-[10px] border border-[var(--border-gold)] p-6 shadow-subtle space-y-4"
        >
          <div className="flex items-center justify-between border-b border-[var(--border-color)] pb-3">
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-[#D9B36C]" />
              <h3 className="font-serif font-bold text-base text-[var(--text-primary)]">
                Provision New User Account
              </h3>
            </div>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="text-xs font-mono text-[var(--text-muted)] hover:text-[var(--text-primary)]"
            >
              Cancel
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-mono uppercase text-[var(--text-secondary)] mb-1">
                Full Name
              </label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Jane Doe"
                className="w-full bg-[var(--bg-surface)] border border-[var(--border-color)] rounded-[6px] px-3 py-2 text-xs text-[var(--text-primary)] font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-mono uppercase text-[var(--text-secondary)] mb-1">
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="jane@campusflow.local"
                className="w-full bg-[var(--bg-surface)] border border-[var(--border-color)] rounded-[6px] px-3 py-2 text-xs text-[var(--text-primary)] font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-mono uppercase text-[var(--text-secondary)] mb-1">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-[var(--bg-surface)] border border-[var(--border-color)] rounded-[6px] px-3 py-2 text-xs text-[var(--text-primary)] font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-mono uppercase text-[var(--text-secondary)] mb-1">
                Role Ring
              </label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="w-full bg-[var(--bg-surface)] border border-[var(--border-color)] rounded-[6px] px-3 py-2 text-xs text-[var(--text-primary)] font-mono"
              >
                <option value="recruiter">Recruiter (Hiring Manager)</option>
                <option value="admin">Administrator (Full Access)</option>
                <option value="student">Student (Candidate)</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <Button variant="primary" size="sm" type="submit" loading={creating}>
              Create Account
            </Button>
          </div>
        </form>
      )}

      <MarginNote title="REGISTRAR ACCESS CONTROL" variant="gold">
        User privilege rings are enforced strictly via JWT authentication and database foreign keys. Only System Operators (admin role) can create staff accounts and supervise examination kernels.
      </MarginNote>

      <div className="bg-white dark:bg-midnight-surface rounded-[6px] border border-[#D9CEBA] dark:border-midnight-border shadow-xs overflow-hidden">
        <div className="px-5 py-3.5 bg-[#FAF7F0] dark:bg-midnight-dark border-b border-[#E8E0D0] dark:border-midnight-border flex items-center justify-between">
          <h3 className="font-serif font-bold text-sm text-midnight dark:text-ivory">
            User Accounts Directory
          </h3>
          <span className="text-xs font-mono text-midnight/60 dark:text-brandMuted">
            {rows.length} Enrolled Users
          </span>
        </div>

        {unavailable ? (
          <EmptyState
            title="User management endpoint unavailable"
            message="Check that the database is connected and migrations are up to date."
          />
        ) : (
          <LedgerTable
            columns={[
              {
                header: 'FULL NAME',
                accessor: 'name',
                render: (u) => (
                  <span className="font-serif font-bold text-sm text-midnight dark:text-ivory">
                    {u.name}
                  </span>
                ),
              },
              {
                header: 'EMAIL ADDRESS',
                accessor: 'email',
                mono: true,
                render: (u) => (
                  <span className="text-xs text-midnight/80 dark:text-brandMuted">
                    {u.email}
                  </span>
                ),
              },
              {
                header: 'PRIVILEGE LEVEL',
                accessor: 'role',
                render: (u) => (
                  <StampBadge variant={ROLE_PILL[u.role] ?? 'neutral'} size="sm">
                    {u.role?.toUpperCase()}
                  </StampBadge>
                ),
              },
              {
                header: 'PROFILE METADATA',
                render: (u) => (
                  <span className="font-mono text-xs text-midnight/60 dark:text-brandMuted">
                    {u.role === 'student'
                      ? `${u.branch || 'CSE'} · CGPA ${u.cgpa || '8.0'}`
                      : u.role === 'recruiter'
                      ? 'Corporate Recruiter'
                      : 'System Operator'}
                  </span>
                ),
              },
            ]}
            data={rows}
            keyField="id"
          />
        )}
      </div>
    </div>
  );
}
