import React from 'react';

/**
 * StampBadge - Registrar's Rubber Stamp Status Badge
 * Replaces generic pill badges with an authoritative, ink-stamped administrative seal.
 */
export default function StampBadge({
  children,
  variant = 'neutral',
  size = 'md',
  className = '',
  tilt = false,
  icon: Icon = null,
  ...props
}) {
  const sizeClasses = {
    sm: 'text-[10px] px-1.5 py-0.5 tracking-wider border',
    md: 'text-xs px-2.5 py-1 tracking-widest border-[1.5px]',
    lg: 'text-sm px-3.5 py-1.5 tracking-widest border-2',
  }[size] || 'text-xs px-2.5 py-1 tracking-widest border-[1.5px]';

  const variantClasses = {
    success: 'border-emerald-700/60 dark:border-emerald-400/60 text-emerald-800 dark:text-emerald-300 bg-emerald-50/70 dark:bg-emerald-950/40',
    warning: 'border-amber-700/60 dark:border-amber-400/60 text-amber-900 dark:text-amber-300 bg-amber-50/70 dark:bg-amber-950/40',
    danger: 'border-rose-700/60 dark:border-rose-400/60 text-rose-900 dark:text-rose-300 bg-rose-50/70 dark:bg-rose-950/40',
    info: 'border-cyan-800/60 dark:border-cyan-400/60 text-cyan-900 dark:text-cyan-300 bg-cyan-50/70 dark:bg-cyan-950/40',
    gold: 'border-amber-600/70 dark:border-amber-400/70 text-amber-950 dark:text-amber-200 bg-amber-100/60 dark:bg-amber-900/30',
    neutral: 'border-[#C8BDA7] dark:border-midnight-border text-midnight dark:text-brandMuted bg-ivory-dark/40 dark:bg-midnight-surface/60',
  }[variant] || 'border-[#C8BDA7] dark:border-midnight-border text-midnight dark:text-brandMuted bg-ivory-dark/40 dark:bg-midnight-surface/60';

  const tiltClass = tilt ? '-rotate-1 hover:rotate-0 transition-transform' : '';

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-mono font-semibold uppercase rounded-[3px] select-none ${sizeClasses} ${variantClasses} ${tiltClass} ${className}`}
      {...props}
    >
      {Icon && <Icon className="w-3 h-3 stroke-[2.2]" />}
      <span>{children}</span>
    </span>
  );
}

