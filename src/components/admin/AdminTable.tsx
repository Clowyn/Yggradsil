import { type ReactNode } from 'react';
import { Loader2, Inbox } from 'lucide-react';
import { AdminPagination } from './AdminPagination';

export interface AdminColumn<T> {
  header: string;
  accessor?: keyof T | ((item: T) => ReactNode);
  className?: string;
  align?: 'left' | 'center' | 'right';
}

interface AdminTableProps<T> {
  columns: AdminColumn<T>[];
  data: T[];
  keyExtractor: (item: T) => string;
  loading?: boolean;
  emptyMessage?: string;
  emptySubtext?: string;
  // Optional pagination
  pagination?: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    pageSize: number;
    onPageChange: (page: number) => void;
    onPageSizeChange?: (size: number) => void;
  };
  // Optional top toolbar
  title?: string;
  count?: number;
  headerActions?: ReactNode;
  searchSlot?: ReactNode;
  filterSlot?: ReactNode;
  selectedCount?: number;
  bulkActionsSlot?: ReactNode;
}

export function AdminTable<T>({
  columns,
  data,
  keyExtractor,
  loading = false,
  emptyMessage = 'No records found',
  emptySubtext = 'Try adjusting your search filters or add a new record.',
  pagination,
  title,
  count,
  headerActions,
  searchSlot,
  filterSlot,
  selectedCount = 0,
  bulkActionsSlot,
}: AdminTableProps<T>) {
  return (
    <div className="bg-neutral-900/70 border border-neutral-800/80 rounded-xl overflow-hidden shadow-sm font-sans flex flex-col">
      {/* Top Table Toolbar */}
      {(title || searchSlot || filterSlot || headerActions || bulkActionsSlot) && (
        <div className="p-4 border-b border-neutral-800/80 flex flex-col md:flex-row md:items-center justify-between gap-3 bg-neutral-950/40">
          <div className="flex flex-wrap items-center gap-3">
            {title && (
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-semibold text-neutral-100 tracking-wide">{title}</h3>
                {count !== undefined && (
                  <span className="px-2 py-0.5 rounded-full text-[11px] font-mono font-medium bg-neutral-800 text-neutral-400 border border-neutral-700/60">
                    {count}
                  </span>
                )}
              </div>
            )}
            {selectedCount > 0 && bulkActionsSlot && (
              <div className="flex items-center gap-2 pl-3 border-l border-neutral-800">
                <span className="text-xs text-red-400 font-mono font-medium">
                  {selectedCount} selected
                </span>
                {bulkActionsSlot}
              </div>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {filterSlot}
            {searchSlot}
            {headerActions}
          </div>
        </div>
      )}

      {/* Table Container */}
      <div className="overflow-x-auto min-h-[240px] relative">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="border-b border-neutral-800/80 bg-neutral-950/80 text-[11px] font-mono uppercase tracking-wider text-neutral-400 select-none">
              {columns.map((col, idx) => (
                <th
                  key={idx}
                  className={`py-3 px-4 font-semibold ${
                    col.align === 'right'
                      ? 'text-right'
                      : col.align === 'center'
                      ? 'text-center'
                      : 'text-left'
                  } ${col.className ?? ''}`}
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-800/50">
            {loading ? (
              <tr>
                <td colSpan={columns.length} className="py-16 text-center text-neutral-400">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <Loader2 size={24} className="animate-spin text-red-500/80" />
                    <span className="text-xs font-mono">Loading data from database...</span>
                  </div>
                </td>
              </tr>
            ) : data.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="py-16 text-center text-neutral-400">
                  <div className="flex flex-col items-center justify-center gap-2 max-w-sm mx-auto">
                    <div className="w-10 h-10 rounded-full bg-neutral-800/60 border border-neutral-700 flex items-center justify-center text-neutral-400">
                      <Inbox size={20} />
                    </div>
                    <p className="text-xs font-medium text-neutral-300">{emptyMessage}</p>
                    <p className="text-[11px] text-neutral-400">{emptySubtext}</p>
                  </div>
                </td>
              </tr>
            ) : (
              data.map((item) => (
                <tr
                  key={keyExtractor(item)}
                  className="hover:bg-neutral-800/40 transition-colors text-neutral-300 group"
                >
                  {columns.map((col, cIdx) => (
                    <td
                      key={cIdx}
                      className={`py-3 px-4 align-middle ${
                        col.align === 'right'
                          ? 'text-right'
                          : col.align === 'center'
                          ? 'text-center'
                          : 'text-left'
                      } ${col.className ?? ''}`}
                    >
                      {typeof col.accessor === 'function'
                        ? col.accessor(item)
                        : col.accessor
                        ? (item[col.accessor] as unknown as ReactNode)
                        : null}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {pagination && (
        <AdminPagination
          currentPage={pagination.currentPage}
          totalPages={pagination.totalPages}
          totalItems={pagination.totalItems}
          pageSize={pagination.pageSize}
          onPageChange={pagination.onPageChange}
          onPageSizeChange={pagination.onPageSizeChange}
        />
      )}
    </div>
  );
}
