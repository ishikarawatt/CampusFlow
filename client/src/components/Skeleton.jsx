import React from 'react';

export default function Skeleton({ className = '', variant = 'rect', lines = 1 }) {
  if (variant === 'circle') {
    return (
      <div
        className={`bg-[var(--border-color)]/60 cf-shimmer rounded-full shrink-0 ${className}`}
      />
    );
  }

  if (lines > 1) {
    return (
      <div className={`space-y-2.5 ${className}`}>
        {Array.from({ length: lines }).map((_, i) => (
          <div
            key={i}
            className={`h-3.5 bg-[var(--border-color)]/60 cf-shimmer rounded-[4px] ${
              i === lines - 1 ? 'w-2/3' : 'w-full'
            }`}
          />
        ))}
      </div>
    );
  }

  return (
    <div
      className={`bg-[var(--border-color)]/60 cf-shimmer rounded-[6px] ${className}`}
    />
  );
}
