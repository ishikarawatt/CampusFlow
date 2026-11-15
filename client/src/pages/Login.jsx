// Login: Split layout.
// Left = Deep Midnight brand panel (Playfair Display brand, line-art SVG, value propositions).
// Right = Ivory/Surface form panel with real validation, demo buttons, and loading states.

import React, { useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { useAuth } from '../auth.jsx';
import { useToast } from '../components/Toast.jsx';
import { errMsg } from '../api.js';
import Button from '../components/Button.jsx';
import { Input } from '../components/FormControls.jsx';
import { Check, ShieldCheck, Cpu, ArrowRight } from 'lucide-react';

const DEMOS = [
  { role: 'Admin', email: 'admin@campusflow.local', label: 'Placement Officer' },
  { role: 'Recruiter', email: 'priya@techcorp.com', label: 'TechCorp Recruiter' },
  { role: 'Student', email: 'aarav@student.local', label: 'Student Candidate' },
];
const DEMO_PASSWORD = 'password123';

const HOME = { admin: '/admin', recruiter: '/recruiter', student: '/student' };

export default function Login() {
  const { user, login, ready } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [errors, setErrors] = useState({});

  if (ready && user) return <Navigate to={HOME[user.role] ?? '/student'} replace />;

  const validate = () => {
    const errs = {};
    if (!email.trim()) errs.email = 'Email address is required.';
    else if (!/\S+@\S+\.\S+/.test(email)) errs.email = 'Please enter a valid email.';
    if (!password) errs.password = 'Password is required.';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const submit = async (e, prefill) => {
    e?.preventDefault();
    const em = prefill?.email ?? email;
    const pw = prefill ? DEMO_PASSWORD : password;

    if (!prefill && !validate()) {
      return;
    }

    setBusy(true);
    try {
      const u = await login(em, pw);
      toast(`Signed in as ${u.name}`, 'success');
      navigate(HOME[u.role] ?? '/student', { replace: true });
    } catch (err) {
      toast(errMsg(err, 'Login failed. Check your email and password.'), 'error');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-[var(--bg-app)] text-[var(--text-primary)]">
      {/* Left Midnight Editorial Brand Panel */}
      <div className="hidden lg:flex w-[48%] bg-[#0B1F1A] text-[#F7F3EA] flex-col justify-between p-12 border-r border-[#1C3A32] relative overflow-hidden">
        {/* Subtle decorative hairline grid */}
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'radial-gradient(#D9B36C 1px, transparent 1px)', backgroundSize: '24px 24px' }} />

        {/* Brand header */}
        <div className="flex items-center gap-3 relative z-10">
          <div className="w-10 h-10 rounded-[6px] border border-[#D9B36C]/40 bg-[#112923] flex items-center justify-center shrink-0">
            <span className="font-serif font-bold text-xl text-[#D9B36C]">C</span>
          </div>
          <div>
            <div className="font-serif font-bold text-xl tracking-tight text-[#F7F3EA]">
              CampusFlow
            </div>
            <div className="text-[10px] text-[#B9C7C1] font-mono tracking-widest uppercase">
              Placement Operating System
            </div>
          </div>
        </div>

        {/* Value proposition & Line-art illustration */}
        <div className="relative z-10 max-w-lg my-auto py-10">
          <div className="w-12 h-[2px] bg-[#D9B36C] mb-6" />
          <h2 className="font-serif text-3xl sm:text-4xl font-bold leading-tight mb-4 text-[#F7F3EA]">
            The architecture of campus placement, orchestrated.
          </h2>
          <p className="text-sm text-[#B9C7C1] leading-relaxed mb-8 font-sans">
            A high-concurrency placement engine pairing strict database isolation with real-time exam-PC supervision and algorithmic interview scheduling.
          </p>

          <div className="space-y-4">
            {[
              {
                title: 'Strict Concurrency Control',
                desc: 'Row-level locking and ACID guarantees prevent slot and seat double-booking under load.',
                icon: ShieldCheck,
              },
              {
                title: 'Real-time PC Supervision',
                desc: 'Native telemetry daemon monitoring process states, window events, and lab seating.',
                icon: Cpu,
              },
            ].map((item, idx) => {
              const Icon = item.icon;
              return (
                <div key={idx} className="flex items-start gap-3.5 p-3.5 rounded-[8px] bg-[#112923]/60 border border-[#1C3A32]">
                  <div className="w-8 h-8 rounded-[4px] bg-[#0F7B5F]/20 text-[#D9B36C] border border-[#D9B36C]/30 flex items-center justify-center shrink-0 mt-0.5">
                    <Icon className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-xs font-serif font-bold text-[#F7F3EA]">{item.title}</h3>
                    <p className="text-xs text-[#B9C7C1] mt-0.5 leading-snug">{item.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer info */}
        <div className="relative z-10 flex items-center justify-between text-[11px] font-mono text-[#7E968F] pt-6 border-t border-[#1C3A32]">
          <span>CampusFlow Architecture</span>
          <span>Kernel v2.4</span>
        </div>
      </div>

      {/* Right Form Panel */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-12">
        <div className="w-full max-w-md">
          <div className="mb-8">
            <h1 className="font-serif text-2xl sm:text-3xl font-bold text-[var(--text-primary)]">
              Portal Sign In
            </h1>
            <div className="w-8 h-[2px] bg-[#D9B36C] mt-2 mb-2" />
            <p className="text-xs text-[var(--text-muted)] font-sans">
              Enter your credentials to access your placement dashboard.
            </p>
          </div>

          <form onSubmit={submit} className="space-y-4">
            <Input
              label="Email Address"
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (errors.email) setErrors((prev) => ({ ...prev, email: null }));
              }}
              placeholder="user@campusflow.local"
              error={errors.email}
              autoComplete="email"
            />

            <Input
              label="Password"
              type="password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                if (errors.password) setErrors((prev) => ({ ...prev, password: null }));
              }}
              placeholder="••••••••••••"
              error={errors.password}
              autoComplete="current-password"
            />

            <div className="pt-2">
              <Button
                type="submit"
                variant="primary"
                loading={busy}
                className="w-full py-2.5"
                icon={<ArrowRight className="w-4 h-4" />}
              >
                Sign In to Account
              </Button>
            </div>
          </form>

          {/* Seed demo quick-fill buttons */}
          <div className="mt-8 pt-6 border-t border-[var(--border-color)]">
            <div className="text-[11px] font-mono text-[var(--text-muted)] uppercase tracking-wider mb-3">
              One-Click Demo Access
            </div>
            <div className="grid grid-cols-1 gap-2">
              {DEMOS.map((d) => (
                <button
                  key={d.role}
                  type="button"
                  onClick={(e) => submit(e, d)}
                  disabled={busy}
                  className="flex items-center justify-between px-3 py-2 rounded-[6px] border border-[var(--border-color)] bg-[var(--bg-surface)] hover:bg-[var(--bg-subtle)] hover:border-[var(--brand-accent)] text-left text-xs transition-colors"
                >
                  <div>
                    <span className="font-semibold text-[var(--text-primary)] font-sans mr-2">
                      {d.role}
                    </span>
                    <span className="text-[var(--text-muted)] text-[11px]">({d.label})</span>
                  </div>
                  <span className="text-[10px] font-mono text-[var(--brand-primary)] dark:text-[var(--brand-accent)]">
                    {d.email}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
