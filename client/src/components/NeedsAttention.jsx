import React from 'react';
import { AlertCircle, ArrowRight } from 'lucide-react';
import Button from './Button';

export default function NeedsAttention({ items = [], title = 'Needs your attention' }) {
  if (!items.length) return null;

  return (
    <div className="bg-[var(--bg-surface)] rounded-[10px] border border-[var(--border-color)] shadow-subtle overflow-hidden">
      <div className="px-5 py-3.5 border-b border-[var(--border-color)] flex items-center gap-2">
        <AlertCircle className="w-4 h-4 text-[#D9B36C]" />
        <h3 className="text-sm font-serif font-bold text-[var(--text-primary)]">{title}</h3>
        <span className="ml-auto text-[11px] font-mono text-[var(--text-muted)]">
          {items.length} item{items.length !== 1 ? 's' : ''}
        </span>
      </div>
      <ul className="divide-y divide-[var(--border-color)]">
        {items.map((item, i) => (
          <li
            key={i}
            className="px-5 py-3 flex items-center gap-4 hover:bg-[var(--bg-subtle)] transition-colors cursor-pointer"
            onClick={item.onClick}
          >
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-[var(--text-primary)] truncate">
                {item.title}
              </div>
              {item.detail && (
                <div className="text-xs text-[var(--text-muted)] font-mono mt-0.5 truncate">
                  {item.detail}
                </div>
              )}
            </div>
            {item.actionLabel ? (
              <Button variant="primary" size="sm" onClick={(e) => { e.stopPropagation(); item.onClick?.(); }}>
                {item.actionLabel}
              </Button>
            ) : (
              <ArrowRight className="w-4 h-4 text-[var(--text-muted)] shrink-0" />
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

