import React from 'react';

export default function Tabs({ tabs, activeTab, onChange, className = '' }) {
  return (
    <div className={`flex border-b border-[var(--color-border)] gap-2 overflow-x-auto slim-scroll ${className}`}>
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        const Icon = tab.icon;
        return (
          <button
            key={tab.id}
            onClick={() => onChange(tab.id)}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-semibold border-b-2 whitespace-nowrap transition-all duration-150 -mb-[1px] ${
              isActive
                ? 'border-[#26BFD0] text-[#26BFD0]'
                : 'border-transparent text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] hover:border-[var(--color-border)]'
            }`}
          >
            {Icon && <Icon className="w-4 h-4" />}
            <span>{tab.label}</span>
            {tab.count !== undefined && (
              <span
                className={`ml-1.5 px-2 py-0.5 text-xs rounded-full ${
                  isActive
                    ? 'bg-[#26BFD0]/15 text-[#26BFD0]'
                    : 'bg-[var(--color-bg)] text-[var(--color-text-muted)]'
                }`}
              >
                {tab.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
