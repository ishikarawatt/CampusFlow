import React from 'react';

/**
 * Microcopy - Plain-Spoken Institutional Administrative Helper
 * Provides crisp, non-fluffy instructional text for forms, rules, and procedures.
 */
export default function Microcopy({
  children,
  requirement = null,
  className = '',
}) {
  return (
    <div className={`flex items-baseline gap-1.5 text-[11px] text-midnight/60 dark:text-brandMuted ${className}`}>
      {requirement && (
        <span className="font-mono uppercase text-[10px] font-bold text-amber-700 dark:text-amber-400">
          [{requirement}]
        </span>
      )}
      <span>{children}</span>
    </div>
  );
}

