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
import { notify } from '@/utils/notify';

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
      onError: () => notify.error('Không thể đánh dấu tất cả là đã đọc'),
      onSuccess: () => notify.success('Đã đánh dấu tất cả là đã đọc'),
    });
  };

  const handleDelete = async id => {
    try {
      await deleteNotification(id);
      notify.success('Đã xóa thông báo');
    } catch {
      notify.error('Không thể xóa thông báo');
    }
  };

  const handleDeleteAll = async () => {
    if (window.confirm('Bạn có chắc chắn muốn xóa tất cả thông báo không?')) {
      try {
        await deleteAllNotifications();
        notify.success('Đã xóa tất cả thông báo');
      } catch {
        notify.error('Không thể xóa tất cả thông báo');
      }
    }
  };

  const refreshType = () => {
    refetch();
    notify.success('Đã làm mới thông báo');
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
        return <Sparkles size={24} className="text-neutral-600 dark:text-neutral-300" />;
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
    <div className="admin-page">
      {/* Header Section */}
      <div className="admin-card p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--color-text-tertiary)]">
            Thông báo
          </p>
          <h2 className="text-2xl font-semibold text-[var(--color-content)] flex items-center gap-3">
            <Bell className="text-[var(--color-content)]" size={22} />
            Thông báo hệ thống
          </h2>
          <p className="text-sm text-[var(--color-text-secondary)] mt-1 flex items-center gap-2">
            Bạn có{' '}
            <span className="admin-pill bg-rose-50 text-rose-600 dark:bg-rose-900/20 dark:text-rose-400 border border-rose-100 dark:border-rose-800">
              {unreadCount}
            </span>{' '}
            thông báo chưa đọc
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={refreshType}
            onKeyDown={event => {
              if (event.key === 'Escape') {
                event.currentTarget.blur();
              }
            }}
            className="p-2 rounded-lg bg-[var(--color-surface-secondary)] text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-hover)] transition-colors"
            title="Làm mới"
            aria-label="Làm mới"
          >
            <RefreshCcw size={20} />
          </button>
          <button
            type="button"
            onClick={handleMarkAllAsRead}
            disabled={unreadCount === 0}
            className="flex items-center gap-2 px-4 py-2 bg-[var(--color-surface)] border border-[var(--color-border)] text-[var(--color-text-secondary)] rounded-full hover:bg-[var(--color-surface-hover)] transition-all font-semibold text-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Check size={16} />
            <span className="hidden sm:inline">Đánh dấu tất cả</span>
            </button>
          <button
            type="button"
            onClick={handleDeleteAll}
            disabled={notifications.length === 0}
            className="flex items-center gap-2 px-4 py-2 bg-rose-50 dark:bg-rose-900/20 border border-rose-100 dark:border-rose-800 text-rose-600 dark:text-rose-400 rounded-full hover:bg-rose-100 dark:hover:bg-rose-900/30 transition-all font-semibold text-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Trash2 size={16} />
            <span className="hidden sm:inline">Xóa tất cả</span>
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="admin-card p-3">
        <div className="flex gap-2 flex-wrap">
          {['all', 'info', 'success', 'warning', 'alert'].map(type => (
            <button
              key={type}
              type="button"
              onClick={() => {
                setFilterType(type);
                setCurrentPage(1);
              }}
              className={`px-4 py-2 rounded-full text-sm font-semibold whitespace-nowrap transition-all border ${
                filterType === type
                  ? 'bg-[var(--color-primary)] text-[var(--color-primary-foreground)] border-[var(--color-primary)]'
                  : 'bg-[var(--color-surface)] text-[var(--color-text-secondary)] border-[var(--color-border)] hover:bg-[var(--color-surface-hover)]'
              }`}
            >
              {getTypeLabel(type)}
            </button>
          ))}
        </div>
      </div>

      {/* Main Content */}
      <div className="admin-card overflow-hidden min-h-[400px] flex flex-col">

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
            <div className="divide-y divide-[var(--color-border)]">
              {notifications.map(notification => (
                <div
                  key={notification._id}
                  className={`p-4 flex gap-4 transition-all group ${
                    !notification.isRead
                      ? 'bg-blue-50/30 dark:bg-blue-900/10'
                      : 'hover:bg-[var(--color-surface-hover)]'
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
                            ? 'font-semibold text-[var(--color-content)]'
                            : 'font-medium text-[var(--color-text-secondary)]'
                        }`}
                      >
                        {notification.title}
                      </p>
                      <span className="text-xs font-medium text-[var(--color-text-tertiary)] whitespace-nowrap flex items-center gap-1.5 bg-[var(--color-surface-secondary)] px-2 py-1 rounded-full border border-[var(--color-border)]">
                        <Clock size={12} />
                        {new Date(notification.createdAt).toLocaleString('vi-VN')}
                      </span>
                    </div>
                    <p className="text-sm text-[var(--color-text-secondary)] mt-1.5 leading-relaxed">
                      {notification.message}
                    </p>
                  </div>
                  <div className="flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    {!notification.isRead && (
                      <button
                        type="button"
                        onClick={() => handleMarkAsRead(notification._id)}
                        className="p-2 text-blue-500 hover:bg-blue-100 rounded-xl transition-colors bg-[var(--color-surface)] border border-[var(--color-border)] shadow-sm"
                        title="Đánh dấu đã đọc"
                        aria-label="Đánh dấu đã đọc"
                      >
                        <CheckCircle size={18} />
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => handleDelete(notification._id)}
                      className="p-2 text-[var(--color-text-tertiary)] hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-colors bg-[var(--color-surface)] border border-[var(--color-border)] shadow-sm"
                      title="Xóa"
                      aria-label="Xóa"
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
        <div className="admin-card p-4 flex items-center justify-between">
          <div className="text-sm text-[var(--color-text-secondary)] px-2">
            Đang hiển thị trang{' '}
            <span className="font-semibold text-[var(--color-content)]">
              {currentPage}
            </span>{' '}
            / {pagination.pages}
          </div>
          <div className="flex gap-2">
           <button
              type="button"
              disabled={currentPage === 1 || isLoading}
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              className="px-4 py-2 rounded-full border border-[var(--color-border)] text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-hover)] disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1 font-medium text-sm transition-all"
            >
              <ChevronLeft size={16} />
              Trước
            </button>
            <button
              type="button"
              disabled={
                currentPage >= pagination.pages || isLoading || isPreviousData
              }
              onClick={() => {
                if (!isPreviousData && currentPage < pagination.pages) {
                  setCurrentPage(p => p + 1);
                }
              }}
              className="px-4 py-2 rounded-full border border-[var(--color-border)] text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-hover)] disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1 font-medium text-sm transition-all"
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

