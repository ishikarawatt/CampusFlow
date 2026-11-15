import React, { useEffect, useRef } from 'react';
import { X } from 'lucide-react';

export default function Modal({
  isOpen,
  onClose,
  title,
  children,
  maxWidth = 'max-w-lg',
  showClose = true,
}) {
  const modalRef = useRef(null);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose?.();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-[#0B1F1A]/75 backdrop-blur-sm transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal Card */}
      <div
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? 'modal-title' : undefined}
        className={`relative w-full ${maxWidth} bg-[var(--bg-surface)] border border-[var(--border-color)] rounded-[10px] shadow-2xl p-6 z-10 cf-transition`}
      >
        <div className="flex items-center justify-between pb-3.5 border-b border-[var(--border-color)]">
          {title && (
            <h3 id="modal-title" className="text-lg font-serif font-bold text-[var(--text-primary)]">
              {title}
            </h3>
          )}
          {showClose && (
            <button
              onClick={onClose}
              className="p-1 rounded-[4px] text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-subtle)] transition-colors ml-auto"
              aria-label="Close dialog"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        <div className="mt-4">{children}</div>
      </div>
    </div>
  );
}
