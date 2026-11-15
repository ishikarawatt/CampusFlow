import React from 'react';
import { Check } from 'lucide-react';

function StepCircle({ state, index }) {
  if (state === 'done') {
    return (
      <span className="w-7 h-7 rounded-full flex items-center justify-center bg-[#0F7B5F] text-[#F7F3EA] shrink-0 border border-[#0A5C47]">
        <Check className="w-3.5 h-3.5 stroke-[2.5]" />
      </span>
    );
  }
  if (state === 'current') {
    return (
      <span
        className="w-7 h-7 rounded-full flex items-center justify-center text-[#0B1F1A] text-xs font-bold shrink-0 bg-[#D9B36C] border border-[#B8924B]"
      >
        {index + 1}
      </span>
    );
  }
  return (
    <span className="w-7 h-7 rounded-full flex items-center justify-center bg-[var(--bg-subtle)] text-[var(--text-muted)] text-xs font-medium shrink-0 border border-[var(--border-color)]">
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
                  className={`w-px flex-1 min-h-[28px] ${
                    s.state === 'done' ? 'bg-[#0F7B5F]' : 'bg-[var(--border-color)]'
                  }`}
                />
              )}
            </div>
            <div className="pb-6 -mt-0.5">
              <div
                className={`text-sm font-medium ${
                  s.state === 'todo' ? 'text-[var(--text-muted)]' : 'text-[var(--text-primary)]'
                }`}
              >
                {s.label}
              </div>
              {s.detail && (
                <div className="text-xs text-[var(--text-muted)] mt-0.5">
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
              className={`text-xs font-medium mt-2 leading-tight ${
                s.state === 'todo' ? 'text-[var(--text-muted)]' : 'text-[var(--text-primary)] font-semibold'
              }`}
            >
              {s.label}
            </div>
            {s.detail && (
              <div className="text-[11px] text-[var(--text-muted)] mt-0.5 leading-tight font-mono">
                {s.detail}
              </div>
            )}
          </div>
          {i < steps.length - 1 && (
            <div
              className={`h-px flex-1 mt-3.5 mx-1 ${
                s.state === 'done' ? 'bg-[#0F7B5F]' : 'bg-[var(--border-color)]'
              }`}
            />
          )}
        </li>
      ))}
    </ol>
  );
}
