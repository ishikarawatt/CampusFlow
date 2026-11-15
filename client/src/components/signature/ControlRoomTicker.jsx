import React, { useState } from 'react';
import StampBadge from './StampBadge';

/**
 * ControlRoomTicker - Monospaced Ruled Live Feed
 * Renders real-time telemetry events for exam supervision and kernel monitors
 * with pause/resume control, category filters, and smooth row entrance.
 */
export default function ControlRoomTicker({
  events = [],
  onClear = null,
  onReview = null,
  className = '',
}) {
  const [isPaused, setIsPaused] = useState(false);
  const [filterType, setFilterType] = useState('ALL');

  const filteredEvents = events.filter((ev) => {
    if (filterType === 'ALL') return true;
    const type = (ev.event_type || ev.type || '').toUpperCase();
    return type.includes(filterType);
  });

  return (
    <div className={`bg-white dark:bg-midnight-surface border border-[#D9CEBA] dark:border-midnight-border rounded-[6px] overflow-hidden flex flex-col ${className}`}>
      {/* Ticker Control Bar */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-[#FAF7F0] dark:bg-midnight-dark border-b border-[#E8E0D0] dark:border-midnight-border">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
          <span className="text-[10px] font-mono tracking-wider uppercase text-midnight/70 dark:text-brandMuted font-semibold">
            SUPERVISOR TELEMETRY FEED
          </span>
          {isPaused && (
            <span className="text-[9px] font-mono px-1.5 py-0.2 bg-amber-200 text-amber-900 rounded font-bold">
              PAUSED
            </span>
          )}
        </div>

        {/* Controls */}
        <div className="flex items-center gap-2">
          {/* Category Filter */}
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="text-[10px] font-mono py-1 px-2 border border-[#C8BDA7] dark:border-midnight-border rounded bg-white dark:bg-midnight text-midnight dark:text-ivory outline-none"
          >
            <option value="ALL">ALL EVENTS</option>
            <option value="PROCESS">PROCESS</option>
            <option value="WINDOW">WINDOW FOCUS</option>
            <option value="NETWORK">NETWORK</option>
            <option value="USB">USB / DEV</option>
          </select>

          {/* Pause / Resume Button */}
          <button
            onClick={() => setIsPaused(!isPaused)}
            className="text-[10px] font-mono font-semibold px-2 py-1 border border-[#C8BDA7] dark:border-midnight-border rounded hover:bg-[#EFE9DC] dark:hover:bg-midnight text-midnight dark:text-ivory"
          >
            {isPaused ? 'â–¶ RESUME' : 'â¸ PAUSE'}
          </button>
        </div>
      </div>

      {/* Ticker Rows */}
      <div className="divide-y divide-[#EFE9DC] dark:divide-midnight-border overflow-y-auto max-h-[380px] font-mono text-xs">
        {filteredEvents.length === 0 ? (
          <div className="p-8 text-center text-xs text-midnight/50 dark:text-brandMuted">
            No telemetry events recorded yet. Supervisor channel listening...
          </div>
        ) : (
          filteredEvents.map((ev, idx) => {
            const timeStr = ev.created_at || ev.timestamp || new Date().toISOString();
            const pcCode = ev.pc_code || ev.pc_name || `PC-${ev.pc_id || '??'}`;
            const eventType = (ev.event_type || ev.type || 'NOTICE').toUpperCase();
            const detail = ev.details || ev.window_title || ev.process_name || ev.description || JSON.stringify(ev.metadata || {});

            let stampVariant = 'neutral';
            if (eventType.includes('ALERT') || eventType.includes('BLOCKED') || eventType.includes('FORBIDDEN') || ev.is_suspicious) {
              stampVariant = 'danger';
            } else if (eventType.includes('WARNING') || eventType.includes('DISCONNECT')) {
              stampVariant = 'warning';
            } else if (eventType.includes('CONNECT') || eventType.includes('START') || eventType.includes('VERIFIED')) {
              stampVariant = 'success';
            }

            return (
              <div
                key={ev.id || idx}
                className="px-4 py-2 flex items-center justify-between gap-3 hover:bg-[#FAF7F0] dark:hover:bg-midnight/50 transition-colors animate-fadeIn"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span className="text-[10px] text-midnight/50 dark:text-brandMuted shrink-0">
                    {timeStr.slice(11, 19)}
                  </span>
                  <span className="text-[11px] font-bold text-emerald dark:text-emerald-light shrink-0">
                    [{pcCode}]
                  </span>
                  <StampBadge variant={stampVariant} size="sm" className="shrink-0">
                    {eventType}
                  </StampBadge>
                  <span
                    className="truncate text-[11px] text-midnight dark:text-ivory"
                    title={detail}
                  >
                    {detail}
                  </span>
                </div>

                {onReview && (
                  <button
                    onClick={() => onReview(ev)}
                    className="text-[10px] font-mono text-emerald dark:text-emerald-light hover:underline shrink-0"
                  >
                    REVIEW
                  </button>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

