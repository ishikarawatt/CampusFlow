import React, { useState } from 'react';
import StampBadge from './StampBadge';

/**
 * SeatMap - Lab Floor Plan with Physical Desk Glyphs
 * Replaces generic card grids on Exam PCs and Exam Monitoring with an
 * authoritative architectural seat grid supporting real-time socket states,
 * keyboard navigation, and immediate inspector triggering.
 */
export default function SeatMap({
  pcs = [],
  onSelectPc = null,
  selectedPcId = null,
  columnsCount = 5,
  className = '',
}) {
  const [focusedIndex, setFocusedIndex] = useState(0);

  // Group PCs into rows
  const rows = [];
  for (let i = 0; i < pcs.length; i += columnsCount) {
    rows.push(pcs.slice(i, i + columnsCount));
  }

  // Keyboard navigation handler
  const handleKeyDown = (e, index, pc) => {
    let nextIndex = index;
    if (e.key === 'ArrowRight') nextIndex = Math.min(pcs.length - 1, index + 1);
    else if (e.key === 'ArrowLeft') nextIndex = Math.max(0, index - 1);
    else if (e.key === 'ArrowDown') nextIndex = Math.min(pcs.length - 1, index + columnsCount);
    else if (e.key === 'ArrowUp') nextIndex = Math.max(0, index - columnsCount);
    else if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      if (onSelectPc) onSelectPc(pc);
      return;
    }

    if (nextIndex !== index) {
      e.preventDefault();
      setFocusedIndex(nextIndex);
      const targetEl = document.getElementById(`seat-desk-${nextIndex}`);
      if (targetEl) targetEl.focus();
    }
  };

  // State resolver
  const getSeatState = (pc) => {
    if (pc.is_flagged || pc.events_count > 0 || pc.suspicious_count > 0) return 'flagged';
    if (pc.status === 'in_use' || pc.current_session_id) return 'online';
    if (pc.is_allocated) return 'allocated';
    if (pc.status === 'offline') return 'offline';
    if (pc.status === 'maintenance') return 'maintenance';
    return 'free';
  };

  return (
    <div className={`w-full bg-white dark:bg-midnight-surface border border-[#D9CEBA] dark:border-midnight-border rounded-[6px] p-5 ${className}`}>
      {/* Floor Plan Header & Legend */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 mb-4 border-b border-[#E8E0D0] dark:border-midnight-border gap-3">
        <div>
          <span className="text-[10px] font-mono tracking-wider uppercase text-midnight/50 dark:text-brandMuted">
            EXAMINATION FLOOR PLAN
          </span>
          <h3 className="text-sm font-serif font-bold text-midnight dark:text-ivory">
            Lab Terminal Grid ({pcs.length} Terminals)
          </h3>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap items-center gap-2 text-[10px] font-mono">
          <span className="flex items-center gap-1.5 px-2 py-0.5 border border-emerald-700/30 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 rounded">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span> ONLINE
          </span>
          <span className="flex items-center gap-1.5 px-2 py-0.5 border border-amber-700/30 bg-amber-50 dark:bg-amber-950/40 text-amber-900 dark:text-amber-300 rounded">
            <span className="w-2 h-2 rounded-full bg-amber-500"></span> ALLOCATED
          </span>
          <span className="flex items-center gap-1.5 px-2 py-0.5 border border-rose-700/30 bg-rose-50 dark:bg-rose-950/40 text-rose-900 dark:text-rose-300 rounded">
            <span className="w-2 h-2 rounded-full bg-rose-500"></span> FLAGGED
          </span>
          <span className="flex items-center gap-1.5 px-2 py-0.5 border border-[#C8BDA7] bg-[#FAF7F0] dark:bg-midnight text-midnight/70 dark:text-brandMuted rounded">
            <span className="w-2 h-2 rounded-full bg-gray-400"></span> FREE
          </span>
        </div>
      </div>

      {/* Grid Floor */}
      <div className="space-y-3 overflow-x-auto pb-2">
        {rows.map((row, rowIdx) => (
          <div key={rowIdx} className="flex items-center gap-3 min-w-[500px]">
            {/* Row Identifier Marker */}
            <span className="w-6 text-[11px] font-mono font-semibold text-midnight/40 dark:text-brandMuted/50 text-right shrink-0">
              R{rowIdx + 1}
            </span>

            <div className="grid grid-cols-5 gap-3 flex-1">
              {row.map((pc, colIdx) => {
                const flatIndex = rowIdx * columnsCount + colIdx;
                const state = getSeatState(pc);
                const isSelected = selectedPcId && (selectedPcId === pc.id || selectedPcId === pc.pc_code);

                // Styling tokens per state
                let deskBg = 'bg-[#FAF7F0] dark:bg-midnight/60 border-[#D9CEBA] dark:border-midnight-border text-midnight dark:text-ivory';
                let stateStamp = 'FREE';
                let stampVariant = 'neutral';

                if (state === 'online') {
                  deskBg = 'bg-emerald-50/80 dark:bg-emerald-950/50 border-emerald-600/60 dark:border-emerald-400/60 text-emerald-950 dark:text-emerald-200';
                  stateStamp = 'ONLINE';
                  stampVariant = 'success';
                } else if (state === 'flagged') {
                  deskBg = 'bg-rose-50/80 dark:bg-rose-950/50 border-rose-600/70 dark:border-rose-400/70 text-rose-950 dark:text-rose-200 animate-pulse';
                  stateStamp = 'ALERT';
                  stampVariant = 'danger';
                } else if (state === 'allocated') {
                  deskBg = 'bg-amber-50/80 dark:bg-amber-950/50 border-amber-600/60 dark:border-amber-400/60 text-amber-950 dark:text-amber-200';
                  stateStamp = 'OCCUPIED';
                  stampVariant = 'warning';
                } else if (state === 'offline') {
                  deskBg = 'bg-gray-100 dark:bg-midnight/30 border-gray-300 dark:border-midnight-border text-gray-500';
                  stateStamp = 'OFFLINE';
                  stampVariant = 'neutral';
                }

                return (
                  <button
                    key={pc.id || pc.pc_code || flatIndex}
                    id={`seat-desk-${flatIndex}`}
                    tabIndex={flatIndex === focusedIndex ? 0 : -1}
                    onClick={() => onSelectPc && onSelectPc(pc)}
                    onKeyDown={(e) => handleKeyDown(e, flatIndex, pc)}
                    title={`Terminal: ${pc.pc_code || pc.name} | Lab: ${pc.lab_name || 'Lab 1'} | State: ${stateStamp}`}
                    className={`relative p-2.5 rounded-[4px] border-2 text-left transition-all outline-none focus:ring-2 focus:ring-amber-500/80 ${deskBg} ${
                      isSelected ? 'ring-2 ring-emerald shadow-md -translate-y-0.5' : 'hover:-translate-y-0.5'
                    }`}
                  >
                    {/* Desk Surface Blueprint Icon */}
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[11px] font-mono font-bold tracking-tight">
                        {pc.pc_code || `PC-${flatIndex + 1}`}
                      </span>
                      <StampBadge variant={stampVariant} size="sm" className="!px-1 !text-[9px]">
                        {stateStamp}
                      </StampBadge>
                    </div>

                    {/* Student / Session Tag */}
                    <div className="text-[10px] truncate text-midnight/70 dark:text-brandMuted">
                      {pc.current_student_name || pc.student_name || pc.ip_address || 'Unassigned'}
                    </div>

                    {/* Desk base footer line */}
                    <div className="mt-2 pt-1 border-t border-dashed border-current/20 flex items-center justify-between text-[9px] font-mono opacity-60">
                      <span>{pc.lab_name || 'LAB-A'}</span>
                      {pc.events_count > 0 && <span className="font-bold text-rose-600">!{pc.events_count}</span>}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
