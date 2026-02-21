import { useState } from 'react';
import {
  CheckCircle,
  Clock,
  Trash2,
  RefreshCcw,
  Check,
  Loader2,
  Info,
  Sparkles,
  Bell,
  Mail,
  UserPlus,
  MessageCircle,
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
import AdminPagination from '@/components/Admin/Shared/AdminPagination.jsx';

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

  const handleMarkAsRead = id => {
    markAsRead(id);
  };

  const handleMarkAllAsRead = () => {
    const typeFilter = filterType !== 'all' ? filterType : undefined;
    markAllAsRead(typeFilter, {
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
        const typeFilter = filterType !== 'all' ? filterType : undefined;
        await deleteAllNotifications(typeFilter);
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
      case 'system':
        return <Info size={24} className="text-[var(--color-info)]" />;
      case 'announcement':
        return <Sparkles size={24} className="text-[var(--color-warning)]" />;
      case 'follow':
        return <UserPlus size={24} className="text-[var(--color-success)]" />;
      case 'message':
        return <Mail size={24} className="text-[var(--color-info)]" />;
      case 'comment':
      case 'reply':
        return <MessageCircle size={24} className="text-[var(--color-info)]" />;
      case 'like':
      case 'share':
      case 'save':
      case 'mention':
      case 'tag':
        return <CheckCircle size={24} className="text-[var(--color-success)]" />;
      default:
        return <Bell size={24} className="text-[var(--color-text-secondary)]" />;
    }
  };

  const getTypeLabel = type => {
    const labels = {
      all: 'Tất cả',
      system: 'Hệ thống',
      announcement: 'Thông báo',
      follow: 'Theo dõi',
      message: 'Tin nhắn',
    };
    return labels[type] || type;
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
            <span className="admin-pill admin-pill-danger">
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
            className="flex items-center gap-2 px-4 py-2 bg-[var(--color-surface)] text-[var(--color-text-secondary)] rounded-full hover:bg-[var(--color-surface-hover)] transition-colors font-semibold text-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Check size={16} />
            <span className="hidden sm:inline">Đánh dấu tất cả</span>
          </button>
          <button
            type="button"
            onClick={handleDeleteAll}
            disabled={notifications.length === 0}
            className="flex items-center gap-2 px-4 py-2 bg-[var(--color-surface)] text-[var(--color-error)] rounded-full hover:bg-[var(--color-surface-hover)] transition-colors font-semibold text-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Trash2 size={16} />
            <span className="hidden sm:inline">Xóa tất cả</span>
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="admin-card p-3">
        <div className="flex gap-2 flex-wrap">
          {['all', 'system', 'announcement', 'follow', 'message'].map(type => (
            <button
              key={type}
              type="button"
              onClick={() => {
                setFilterType(type);
                setCurrentPage(1);
              }}
              className={`px-4 py-2 rounded-full text-sm font-semibold whitespace-nowrap transition-colors ${
                filterType === type
                  ? 'bg-[var(--color-primary)] text-[var(--color-primary-foreground)]'
                  : 'bg-[var(--color-surface)] text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-hover)]'
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
          <div className="flex-1 flex flex-col items-center justify-center p-12 text-[var(--color-text-secondary)] gap-3">
            <Loader2
              size={32}
              className="animate-spin text-[var(--color-text-tertiary)]"
            />
            <span className="font-medium">Đang tải thông báo...</span>
          </div>
        ) : notifications.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center p-12 text-center text-[var(--color-text-secondary)] gap-4">
            <div className="p-4 bg-[var(--color-surface-secondary)] rounded-full">
              <Bell
                size={32}
                className="text-[var(--color-text-tertiary)]"
              />
            </div>
            <p className="text-lg font-medium text-[var(--color-content)]">
              Không có thông báo nào
            </p>
            <p className="text-sm">Hiện tại bạn không có thông báo mới nào.</p>
          </div>
        ) : (
            <div>
              {notifications.map(notification => (
                <div
                  key={notification._id}
                  className={`p-4 flex gap-4 transition-all group ${
                    !notification.isRead
                      ? 'bg-[var(--color-surface-secondary)]'
                      : 'hover:bg-[var(--color-surface-hover)]'
                  }`}
                >
                  <div
                    className="mt-1 flex-shrink-0 p-2.5 rounded-2xl bg-[var(--color-surface-secondary)]"
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
                        {notification.metadata?.title ||
                          getTypeLabel(notification.type)}
                      </p>
                      <span className="text-xs font-medium text-[var(--color-text-tertiary)] whitespace-nowrap flex items-center gap-1.5 bg-[var(--color-surface-secondary)] px-2 py-1 rounded-full">
                        <Clock size={12} />
                        {new Date(notification.createdAt).toLocaleString('vi-VN')}
                      </span>
                    </div>
                    <p className="text-sm text-[var(--color-text-secondary)] mt-1.5 leading-relaxed">
                      {notification.displayContent ||
                        notification.content ||
                        notification.message}
                    </p>
                  </div>
                  <div className="flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    {!notification.isRead && (
                      <button
                        type="button"
                        onClick={() => handleMarkAsRead(notification._id)}
                        className="p-2 text-[var(--color-info)] hover:bg-[var(--color-surface-hover)] rounded-xl transition-colors bg-[var(--color-surface)]"
                        title="Đánh dấu đã đọc"
                        aria-label="Đánh dấu đã đọc"
                      >
                        <CheckCircle size={18} />
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => handleDelete(notification._id)}
                      className="p-2 text-[var(--color-text-tertiary)] hover:text-[var(--color-error)] hover:bg-[var(--color-surface-hover)] rounded-xl transition-colors bg-[var(--color-surface)]"
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
      {Math.ceil((data?.total || 0) / LIMIT) > 1 && (
        <AdminPagination
          currentPage={currentPage}
          totalPages={Math.ceil((data?.total || 0) / LIMIT)}
          label={`Trang ${currentPage} / ${Math.ceil((data?.total || 0) / LIMIT)}`}
          canPrev={currentPage > 1 && !isLoading}
          canNext={
            !isPreviousData &&
            currentPage < Math.ceil((data?.total || 0) / LIMIT) &&
            !isLoading
          }
          onPrev={() => setCurrentPage(p => Math.max(1, p - 1))}
          onNext={() => {
            if (
              !isPreviousData &&
              currentPage < Math.ceil((data?.total || 0) / LIMIT)
            ) {
              setCurrentPage(p => p + 1);
            }
          }}
        />

      )}
    </div>
  );
};

export default Notifications;

