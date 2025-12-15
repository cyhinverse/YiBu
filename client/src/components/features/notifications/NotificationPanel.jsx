import React, { useEffect, useCallback, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  Bell,
  Heart,
  MessageCircle,
  UserPlus,
  Repeat2,
  Check,
  Filter,
  Loader2,
  Trash2,
} from 'lucide-react';
import {
  getNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  deleteAllNotifications,
  getUnreadCount,
} from '../../../../redux/actions/notificationActions';
import toast from 'react-hot-toast';

const formatTime = dateStr => {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'now';
  if (diffMins < 60) return `${diffMins}m`;
  if (diffHours < 24) return `${diffHours}h`;
  if (diffDays < 7) return `${diffDays}d`;
  return date.toLocaleDateString();
};

const getNotificationIcon = type => {
  switch (type) {
    case 'like':
      return <Heart size={16} className="text-red-500" />;
    case 'comment':
      return <MessageCircle size={16} className="text-blue-500" />;
    case 'follow':
      return <UserPlus size={16} className="text-green-500" />;
    case 'repost':
    case 'share':
      return <Repeat2 size={16} className="text-purple-500" />;
    default:
      return <Bell size={16} className="text-neutral-500" />;
  }
};

const NotificationPanel = () => {
  const dispatch = useDispatch();
  const { notifications, loading, error, unreadCount, pagination } =
    useSelector(state => state.notification);
  const [filter, setFilter] = useState('all');
  const [showDeleteAllConfirm, setShowDeleteAllConfirm] = useState(false);
  const [deleteAllLoading, setDeleteAllLoading] = useState(false);
  const loadingRef = useRef(false);
  const observerRef = useRef(null);

  // Fetch notifications on mount
  useEffect(() => {
    dispatch(getNotifications({ page: 1, limit: 20 }));
    dispatch(getUnreadCount());
  }, [dispatch]);

  // Infinite scroll
  const loadMore = useCallback(() => {
    if (loadingRef.current || !pagination?.hasMore) return;
    loadingRef.current = true;
    dispatch(
      getNotifications({
        page: pagination.currentPage + 1,
        limit: 20,
        type: filter !== 'all' ? undefined : undefined,
      })
    ).finally(() => {
      loadingRef.current = false;
    });
  }, [dispatch, pagination, filter]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => {
        if (entries[0].isIntersecting && !loading && pagination?.hasMore) {
          loadMore();
        }
      },
      { threshold: 0.1 }
    );

    if (observerRef.current) {
      observer.observe(observerRef.current);
    }

    return () => observer.disconnect();
  }, [loadMore, loading, pagination?.hasMore]);

  const filteredNotifications = (notifications || []).filter(n => {
    if (filter === 'all') return true;
    if (filter === 'unread') return !n.isRead;
    return true;
  });

  const handleMarkAllAsRead = () => {
    dispatch(markAllAsRead());
  };

  const handleMarkAsRead = id => {
    dispatch(markAsRead(id));
  };

  const handleDelete = (e, id) => {
    e.stopPropagation();
    dispatch(deleteNotification(id));
  };

  const handleDeleteAll = async () => {
    setDeleteAllLoading(true);
    try {
      await dispatch(deleteAllNotifications()).unwrap();
      toast.success('Đã xóa tất cả thông báo');
      setShowDeleteAllConfirm(false);
    } catch (error) {
      toast.error(error || 'Xóa thông báo thất bại');
    } finally {
      setDeleteAllLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      {/* Header */}
      <div className="sticky top-0 bg-white/80 dark:bg-neutral-900/80 backdrop-blur-xl z-10 border-b border-neutral-200 dark:border-neutral-800">
        <div className="flex items-center justify-between p-4">
          <h1 className="text-xl font-bold text-black dark:text-white">
            Notifications
          </h1>
          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllAsRead}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-full transition-colors"
              >
                <Check size={14} />
                Mark all read
              </button>
            )}
            {notifications && notifications.length > 0 && (
              <button
                onClick={() => setShowDeleteAllConfirm(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-full transition-colors"
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
        <div className="flex border-b border-neutral-200 dark:border-neutral-800">
          <button
            onClick={() => setFilter('all')}
            className={`flex-1 py-3 text-sm font-medium transition-colors relative ${
              filter === 'all'
                ? 'text-black dark:text-white'
                : 'text-neutral-500 hover:text-black dark:hover:text-white'
            }`}
          >
            All
            {filter === 'all' && (
              <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-12 h-1 bg-black dark:bg-white rounded-full" />
            )}
          </button>
          <button
            onClick={() => setFilter('unread')}
            className={`flex-1 py-3 text-sm font-medium transition-colors relative ${
              filter === 'unread'
                ? 'text-black dark:text-white'
                : 'text-neutral-500 hover:text-black dark:hover:text-white'
            }`}
          >
            Unread {unreadCount > 0 && `(${unreadCount})`}
            {filter === 'unread' && (
              <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-12 h-1 bg-black dark:bg-white rounded-full" />
            )}
          </button>
        </div>
      </div>

      {/* Loading State */}
      {loading && (!notifications || notifications.length === 0) && (
        <div className="flex justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-neutral-400" />
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="p-8 text-center">
          <Bell size={32} className="mx-auto text-red-400 mb-2" />
          <p className="text-red-500 text-sm">{error}</p>
          <button
            onClick={() => dispatch(getNotifications({ page: 1, limit: 20 }))}
            className="mt-2 px-4 py-2 bg-black dark:bg-white text-white dark:text-black text-sm rounded-full"
          >
            Thử lại
          </button>
        </div>
      )}

      {/* Notifications List */}
      {!loading && !error && (
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
                className={`flex items-start gap-3 p-4 border-b border-neutral-100 dark:border-neutral-800 cursor-pointer transition-colors group ${
                  !notification.isRead
                    ? 'bg-neutral-50 dark:bg-neutral-800/50'
                    : 'hover:bg-neutral-50 dark:hover:bg-neutral-800/30'
                }`}
              >
                {/* Avatar */}
                <div className="relative flex-shrink-0">
                  <img
                    src={
                      notification.sender?.avatar || notification.user?.avatar
                    }
                    alt={notification.sender?.name || notification.user?.name}
                    className="w-10 h-10 rounded-full object-cover border-2 border-neutral-200 dark:border-neutral-700"
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
                  {/* Unread Indicator */}
                  {!notification.isRead && (
                    <div className="w-2 h-2 rounded-full bg-black dark:bg-white flex-shrink-0" />
                  )}
                  {/* Delete Button */}
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
          <div ref={observerRef} className="h-10">
            {loading && notifications?.length > 0 && (
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
                className="flex-1 px-4 py-2.5 rounded-full border border-neutral-200 dark:border-neutral-700 text-black dark:text-white text-sm font-medium hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteAll}
                disabled={deleteAllLoading}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-full bg-red-500 text-white text-sm font-medium hover:bg-red-600 transition-colors"
              >
                {deleteAllLoading ? (
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
