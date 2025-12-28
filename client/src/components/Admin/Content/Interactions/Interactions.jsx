import { useState, useEffect } from 'react';
import { useDebounce } from '@/hooks/useDebounce';
import {
  Search,
  ChevronLeft,
  ChevronRight,
  Activity,
  RefreshCcw,
} from 'lucide-react';
import { useAdminInteractions } from '@/hooks/useAdminQuery';

import InteractionStats from './InteractionStats';
import InteractionsList from './InteractionsList';

export default function Interactions() {
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
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-black dark:text-white flex items-center gap-2">
            <Activity className="text-indigo-500" size={24} />
            Hoạt động tương tác
          </h1>
          <p className="text-neutral-500 dark:text-neutral-400 mt-1">
            Theo dõi và quản lý các lượt tương tác của người dùng
          </p>
        </div>
        <button
          onClick={handleRefresh}
          disabled={loading}
          className="yb-btn yb-btn-secondary"
        >
          <RefreshCcw size={16} className={loading ? 'animate-spin' : ''} />
          <span>Làm mới</span>
        </button>
      </div>

      {/* Stats Cards */}
      <InteractionStats stats={interactionStats} />

      {/* Filters & Search */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search
            size={18}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400"
          />
          <input
            type="text"
            placeholder="Tìm kiếm theo tên người dùng..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="yb-input pl-10 radius-lg"
          />
        </div>

        <select
          value={filterType}
          onChange={e => {
            setFilterType(e.target.value);
            setCurrentPage(1);
          }}
          className="yb-input w-full md:w-64 radius-lg"
        >
          <option value="all">Tất cả tương tác</option>
          <option value="like">Lượt thích</option>
          <option value="comment">Bình luận</option>
          <option value="share">Chia sẻ</option>
          <option value="follow">Theo dõi</option>
          <option value="save">Lưu bài</option>
        </select>
      </div>

      {/* Content Area */}
      <div className="relative">
        <InteractionsList interactions={interactionsList} loading={loading} />

        {/* Pagination */}
        {interactionsList.length > 0 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-neutral-100 dark:border-neutral-800">
            <p className="text-sm text-neutral-500">
              Hiển thị{' '}
              <span className="font-semibold text-black dark:text-white">
                {interactionsList.length}
              </span>{' '}
              /{' '}
              <span className="font-semibold text-black dark:text-white">
                {pagination?.total || 0}
              </span>{' '}
              tương tác
            </p>

            <div className="flex items-center gap-3">
              <button
                disabled={currentPage === 1 || loading}
                onClick={() => handlePageChange(currentPage - 1)}
                className="p-2 rounded-xl border border-neutral-200 dark:border-neutral-700 hover:bg-neutral-50 dark:hover:bg-neutral-800 disabled:opacity-30 transition-colors shadow-sm"
              >
                <ChevronLeft size={20} />
              </button>

              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">Trang</span>
                <div className="px-3 py-1 bg-neutral-100 dark:bg-neutral-800 rounded-lg text-sm font-bold text-indigo-600 dark:text-indigo-400">
                  {currentPage}
                </div>
                <span className="text-sm font-medium">
                  / {pagination?.totalPages || 1}
                </span>
              </div>

              <button
                disabled={!pagination?.hasMore || loading}
                onClick={() => handlePageChange(currentPage + 1)}
                className="p-2 rounded-xl border border-neutral-200 dark:border-neutral-700 hover:bg-neutral-50 dark:hover:bg-neutral-800 disabled:opacity-30 transition-colors shadow-sm"
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
