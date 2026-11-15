import React from 'react';

/**
 * LedgerTable - Archival Record Ledger Table
 * Dense, authoritative registrar table with hairline borders, tabular figures,
 * and high-contrast row interaction.
 */
export default function LedgerTable({
  columns = [],
  data = [],
  keyField = 'id',
  onRowClick = null,
  selectedIds = [],
  onSelectRow = null,
  onSelectAll = null,
  emptyMessage = 'No ledger entries recorded.',
  className = '',
}) {
  const hasSelection = !!onSelectRow;
  const isAllSelected = data.length > 0 && selectedIds.length === data.length;

  return (
    <div className={`w-full overflow-x-auto border border-[#D9CEBA] dark:border-midnight-border rounded-[6px] bg-white dark:bg-midnight-surface ${className}`}>
      <table className="w-full text-left border-collapse text-xs">
        {/* Table Head */}
        <thead>
          <tr className="bg-[#FAF7F0] dark:bg-midnight-dark border-b border-[#D9CEBA] dark:border-midnight-border text-[11px] font-mono uppercase tracking-wider text-midnight/70 dark:text-brandMuted select-none">
            {hasSelection && (
              <th className="py-2.5 px-3 w-8 text-center border-r border-[#E8E0D0] dark:border-midnight-border">
                <input
                  type="checkbox"
                  checked={isAllSelected}
                  onChange={onSelectAll}
                  className="rounded border-[#C8BDA7] text-emerald focus:ring-emerald dark:bg-midnight dark:border-midnight-border"
                />
              </th>
            )}
            {columns.map((col, idx) => (
              <th
                key={idx}
                className={`py-2.5 px-4 font-semibold ${col.align === 'right' ? 'text-right' : col.align === 'center' ? 'text-center' : 'text-left'} ${col.className || ''}`}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>

        {/* Table Body */}
        <tbody className="divide-y divide-[#EFE9DC] dark:divide-midnight-border text-midnight dark:text-ivory">
          {data.length === 0 ? (
            <tr>
              <td
                colSpan={columns.length + (hasSelection ? 1 : 0)}
                className="py-8 text-center text-xs font-mono text-midnight/50 dark:text-brandMuted"
              >
                {emptyMessage}
              </td>
            </tr>
          ) : (
            data.map((row, rowIdx) => {
              const rowId = row[keyField] || rowIdx;
              const isSelected = selectedIds.includes(rowId);

              return (
                <tr
                  key={rowId}
                  onClick={() => onRowClick && onRowClick(row)}
                  className={`transition-colors ${
                    onRowClick ? 'cursor-pointer hover:bg-[#FAF7F0] dark:hover:bg-midnight/70' : ''
                  } ${isSelected ? 'bg-amber-50/40 dark:bg-amber-950/20' : ''}`}
                >
                  {hasSelection && (
                    <td
                      className="py-2.5 px-3 text-center border-r border-[#EFE9DC] dark:border-midnight-border"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => onSelectRow(rowId)}
                        className="rounded border-[#C8BDA7] text-emerald focus:ring-emerald dark:bg-midnight dark:border-midnight-border"
                      />
                    </td>
                  )}
                  {columns.map((col, colIdx) => {
                    const val = col.accessor ? (typeof col.accessor === 'function' ? col.accessor(row) : row[col.accessor]) : null;
                    return (
                      <td
                        key={colIdx}
                        className={`py-2.5 px-4 ${col.align === 'right' ? 'text-right' : col.align === 'center' ? 'text-center' : 'text-left'} ${col.mono ? 'font-mono' : ''} ${col.cellClassName || ''}`}
                      >
                        {col.render ? col.render(row, val) : val}
                      </td>
                    );
                  })}
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
}

