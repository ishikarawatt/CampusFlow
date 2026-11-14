import React from 'react';

export default function DataTable({ columns, rows, emptyHint }) {
  if (!rows || rows.length === 0) {
    return (
      <div className="px-5 py-8 text-center text-sm text-[var(--color-text-muted)]">
        {emptyHint ?? 'Nothing here yet.'}
      </div>
    );
  }
  return (
    <div className="overflow-x-auto slim-scroll rounded-xl border border-[var(--color-border)]">
      <table className="w-full text-sm">
        <thead className="sticky top-0 bg-[var(--color-surface)] z-10">
          <tr className="border-b border-[var(--color-border)] text-left">
            {columns.map((c) => (
              <th
                key={c.key}
                className="px-5 py-3 text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wider whitespace-nowrap"
              >
                {c.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-[var(--color-border)] bg-[var(--color-surface)]">
          {rows.map((row, i) => (
            <tr
              key={row.id ?? i}
              className="hover:bg-[var(--color-bg)]/60 transition-colors duration-150"
            >
              {columns.map((c) => (
                <td
                  key={c.key}
                  className={`px-5 py-3.5 align-middle text-[var(--color-text-primary)] ${c.className ?? ''}`}
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
