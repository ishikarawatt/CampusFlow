import React from 'react';
import { Check } from 'lucide-react';

function StepCircle({ state, index }) {
  if (state === 'done') {
    return (
      <span className="w-8 h-8 rounded-full flex items-center justify-center bg-emerald-500 text-white shrink-0 shadow-sm">
        <Check className="w-4 h-4 stroke-[3]" />
      </span>
    );
  }
  if (state === 'current') {
    return (
      <span
        className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold shrink-0 bg-[#26BFD0]"
        style={{ boxShadow: '0 0 12px rgba(38, 191, 208, 0.45)' }}
      >
        {index + 1}
      </span>
    );
  }
  return (
    <span className="w-8 h-8 rounded-full flex items-center justify-center bg-[var(--color-bg)] text-[var(--color-text-muted)] text-sm font-bold shrink-0 border border-[var(--color-border)]">
      {index + 1}
    </span>
  );
}

export default function Stepper({ steps, vertical = false }) {
  if (vertical) {
    return (
      <ol className="space-y-0">
        {steps.map((s, i) => (
          <li key={s.key} className="flex gap-4">
            <div className="flex flex-col items-center">
              <StepCircle state={s.state} index={i} />
              {i < steps.length - 1 && (
                <span
                  className={`w-0.5 flex-1 min-h-[28px] ${
                    s.state === 'done' ? 'bg-emerald-400 dark:bg-emerald-600' : 'bg-[var(--color-border)]'
                  }`}
                />
              )}
            </div>
            <div className="pb-6 -mt-0.5">
              <div
                className={`text-sm font-semibold ${
                  s.state === 'todo' ? 'text-[var(--color-text-muted)]' : 'text-[var(--color-text-primary)]'
                }`}
              >
                {s.label}
              </div>
              {s.detail && (
                <div className="text-[13px] text-[var(--color-text-muted)] mt-0.5">
                  {s.detail}
                </div>
              )}
            </div>
          </li>
        ))}
      </ol>
    );
  }

  return (
    <ol className="flex items-start">
      {steps.map((s, i) => (
        <li key={s.key} className={`flex items-start ${i < steps.length - 1 ? 'flex-1' : ''}`}>
          <div className="flex flex-col items-center text-center shrink-0 w-24">
            <StepCircle state={s.state} index={i} />
            <div
              className={`text-xs font-semibold mt-2.5 leading-tight ${
                s.state === 'todo' ? 'text-[var(--color-text-muted)]' : 'text-[var(--color-text-primary)]'
              }`}
            >
              {s.label}
            </div>
            {s.detail && (
              <div className="text-[11px] text-[var(--color-text-muted)] mt-0.5 leading-tight">
                {s.detail}
              </div>
            )}
          </div>
          {i < steps.length - 1 && (
            <div
              className={`h-0.5 flex-1 mt-4 mx-1 rounded ${
                s.state === 'done' ? 'bg-emerald-400 dark:bg-emerald-600' : 'bg-[var(--color-border)]'
              }`}
            />
          )}
        </li>
      ))}
    </ol>
  );
}
