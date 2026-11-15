import React from 'react';

/**
 * TimelineRule - Ruled Architectural Gantt Timeline
 * Hairline ticks, monospaced time markers, and clear solid event blocks.
 * Backward-compatible drop-in for GanttChart.
 */
export default function TimelineRule({
  gantt = [],
  ticks = 5,
  unitLabel = 'units',
  className = '',
}) {
  if (!gantt || gantt.length === 0) {
    return (
      <div className={`p-4 text-center text-xs font-mono text-midnight/40 dark:text-brandMuted border border-dashed border-[#D9CEBA] dark:border-midnight-border rounded-[4px] ${className}`}>
        No schedule timeline available.
      </div>
    );
  }

  const total = Math.max(...gantt.map((g) => g.end || 0), 1);

  // Distinct registrar color bands
  const PALETTE = [
    'bg-emerald-800 text-ivory border-emerald-950',
    'bg-[#1C5346] text-ivory border-[#0E2E26]',
    'bg-amber-800 text-ivory border-amber-950',
    'bg-[#2D6A5D] text-ivory border-[#1B4038]',
    'bg-[#3D5A52] text-ivory border-[#253833]',
    'bg-[#0A5C47] text-ivory border-[#053025]',
  ];

  // Generate tick markers
  const tickList = [];
  for (let i = 0; i <= ticks; i++) {
    const val = Math.round((total / ticks) * i);
    const pct = (i / ticks) * 100;
    tickList.push({ val, pct });
  }

  return (
    <div className={`w-full ${className}`}>
      {/* Ruler Spine & Blocks */}
      <div className="relative h-14 bg-[#FAF7F0] dark:bg-midnight rounded-[4px] border border-[#D9CEBA] dark:border-midnight-border overflow-hidden">
        {/* Hairline Grid Ticks */}
        {tickList.map((t, idx) => (
          <div
            key={idx}
            className="absolute top-0 bottom-0 w-[1px] bg-[#E2D9C8] dark:bg-midnight-border/60 pointer-events-none"
            style={{ left: `${t.pct}%` }}
          />
        ))}

        {/* Schedule Blocks */}
        {gantt.map((g, idx) => {
          const left = (g.start / total) * 100;
          const width = Math.max(((g.end - g.start) / total) * 100, 1);
          const colorClass = PALETTE[(g.id ?? idx) % PALETTE.length];

          return (
            <div
              key={`${g.id || idx}-${idx}`}
              title={`${g.label}: ${g.start} â†’ ${g.end} ${unitLabel}`}
              className={`absolute top-2 bottom-2 rounded-[3px] border shadow-xs flex items-center justify-center px-1.5 transition-transform hover:scale-[1.01] ${colorClass}`}
              style={{ left: `${left}%`, width: `calc(${width}% - 2px)` }}
            >
              <span className="truncate font-mono text-[11px] font-semibold">
                {g.label}
              </span>
            </div>
          );
        })}
      </div>

      {/* Axis Marker Row */}
      <div className="relative h-6 mt-1 text-[10px] font-mono text-midnight/60 dark:text-brandMuted">
        {tickList.map((t, idx) => (
          <span
            key={idx}
            className="absolute -translate-x-1/2"
            style={{ left: `${t.pct}%` }}
          >
            {t.val} {idx === tickList.length - 1 ? unitLabel : ''}
          </span>
        ))}
      </div>
    </div>
  );
}

