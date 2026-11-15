import React from 'react';
import Button from './Button';
import { StampBadge } from './signature';
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
    <div
      className={`bg-white dark:bg-midnight-surface rounded-[6px] border border-[#D9CEBA] dark:border-midnight-border p-5 shadow-xs space-y-5 ${
        isWithdrawn ? 'opacity-70' : ''
      }`}
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3.5 border-b border-[#E8E0D0] dark:border-midnight-border">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-serif font-bold text-lg text-midnight dark:text-ivory">
              {driveTitle}
            </h3>
            {packageLpa && (
              <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-[#FAF7F0] dark:bg-midnight border border-[#E2D9C8] dark:border-midnight-border text-emerald dark:text-emerald-light">
                ₹{packageLpa} LPA
              </span>
            )}
            {offer?.status === 'accepted' && (
              <StampBadge variant="success" size="sm">
                OFFER ACCEPTED
              </StampBadge>
            )}
          </div>
          <p className="text-xs text-midnight/60 dark:text-brandMuted font-mono mt-0.5">
            {companyName}
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <StampBadge variant={badgeVariant} size="sm">
            {currentStage.toUpperCase()}
          </StampBadge>

          {canWithdraw && !isWithdrawn && !offer && onWithdrawApplication && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onWithdrawApplication(applicationId)}
              className="text-xs text-rose-700 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 font-mono"
            >
              Withdraw Application
            </Button>
          )}
        </div>
      </div>

      {/* Ruled Milestone Stepper Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {stages.map((st, i) => {
          const isDone = st.status === 'done';
          const isCurrent = st.status === 'current';

          return (
            <div
              key={i}
              className={`p-3 rounded-[4px] border text-xs space-y-1 ${
                isCurrent
                  ? 'border-amber-600/70 bg-amber-50/50 dark:bg-amber-950/20 text-midnight dark:text-ivory'
                  : isDone
                  ? 'border-emerald-600/50 bg-emerald-50/50 dark:bg-emerald-950/20 text-emerald-900 dark:text-emerald-300'
                  : 'border-[#E2D9C8] dark:border-midnight-border bg-[#FAF7F0] dark:bg-midnight/40 text-midnight/60 dark:text-brandMuted'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-serif font-bold">{st.label}</span>
                {isDone && <CheckCircle2 className="w-3.5 h-3.5 text-emerald" />}
              </div>
              <div className="text-[11px] font-mono opacity-80">
                {st.detail || (isDone ? 'Completed' : 'Pending')}
              </div>
            </div>
          );
        })}
      </div>

      {/* Official Placement Offer Document Slip */}
      {offer && (
        <div
          className={`mt-4 p-4 rounded-[4px] border-2 ${
            offer.status === 'accepted'
              ? 'border-emerald-600/60 bg-emerald-50/60 dark:bg-emerald-950/30'
              : offer.status === 'offered'
              ? 'border-amber-600/70 bg-amber-50/60 dark:bg-amber-950/30'
              : 'border-[#D9CEBA] dark:border-midnight-border bg-[#FAF7F0] dark:bg-midnight/60'
          } flex flex-col sm:flex-row sm:items-center justify-between gap-4`}
        >
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-serif font-bold text-sm text-midnight dark:text-ivory">
                {offer.status === 'accepted'
                  ? 'Official Placement Offer Accepted'
                  : offer.status === 'declined'
                  ? 'Placement Offer Declined'
                  : offer.status === 'withdrawn'
                  ? 'Placement Offer Withdrawn by Employer'
                  : 'Formal Placement Offer Extended'}
              </span>
              <StampBadge
                variant={
                  offer.status === 'accepted'
                    ? 'success'
                    : offer.status === 'offered'
                    ? 'gold'
                    : 'danger'
                }
                size="sm"
              >
                {offer.status.toUpperCase()}
              </StampBadge>
            </div>

            <div className="text-xs text-midnight dark:text-ivory font-medium mt-1">
              Confirmed Package:{' '}
              <span className="font-mono font-bold text-emerald dark:text-emerald-light">
                ₹{offer.package_lpa || packageLpa} LPA
              </span>
              {offer.joining_date && (
                <span className="text-midnight/60 dark:text-brandMuted font-mono">
                  {' '}
                  • Joining Date: {new Date(offer.joining_date).toLocaleDateString()}
                </span>
              )}
            </div>

            {offer.note && (
              <p className="text-xs text-midnight/80 dark:text-brandMuted italic mt-2 bg-white/70 dark:bg-midnight/70 p-2 rounded-[3px] border border-[#E2D9C8] dark:border-midnight-border">
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
                className="hover:border-rose-600 hover:text-rose-600 font-mono text-xs"
              >
                Decline Offer
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={() => onAcceptOffer(offer)}
                className="font-bold font-mono text-xs"
              >
                Accept Placement
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
