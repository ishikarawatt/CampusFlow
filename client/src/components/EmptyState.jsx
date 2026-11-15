import React from 'react';

// Tasteful empty-state line art SVG matching the Midnight x Emerald x Gold palette
function ElegantInboxArt() {
  return (
    <svg className="w-16 h-16 mb-4 text-[var(--border-color)]" viewBox="0 0 64 64" fill="none">
      <rect x="12" y="18" width="40" height="28" rx="3" stroke="currentColor" strokeWidth="1.5" />
      <path d="M12 36H24C26.2 36 28 37.8 28 40V40C28 42.2 29.8 44 32 44H32C34.2 44 36 42.2 36 40V40C36 37.8 37.8 36 40 36H52" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="32" cy="27" r="1.5" fill="#D9B36C" />
      <line x1="20" y1="27" x2="26" y2="27" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
      <line x1="38" y1="27" x2="44" y2="27" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  );
}

export default function EmptyState({ title = 'No records found', message, action }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-6 text-center">
      <ElegantInboxArt />
      <h3 className="text-base font-serif font-bold text-[var(--text-primary)]">{title}</h3>
      {message && (
        <p className="text-xs text-[var(--text-muted)] mt-1.5 max-w-sm leading-relaxed">
          {message}
        </p>
      )}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
