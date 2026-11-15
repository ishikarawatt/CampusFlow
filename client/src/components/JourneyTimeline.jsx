import React from 'react';
import Badge from './Badge';
import Button from './Button';
import { CheckCircle2, Clock, Calendar, AlertCircle } from 'lucide-react';

const STAGE_ORDER = ['applied', 'testing', 'interviews', 'offered'];

export default function JourneyTimeline({
  driveTitle,
  companyName,
  packageLpa,
  currentStage,
  stages = [],
  offer,
  onAcceptOffer,
  onDeclineOffer,
}) {
  return (
    <div className="bg-[var(--bg-surface)] rounded-[10px] border border-[var(--border-color)] p-5 shadow-subtle space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3.5 border-b border-[var(--border-color)]">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="font-serif font-bold text-lg text-[var(--text-primary)]">
              {driveTitle}
            </h3>
            <Badge variant="neutral">{packageLpa ? `${packageLpa} LPA` : 'Placement Drive'}</Badge>
          </div>
          <p className="text-xs text-[var(--text-muted)] font-mono mt-0.5">{companyName}</p>
        </div>

        <Badge variant={currentStage === 'offered' ? 'gold' : currentStage === 'rejected' ? 'danger' : 'success'}>
          {currentStage.toUpperCase()}
        </Badge>
      </div>

      {/* Horizontal Step Timeline */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
        {stages.map((st, i) => {
          const isDone = st.status === 'done';
          const isCurrent = st.status === 'current';
          return (
            <div
              key={i}
              className={`p-3 rounded-[6px] border text-xs space-y-1 ${
                isCurrent
                  ? 'border-[#D9B36C] bg-[#D9B36C]/10 text-[var(--text-primary)]'
                  : isDone
                  ? 'border-[var(--status-success-border)] bg-[var(--status-success-bg)] text-[var(--status-success-text)]'
                  : 'border-[var(--border-color)] bg-[var(--bg-subtle)] text-[var(--text-muted)]'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-serif font-bold">{st.label}</span>
                {isDone && <CheckCircle2 className="w-3.5 h-3.5 text-[#0F7B5F]" />}
              </div>
              <div className="text-[11px] font-mono opacity-80">{st.detail || (isDone ? 'Completed' : 'Pending')}</div>
            </div>
          );
        })}
      </div>

      {/* Offer Action Strip if Offered */}
      {offer && (
        <div className="mt-4 p-4 rounded-[6px] border border-[var(--border-gold)] bg-[var(--bg-surface-elevated)] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="font-serif font-bold text-sm text-[var(--text-primary)]">
              Formal Placement Offer Extended
            </div>
            <div className="text-xs text-[var(--text-muted)] font-mono mt-0.5">
              Compensation: {offer.package_lpa || packageLpa} LPA · Joining: {offer.joining_date || 'June 2027'}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={onDeclineOffer}>
              Decline
            </Button>
            <Button variant="primary" size="sm" onClick={onAcceptOffer}>
              Accept Offer
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

