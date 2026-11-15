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
          className="block text-[11px] font-mono font-medium uppercase tracking-wider text-[var(--text-muted)] mb-1"
        >
          {label}
        </label>
      )}
      <input
        id={inputId}
        ref={ref}
        className={`w-full rounded-[6px] border bg-[var(--bg-surface)] px-3 py-2 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)]/50 focus:outline-none focus:border-[#D9B36C] focus:ring-1 focus:ring-[#D9B36C] transition-colors ${
          error ? 'border-[#9E3524]' : 'border-[var(--border-color)]'
        } ${className}`}
        {...props}
      />
      {error ? (
        <p className="text-[11px] text-[#9E3524] mt-1 font-sans">{error}</p>
      ) : hint ? (
        <p className="text-[11px] text-[var(--text-muted)] mt-1 font-sans">{hint}</p>
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
          className="block text-[11px] font-mono font-medium uppercase tracking-wider text-[var(--text-muted)] mb-1"
        >
          {label}
        </label>
      )}
      <select
        id={selectId}
        ref={ref}
        className={`w-full rounded-[6px] border bg-[var(--bg-surface)] px-3 py-2 text-sm text-[var(--text-primary)] focus:outline-none focus:border-[#D9B36C] focus:ring-1 focus:ring-[#D9B36C] transition-colors ${
          error ? 'border-[#9E3524]' : 'border-[var(--border-color)]'
        } ${className}`}
        {...props}
      >
        {children}
      </select>
      {error ? (
        <p className="text-[11px] text-[#9E3524] mt-1 font-sans">{error}</p>
      ) : hint ? (
        <p className="text-[11px] text-[var(--text-muted)] mt-1 font-sans">{hint}</p>
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
          className="block text-[11px] font-mono font-medium uppercase tracking-wider text-[var(--text-muted)] mb-1"
        >
          {label}
        </label>
      )}
      <textarea
        id={textareaId}
        ref={ref}
        rows={rows}
        className={`w-full rounded-[6px] border bg-[var(--bg-surface)] px-3 py-2 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)]/50 focus:outline-none focus:border-[#D9B36C] focus:ring-1 focus:ring-[#D9B36C] transition-colors ${
          error ? 'border-[#9E3524]' : 'border-[var(--border-color)]'
        } ${className}`}
        {...props}
      />
      {error ? (
        <p className="text-[11px] text-[#9E3524] mt-1 font-sans">{error}</p>
      ) : hint ? (
        <p className="text-[11px] text-[var(--text-muted)] mt-1 font-sans">{hint}</p>
      ) : null}
    </div>
  );
});
