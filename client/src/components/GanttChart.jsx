import React from 'react';

// Restrained palette suited for scheduling segments
const PALETTE = [
  'bg-[#0F7B5F]', 'bg-[#1C5346]', 'bg-[#2D6A5D]', 'bg-[#8C6B1F]',
  'bg-[#3D5A52]', 'bg-[#0A5C47]', 'bg-[#557B72]', 'bg-[#40685E]',
];

export default function GanttChart({ gantt = [] }) {
  if (!gantt.length) return null;
  const total = Math.max(...gantt.map((g) => g.end), 1);
  const colorFor = (i, id) => PALETTE[(id ?? i) % PALETTE.length];

  return (
    <div>
      <div className="relative h-12 bg-[var(--bg-subtle)] rounded-[6px] border border-[var(--border-color)] overflow-hidden">
        {gantt.map((g, i) => {
          const left = (g.start / total) * 100;
          const width = Math.max(((g.end - g.start) / total) * 100, 0.5);
          return (
            <div
              key={`${g.id}-${i}`}
              title={`${g.label}: ${g.start} → ${g.end}`}
              className={`absolute top-1.5 bottom-1.5 rounded-[4px] flex items-center justify-center text-xs font-medium text-[#F7F3EA] border border-black/10 transition-all ${colorFor(i, g.id)}`}
              style={{ left: `${left}%`, width: `calc(${width}% - 2px)` }}
            >
              <span className="truncate px-1.5 font-mono text-[11px]">{g.label}</span>
            </div>
          );
        })}
      </div>
      <div className="relative h-5 mt-1.5 text-[11px] text-[var(--text-muted)] font-mono tabular-nums">
        <span className="absolute left-0">0</span>
        <span className="absolute left-1/2 -translate-x-1/2">{Math.round(total / 2)}</span>
        <span className="absolute right-0">{total} units</span>
      </div>
    </div>
  );
}
