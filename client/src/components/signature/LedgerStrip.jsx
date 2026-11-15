import React from 'react';

/**
 * LedgerStrip - Tabular KPI Ledger Bar
 * Replaces generic icon-in-colored-square stat tiles with an authoritative,
 * hairline-ruled financial/academic ledger strip.
 */
export default function LedgerStrip({ items = [], className = '' }) {
  if (!items || items.length === 0) return null;

  return (
    <div
      className={`w-full bg-white dark:bg-midnight-surface border border-[#D9CEBA] dark:border-midnight-border rounded-[6px] shadow-sm divide-y sm:divide-y-0 sm:divide-x divide-[#E2D9C8] dark:divide-midnight-border grid grid-cols-2 sm:grid-cols-${Math.min(items.length, 6)} ${className}`}
    >
      {items.map((item, idx) => {
        return (
          <div key={idx} className="p-4 flex flex-col justify-between">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[11px] font-mono uppercase tracking-wider text-midnight/60 dark:text-brandMuted">
                {item.label}
              </span>
              {item.badge && (
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[#FAF7F0] dark:bg-midnight border border-[#E2D9C8] dark:border-midnight-border text-midnight/70 dark:text-brandMuted">
                  {item.badge}
                </span>
              )}
            </div>

            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl sm:text-3xl font-mono font-bold text-midnight dark:text-ivory tabular-nums">
                {item.value}
              </span>
              {item.unit && (
                <span className="text-xs font-mono text-midnight/60 dark:text-brandMuted">
                  {item.unit}
                </span>
              )}
            </div>

            {item.subtext && (
              <div className="mt-1.5 text-[11px] text-midnight/60 dark:text-brandMuted flex items-center gap-1.5">
                {item.trend === 'up' && (
                  <span className="text-emerald-700 dark:text-emerald-400 font-mono font-semibold">â†‘</span>
                )}
                {item.trend === 'down' && (
                  <span className="text-rose-700 dark:text-rose-400 font-mono font-semibold">â†“</span>
                )}
                <span>{item.subtext}</span>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

