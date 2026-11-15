import React from 'react';
import StampBadge from './StampBadge';

/**
 * Docket - Numbered Administrative "Needs Attention" Queue
 * Presents urgent actions, pending approvals, and supervision flags
 * as an orderly, numbered archival queue.
 */
export default function Docket({
  items = [],
  title = 'ACTION DOCKET',
  subTitle = 'Items requiring administrative decision',
  emptyMessage = 'All dockets cleared. No urgent action required.',
  className = '',
}) {
  return (
    <div className={`bg-white dark:bg-midnight-surface border border-[#D9CEBA] dark:border-midnight-border rounded-[6px] overflow-hidden ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3 bg-[#FAF7F0] dark:bg-midnight-dark border-b border-[#E8E0D0] dark:border-midnight-border">
        <div>
          <span className="text-[10px] font-mono tracking-wider uppercase text-midnight/50 dark:text-brandMuted">
            {title}
          </span>
          {subTitle && (
            <h3 className="text-sm font-serif font-bold text-midnight dark:text-ivory">
              {subTitle}
            </h3>
          )}
        </div>
        <span className="text-xs font-mono font-bold text-midnight/70 dark:text-brandMuted bg-[#EFE9DC] dark:bg-midnight px-2 py-0.5 rounded border border-[#D9CEBA] dark:border-midnight-border">
          {items.length} PENDING
        </span>
      </div>

      {/* Items list */}
      <div className="divide-y divide-[#EFE9DC] dark:divide-midnight-border">
        {items.length === 0 ? (
          <div className="p-8 text-center text-xs font-mono text-midnight/50 dark:text-brandMuted">
            {emptyMessage}
          </div>
        ) : (
          items.map((item, idx) => {
            const num = String(idx + 1).padStart(2, '0');
            return (
              <div
                key={item.id || idx}
                className="px-5 py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-[#FAF7F0] dark:hover:bg-midnight/50 transition-colors"
              >
                <div className="flex items-start sm:items-center gap-3">
                  <span className="text-xs font-mono font-bold text-emerald dark:text-emerald-light shrink-0">
                    #{num}
                  </span>
                  {item.type && (
                    <StampBadge variant={item.typeVariant || 'warning'} size="sm" className="shrink-0">
                      {item.type}
                    </StampBadge>
                  )}
                  <div>
                    <h4 className="text-xs font-semibold text-midnight dark:text-ivory">
                      {item.title}
                    </h4>
                    {item.description && (
                      <p className="text-[11px] text-midnight/70 dark:text-brandMuted mt-0.5">
                        {item.description}
                      </p>
                    )}
                  </div>
                </div>

                {item.action && (
                  <div className="shrink-0 self-end sm:self-center">
                    {item.action}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

