import { useState, useEffect } from 'react';
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
    <div className="space-y-8 animate-in fade-in duration-500 pb-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-white tracking-tight flex items-center gap-3">
            <Activity className="text-neutral-900 dark:text-white" size={24} />
            Hoạt động tương tác
          </h1>
          <p className="text-neutral-500 font-medium mt-2">
            Quản lý và theo dõi các hoạt động tương tác trong hệ thống
          </p>
        </div>
        <button
          onClick={handleRefresh}
          disabled={loading}
          className="p-3 rounded-full bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-800 text-neutral-600 dark:text-neutral-300 transition-all shadow-sm hover:shadow-md disabled:opacity-50"
        >
          <RefreshCcw size={20} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>

      {/* Stats Cards */}
      <InteractionStats stats={interactionStats} />

      {/* Filters & Content Container */}
      <div className="bg-white dark:bg-neutral-900 rounded-3xl border border-neutral-200 dark:border-neutral-800 shadow-sm overflow-hidden">
        {/* Toolbar */}
        <div className="p-6 border-b border-neutral-100 dark:border-neutral-800 flex flex-col md:flex-row gap-4 bg-neutral-50/50 dark:bg-neutral-800/20">
          <div className="relative flex-1">
            <Search
              size={18}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400"
            />
            <input
              type="text"
              placeholder="Tìm kiếm người dùng..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-11 pr-4 py-3 rounded-full bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 focus:ring-2 focus:ring-neutral-900 dark:focus:ring-white focus:border-transparent outline-none transition-all text-sm font-medium"
            />
          </div>

          <div className="relative w-full md:w-64">
            <Filter
              size={18}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400"
            />
            <select
              value={filterType}
              onChange={e => {
                setFilterType(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-11 pr-10 py-3 rounded-full bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 focus:ring-2 focus:ring-neutral-900 dark:focus:ring-white focus:border-transparent outline-none transition-all text-sm font-medium appearance-none cursor-pointer"
            >
              <option value="all">Tất cả tương tác</option>
              <option value="like">Lượt thích</option>
              <option value="comment">Bình luận</option>
              <option value="share">Chia sẻ</option>
              <option value="follow">Theo dõi</option>
              <option value="save">Lưu bài</option>
            </select>
            <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-neutral-400">
              <ChevronRight size={14} className="rotate-90" />
            </div>
          </div>
        </div>

        {/* Content Area */}
        <div className="p-6 min-h-[400px]">
          <InteractionsList interactions={interactionsList} loading={loading} />
        </div>

        {/* Pagination */}
        {interactionsList.length > 0 && (
          <div className="p-6 border-t border-neutral-100 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-800/20 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-sm font-medium text-neutral-500">
              Hiển thị{' '}
              <span className="font-bold text-neutral-900 dark:text-white">
                {interactionsList.length}
              </span>{' '}
              /{' '}
              <span className="font-bold text-neutral-900 dark:text-white">
                {pagination?.total || 0}
              </span>{' '}
              tương tác
            </p>

            <div className="flex items-center gap-2">
              <button
                disabled={currentPage === 1 || loading}
                onClick={() => handlePageChange(currentPage - 1)}
                className="p-2 rounded-full hover:bg-neutral-200 dark:hover:bg-neutral-700 disabled:opacity-30 transition-colors text-neutral-600 dark:text-neutral-400"
              >
                <ChevronLeft size={20} />
              </button>

              <div className="h-8 w-8 flex items-center justify-center bg-neutral-900 dark:bg-white text-white dark:text-black rounded-full text-sm font-bold">
                {currentPage}
              </div>

              <button
                disabled={!pagination?.hasMore || loading}
                onClick={() => handlePageChange(currentPage + 1)}
                className="p-2 rounded-full hover:bg-neutral-200 dark:hover:bg-neutral-700 disabled:opacity-30 transition-colors text-neutral-600 dark:text-neutral-400"
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
