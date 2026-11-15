import React from 'react';
import StampBadge from './StampBadge';

/**
 * QueueLanes - Horizontal Resource & Lock Tracks
 * Replaces generic lock indicators with parallel architectural tracks showing
 * active lock holders as filled tokens and queued contenders as hollow tokens.
 */
export default function QueueLanes({
  resources = [],
  className = '',
}) {
  return (
    <div className={`bg-white dark:bg-midnight-surface border border-[#D9CEBA] dark:border-midnight-border rounded-[6px] p-5 ${className}`}>
      <div className="flex items-center justify-between pb-3 mb-4 border-b border-[#E8E0D0] dark:border-midnight-border">
        <div>
          <span className="text-[10px] font-mono tracking-wider uppercase text-midnight/50 dark:text-brandMuted">
            CONCURRENCY & RESOURCE ARBITRATION
          </span>
          <h3 className="text-sm font-serif font-bold text-midnight dark:text-ivory">
            Lock Queue Tracks
          </h3>
        </div>
        <div className="flex items-center gap-3 text-[10px] font-mono">
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-600"></span> ACTIVE HOLDER
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full border-2 border-amber-500 bg-transparent"></span> WAITING IN QUEUE
          </span>
        </div>
      </div>

      <div className="space-y-4">
        {resources.length === 0 ? (
          <div className="p-6 text-center text-xs font-mono text-midnight/50 dark:text-brandMuted">
            No active resource locks registered. System arbitration idle.
          </div>
        ) : (
          resources.map((res, idx) => {
            const holders = res.holders || (res.holder ? [res.holder] : []);
            const waiters = res.waiters || res.queue || [];

            return (
              <div key={res.id || idx} className="space-y-1.5">
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="font-bold text-midnight dark:text-ivory">
                    {res.name || `RESOURCE-${idx + 1}`}
                  </span>
                  <span className="text-[10px] text-midnight/50 dark:text-brandMuted">
                    {res.type || 'MUTEX'} â€¢ {waiters.length} QUEUED
                  </span>
                </div>

                {/* Track Line */}
                <div className="relative h-10 bg-[#FAF7F0] dark:bg-midnight rounded-[4px] border border-[#E2D9C8] dark:border-midnight-border flex items-center px-3 gap-2 overflow-x-auto">
                  {/* Track Spine Hairline */}
                  <div className="absolute top-1/2 left-0 right-0 -translate-y-1/2 h-[1px] bg-[#D9CEBA] dark:bg-midnight-border z-0"></div>

                  {/* Active Holders */}
                  {holders.map((h, hIdx) => (
                    <div
                      key={`h-${hIdx}`}
                      title={`Active: ${h.name || h.id || h}`}
                      className="relative z-10 px-2.5 py-1 rounded-full bg-emerald-600 text-white font-mono text-[10px] font-bold shadow-sm flex items-center gap-1 shrink-0"
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse"></span>
                      <span>{h.name || h.id || h}</span>
                    </div>
                  ))}

                  {/* Waiting Queue Tokens */}
                  {waiters.map((w, wIdx) => (
                    <div
                      key={`w-${wIdx}`}
                      title={`Queued position #${wIdx + 1}: ${w.name || w.id || w}`}
                      className="relative z-10 px-2 py-0.5 rounded-full border-2 border-amber-500 bg-white dark:bg-midnight text-amber-800 dark:text-amber-300 font-mono text-[10px] font-semibold shrink-0"
                    >
                      #{wIdx + 1} {w.name || w.id || w}
                    </div>
                  ))}

                  {holders.length === 0 && waiters.length === 0 && (
                    <span className="relative z-10 text-[10px] font-mono text-midnight/40 dark:text-brandMuted italic">
                      Unlocked / Free
                    </span>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
