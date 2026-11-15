import React from 'react';

// Contrast rules: Gold text on dark surfaces only; dark text on gold in light theme.
const STYLES = {
  success: 'bg-[var(--status-success-bg)] text-[var(--status-success-text)] border border-[var(--status-success-border)]',
  warning: 'bg-[var(--status-warning-bg)] text-[var(--status-warning-text)] border border-[var(--status-warning-border)]',
  danger: 'bg-[var(--status-danger-bg)] text-[var(--status-danger-text)] border border-[var(--status-danger-border)]',
  info: 'bg-[var(--status-info-bg)] text-[var(--status-info-text)] border border-[var(--status-info-border)]',
  neutral: 'bg-[var(--bg-subtle)] text-[var(--text-secondary)] border border-[var(--border-color)]',
  gold: 'bg-[#D9B36C]/20 text-[#0B1F1A] dark:text-[#D9B36C] border border-[#D9B36C]/40 font-semibold',
};

export default function Badge({ variant = 'neutral', children }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-[4px] text-xs font-mono font-medium whitespace-nowrap transition-colors duration-150 ${
        STYLES[variant] ?? STYLES.neutral
      }`}
    >
      {children}
    </span>
  );
}
