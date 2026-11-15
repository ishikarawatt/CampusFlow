import React from 'react';
import StampBadge from './StampBadge';

/**
 * AdmitCard - Official Hall Ticket / Drive Admission Document
 * Presents scheduled tests, drive appointments, and registration credentials
 * with registrar authority and perforated-slip detailing.
 */
export default function AdmitCard({
  serialNumber,
  title,
  subTitle,
  date,
  time,
  venue,
  status = 'active',
  statusLabel = 'VALID ADMIT',
  statusVariant = 'success',
  metaItems = [],
  actionSlot = null,
  className = '',
}) {
  return (
    <div
      className={`relative bg-white dark:bg-midnight-surface border border-[#D9CEBA] dark:border-midnight-border rounded-[6px] shadow-sm overflow-hidden ${className}`}
    >
      {/* Header Band */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-[#FAF7F0] dark:bg-midnight-dark border-b border-[#E8E0D0] dark:border-midnight-border">
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-mono tracking-wider uppercase text-midnight/60 dark:text-brandMuted">
            ADMIT DOCKET
          </span>
          {serialNumber && (
            <span className="text-xs font-mono font-semibold text-emerald dark:text-emerald-light bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-700/20 dark:border-emerald-500/20">
              #{serialNumber}
            </span>
          )}
        </div>
        <StampBadge variant={statusVariant} size="sm">
          {statusLabel}
        </StampBadge>
      </div>

      {/* Main Body */}
      <div className="p-5">
        <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2 mb-3">
          <div>
            <h3 className="text-lg font-serif font-bold text-midnight dark:text-ivory">
              {title}
            </h3>
            {subTitle && (
              <p className="text-sm text-midnight/70 dark:text-brandMuted mt-0.5">
                {subTitle}
              </p>
            )}
          </div>
          {(date || time) && (
            <div className="text-right sm:shrink-0">
              <span className="block text-xs font-mono font-semibold text-midnight dark:text-ivory">
                {date}
              </span>
              <span className="block text-[11px] font-mono text-midnight/60 dark:text-brandMuted">
                {time}
              </span>
            </div>
          )}
        </div>

        {/* Perforated Hairline Divider */}
        <div className="relative my-4">
          <div className="border-t border-dashed border-[#D9CEBA] dark:border-midnight-border"></div>
          <div className="absolute -left-7 -top-2 w-4 h-4 rounded-full bg-[#F7F3EA] dark:bg-midnight-dark border-r border-[#D9CEBA] dark:border-midnight-border"></div>
          <div className="absolute -right-7 -top-2 w-4 h-4 rounded-full bg-[#F7F3EA] dark:bg-midnight-dark border-l border-[#D9CEBA] dark:border-midnight-border"></div>
        </div>

        {/* Meta Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs mb-4">
          {venue && (
            <div>
              <span className="block text-[10px] font-mono uppercase tracking-wider text-midnight/50 dark:text-brandMuted/70">
                VENUE / LAB
              </span>
              <span className="font-medium text-midnight dark:text-ivory">
                {venue}
              </span>
            </div>
          )}
          {metaItems.map((item, idx) => (
            <div key={idx}>
              <span className="block text-[10px] font-mono uppercase tracking-wider text-midnight/50 dark:text-brandMuted/70">
                {item.label}
              </span>
              <span className="font-medium text-midnight dark:text-ivory">
                {item.value}
              </span>
            </div>
          ))}
        </div>

        {/* Action Slot */}
        {actionSlot && (
          <div className="pt-3 border-t border-[#EFE9DC] dark:border-midnight-border flex items-center justify-end gap-2">
            {actionSlot}
          </div>
        )}
      </div>
    </div>
  );
}
