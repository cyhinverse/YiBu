import { useId, useState, useEffect } from 'react';
import { useDebounce } from '@/hooks/useDebounce';
import {
  Search,
  ChevronLeft,
  ChevronRight,
  Activity,
  RefreshCcw,
  Filter,
} from 'lucide-react';
import { useAdminInteractions } from '@/hooks/useAdminQuery';

import InteractionStats from './InteractionStats';
import InteractionsList from './InteractionsList';

export default function Interactions() {
  const interactionsSearchId = useId();
  const interactionsTypeId = useId();

  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearch = useDebounce(searchTerm, 500);
  const [filterType, setFilterType] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);

  // Reset page on search
  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearch]);

  const {
    data: interactionsData,
    isLoading: loading,
    refetch: refetchInteractions,
  } = useAdminInteractions({
    page: currentPage,
    limit: 20,
    type: filterType !== 'all' ? filterType : undefined,
    search: debouncedSearch || undefined,
  });

  const handleRefresh = () => {
    refetchInteractions();
  };

  const handlePageChange = newPage => {
    setCurrentPage(newPage);
  };

  const interactions = interactionsData?.interactions || [];
  const interactionStats = interactionsData?.interactionStats || {};
  const pagination = interactionsData?.pagination || {};

  const interactionsList = Array.isArray(interactions) ? interactions : [];

  return (
    <div className="admin-page pb-10">
      {/* Header */}
      <div className="admin-card p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--color-text-tertiary)]">
            Tương tác
          </p>
          <h1 className="text-2xl font-semibold text-[var(--color-content)] flex items-center gap-3">
            <Activity className="text-[var(--color-content)]" size={22} />
            Hoạt động tương tác
          </h1>
          <p className="text-[var(--color-text-secondary)] text-sm mt-1">
            Quản lý và theo dõi các hoạt động tương tác trong hệ thống
          </p>
        </div>
        <button
          type="button"
          onClick={handleRefresh}
          disabled={loading}
          onKeyDown={event => {
            if (event.key === 'Escape') {
              event.currentTarget.blur();
            }
          }}
          className="p-2 rounded-lg bg-[var(--color-surface-secondary)] text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-hover)] transition-colors disabled:opacity-50"
          aria-label="Làm mới tương tác"
        >
          <RefreshCcw size={20} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>

      {/* Stats Cards */}
      <InteractionStats stats={interactionStats} />

      {/* Filters & Content Container */}
      <div className="admin-card overflow-hidden">
        {/* Toolbar */}
        <div className="p-4 border-b border-[var(--color-border)] flex flex-col md:flex-row gap-4 bg-[var(--color-surface-secondary)]">
          <div className="relative flex-1">
            <label htmlFor={interactionsSearchId} className="sr-only">
              Tìm kiếm tương tác
            </label>
            <Search
              size={18}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--color-text-tertiary)]"
            />
            <input
              id={interactionsSearchId}
              type="text"
              placeholder="Tìm kiếm người dùng..."
              value={searchTerm}
              aria-label="Search interactions"
              onChange={e => setSearchTerm(e.target.value)}
              className="admin-input w-full pl-11"
            />
          </div>

          <div className="relative w-full md:w-64">
            <label htmlFor={interactionsTypeId} className="sr-only">
              Lọc loại tương tác
            </label>
            <Filter
              size={18}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--color-text-tertiary)]"
            />
            <select
              id={interactionsTypeId}
              value={filterType}
              onChange={e => {
                setFilterType(e.target.value);
                setCurrentPage(1);
              }}
              className="admin-select w-full pl-11 pr-10 appearance-none cursor-pointer"
            >
              <option value="all">Tất cả tương tác</option>
              <option value="like">Lượt thích</option>
              <option value="comment">Bình luận</option>
              <option value="share">Chia sẻ</option>
              <option value="follow">Theo dõi</option>
              <option value="save">Lưu bài</option>
            </select>
            <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-[var(--color-text-tertiary)]">
              <ChevronRight size={14} className="rotate-90" />
            </div>
          </div>
        </div>

        {/* Content Area */}
        <div className="p-5 min-h-[400px]">
          <InteractionsList interactions={interactionsList} loading={loading} />
        </div>

        {/* Pagination */}
        {interactionsList.length > 0 && (
          <div className="p-4 border-t border-[var(--color-border)] bg-[var(--color-surface-secondary)] flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-sm font-medium text-[var(--color-text-secondary)]">
              Hiển thị{' '}
              <span className="font-semibold text-[var(--color-content)]">
                {interactionsList.length}
              </span>{' '}
              /{' '}
              <span className="font-semibold text-[var(--color-content)]">
                {pagination?.total || 0}
              </span>{' '}
              tương tác
            </p>

            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={currentPage === 1 || loading}
                onClick={() => handlePageChange(currentPage - 1)}
                className="p-2 rounded-lg hover:bg-[var(--color-surface-hover)] disabled:opacity-30 transition-colors text-[var(--color-text-secondary)]"
              >
                <ChevronLeft size={20} />
              </button>

              <div className="h-8 w-8 flex items-center justify-center bg-[var(--color-primary)] text-[var(--color-primary-foreground)] rounded-full text-sm font-semibold">
                {currentPage}
              </div>

              <button
                type="button"
                disabled={!pagination?.hasMore || loading}
                onClick={() => handlePageChange(currentPage + 1)}
                className="p-2 rounded-lg hover:bg-[var(--color-surface-hover)] disabled:opacity-30 transition-colors text-[var(--color-text-secondary)]"
              >
                <ChevronRight size={20} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>

  );
}
