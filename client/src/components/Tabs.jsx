import React from 'react';

export default function Tabs({ tabs, activeTab, onChange, className = '' }) {
  return (
    <div className={`flex border-b border-[var(--border-color)] gap-1 overflow-x-auto slim-scroll ${className}`}>
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        const Icon = tab.icon;
        return (
          <button
            key={tab.id}
            onClick={() => onChange(tab.id)}
            className={`flex items-center gap-2 px-3.5 py-2 text-xs font-mono font-medium border-b-2 whitespace-nowrap transition-all duration-150 -mb-[1px] ${
              isActive
                ? 'border-[#D9B36C] text-[var(--text-primary)] font-bold'
                : 'border-transparent text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:border-[var(--border-color)]'
            }`}
          >
            {Icon && <Icon className="w-3.5 h-3.5" />}
            <span>{tab.label}</span>
            {tab.count !== undefined && (
              <span
                className={`ml-1 px-1.5 py-0.2 text-[10px] rounded-[4px] border ${
                  isActive
                    ? 'bg-[#D9B36C]/15 text-[var(--text-primary)] border-[#D9B36C]/40'
                    : 'bg-[var(--bg-subtle)] text-[var(--text-muted)] border-[var(--border-color)]'
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
