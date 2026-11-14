import React from 'react';

const PALETTE = [
  'bg-[#26BFD0]', 'bg-emerald-500', 'bg-amber-500', 'bg-rose-500',
  'bg-sky-500', 'bg-cyan-600', 'bg-indigo-500', 'bg-teal-500',
];

export default function GanttChart({ gantt = [] }) {
  if (!gantt.length) return null;
  const total = Math.max(...gantt.map((g) => g.end), 1);
  const colorFor = (i, id) => PALETTE[(id ?? i) % PALETTE.length];

  return (
    <div>
      <div className="relative h-14 bg-[var(--color-bg)] rounded-xl border border-[var(--color-border)] overflow-hidden">
        {gantt.map((g, i) => {
          const left = (g.start / total) * 100;
          const width = Math.max(((g.end - g.start) / total) * 100, 0.5);
          return (
            <div
              key={`${g.id}-${i}`}
              title={`${g.label}: ${g.start} → ${g.end}`}
              className={`absolute top-2 bottom-2 rounded-lg flex items-center justify-center text-xs font-semibold text-white shadow-sm transition-all ${colorFor(i, g.id)}`}
              style={{ left: `${left}%`, width: `calc(${width}% - 2px)` }}
            >
              <span className="truncate px-1.5 font-mono">{g.label}</span>
            </div>
          );
        })}
      </div>
      <div className="relative h-5 mt-1.5 text-[11px] text-[var(--color-text-muted)] font-mono">
        <span className="absolute left-0">0</span>
        <span className="absolute left-1/2 -translate-x-1/2">{Math.round(total / 2)}</span>
        <span className="absolute right-0">{total} units</span>
      </div>
    </div>
  );
}
