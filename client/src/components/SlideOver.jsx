import React, { useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { X } from 'lucide-react';

export default function SlideOver({
  panelId,
  title,
  subtitle,
  children,
  width = 'max-w-xl',
  onClose,
}) {
  const [searchParams, setSearchParams] = useSearchParams();
  const currentPanel = searchParams.get('panel');
  const isOpen = currentPanel === panelId;

  const close = () => {
    if (onClose) onClose();
    searchParams.delete('panel');
    setSearchParams(searchParams, { replace: true });
  };

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') close();
    };

    window.addEventListener('keydown', handleKeyDown);
    document.body.style.overflow = 'hidden';

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-[#0B1F1A]/70 backdrop-blur-sm transition-opacity"
        onClick={close}
        aria-hidden="true"
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div
          className={`w-screen ${width} bg-[var(--bg-surface)] border-l border-[var(--border-color)] shadow-2xl flex flex-col cf-transition`}
        >
          {/* SlideOver Header */}
          <div className="p-6 border-b border-[var(--border-color)] flex items-start justify-between gap-4 bg-[var(--bg-surface-elevated)]">
            <div>
              <h2 className="text-xl font-serif font-bold text-[var(--text-primary)]">
                {title}
              </h2>
              {subtitle && (
                <p className="text-xs text-[var(--text-muted)] mt-1 font-sans leading-relaxed">
                  {subtitle}
                </p>
              )}
            </div>
            <button
              onClick={close}
              className="p-1.5 rounded-[4px] text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-subtle)] transition-colors"
              aria-label="Close panel"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* SlideOver Content */}
          <div className="flex-1 overflow-y-auto p-6 slim-scroll">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}

