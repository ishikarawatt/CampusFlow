import React from 'react';
import SearchInput from './SearchInput';

export default function FilterBar({
  search,
  onSearchChange,
  searchPlaceholder = 'Search records...',
  tabs,
  activeTab,
  onTabChange,
  actions,
  children,
}) {
  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-[var(--border-color)]">
      <div className="flex flex-wrap items-center gap-3 flex-1">
        {onSearchChange !== undefined && (
          <div className="w-full sm:w-64">
            <SearchInput
              value={search}
              onChange={onSearchChange}
              placeholder={searchPlaceholder}
            />
          </div>
        )}

        {tabs && tabs.length > 0 && (
          <div className="flex items-center gap-1 p-0.5 rounded-[6px] bg-[var(--bg-subtle)] border border-[var(--border-color)]">
            {tabs.map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => onTabChange(tab.id)}
                  className={`px-3 py-1 text-xs font-mono rounded-[4px] transition-colors ${
                    isActive
                      ? 'bg-[var(--bg-surface)] text-[var(--text-primary)] font-bold shadow-subtle border border-[var(--border-color)]'
                      : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
                  }`}
                >
                  {tab.label}
                  {tab.count !== undefined && (
                    <span className="ml-1.5 opacity-60">({tab.count})</span>
                  )}
                </button>
              );
            })}
          </div>
        )}

        {children}
      </div>

      {actions && (
        <div className="flex items-center gap-2.5 shrink-0">
          {actions}
        </div>
      )}
    </div>
  );
}

