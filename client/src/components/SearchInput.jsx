import React from 'react';
import { Search, X } from 'lucide-react';

export default function SearchInput({
  value,
  onChange,
  placeholder = 'Search...',
  className = '',
  onClear,
}) {
  return (
    <div className={`relative flex items-center ${className}`}>
      <Search className="w-4 h-4 text-[var(--text-muted)] absolute left-3 pointer-events-none" />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full pl-9 pr-8 py-1.5 rounded-[6px] border border-[var(--border-color)] bg-[var(--bg-surface)] text-xs text-[var(--text-primary)] placeholder:text-[var(--text-muted)]/50 focus:outline-none focus:border-[#D9B36C] focus:ring-1 focus:ring-[#D9B36C] transition-colors"
      />
      {value && (
        <button
          type="button"
          onClick={() => (onClear ? onClear() : onChange(''))}
          className="absolute right-2.5 p-0.5 rounded text-[var(--text-muted)] hover:text-[var(--text-primary)]"
          aria-label="Clear search"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  );
}
