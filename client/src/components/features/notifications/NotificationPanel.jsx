import React, { useEffect, useState } from 'react';
import {
  Bell,
  Check,
  Filter,
  Loader2,
  Trash2,
} from 'lucide-react';
import {
  useNotifications,
  useUnreadCount,
  useMarkAsRead,
  useMarkAllAsRead,
  useDeleteNotification,
  useDeleteAllNotifications,
} from '../../../../hooks/useNotificationQuery';
import toast from 'react-hot-toast';
import { useInView } from 'react-intersection-observer';
import {
  formatNotificationTime as formatTime,
  getNotificationIcon,
} from '@/utils/notificationUtils';

const NotificationPanel = () => {
  const [filter, setFilter] = useState('all');
  const [showDeleteAllConfirm, setShowDeleteAllConfirm] = useState(false);

  // Queries
  const {
    data,
    isLoading,
    isFetchingNextPage,
    fetchNextPage,
    hasNextPage,
    error,
    refetch,
  } = useNotifications(filter);

  const { data: unreadCount = 0 } = useUnreadCount();

  // Mutations
  const { mutate: markAsRead } = useMarkAsRead();
  const { mutate: markAllAsRead } = useMarkAllAsRead();
  const { mutate: deleteNotification } = useDeleteNotification();
  const { mutateAsync: deleteAllNotifications, isPending: isDeletingAll } =
    useDeleteAllNotifications();

  // Flatten pages to get all notifications
  const notifications =
    data?.pages?.flatMap(page => page.notifications || page) || [];

  // Filter client-side
  const filteredNotifications = notifications.filter(n => {
    if (filter === 'all') return true;
    if (filter === 'unread') return !n.isRead;
    return true;
  });

  // Infinite Scroll Hook
  const { ref, inView } = useInView({ threshold: 0 });

  useEffect(() => {
    if (inView && hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [inView, hasNextPage, isFetchingNextPage, fetchNextPage]);

  // Handlers
  const handleMarkAllAsRead = () => {
    markAllAsRead(undefined, {
      onError: () => toast.error('Failed to mark all as read'),
    });
  };

  const handleMarkAsRead = id => {
    markAsRead(id);
  };

  const handleDelete = (e, id) => {
    e.stopPropagation();
    deleteNotification(id, {
      onError: () => toast.error('Failed to delete notification'),
    });
  };

  const handleDeleteAll = async () => {
    try {
      await deleteAllNotifications();
      toast.success('Đã xóa tất cả thông báo');
      setShowDeleteAllConfirm(false);
    } catch (error) {
      toast.error('Xóa thông báo thất bại', error.message);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      {/* Header */}
      <div className="sticky top-0 bg-white/80 dark:bg-neutral-900/80 backdrop-blur-xl z-10">
        <div className="flex items-center justify-between p-4">
          <h1 className="text-xl font-bold text-black dark:text-white">
            Notifications
          </h1>
          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllAsRead}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-full transition-colors"
                title="Mark all as read"
              >
                <Check size={14} />
                Mark all read
              </button>
            )}
            {notifications.length > 0 && (
              <button
                onClick={() => setShowDeleteAllConfirm(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-full transition-colors"
                title="Clear all notifications"
              >
                <Trash2 size={14} />
                Clear all
              </button>
            )}
            <button className="p-2 rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors">
              <Filter size={18} className="text-neutral-500" />
            </button>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex bg-neutral-50 dark:bg-neutral-800/50 p-1 rounded-xl mx-4 mb-2">
          <button
            onClick={() => setFilter('all')}
            className={`flex-1 py-3 text-sm font-medium transition-colors relative ${
              filter === 'all'
                ? 'text-primary'
                : 'text-neutral-500 hover:text-black dark:hover:text-white'
            }`}
          >
            All
            {filter === 'all' && (
              <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-8 h-1 bg-primary rounded-full" />
            )}
          </button>
          <button
            onClick={() => setFilter('unread')}
            className={`flex-1 py-3 text-sm font-medium transition-colors relative ${
              filter === 'unread'
                ? 'text-primary'
                : 'text-neutral-500 hover:text-black dark:hover:text-white'
            }`}
          >
            Unread {unreadCount > 0 && `(${unreadCount})`}
            {filter === 'unread' && (
              <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-12 h-1 bg-primary rounded-full" />
            )}
          </button>
        </div>
      </div>

      {/* Loading State */}
      {isLoading && notifications.length === 0 && (
        <div className="flex justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-neutral-400" />
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="p-8 text-center">
          <Bell size={32} className="mx-auto text-red-400 mb-2" />
          <p className="text-red-500 text-sm">
            {error.message || 'Error loading notifications'}
          </p>
          <button
            onClick={() => refetch()}
            className="mt-2 px-4 py-2 bg-primary text-primary-foreground text-sm rounded-full"
          >
            Thử lại
          </button>
        </div>
      )}

      {/* Notifications List */}
      {!isLoading && !error && (
        <div>
          {filteredNotifications.length === 0 ? (
            <div className="p-8 text-center">
              <Bell size={32} className="mx-auto text-neutral-300 mb-2" />
              <p className="text-neutral-500 text-sm">No notifications</p>
            </div>
          ) : (
            filteredNotifications.map(notification => (
              <div
                key={notification._id}
                onClick={() => handleMarkAsRead(notification._id)}
                className={`flex items-start gap-4 p-4 cursor-pointer transition-all duration-300 rounded-2xl mx-4 mb-2 group ${
                  !notification.isRead
                    ? 'bg-primary/5 dark:bg-primary/10'
                    : 'hover:bg-neutral-100 dark:hover:bg-neutral-800/30'
                }`}
              >
                {/* Avatar */}
                <div className="relative flex-shrink-0">
                  <img
                    src={
                      notification.sender?.avatar || notification.user?.avatar
                    }
                    alt={notification.sender?.name || notification.user?.name}
                    className="w-10 h-10 rounded-full object-cover"
                  />
                  <div className="absolute -bottom-1 -right-1 p-1 rounded-full bg-white dark:bg-neutral-900">
                    {getNotificationIcon(notification.type)}
                  </div>
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <p
                    className={`text-sm ${
                      !notification.isRead
                        ? 'text-black dark:text-white font-medium'
                        : 'text-neutral-600 dark:text-neutral-400'
                    }`}
                  >
                    {notification.message || notification.content}
                  </p>
                  <p className="text-xs text-neutral-400 mt-1">
                    {formatTime(notification.createdAt)}
                  </p>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2">
                  {!notification.isRead && (
                    <div className="w-2 h-2 rounded-full bg-primary flex-shrink-0" />
                  )}
                  <button
                    onClick={e => handleDelete(e, notification._id)}
                    className="p-1.5 rounded-full opacity-0 group-hover:opacity-100 hover:bg-red-100 dark:hover:bg-red-900/20 transition-all"
                  >
                    <Trash2 size={14} className="text-red-500" />
                  </button>
                </div>
              </div>
            ))
          )}

          {/* Load more trigger */}
          <div ref={ref} className="h-10">
            {isFetchingNextPage && (
              <div className="flex justify-center py-4">
                <Loader2 className="w-6 h-6 animate-spin text-neutral-400" />
              </div>
            )}
          </div>
        </div>
      )}

      {/* Delete All Confirmation Modal */}
      {showDeleteAllConfirm && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
          onClick={() => setShowDeleteAllConfirm(false)}
        >
          <div
            className="w-full max-w-sm bg-white dark:bg-neutral-900 rounded-2xl overflow-hidden p-6 mx-4"
            onClick={e => e.stopPropagation()}
          >
            <h3 className="text-lg font-semibold text-black dark:text-white mb-2">
              Clear All Notifications?
            </h3>
            <p className="text-sm text-neutral-500 mb-6">
              This will permanently delete all your notifications. This action
              cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteAllConfirm(false)}
                className="flex-1 px-4 py-2.5 rounded-full bg-neutral-100 dark:bg-neutral-800 text-black dark:text-white text-sm font-medium hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteAll}
                disabled={isDeletingAll}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-full bg-red-500 text-white text-sm font-medium hover:bg-red-600 transition-colors"
              >
                {isDeletingAll ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <>
                    <Trash2 size={16} />
                    Clear All
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationPanel;
