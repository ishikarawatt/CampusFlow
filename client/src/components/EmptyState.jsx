import React from 'react';
import { Inbox } from 'lucide-react';

export default function EmptyState({ title = 'Nothing here yet', message, action }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-6 text-center">
      <div className="w-14 h-14 rounded-2xl bg-[#26BFD0]/10 border border-[#26BFD0]/20 flex items-center justify-center mb-4 text-[#26BFD0]">
        <Inbox className="w-7 h-7" />
      </div>
      <h3 className="text-base font-semibold text-[var(--color-text-primary)]">{title}</h3>
      {message && (
        <p className="text-sm text-[var(--color-text-muted)] mt-1.5 max-w-sm leading-relaxed">
          {message}
        </p>
      )}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
