import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';

export default function PageHeader({ title, subtitle, breadcrumbs = [], actions }) {
  return (
    <div className="mb-6 pb-4 border-b border-[var(--border-color)]">
      {breadcrumbs.length > 0 && (
        <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-xs text-[var(--text-muted)] font-mono mb-2">
          {breadcrumbs.map((b, i) => (
            <React.Fragment key={i}>
              {i > 0 && <ChevronRight className="w-3.5 h-3.5 opacity-50" />}
              {b.to ? (
                <Link to={b.to} className="hover:text-[var(--text-primary)] transition-colors">
                  {b.label}
                </Link>
              ) : (
                <span className="font-semibold text-[var(--text-primary)]">{b.label}</span>
              )}
            </React.Fragment>
          ))}
        </nav>
      )}

      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-serif font-bold text-[var(--text-primary)] tracking-tight">
            {title}
          </h1>
          {/* Subtle gold hairline underline beneath serif page title */}
          <div className="w-12 h-[2px] bg-[#D9B36C] mt-2 mb-1.5 opacity-80" />
          {subtitle && (
            <p className="text-xs text-[var(--text-muted)] mt-1 font-sans">
              {subtitle}
            </p>
          )}
        </div>

        {actions && (
          <div className="flex items-center gap-2.5 shrink-0">
            {actions}
          </div>
        )}
      </div>
    </div>
  );
}
