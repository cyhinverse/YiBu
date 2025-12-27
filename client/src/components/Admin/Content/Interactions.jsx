import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  Search,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Heart,
  MessageCircle,
  Share2,
  UserPlus,
  Bookmark,
  Activity,
  RefreshCcw,
  Loader2,
} from 'lucide-react';
import { getInteractions } from '../../../redux/actions/adminActions';
import { formatDistanceToNow } from 'date-fns';
import { vi } from 'date-fns/locale';

const getInteractionIcon = type => {
  switch (type) {
    case 'like':
      return <Heart size={18} className="text-red-500" fill="currentColor" />;
    case 'comment':
      return <MessageCircle size={18} className="text-blue-500" />;
    case 'share':
      return <Share2 size={18} className="text-green-500" />;
    case 'follow':
      return <UserPlus size={18} className="text-purple-500" />;
    case 'save':
      return (
        <Bookmark size={18} className="text-amber-500" fill="currentColor" />
      );
    default:
      return <Activity size={18} className="text-neutral-500" />;
  }
};

const getInteractionText = type => {
  switch (type) {
    case 'like':
      return 'đã thích';
    case 'comment':
      return 'đã bình luận';
    case 'share':
      return 'đã chia sẻ';
    case 'follow':
      return 'đã theo dõi';
    case 'save':
      return 'đã lưu';
    default:
      return 'tương tác';
  }
};

const getInteractionBg = type => {
  switch (type) {
    case 'like':
      return 'bg-red-50/50 dark:bg-red-900/10 border-red-100 dark:border-red-900/20';
    case 'comment':
      return 'bg-blue-50/50 dark:bg-blue-900/10 border-blue-100 dark:border-blue-900/20';
    case 'share':
      return 'bg-green-50/50 dark:bg-green-900/10 border-green-100 dark:border-green-900/20';
    case 'follow':
      return 'bg-purple-50/50 dark:bg-purple-900/10 border-purple-100 dark:border-purple-900/20';
    case 'save':
      return 'bg-amber-50/50 dark:bg-amber-900/10 border-amber-100 dark:border-amber-900/20';
    default:
      return 'bg-neutral-50/50 dark:bg-neutral-800/50 border-neutral-100 dark:border-neutral-800';
  }
};

const formatTime = date => {
  try {
    return formatDistanceToNow(new Date(date), { addSuffix: true, locale: vi });
  } catch {
    return 'vừa xong';
  }
};

export default function Interactions() {
  const dispatch = useDispatch();
  const { interactions, interactionStats, pagination, loading } = useSelector(
    state => state.admin
  );

  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);

  // Fetch interactions on mount and when filters change
  useEffect(() => {
    const params = {
      page: currentPage,
      limit: 20,
    };
    if (filterType !== 'all') params.type = filterType;
    if (searchTerm) params.search = searchTerm;

    dispatch(getInteractions(params));
  }, [dispatch, currentPage, filterType]);

  // Handle search with debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      const params = {
        page: 1,
        limit: 20,
        search: searchTerm || undefined,
      };
      if (filterType !== 'all') params.type = filterType;
      dispatch(getInteractions(params));
      setCurrentPage(1);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const handleRefresh = () => {
    const params = {
      page: currentPage,
      limit: 20,
    };
    if (filterType !== 'all') params.type = filterType;
    if (searchTerm) params.search = searchTerm;
    dispatch(getInteractions(params));
  };

  const handlePageChange = newPage => {
    setCurrentPage(newPage);
  };

  const interactionsList = Array.isArray(interactions) ? interactions : [];
  const stats = interactionStats || {
    likes: 0,
    comments: 0,
    shares: 0,
    follows: 0,
    saves: 0,
  };

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
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="yb-card p-4 border-l-4 border-l-red-500 bg-red-50/30 dark:bg-red-950/10">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400">
              <Heart size={20} fill="currentColor" />
            </div>
            <span className="text-neutral-600 dark:text-neutral-400 text-sm font-medium">
              Lượt thích
            </span>
          </div>
          <p className="text-2xl font-bold text-black dark:text-white">
            {(stats.likes || 0).toLocaleString()}
          </p>
        </div>

        <div className="yb-card p-4 border-l-4 border-l-blue-500 bg-blue-50/30 dark:bg-blue-950/10">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400">
              <MessageCircle size={20} />
            </div>
            <span className="text-neutral-600 dark:text-neutral-400 text-sm font-medium">
              Bình luận
            </span>
          </div>
          <p className="text-2xl font-bold text-black dark:text-white">
            {(stats.comments || 0).toLocaleString()}
          </p>
        </div>

        <div className="yb-card p-4 border-l-4 border-l-green-500 bg-green-50/30 dark:bg-green-950/10">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400">
              <Share2 size={20} />
            </div>
            <span className="text-neutral-600 dark:text-neutral-400 text-sm font-medium">
              Chia sẻ
            </span>
          </div>
          <p className="text-2xl font-bold text-black dark:text-white">
            {(stats.shares || 0).toLocaleString()}
          </p>
        </div>

        <div className="yb-card p-4 border-l-4 border-l-purple-500 bg-purple-50/30 dark:bg-purple-950/10">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400">
              <UserPlus size={20} />
            </div>
            <span className="text-neutral-600 dark:text-neutral-400 text-sm font-medium">
              Theo dõi
            </span>
          </div>
          <p className="text-2xl font-bold text-black dark:text-white">
            {(stats.follows || 0).toLocaleString()}
          </p>
        </div>

        <div className="yb-card p-4 border-l-4 border-l-amber-500 bg-amber-50/30 dark:bg-amber-950/10 col-span-2 lg:col-span-1">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400">
              <Bookmark size={20} fill="currentColor" />
            </div>
            <span className="text-neutral-600 dark:text-neutral-400 text-sm font-medium">
              Lưu bài
            </span>
          </div>
          <p className="text-2xl font-bold text-black dark:text-white">
            {(stats.saves || 0).toLocaleString()}
          </p>
        </div>
      </div>

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
        {loading && interactionsList.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800">
            <Loader2 size={32} className="animate-spin text-indigo-500 mb-4" />
            <p className="text-neutral-500">Đang tải dữ liệu...</p>
          </div>
        ) : interactionsList.length === 0 ? (
          <div className="yb-card p-20 text-center">
            <div className="w-16 h-16 bg-neutral-100 dark:bg-neutral-800 rounded-full flex items-center justify-center mx-auto mb-4">
              <Activity size={32} className="text-neutral-400" />
            </div>
            <h3 className="text-lg font-semibold text-black dark:text-white mb-2">
              Chưa có tương tác nào
            </h3>
            <p className="text-neutral-500 max-w-xs mx-auto">
              Không tìm thấy hoạt động tương tác nào phù hợp với bộ lọc hiện
              tại.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="grid gap-4">
              {interactionsList.map(interaction => (
                <div
                  key={interaction._id}
                  className={`yb-card p-4 transition-all hover:shadow-lg border-2 ${getInteractionBg(
                    interaction.type
                  )}`}
                >
                  <div className="flex items-start gap-4">
                    {/* User Avatar */}
                    <div className="relative">
                      <img
                        src={
                          interaction.user?.avatar ||
                          `https://ui-avatars.com/api/?name=${encodeURIComponent(
                            interaction.user?.name || 'U'
                          )}&background=random`
                        }
                        alt={interaction.user?.name || 'User'}
                        className="w-12 h-12 rounded-full ring-2 ring-white dark:ring-neutral-700 object-cover shadow-sm bg-neutral-200"
                      />
                      <div className="absolute -bottom-1 -right-1 p-1 rounded-full bg-white dark:bg-neutral-900 shadow-sm ring-1 ring-neutral-200 dark:ring-neutral-700">
                        {getInteractionIcon(interaction.type)}
                      </div>
                    </div>

                    {/* Main Content Area */}
                    <div className="flex-1 min-w-0">
                      {/* Header: User & Sentiment */}
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <div className="flex flex-col sm:flex-row sm:items-center gap-x-2">
                          <span className="font-bold text-black dark:text-white hover:underline cursor-pointer">
                            {interaction.user?.name || 'Người dùng'}
                          </span>
                          <span className="text-neutral-500 text-sm">
                            @{interaction.user?.username || 'unknown'}
                          </span>
                        </div>

                        {interaction.sentiment && (
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                              interaction.sentiment === 'positive'
                                ? 'bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-400'
                                : interaction.sentiment === 'negative'
                                ? 'bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-400'
                                : 'bg-neutral-100 text-neutral-600 border-neutral-200 dark:bg-neutral-800 dark:text-neutral-400'
                            }`}
                          >
                            {interaction.sentiment === 'positive'
                              ? 'Tích cực'
                              : interaction.sentiment === 'negative'
                              ? 'Tiêu cực'
                              : 'Trung lập'}
                          </span>
                        )}
                      </div>

                      {/* Action & Target */}
                      <div className="flex flex-wrap items-center gap-1.5 text-sm mb-3">
                        <span className="text-neutral-600 dark:text-neutral-400">
                          {getInteractionText(interaction.type)}
                        </span>

                        {interaction.target?.type === 'user' ? (
                          <span className="text-neutral-600 dark:text-neutral-400">
                            người dùng{' '}
                            <span className="font-semibold text-black dark:text-white cursor-pointer hover:text-indigo-500 transition-colors">
                              {interaction.target.name}
                            </span>
                          </span>
                        ) : interaction.target ? (
                          <span className="text-neutral-600 dark:text-neutral-400">
                            bài viết của{' '}
                            <span className="font-semibold text-black dark:text-white cursor-pointer hover:text-indigo-500 transition-colors">
                              {interaction.target.author}
                            </span>
                          </span>
                        ) : null}
                      </div>

                      {/* Content Preview */}
                      {(interaction.content || interaction.target?.preview) && (
                        <div className="p-3 bg-white/50 dark:bg-black/20 rounded-xl border border-black/5 dark:border-white/5 mb-3 group relative">
                          {interaction.target?.preview && (
                            <div className="text-[10px] text-neutral-400 uppercase font-bold mb-1 opacity-50 group-hover:opacity-100 transition-opacity">
                              Xem trước bài viết
                            </div>
                          )}
                          <p className="text-sm text-neutral-700 dark:text-neutral-300 italic leading-snug">
                            "
                            {interaction.content || interaction.target?.preview}
                            "
                          </p>
                        </div>
                      )}

                      {/* Footer: Meta Info */}
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 pt-3 mt-3 border-t border-black/5 dark:border-white/5 text-[11px] text-neutral-500 dark:text-neutral-400">
                        <div
                          className="flex items-center gap-1.5"
                          title="Thời gian"
                        >
                          <Calendar size={12} />
                          <span>{formatTime(interaction.createdAt)}</span>
                        </div>

                        {interaction.context?.source && (
                          <div className="flex items-center gap-1.5">
                            <span className="opacity-60">Nguồn:</span>
                            <span className="font-semibold text-neutral-700 dark:text-neutral-300 capitalize">
                              {interaction.context.source}
                            </span>
                          </div>
                        )}

                        {interaction.context?.deviceType && (
                          <div className="flex items-center gap-1.5">
                            <span className="opacity-60">Thiết bị:</span>
                            <span className="font-semibold text-neutral-700 dark:text-neutral-300 capitalize">
                              {interaction.context.deviceType}
                            </span>
                          </div>
                        )}

                        {interaction.weight !== undefined && (
                          <div
                            className="ml-auto flex items-center gap-1 bg-neutral-100 dark:bg-neutral-800 px-2 py-0.5 rounded font-mono"
                            title="Độ ưu tiên / Trọng số AI"
                          >
                            <span className="opacity-60">SCORE:</span>
                            <span className="font-bold text-indigo-600 dark:text-indigo-400">
                              {interaction.weight}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
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
          </div>
        )}
      </div>
    </div>
  );
}
