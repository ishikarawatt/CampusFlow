import React from 'react';
import StampBadge from './StampBadge';

/**
 * Dossier - Document-Style Administrative Record Dossier
 * Structured record viewer for candidates, company profiles, and supervision inspections.
 */
export default function Dossier({
  title,
  subTitle,
  registrationCode,
  status = 'ACTIVE',
  statusVariant = 'neutral',
  fields = [],
  documents = [],
  timeline = null,
  actions = null,
  className = '',
}) {
  return (
    <div className={`space-y-6 text-midnight dark:text-ivory ${className}`}>
      {/* Dossier Header */}
      <div className="pb-4 border-b border-[#D9CEBA] dark:border-midnight-border">
        <div className="flex items-start justify-between gap-3">
          <div>
            <span className="text-[10px] font-mono tracking-widest uppercase text-midnight/50 dark:text-brandMuted">
              OFFICIAL CANDIDATE DOSSIER
            </span>
            <h2 className="text-xl font-serif font-bold text-midnight dark:text-ivory mt-0.5">
              {title}
            </h2>
            {subTitle && (
              <p className="text-xs text-midnight/70 dark:text-brandMuted mt-0.5">
                {subTitle}
              </p>
            )}
          </div>
          <div className="flex flex-col items-end gap-1.5 shrink-0">
            <StampBadge variant={statusVariant} size="sm">
              {status}
            </StampBadge>
            {registrationCode && (
              <span className="text-[11px] font-mono text-midnight/60 dark:text-brandMuted">
                REG: {registrationCode}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Ruled Field Grid */}
      <div className="bg-[#FAF7F0] dark:bg-midnight/60 border border-[#E2D9C8] dark:border-midnight-border rounded-[4px] p-4 divide-y divide-[#EFE9DC] dark:divide-midnight-border">
        {fields.map((f, idx) => (
          <div key={idx} className="py-2.5 first:pt-0 last:pb-0 flex items-center justify-between text-xs">
            <span className="font-mono text-[11px] text-midnight/60 dark:text-brandMuted uppercase tracking-wider">
              {f.label}
            </span>
            <span className="font-medium text-midnight dark:text-ivory text-right">
              {f.value || 'â€”'}
            </span>
          </div>
        ))}
      </div>

      {/* Document Attachments */}
      {documents.length > 0 && (
        <div>
          <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-midnight/70 dark:text-brandMuted mb-2">
            ATTACHED VERIFIED DOCUMENTS
          </h4>
          <div className="space-y-2">
            {documents.map((doc, idx) => (
              <div
                key={idx}
                className="p-3 border border-[#D9CEBA] dark:border-midnight-border rounded-[4px] bg-white dark:bg-midnight-surface flex items-center justify-between gap-3"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className="text-xs font-mono font-bold px-1.5 py-0.5 bg-emerald-50 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 rounded border border-emerald-700/20">
                    PDF
                  </span>
                  <div className="truncate">
                    <span className="text-xs font-semibold block truncate">
                      {doc.name || 'Resume Document'}
                    </span>
                    {doc.meta && (
                      <span className="text-[10px] font-mono text-midnight/50 dark:text-brandMuted block">
                        {doc.meta}
                      </span>
                    )}
                  </div>
                </div>
                {doc.action && <div className="shrink-0">{doc.action}</div>}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Timeline Section */}
      {timeline && (
        <div>
          <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-midnight/70 dark:text-brandMuted mb-2">
            APPLICATION MILESTONES
          </h4>
          {timeline}
        </div>
      )}

      {/* Sticky Bottom Actions */}
      {actions && (
        <div className="pt-4 border-t border-[#D9CEBA] dark:border-midnight-border flex items-center justify-end gap-2">
          {actions}
        </div>
      )}
    </div>
  );
}
