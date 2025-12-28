import { useState } from 'react';
import {
  CheckCircle,
  Clock,
  Trash2,
  RefreshCcw,
  Check,
  Loader2,
  Info,
  AlertTriangle,
  AlertCircle,
  Sparkles,
  Bell,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import {
  useNotificationsPage,
  useUnreadCount,
  useMarkAsRead,
  useMarkAllAsRead,
  useDeleteNotification,
  useDeleteAllNotifications,
} from '@/hooks/useNotificationQuery';
import toast from 'react-hot-toast';

const Notifications = () => {
  const [filterType, setFilterType] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const LIMIT = 10;

  // Data Fetching
  const { data, isLoading, isPreviousData, refetch } = useNotificationsPage(
    currentPage,
    LIMIT,
    filterType
  );

  const { data: unreadCount = 0 } = useUnreadCount();

  // Mutations
  const { mutate: markAsRead } = useMarkAsRead();
  const { mutate: markAllAsRead } = useMarkAllAsRead();
  const { mutateAsync: deleteNotification } = useDeleteNotification();
  const { mutateAsync: deleteAllNotifications } = useDeleteAllNotifications();

  // Derived state
  const notifications = data?.notifications || [];
  const pagination = data?.pagination || {};

  const handleMarkAsRead = id => {
    markAsRead(id);
  };

  const handleMarkAllAsRead = () => {
    markAllAsRead(undefined, {
      onError: () => toast.error('Không thể đánh dấu tất cả là đã đọc'),
      onSuccess: () => toast.success('Đã đánh dấu tất cả là đã đọc'),
    });
  };

  const handleDelete = async id => {
    try {
      await deleteNotification(id);
      toast.success('Đã xóa thông báo');
    } catch (err) {
      toast.error('Không thể xóa thông báo');
    }
  };

  const handleDeleteAll = async () => {
    if (window.confirm('Bạn có chắc chắn muốn xóa tất cả thông báo không?')) {
      try {
        await deleteAllNotifications();
        toast.success('Đã xóa tất cả thông báo');
      } catch (err) {
        toast.error('Không thể xóa tất cả thông báo');
      }
    }
  };

  const refreshType = () => {
    refetch();
    toast.success('Đã làm mới thông báo');
  };

  const getIcon = type => {
    switch (type) {
      case 'info':
        return <Info size={24} className="text-blue-500" />;
      case 'success':
        return <CheckCircle size={24} className="text-emerald-500" />;
      case 'warning':
        return <AlertTriangle size={24} className="text-amber-500" />;
      case 'alert':
        return <AlertCircle size={24} className="text-rose-500" />;
      default:
        return <Sparkles size={24} className="text-violet-500" />;
    }
  };

  const getTypeLabel = type => {
    const labels = {
      all: 'Tất cả',
      info: 'Thông tin',
      success: 'Thành công',
      warning: 'Cảnh báo',
      alert: 'Lỗi',
    };
    return labels[type] || type;
  };

  const getTypeColor = type => {
    switch (type) {
      case 'info':
        return 'bg-blue-50 text-blue-600 border-blue-100';
      case 'success':
        return 'bg-emerald-50 text-emerald-600 border-emerald-100';
      case 'warning':
        return 'bg-amber-50 text-amber-600 border-amber-100';
      case 'alert':
        return 'bg-rose-50 text-rose-600 border-rose-100';
      default:
        return 'bg-neutral-100 text-neutral-600 border-neutral-200';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
        <div>
          <h2 className="text-2xl font-bold text-neutral-900 dark:text-white tracking-tight flex items-center gap-3">
            <Bell className="text-neutral-900 dark:text-white" size={24} />
            Thông báo hệ thống
          </h2>
          <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1 flex items-center gap-2">
            Bạn có{' '}
            <span className="font-bold text-rose-500 bg-rose-50 dark:bg-rose-900/20 px-2 py-0.5 rounded-full border border-rose-100 dark:border-rose-800">
              {unreadCount}
            </span>{' '}
            thông báo chưa đọc
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={refreshType}
            className="p-2 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-full text-neutral-500 hover:text-black dark:text-neutral-400 dark:hover:text-white transition-colors"
            title="Làm mới"
          >
            <RefreshCcw size={20} />
          </button>
          <button
            onClick={handleMarkAllAsRead}
            disabled={unreadCount === 0}
            className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-neutral-600 dark:text-neutral-300 rounded-full hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-all font-bold text-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Check size={16} />
            <span className="hidden sm:inline">Đánh dấu tất cả</span>
          </button>
          <button
            onClick={handleDeleteAll}
            disabled={notifications.length === 0}
            className="flex items-center gap-2 px-4 py-2 bg-rose-50 dark:bg-rose-900/20 border border-rose-100 dark:border-rose-800 text-rose-600 dark:text-rose-400 rounded-full hover:bg-rose-100 dark:hover:bg-rose-900/30 transition-all font-bold text-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Trash2 size={16} />
            <span className="hidden sm:inline">Xóa tất cả</span>
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="overflow-x-auto pb-2 -mx-2 px-2">
        <div className="flex gap-2">
          {['all', 'info', 'success', 'warning', 'alert'].map(type => (
            <button
              key={type}
              onClick={() => {
                setFilterType(type);
                setCurrentPage(1);
              }}
              className={`px-4 py-2 rounded-full text-sm font-bold whitespace-nowrap transition-all border ${
                filterType === type
                  ? 'bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 border-neutral-900 dark:border-white'
                  : 'bg-white dark:bg-neutral-900 text-neutral-500 border-neutral-200 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-800'
              }`}
            >
              {getTypeLabel(type)}
            </button>
          ))}
        </div>
      </div>

      {/* Main Content */}
      <div className="bg-white dark:bg-neutral-900 rounded-3xl border border-neutral-200 dark:border-neutral-800 shadow-sm overflow-hidden min-h-[400px] flex flex-col">
        {isLoading ? (
          <div className="flex-1 flex flex-col items-center justify-center p-12 text-neutral-400 gap-3">
            <Loader2
              size={32}
              className="animate-spin text-neutral-900 dark:text-white"
            />
            <span className="font-medium">Đang tải thông báo...</span>
          </div>
        ) : notifications.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center p-12 text-center text-neutral-500 gap-4">
            <div className="p-4 bg-neutral-50 dark:bg-neutral-800 rounded-full">
              <Bell
                size={32}
                className="text-neutral-300 dark:text-neutral-600"
              />
            </div>
            <p className="text-lg font-medium text-neutral-900 dark:text-white">
              Không có thông báo nào
            </p>
            <p className="text-sm">Hiện tại bạn không có thông báo mới nào.</p>
          </div>
        ) : (
          <div className="divide-y divide-neutral-100 dark:divide-neutral-800">
            {notifications.map(notification => (
              <div
                key={notification._id}
                className={`p-5 flex gap-5 transition-all group ${
                  !notification.isRead
                    ? 'bg-blue-50/30 dark:bg-blue-900/10'
                    : 'hover:bg-neutral-50 dark:hover:bg-neutral-800/50'
                }`}
              >
                <div
                  className={`mt-1 flex-shrink-0 p-2.5 rounded-2xl ${getTypeColor(
                    notification.type
                  )} bg-opacity-50`}
                >
                  {getIcon(notification.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <p
                      className={`text-base leading-snug ${
                        !notification.isRead
                          ? 'font-bold text-neutral-900'
                          : 'font-medium text-neutral-700'
                      }`}
                    >
                      {notification.title}
                    </p>
                    <span className="text-xs font-medium text-neutral-400 whitespace-nowrap flex items-center gap-1.5 bg-neutral-50 px-2 py-1 rounded-full border border-neutral-100">
                      <Clock size={12} />
                      {new Date(notification.createdAt).toLocaleString('vi-VN')}
                    </span>
                  </div>
                  <p className="text-sm text-neutral-500 mt-1.5 leading-relaxed">
                    {notification.message}
                  </p>
                </div>
                <div className="flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  {!notification.isRead && (
                    <button
                      onClick={() => handleMarkAsRead(notification._id)}
                      className="p-2 text-blue-500 hover:bg-blue-100 rounded-xl transition-colors bg-white border border-neutral-100 shadow-sm"
                      title="Đánh dấu đã đọc"
                    >
                      <CheckCircle size={18} />
                    </button>
                  )}
                  <button
                    onClick={() => handleDelete(notification._id)}
                    className="p-2 text-neutral-400 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-colors bg-white border border-neutral-100 shadow-sm"
                    title="Xóa"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Pagination */}
      {pagination && pagination.pages > 1 && (
        <div className="flex items-center justify-between bg-white p-4 rounded-3xl border border-neutral-100 shadow-sm">
          <div className="text-sm text-neutral-500 px-2">
            Đang hiển thị trang{' '}
            <span className="font-bold text-neutral-900">{currentPage}</span> /{' '}
            {pagination.pages}
          </div>
          <div className="flex gap-2">
            <button
              disabled={currentPage === 1 || isLoading}
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              className="px-4 py-2 rounded-full border border-neutral-200 text-neutral-600 hover:bg-neutral-50 hover:text-neutral-900 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1 font-medium text-sm transition-all"
            >
              <ChevronLeft size={16} />
              Trước
            </button>
            <button
              disabled={
                currentPage >= pagination.pages || isLoading || isPreviousData
              }
              onClick={() => {
                if (!isPreviousData && currentPage < pagination.pages) {
                  setCurrentPage(p => p + 1);
                }
              }}
              className="px-4 py-2 rounded-full border border-neutral-200 text-neutral-600 hover:bg-neutral-50 hover:text-neutral-900 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1 font-medium text-sm transition-all"
            >
              Tiếp
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Notifications;
