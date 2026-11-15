import React from 'react';
import StampBadge from './StampBadge';

/**
 * JourneyRail - Ruled Milestone Track
 * Visualizes the applicant's official progression across recruitment phases.
 */
export default function JourneyRail({
  steps = [],
  currentStepIndex = 0,
  orientation = 'vertical',
  className = '',
}) {
  if (orientation === 'horizontal') {
    return (
      <div className={`w-full overflow-x-auto pb-2 ${className}`}>
        <div className="flex items-center min-w-[600px] relative px-4">
          {/* Connecting Spine */}
          <div className="absolute top-1/2 left-8 right-8 -translate-y-1/2 h-[2px] bg-[#D9CEBA] dark:bg-midnight-border z-0"></div>

          {steps.map((step, idx) => {
            const isDone = idx < currentStepIndex || step.status === 'completed';
            const isCurrent = idx === currentStepIndex && step.status !== 'completed';
            const isFailed = step.status === 'failed' || step.status === 'rejected';

            let dotColor = 'border-[#C8BDA7] bg-white dark:bg-midnight text-midnight/50';
            if (isDone) dotColor = 'border-emerald-600 bg-emerald dark:bg-emerald text-white';
            if (isCurrent) dotColor = 'border-amber-500 bg-amber-400 dark:bg-amber-500 text-midnight ring-4 ring-amber-400/20';
            if (isFailed) dotColor = 'border-rose-600 bg-rose-600 text-white';

            return (
              <div key={idx} className="flex-1 flex flex-col items-center text-center relative z-10 px-2">
                <div
                  className={`w-7 h-7 rounded-full border-2 flex items-center justify-center font-mono text-xs font-bold transition-all ${dotColor}`}
                >
                  {idx + 1}
                </div>
                <div className="mt-2">
                  <span className="block text-xs font-semibold text-midnight dark:text-ivory">
                    {step.title}
                  </span>
                  {step.date && (
                    <span className="block text-[10px] font-mono text-midnight/60 dark:text-brandMuted">
                      {step.date}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // Vertical layout (default)
  return (
    <div className={`relative pl-6 space-y-6 before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-[2px] before:bg-[#D9CEBA] dark:before:bg-midnight-border ${className}`}>
      {steps.map((step, idx) => {
        const isDone = idx < currentStepIndex || step.status === 'completed';
        const isCurrent = idx === currentStepIndex && step.status !== 'completed';
        const isFailed = step.status === 'failed' || step.status === 'rejected';

        let markerStyle = 'border-[#C8BDA7] bg-white dark:bg-midnight text-midnight/60';
        if (isDone) markerStyle = 'border-emerald-600 bg-emerald text-white';
        if (isCurrent) markerStyle = 'border-amber-500 bg-amber-400 dark:bg-amber-500 text-midnight ring-4 ring-amber-400/20';
        if (isFailed) markerStyle = 'border-rose-600 bg-rose-600 text-white';

        return (
          <div key={idx} className="relative group">
            {/* Marker Disc */}
            <div
              className={`absolute -left-[30px] top-0.5 w-6 h-6 rounded-full border-2 flex items-center justify-center font-mono text-[11px] font-bold ${markerStyle}`}
            >
              {isDone ? 'â' : idx + 1}
            </div>

            {/* Content Card */}
            <div className="bg-white/80 dark:bg-midnight-surface/80 border border-[#E2D9C8] dark:border-midnight-border p-3.5 rounded-[4px]">
              <div className="flex items-center justify-between gap-2 mb-1">
                <h4 className="text-sm font-semibold text-midnight dark:text-ivory">
                  {step.title}
                </h4>
                {step.stamp && (
                  <StampBadge variant={step.stampVariant || (isDone ? 'success' : isCurrent ? 'warning' : 'neutral')} size="sm">
                    {step.stamp}
                  </StampBadge>
                )}
              </div>
              {step.description && (
                <p className="text-xs text-midnight/70 dark:text-brandMuted mb-2">
                  {step.description}
                </p>
              )}
              {step.date && (
                <div className="text-[11px] font-mono text-midnight/50 dark:text-brandMuted">
                  RECORDED: {step.date}
                </div>
              )}
              {step.actions && (
                <div className="mt-3 pt-2.5 border-t border-[#EFE9DC] dark:border-midnight-border flex items-center gap-2">
                  {step.actions}
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
