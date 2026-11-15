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
    <div className={`flex items-center justify-between gap-4 py-3 text-sm text-[var(--color-text-muted)] ${className}`}>
      <span>
        Page <span className="font-semibold text-[var(--color-text-primary)]">{currentPage}</span> of{' '}
        <span className="font-semibold text-[var(--color-text-primary)]">{totalPages}</span>
      </span>

      <div className="flex items-center gap-1.5">
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage <= 1}
          className="p-1.5 rounded-lg border border-[var(--color-border)] hover:bg-[var(--color-bg)] text-[var(--color-text-primary)] disabled:opacity-40 disabled:hover:bg-transparent transition-colors"
          aria-label="Previous page"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage >= totalPages}
          className="p-1.5 rounded-lg border border-[var(--color-border)] hover:bg-[var(--color-bg)] text-[var(--color-text-primary)] disabled:opacity-40 disabled:hover:bg-transparent transition-colors"
          aria-label="Next page"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
