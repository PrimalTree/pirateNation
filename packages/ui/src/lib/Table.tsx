import * as React from 'react';

export type Column<T> = {
  key: keyof T | string;
  header: string;
  render?: (row: T) => React.ReactNode;
};

export type TableProps<T> = {
  columns: Column<T>[];
  data: T[];
  page?: number;
  pageSize?: number;
  total?: number;
  onPageChange?: (page: number) => void;
};

export function Table<T extends Record<string, any>>({ columns, data, page = 1, pageSize = 10, total = 0, onPageChange }: TableProps<T>) {
  const pages = Math.max(1, Math.ceil(total / pageSize));
  return (
    <div className="w-full">
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="bg-white/5">
              {columns.map((c) => (
                <th key={String(c.key)} className="px-3 py-2 text-left font-medium text-white/80">{c.header}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.length === 0 && (
              <tr>
                <td className="px-3 py-3 text-white/60" colSpan={columns.length}>No data</td>
              </tr>
            )}
            {data.map((row, i) => (
              <tr key={i} className="border-t border-white/10">
                {columns.map((c) => (
                  <td key={String(c.key)} className="px-3 py-2 align-top">
                    {c.render ? c.render(row) : String(row[c.key as keyof T] ?? '')}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="mt-2 flex items-center justify-end gap-2 text-xs text-white/80">
        <button disabled={page <= 1} onClick={() => onPageChange?.(page - 1)} className="rounded border border-white/10 px-2 py-1 disabled:opacity-40">Prev</button>
        <span>Page {page} / {pages}</span>
        <button disabled={page >= pages} onClick={() => onPageChange?.(page + 1)} className="rounded border border-white/10 px-2 py-1 disabled:opacity-40">Next</button>
      </div>
    </div>
  );
}

