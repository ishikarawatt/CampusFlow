import React, { useEffect, useState } from 'react';

// Count-up hook for big numbers on initial load
function useCountUp(targetVal) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    // Check if target is a number
    const num = parseFloat(String(targetVal).replace(/[^0-9.-]/g, ''));
    if (isNaN(num) || num <= 0) {
      setCount(targetVal);
      return;
    }

    let start = 0;
    const duration = 800; // ms
    const stepTime = 20;
    const steps = duration / stepTime;
    const increment = num / steps;

    const timer = setInterval(() => {
      start += increment;
      if (start >= num) {
        setCount(targetVal);
        clearInterval(timer);
      } else {
        setCount(Math.round(start));
      }
    }, stepTime);

    return () => clearInterval(timer);
  }, [targetVal]);

  return count;
}

export default function StatCard({ label, value, icon, accent = 'emerald' }) {
  const animatedVal = useCountUp(value);

  return (
    <div className="bg-[var(--bg-surface)] rounded-[10px] border border-[var(--border-color)] p-5 flex items-center justify-between gap-4 transition-all duration-200 hover:-translate-y-0.5 shadow-subtle relative overflow-hidden group">
      {/* Subtle gold accent top hairline */}
      <div className="absolute top-0 left-0 right-0 h-[2px] bg-[var(--border-gold)] opacity-70 group-hover:opacity-100 transition-opacity" />

      <div className="min-w-0 flex-1">
        <div className="text-xs font-mono font-medium text-[var(--text-muted)] uppercase tracking-wider">
          {label}
        </div>
        <div className="text-3xl font-serif font-bold text-[var(--text-primary)] leading-tight tracking-tight mt-1 tabular-nums">
          {animatedVal ?? '—'}
        </div>
      </div>

      <div className="w-11 h-11 rounded-[6px] flex items-center justify-center shrink-0 border border-[var(--border-color)] bg-[var(--bg-subtle)] text-[var(--brand-primary)]">
        {icon}
      </div>
    </div>
  );
}
