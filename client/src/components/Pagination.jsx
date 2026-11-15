import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export default function Pagination({
  currentPage,
  totalPages,
  onPageChange,
  className = '',
}) {
  if (totalPages <= 1) return null;

  return (
    <div className={`flex items-center justify-between gap-4 py-3 text-xs font-mono text-[var(--text-muted)] ${className}`}>
      <span>
        Page <span className="font-semibold text-[var(--text-primary)]">{currentPage}</span> of{' '}
        <span className="font-semibold text-[var(--text-primary)]">{totalPages}</span>
      </span>

      <div className="flex items-center gap-1.5">
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage <= 1}
          className="p-1.5 rounded-[4px] border border-[var(--border-color)] hover:bg-[var(--bg-subtle)] text-[var(--text-primary)] disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
          aria-label="Previous page"
        >
          <ChevronLeft className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage >= totalPages}
          className="p-1.5 rounded-[4px] border border-[var(--border-color)] hover:bg-[var(--bg-subtle)] text-[var(--text-primary)] disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
          aria-label="Next page"
        >
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
