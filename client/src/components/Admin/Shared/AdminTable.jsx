import { useState } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  ChevronDown,
  Search,
  MoreHorizontal,
} from 'lucide-react';

/**
 * Reusable Admin Table Component
 *
 * @param {Object} props
 * @param {Array} props.columns - Array of column definitions { key, label, sortable, render }
 * @param {Array} props.data - Array of data objects
 * @param {Function} props.onRowClick - Optional callback when row is clicked
 * @param {boolean} props.searchable - Enable search functionality
 * @param {string} props.searchPlaceholder - Placeholder for search input
 * @param {Function} props.renderActions - Optional function to render row actions
 * @param {number} props.pageSize - Items per page (default: 10)
 */
export default function AdminTable({
  columns = [],
  data = [],
  onRowClick,
  searchable = false,
  searchPlaceholder = 'Tìm kiếm...',
  renderActions,
  pageSize = 10,
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
  const [currentPage, setCurrentPage] = useState(1);
  const [activeDropdown, setActiveDropdown] = useState(null);

  // Filter data based on search term
  const filteredData = data.filter(item => {
    if (!searchTerm) return true;
    return columns.some(col => {
      const value = item[col.key];
      if (typeof value === 'string') {
        return value.toLowerCase().includes(searchTerm.toLowerCase());
      }
      if (typeof value === 'object' && value !== null) {
        return Object.values(value).some(
          v =>
            typeof v === 'string' &&
            v.toLowerCase().includes(searchTerm.toLowerCase())
        );
      }
      return false;
    });
  });

  // Sort data
  const sortedData = [...filteredData].sort((a, b) => {
    if (!sortConfig.key) return 0;

    let aValue = a[sortConfig.key];
    let bValue = b[sortConfig.key];

    // Handle nested objects
    if (typeof aValue === 'object') aValue = JSON.stringify(aValue);
    if (typeof bValue === 'object') bValue = JSON.stringify(bValue);

    if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
    if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
    return 0;
  });

  // Paginate data
  const totalPages = Math.ceil(sortedData.length / pageSize);
  const paginatedData = sortedData.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  const handleSort = key => {
    if (!columns.find(col => col.key === key)?.sortable) return;

    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc',
    }));
  };

  const renderSortIcon = key => {
    if (sortConfig.key !== key) return null;
    return sortConfig.direction === 'asc' ? (
      <ChevronUp size={14} />
    ) : (
      <ChevronDown size={14} />
    );
  };

  return (
    <div className="space-y-6">
      {/* Search & Actions */}
      {searchable && (
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <Search
              size={18}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-secondary group-focus-within:text-primary transition-colors"
            />
            <input
              type="text"
              placeholder={searchPlaceholder}
              value={searchTerm}
              onChange={e => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="yb-input pl-11 py-2.5 w-full text-sm"
            />
          </div>
        </div>
      )}

      {/* Table Container */}
      <div className="yb-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b border-border bg-surface-secondary/50">
                {columns.map(col => (
                  <th
                    key={col.key}
                    onClick={() => col.sortable && handleSort(col.key)}
                    className={`text-left px-6 py-4 text-xs font-bold text-secondary uppercase tracking-wider ${
                      col.sortable
                        ? 'cursor-pointer hover:text-primary transition-colors'
                        : ''
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      {col.label}
                      {col.sortable && (
                        <div className="flex flex-col text-border">
                          <ChevronUp
                            size={12}
                            className={
                              sortConfig.key === col.key &&
                              sortConfig.direction === 'asc'
                                ? 'text-primary'
                                : ''
                            }
                          />
                          <ChevronDown
                            size={12}
                            className={
                              sortConfig.key === col.key &&
                              sortConfig.direction === 'desc'
                                ? 'text-primary'
                                : ''
                            }
                          />
                        </div>
                      )}
                    </div>
                  </th>
                ))}
                {renderActions && (
                  <th className="px-6 py-4 text-xs font-bold text-secondary uppercase tracking-wider text-right">
                    Thao tác
                  </th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {paginatedData.length === 0 ? (
                <tr>
                  <td
                    colSpan={columns.length + (renderActions ? 1 : 0)}
                    className="px-6 py-16 text-center text-secondary font-medium"
                  >
                    Không có dữ liệu
                  </td>
                </tr>
              ) : (
                paginatedData.map((row, rowIndex) => (
                  <tr
                    key={row.id || rowIndex}
                    onClick={() => onRowClick && onRowClick(row)}
                    className={`group hover:bg-surface-secondary/50 transition-colors ${
                      onRowClick ? 'cursor-pointer' : ''
                    }`}
                  >
                    {columns.map(col => (
                      <td key={col.key} className="px-6 py-5 text-sm">
                        {col.render ? (
                          col.render(row[col.key], row)
                        ) : (
                          <span className="text-content font-medium">
                            {row[col.key]}
                          </span>
                        )}
                      </td>
                    ))}
                    {renderActions && (
                      <td className="px-6 py-5 text-right">
                        <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-all">
                          {renderActions(row, () => setActiveDropdown(null))}
                        </div>
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-2">
          <p className="text-sm text-secondary font-medium order-2 sm:order-1">
            Hiển thị{' '}
            <span className="text-primary">
              {(currentPage - 1) * pageSize + 1}
            </span>{' '}
            -{' '}
            <span className="text-primary">
              {Math.min(currentPage * pageSize, sortedData.length)}
            </span>{' '}
            trong <span className="text-primary">{sortedData.length}</span> bản
            ghi
          </p>
          <div className="flex items-center gap-2 order-1 sm:order-2">
            <button
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(p => p - 1)}
              className="p-2 rounded-xl border border-border bg-surface hover:bg-surface-hover disabled:opacity-40 transition-all text-secondary"
            >
              <ChevronLeft size={18} />
            </button>

            <div className="flex items-center gap-1">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum;
                if (totalPages <= 5) {
                  pageNum = i + 1;
                } else if (currentPage <= 3) {
                  pageNum = i + 1;
                } else if (currentPage >= totalPages - 2) {
                  pageNum = totalPages - 4 + i;
                } else {
                  pageNum = currentPage - 2 + i;
                }

                return (
                  <button
                    key={pageNum}
                    onClick={() => setCurrentPage(pageNum)}
                    className={`w-10 h-10 rounded-xl text-sm font-bold transition-all ${
                      currentPage === pageNum
                        ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20'
                        : 'hover:bg-surface-hover text-secondary'
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}
            </div>

            <button
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage(p => p + 1)}
              className="p-2 rounded-xl border border-border bg-surface hover:bg-surface-hover disabled:opacity-40 transition-all text-secondary"
            >
              <ChevronRight size={18} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
