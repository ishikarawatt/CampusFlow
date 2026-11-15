import React from 'react';

// Hard rule:
// Primary button = Gold fill + Midnight text (#0B1F1A)
// Secondary button = Transparent + 1px gold border + gold text on dark (emerald border + emerald text on light)
// Danger = Muted brick red
// Ghost = Transparent with subtle hover

export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  icon,
  className = '',
  type = 'button',
  onClick,
  ...props
}) {
  const sizeClasses = {
    sm: 'px-3 py-1.5 text-xs rounded-[4px] gap-1.5',
    md: 'px-4 py-2 text-sm rounded-[6px] gap-2',
    lg: 'px-5 py-2.5 text-base rounded-[6px] gap-2.5',
  };

  const variantClasses = {
    primary:
      'bg-[#D9B36C] hover:bg-[#E6C98A] text-[#0B1F1A] font-semibold shadow-subtle focus-visible:ring-2 focus-visible:ring-[#D9B36C]/50',
    secondary:
      'bg-transparent border border-[#0F7B5F] text-[#0F7B5F] hover:bg-[#0F7B5F]/10 dark:border-[#D9B36C] dark:text-[#D9B36C] dark:hover:bg-[#D9B36C]/10 font-medium focus-visible:ring-2 focus-visible:ring-[var(--brand-accent)]/50',
    ghost:
      'bg-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-subtle)] font-medium',
    danger:
      'bg-[#9E3524] hover:bg-[#85291A] text-[#F7F3EA] font-semibold shadow-subtle',
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={`inline-flex items-center justify-center transition-colors font-sans select-none disabled:opacity-50 disabled:cursor-not-allowed ${
        sizeClasses[size] ?? sizeClasses.md
      } ${variantClasses[variant] ?? variantClasses.primary} ${className}`}
      {...props}
    >
      {loading ? (
        <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
      ) : icon ? (
        <span className="shrink-0">{icon}</span>
      ) : null}
      <span>{children}</span>
    </button>
  );
}
