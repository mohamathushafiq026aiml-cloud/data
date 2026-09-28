import React, { useState } from 'react';
import { Search, ChevronLeft, ChevronRight, Hash, Type } from 'lucide-react';
import { ColumnType, DataRow } from '../types';

interface DataTableProps {
  columns: string[];
  rows: DataRow[];
  columnTypes: Record<string, ColumnType>;
  title?: string;
  subtitle?: string;
  defaultPageSize?: number;
  highlightNegatives?: boolean;
}

export const DataTable: React.FC<DataTableProps> = ({
  columns,
  rows,
  columnTypes,
  title = 'Dataset Preview',
  subtitle,
  defaultPageSize = 10,
  highlightNegatives = false
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [pageSize, setPageSize] = useState<number>(defaultPageSize);
  const [currentPage, setCurrentPage] = useState(1);

  // Filter rows
  const filteredRows = rows.filter(row => {
    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase();
    return columns.some(col => {
      const val = row[col];
      if (val === null || val === undefined) return false;
      return String(val).toLowerCase().includes(term);
    });
  });

  const totalPages = Math.max(1, Math.ceil(filteredRows.length / pageSize));
  const safePage = Math.min(currentPage, totalPages);
  const startIndex = (safePage - 1) * pageSize;
  const pageRows = filteredRows.slice(startIndex, startIndex + pageSize);

  return (
    <div className="bg-white border border-neutral-200 rounded-lg overflow-hidden">
      {/* Table Toolbar */}
      <div className="p-4 border-b border-neutral-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-neutral-50/50">
        <div>
          <h3 className="text-sm font-semibold text-neutral-900">{title}</h3>
          {subtitle ? (
            <p className="text-xs text-neutral-500 mt-0.5">{subtitle}</p>
          ) : (
            <div className="flex items-center gap-2 text-xs text-neutral-500 mt-0.5">
              <span>Showing {pageRows.length} of {rows.length} rows</span>
              <span aria-hidden="true">·</span>
              <span>{columns.length} columns</span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-3">
          {/* Search box */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-neutral-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search table..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="pl-8 pr-3 py-1.5 text-xs bg-white border border-neutral-200 rounded-md focus:border-neutral-900 focus:outline-none w-44 transition-all"
            />
          </div>

          {/* Rows per page selector */}
          <div className="flex items-center gap-1.5 text-xs text-neutral-500">
            <span>Show:</span>
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="bg-white border border-neutral-200 rounded-md px-2 py-1 text-xs text-neutral-800 focus:outline-none"
            >
              <option value={10}>10 rows</option>
              <option value={25}>25 rows</option>
              <option value={50}>50 rows</option>
              <option value={rows.length}>All ({rows.length})</option>
            </select>
          </div>
        </div>
      </div>

      {/* Table Container */}
      <div className="overflow-x-auto max-h-[460px]">
        <table className="w-full text-left text-xs border-collapse">
          <thead className="bg-neutral-100/80 text-neutral-600 sticky top-0 z-10 border-b border-neutral-200">
            <tr>
              <th className="py-2.5 px-3 font-mono font-medium text-neutral-400 w-12 text-center border-r border-neutral-200/60">
                #
              </th>
              {columns.map((col) => {
                const isNumeric = columnTypes[col] === 'numeric';
                return (
                  <th
                    key={col}
                    className={`py-2.5 px-3 font-medium text-neutral-700 whitespace-nowrap border-r border-neutral-200/60 ${
                      isNumeric ? 'text-right' : 'text-left'
                    }`}
                  >
                    <div className={`flex items-center gap-1.5 ${isNumeric ? 'justify-end' : 'justify-start'}`}>
                      {isNumeric ? (
                        <Hash className="w-3 h-3 text-neutral-400" />
                      ) : (
                        <Type className="w-3 h-3 text-neutral-400" />
                      )}
                      <span>{col}</span>
                    </div>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100">
            {pageRows.length === 0 ? (
              <tr>
                <td colSpan={columns.length + 1} className="py-8 text-center text-neutral-400">
                  No matching records found.
                </td>
              </tr>
            ) : (
              pageRows.map((row, idx) => {
                const rowIndex = startIndex + idx + 1;
                return (
                  <tr key={idx} className="hover:bg-neutral-50/80 transition-colors">
                    <td className="py-2 px-3 font-mono tabular-nums text-neutral-400 text-center border-r border-neutral-200/40">
                      {rowIndex}
                    </td>
                    {columns.map((col) => {
                      const val = row[col];
                      const isNumeric = columnTypes[col] === 'numeric';
                      const isMissing = val === null || val === undefined || (typeof val === 'string' && val === '');
                      const isNegative = typeof val === 'number' && val < 0;

                      return (
                        <td
                          key={col}
                          className={`py-2 px-3 whitespace-nowrap border-r border-neutral-200/40 ${
                            isNumeric ? 'text-right font-mono tabular-nums' : 'text-left'
                          }`}
                        >
                          {isMissing ? (
                            <span className="text-amber-600/80 font-mono text-[11px] italic">
                              (null)
                            </span>
                          ) : isNegative && highlightNegatives ? (
                            <span className="text-rose-600 font-semibold bg-rose-50 px-1.5 py-0.5 rounded">
                              {String(val)}
                            </span>
                          ) : (
                            <span className="text-neutral-800">
                              {String(val)}
                            </span>
                          )}
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

      {/* Pagination Footer */}
      {totalPages > 1 && (
        <div className="p-3 border-t border-neutral-200 flex items-center justify-between text-xs text-neutral-600 bg-neutral-50/40">
          <div>
            Page <span className="font-mono tabular-nums font-medium text-neutral-900">{safePage}</span> of{' '}
            <span className="font-mono tabular-nums font-medium text-neutral-900">{totalPages}</span>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={safePage === 1}
              className="p-1 rounded border border-neutral-200 hover:bg-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={safePage === totalPages}
              className="p-1 rounded border border-neutral-200 hover:bg-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
