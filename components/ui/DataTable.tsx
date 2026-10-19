"use client";

import { cn } from "@/lib/utils";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface Column<T> {
  key: string;
  label: string;
  render?: (item: T) => React.ReactNode;
  className?: string;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  onRowClick?: (item: T) => void;
  page?: number;
  totalPages?: number;
  onPageChange?: (page: number) => void;
  loading?: boolean;
  emptyMessage?: string;
  /** Extra classes per row (e.g. highlight REJECTED audit rows). */
  rowClassName?: (item: T) => string | undefined;
  /** Stable key per row (defaults to item.id, then the index). */
  rowKey?: (item: T, idx: number) => string;
  /** Accessible table caption (visually hidden). */
  caption?: string;
}

export default function DataTable<T extends Record<string, any>>({
  columns, data, onRowClick, page = 1, totalPages = 1, onPageChange, loading, emptyMessage = "No data found", rowClassName, rowKey, caption,
}: DataTableProps<T>) {
  return (
    <div className="rb-card-flat overflow-hidden">
      <div className="overflow-x-auto">
        <table className="rb-table">
          {caption && <caption className="sr-only">{caption}</caption>}
          <thead>
            <tr>
              {columns.map((col) => (
                <th key={col.key} scope="col" className={cn(col.className)}>{col.label}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={columns.length} className="px-4 py-12 text-center">
                  <div className="flex flex-col items-center gap-2" role="status">
                    <div className="w-6 h-6 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: "#D82C2C", borderTopColor: "transparent" }} />
                    <span className="text-[12px] text-gray-400">Loading...</span>
                  </div>
                </td>
              </tr>
            ) : data.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-4 py-12 text-center text-[13px] text-gray-400">{emptyMessage}</td>
              </tr>
            ) : (
              data.map((item, idx) => (
                <tr
                  key={rowKey ? rowKey(item, idx) : item.id || idx}
                  onClick={() => onRowClick?.(item)}
                  onKeyDown={onRowClick ? (e) => {
                    if ((e.key === "Enter" || e.key === " ") && e.target === e.currentTarget) { e.preventDefault(); onRowClick(item); }
                  } : undefined}
                  tabIndex={onRowClick ? 0 : undefined}
                  className={cn(onRowClick && "cursor-pointer focus:outline-none focus:bg-red-50", rowClassName?.(item))}
                >
                  {columns.map((col) => (
                    <td key={col.key} className={cn(col.className)}>
                      {col.render ? col.render(item) : item[col.key]}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      {totalPages > 1 && (
        <div className="flex items-center justify-between px-4 py-3" style={{ borderTop: "1px solid #f0f0f0" }}>
          <span className="text-[12px] text-gray-500">Page {page} of {totalPages}</span>
          <div className="flex gap-1.5">
            <button onClick={() => onPageChange?.(page - 1)} disabled={page <= 1} aria-label="Previous page" className="p-1.5 rounded-lg hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed">
              <ChevronLeft className="w-4 h-4 text-gray-500" />
            </button>
            <button onClick={() => onPageChange?.(page + 1)} disabled={page >= totalPages} aria-label="Next page" className="p-1.5 rounded-lg hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed">
              <ChevronRight className="w-4 h-4 text-gray-500" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
