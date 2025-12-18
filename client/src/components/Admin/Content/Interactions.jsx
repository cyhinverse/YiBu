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
      return <Heart size={18} className="text-red-500" fill="#ef4444" />;
    case 'comment':
      return <MessageCircle size={18} className="text-blue-500" />;
    case 'share':
      return <Share2 size={18} className="text-green-500" />;
    case 'follow':
      return <UserPlus size={18} className="text-purple-500" />;
    case 'save':
      return <Bookmark size={18} className="text-yellow-500" />;
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
      return '';
  }
};

const getInteractionBg = type => {
  switch (type) {
    case 'like':
      return 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800';
    case 'comment':
      return 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800';
    case 'share':
      return 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800';
    case 'follow':
      return 'bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800';
    case 'save':
      return 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800';
    default:
      return 'bg-neutral-50 dark:bg-neutral-800 border-neutral-200 dark:border-neutral-700';
  }
};

const formatTime = date => {
  try {
    return formatDistanceToNow(new Date(date), { addSuffix: true, locale: vi });
  } catch {
    return date;
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

    dispatch(getInteractions(params));
  }, [dispatch, currentPage, filterType]);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchTerm !== undefined) {
        const params = {
          page: 1,
          limit: 20,
          search: searchTerm || undefined,
        };
        if (filterType !== 'all') params.type = filterType;
        dispatch(getInteractions(params));
        setCurrentPage(1);
      }
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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-black dark:text-white">
            Hoạt động tương tác
          </h1>
          <p className="text-neutral-500 dark:text-neutral-400 mt-1">
            Theo dõi các tương tác trên nền tảng
          </p>
        </div>
        <button
          onClick={handleRefresh}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 bg-neutral-100 dark:bg-neutral-800 rounded-lg font-medium text-sm hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors disabled:opacity-50"
        >
          <RefreshCcw size={16} className={loading ? 'animate-spin' : ''} />
          Làm mới
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
        <div className="bg-red-50 dark:bg-red-900/20 rounded-2xl p-4 border border-red-200 dark:border-red-800">
          <div className="flex items-center gap-2 mb-2">
            <Heart size={18} className="text-red-500" fill="#ef4444" />
            <span className="text-red-600 dark:text-red-400 text-sm font-medium">
              Lượt thích
            </span>
          </div>
          <p className="text-2xl font-bold text-red-700 dark:text-red-300">
            {(stats.likes || 0).toLocaleString()}
          </p>
        </div>

        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-2xl p-4 border border-blue-200 dark:border-blue-800">
          <div className="flex items-center gap-2 mb-2">
            <MessageCircle size={18} className="text-blue-500" />
            <span className="text-blue-600 dark:text-blue-400 text-sm font-medium">
              Bình luận
            </span>
          </div>
          <p className="text-2xl font-bold text-blue-700 dark:text-blue-300">
            {(stats.comments || 0).toLocaleString()}
          </p>
        </div>

        <div className="bg-green-50 dark:bg-green-900/20 rounded-2xl p-4 border border-green-200 dark:border-green-800">
          <div className="flex items-center gap-2 mb-2">
            <Share2 size={18} className="text-green-500" />
            <span className="text-green-600 dark:text-green-400 text-sm font-medium">
              Chia sẻ
            </span>
          </div>
          <p className="text-2xl font-bold text-green-700 dark:text-green-300">
            {(stats.shares || 0).toLocaleString()}
          </p>
        </div>

        <div className="bg-purple-50 dark:bg-purple-900/20 rounded-2xl p-4 border border-purple-200 dark:border-purple-800">
          <div className="flex items-center gap-2 mb-2">
            <UserPlus size={18} className="text-purple-500" />
            <span className="text-purple-600 dark:text-purple-400 text-sm font-medium">
              Theo dõi
            </span>
          </div>
          <p className="text-2xl font-bold text-purple-700 dark:text-purple-300">
            {(stats.follows || 0).toLocaleString()}
          </p>
        </div>

        <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-2xl p-4 border border-yellow-200 dark:border-yellow-800 col-span-2 sm:col-span-1">
          <div className="flex items-center gap-2 mb-2">
            <Bookmark size={18} className="text-yellow-500" />
            <span className="text-yellow-600 dark:text-yellow-400 text-sm font-medium">
              Lưu bài
            </span>
          </div>
          <p className="text-2xl font-bold text-yellow-700 dark:text-yellow-300">
            {(stats.saves || 0).toLocaleString()}
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search
            size={18}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400"
          />
          <input
            type="text"
            placeholder="Tìm kiếm người dùng..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-black dark:text-white focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white"
          />
        </div>

        <select
          value={filterType}
          onChange={e => {
            setFilterType(e.target.value);
            setCurrentPage(1);
          }}
          className="px-4 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-black dark:text-white focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white"
        >
          <option value="all">Tất cả tương tác</option>
          <option value="like">Lượt thích</option>
          <option value="comment">Bình luận</option>
          <option value="share">Chia sẻ</option>
          <option value="follow">Theo dõi</option>
          <option value="save">Lưu bài</option>
        </select>
      </div>

      {/* Loading State */}
      {loading && interactionsList.length === 0 ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 size={24} className="animate-spin text-neutral-400" />
        </div>
      ) : interactionsList.length === 0 ? (
        <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 p-12 text-center">
          <Activity size={48} className="mx-auto mb-4 text-neutral-300" />
          <h3 className="text-lg font-semibold text-black dark:text-white mb-2">
            Chưa có tương tác
          </h3>
          <p className="text-neutral-500">Không có tương tác nào để hiển thị</p>
        </div>
      ) : (
        <>
          {/* Interactions List */}
          <div className="space-y-3">
            {interactionsList.map(interaction => (
              <div
                key={interaction._id}
                className={`rounded-2xl border p-4 ${getInteractionBg(
                  interaction.type
                )}`}
              >
                <div className="flex items-start gap-3">
                  {/* User Avatar */}
                  <img
                    src={
                      interaction.user?.avatar ||
                      `https://ui-avatars.com/api/?name=${
                        interaction.user?.name || 'U'
                      }&background=random`
                    }
                    alt={interaction.user?.name || 'User'}
                    className="w-10 h-10 rounded-full border-2 border-white dark:border-neutral-700 flex-shrink-0 object-cover"
                  />

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-black dark:text-white">
                        {interaction.user?.name || 'Người dùng'}
                      </span>
                      <span className="text-neutral-500 dark:text-neutral-400 text-sm">
                        @{interaction.user?.username || 'unknown'}
                      </span>
                      <span className="flex items-center gap-1.5 text-sm">
                        {getInteractionIcon(interaction.type)}
                        <span className="text-neutral-600 dark:text-neutral-400">
                          {getInteractionText(interaction.type)}
                        </span>
                      </span>
                    </div>

                    {/* Target */}
                    {interaction.target?.type === 'user' ? (
                      <p className="mt-2 text-sm text-black dark:text-white">
                        <span className="font-medium">
                          {interaction.target.name}
                        </span>{' '}
                        <span className="text-neutral-500 dark:text-neutral-400">
                          {interaction.target.username}
                        </span>
                      </p>
                    ) : interaction.target ? (
                      <div className="mt-2 p-2 bg-white/50 dark:bg-black/20 rounded-lg">
                        <p className="text-sm text-neutral-600 dark:text-neutral-400 truncate">
                          "{interaction.target.preview}"
                        </p>
                        <p className="text-xs text-neutral-500 dark:text-neutral-500 mt-1">
                          bởi {interaction.target.author}
                        </p>
                      </div>
                    ) : null}

                    {/* Comment Content */}
                    {interaction.content && (
                      <p className="mt-2 text-sm text-black dark:text-white p-2 bg-white/50 dark:bg-black/20 rounded-lg">
                        "{interaction.content}"
                      </p>
                    )}

                    {/* Time */}
                    <div className="flex items-center gap-1.5 mt-2 text-xs text-neutral-500 dark:text-neutral-400">
                      <Calendar size={12} />
                      {formatTime(interaction.createdAt)}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between">
            <p className="text-sm text-neutral-500 dark:text-neutral-400">
              Hiển thị {interactionsList.length} / {pagination?.total || 0}{' '}
              tương tác
            </p>
            <div className="flex items-center gap-2">
              <button
                disabled={currentPage === 1 || loading}
                onClick={() => handlePageChange(currentPage - 1)}
                className="p-2 rounded-lg border border-neutral-200 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-800 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronLeft size={18} />
              </button>
              <span className="px-4 py-2 text-sm">
                Trang {currentPage} / {pagination?.totalPages || 1}
              </span>
              <button
                disabled={!pagination?.hasMore || loading}
                onClick={() => handlePageChange(currentPage + 1)}
                className="p-2 rounded-lg border border-neutral-200 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-800 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronRight size={18} />
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
