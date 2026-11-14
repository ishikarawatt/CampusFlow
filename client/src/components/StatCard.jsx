import React from 'react';

export default function StatCard({ label, value, icon, accent = 'cyan' }) {
  const accents = {
    cyan: 'bg-[#26BFD0]/10 text-[#26BFD0] border border-[#26BFD0]/20',
    emerald: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/40',
    amber: 'bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400 border border-amber-200 dark:border-amber-800/40',
    rose: 'bg-rose-50 text-rose-600 dark:bg-rose-950/40 dark:text-rose-400 border border-rose-200 dark:border-rose-800/40',
    slate: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border border-slate-200 dark:border-slate-700',
    indigo: 'bg-[#26BFD0]/10 text-[#26BFD0] border border-[#26BFD0]/20',
  };

  return (
    <div className="bg-[var(--color-surface)] rounded-2xl border border-[var(--color-border)] p-5 flex items-center gap-4 transition-all duration-200 hover:-translate-y-0.5 shadow-sm">
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${accents[accent] ?? accents.cyan}`}>
        {icon}
      </div>
      <div className="min-w-0">
        <div className="text-2xl font-heading text-[var(--color-text-primary)] leading-tight tracking-tight">
          {value ?? '—'}
        </div>
        <div className="text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wider mt-0.5">
          {label}
        </div>
      </div>
    </div>
  );
}
