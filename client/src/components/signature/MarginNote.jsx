import React from 'react';

/**
 * MarginNote - Registrar's Marginalia Commentary
 * Provides contextual guidance, deadlines, and rules without cluttering the primary workflow.
 */
export default function MarginNote({
  title = 'REGISTRAR NOTICE',
  children,
  variant = 'neutral',
  className = '',
  action = null,
}) {
  const borderColors = {
    neutral: 'border-l-midnight/40 dark:border-l-brandMuted/40 bg-[#FAF7F0] dark:bg-midnight-surface/50',
    gold: 'border-l-amber-600 dark:border-l-amber-500 bg-amber-50/50 dark:bg-amber-950/20',
    emerald: 'border-l-emerald-600 dark:border-l-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/20',
    danger: 'border-l-rose-600 dark:border-l-rose-500 bg-rose-50/50 dark:bg-rose-950/20',
  }[variant] || 'border-l-midnight/40 dark:border-l-brandMuted/40 bg-[#FAF7F0] dark:bg-midnight-surface/50';

  return (
    <aside
      className={`border-l-4 p-4 rounded-r-[4px] border-t border-r border-b border-[#E2D9C8] dark:border-midnight-border ${borderColors} ${className}`}
    >
      <div className="flex items-center justify-between mb-1.5">
        <h4 className="text-[11px] font-mono font-bold uppercase tracking-wider text-midnight dark:text-ivory">
          {title}
        </h4>
        {action && <div>{action}</div>}
      </div>
      <div className="text-xs text-midnight/80 dark:text-brandMuted leading-relaxed space-y-1">
        {children}
      </div>
    </aside>
  );
}

