import React, { forwardRef } from 'react';

export const Input = forwardRef(function Input(
  { label, error, hint, className = '', id, ...props },
  ref
) {
  const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

  return (
    <div className="w-full">
      {label && (
        <label
          htmlFor={inputId}
          className="block text-xs font-semibold uppercase tracking-wider text-[var(--color-text-muted)] mb-1.5"
        >
          {label}
        </label>
      )}
      <input
        id={inputId}
        ref={ref}
        className={`w-full rounded-xl border bg-[var(--color-surface)] px-3.5 py-2.5 text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)]/60 focus:outline-none focus:ring-2 focus:ring-[#26BFD0]/30 focus:border-[#26BFD0] transition-colors ${
          error ? 'border-rose-500' : 'border-[var(--color-border)]'
        } ${className}`}
        {...props}
      />
      {error ? (
        <p className="text-xs text-rose-500 mt-1 font-medium">{error}</p>
      ) : hint ? (
        <p className="text-xs text-[var(--color-text-muted)] mt-1">{hint}</p>
      ) : null}
    </div>
  );
});

export const Select = forwardRef(function Select(
  { label, error, hint, children, className = '', id, ...props },
  ref
) {
  const selectId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

  return (
    <div className="w-full">
      {label && (
        <label
          htmlFor={selectId}
          className="block text-xs font-semibold uppercase tracking-wider text-[var(--color-text-muted)] mb-1.5"
        >
          {label}
        </label>
      )}
      <select
        id={selectId}
        ref={ref}
        className={`w-full rounded-xl border bg-[var(--color-surface)] px-3.5 py-2.5 text-sm text-[var(--color-text-primary)] focus:outline-none focus:ring-2 focus:ring-[#26BFD0]/30 focus:border-[#26BFD0] transition-colors ${
          error ? 'border-rose-500' : 'border-[var(--color-border)]'
        } ${className}`}
        {...props}
      >
        {children}
      </select>
      {error ? (
        <p className="text-xs text-rose-500 mt-1 font-medium">{error}</p>
      ) : hint ? (
        <p className="text-xs text-[var(--color-text-muted)] mt-1">{hint}</p>
      ) : null}
    </div>
  );
});

export const Textarea = forwardRef(function Textarea(
  { label, error, hint, className = '', rows = 3, id, ...props },
  ref
) {
  const textareaId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

  return (
    <div className="w-full">
      {label && (
        <label
          htmlFor={textareaId}
          className="block text-xs font-semibold uppercase tracking-wider text-[var(--color-text-muted)] mb-1.5"
        >
          {label}
        </label>
      )}
      <textarea
        id={textareaId}
        ref={ref}
        rows={rows}
        className={`w-full rounded-xl border bg-[var(--color-surface)] px-3.5 py-2.5 text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)]/60 focus:outline-none focus:ring-2 focus:ring-[#26BFD0]/30 focus:border-[#26BFD0] transition-colors ${
          error ? 'border-rose-500' : 'border-[var(--color-border)]'
        } ${className}`}
        {...props}
      />
      {error ? (
        <p className="text-xs text-rose-500 mt-1 font-medium">{error}</p>
      ) : hint ? (
        <p className="text-xs text-[var(--color-text-muted)] mt-1">{hint}</p>
      ) : null}
    </div>
  );
});
