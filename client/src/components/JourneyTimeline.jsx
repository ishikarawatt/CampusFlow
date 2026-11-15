import React from 'react';
import Badge from './Badge';
import Button from './Button';
import { CheckCircle2, Clock, Calendar, AlertCircle, FileText, Ban } from 'lucide-react';

export default function JourneyTimeline({
  applicationId,
  driveTitle,
  companyName,
  packageLpa,
  currentStage,
  stages = [],
  offer,
  canWithdraw,
  onWithdrawApplication,
  onAcceptOffer,
  onDeclineOffer,
}) {
  const isWithdrawn = currentStage === 'withdrawn';
  const isSelected = currentStage === 'selected';
  const isRejected = currentStage === 'rejected';

  let badgeVariant = 'neutral';
  if (isSelected || currentStage === 'shortlisted') badgeVariant = 'success';
  else if (isRejected || isWithdrawn) badgeVariant = 'danger';
  else if (offer?.status === 'offered') badgeVariant = 'gold';

  return (
    <div className={`bg-[var(--bg-surface)] rounded-[10px] border border-[var(--border-color)] p-5 shadow-subtle space-y-5 ${isWithdrawn ? 'opacity-70' : ''}`}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3.5 border-b border-[var(--border-color)]">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-serif font-bold text-lg text-[var(--text-primary)]">
              {driveTitle}
            </h3>
            <Badge variant="neutral">{packageLpa ? `${packageLpa} LPA` : 'Placement Drive'}</Badge>
            {offer?.status === 'accepted' && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#0F7B5F]/15 text-[#0F7B5F] border border-[#0F7B5F]/30 font-mono">
                🎉 Offer Accepted
              </span>
            )}
          </div>
          <p className="text-xs text-[var(--text-muted)] font-mono mt-0.5">{companyName}</p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Badge variant={badgeVariant}>
            {currentStage.toUpperCase()}
          </Badge>
          {canWithdraw && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onWithdrawApplication(applicationId)}
              className="text-xs text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/20"
            >
              Withdraw
            </Button>
          )}
        </div>
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

      {/* Real Offer Section */}
      {offer && (
        <div className={`mt-4 p-4 rounded-[8px] border ${
          offer.status === 'accepted'
            ? 'border-[#0F7B5F]/40 bg-[#0F7B5F]/10'
            : offer.status === 'offered'
            ? 'border-[var(--border-gold)] bg-[var(--bg-surface-elevated)]'
            : 'border-[var(--border-color)] bg-[var(--bg-subtle)]'
        } flex flex-col sm:flex-row sm:items-center justify-between gap-4`}>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-serif font-bold text-sm text-[var(--text-primary)]">
                {offer.status === 'accepted'
                  ? 'Placement Offer Accepted'
                  : offer.status === 'declined'
                  ? 'Offer Declined'
                  : offer.status === 'withdrawn'
                  ? 'Offer Withdrawn by Recruiter'
                  : 'Formal Placement Offer Extended'}
              </span>
              <span className={`text-[10px] font-mono uppercase px-2 py-0.5 rounded-full font-bold ${
                offer.status === 'accepted'
                  ? 'bg-[#0F7B5F] text-white'
                  : offer.status === 'offered'
                  ? 'bg-[#D9B36C] text-[#0B1F1A]'
                  : 'bg-stone-500 text-white'
              }`}>
                {offer.status}
              </span>
            </div>

            <div className="text-xs text-[var(--text-primary)] font-medium mt-1">
              Package: <span className="font-mono font-bold text-[#D9B36C]">{offer.package_lpa || packageLpa} LPA</span>
              {offer.joining_date && (
                <span className="text-[var(--text-muted)]"> · Joining: {new Date(offer.joining_date).toLocaleDateString()}</span>
              )}
            </div>

            {offer.note && (
              <p className="text-xs text-[var(--text-muted)] italic mt-1 bg-[var(--bg-app)]/50 p-2 rounded-[4px] border border-[var(--border-color)]">
                "{offer.note}"
              </p>
            )}
          </div>

          {offer.status === 'offered' && (
            <div className="flex items-center gap-2 shrink-0">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => onDeclineOffer(offer)}
                className="hover:border-red-500 hover:text-red-500"
              >
                Decline
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={() => onAcceptOffer(offer)}
                className="font-bold"
              >
                Accept Offer
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
