import React from 'react';

export default function DataTable({ columns, rows, emptyHint }) {
  if (!rows || rows.length === 0) {
    return (
      <div className="px-5 py-8 text-center text-sm text-[var(--text-muted)] font-sans">
        {emptyHint ?? 'Nothing here yet.'}
      </div>
    );
  }

  return (
    <div className="overflow-x-auto slim-scroll rounded-[8px] border border-[var(--border-color)] bg-[var(--bg-surface)]">
      <table className="w-full text-sm font-sans">
        <thead className="sticky top-0 bg-[var(--bg-surface-elevated)] z-10 border-b border-[var(--border-color)]">
          <tr className="text-left">
            {columns.map((c) => (
              <th
                key={c.key}
                className="px-5 py-3 text-xs font-mono font-medium text-[var(--text-muted)] uppercase tracking-wider whitespace-nowrap"
              >
                {c.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-[var(--border-color)] bg-[var(--bg-surface)]">
          {rows.map((row, i) => (
            <tr
              key={row.id ?? i}
              className="hover:bg-[var(--bg-subtle)]/70 transition-colors duration-150"
            >
              {columns.map((c) => (
                <td
                  key={c.key}
                  className={`px-5 py-3.5 align-middle text-[var(--text-primary)] ${c.className ?? ''}`}
                >
                  {c.render ? c.render(row) : row[c.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
