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
} from 'lucide-react';
import {
  useNotificationsPage,
  useUnreadCount,
  useMarkAsRead,
  useMarkAllAsRead,
  useDeleteNotification,
  useDeleteAllNotifications,
} from '../../../hooks/useNotificationQuery';
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
      onError: () => toast.error('Failed to mark all as read'),
    });
  };

  const handleDelete = async id => {
    try {
      await deleteNotification(id);
      // Toast is handled or we can add one here
    } catch (err) {
      toast.error('Failed to delete notification');
    }
  };

  const handleDeleteAll = async () => {
    if (window.confirm('Are you sure you want to delete all notifications?')) {
      try {
        await deleteAllNotifications();
        toast.success('All notifications deleted');
      } catch (err) {
        toast.error('Failed to delete all notifications');
      }
    }
  };

  const refreshType = () => {
    refetch();
  };

  const getIcon = type => {
    switch (type) {
      case 'info':
        return <Info size={20} className="text-blue-500" />;
      case 'success':
        return <CheckCircle size={20} className="text-green-500" />;
      case 'warning':
        return <AlertTriangle size={20} className="text-yellow-500" />;
      case 'alert':
        return <AlertCircle size={20} className="text-red-500" />;
      default:
        return <Sparkles size={20} className="text-purple-500" />;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-black dark:text-white">
            Notifications
          </h2>
          <p className="text-sm text-neutral-500 mt-1">
            You have {unreadCount} unread notifications
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={refreshType}
            className="flex items-center gap-2 px-3 py-2 bg-neutral-100 dark:bg-neutral-800 rounded-lg hover:bg-neutral-200 dark:hover:bg-neutral-700 transition"
          >
            <RefreshCcw size={16} />
          </button>
          <button
            onClick={() => handleMarkAllAsRead()}
            className="flex items-center gap-2 px-4 py-2 bg-neutral-100 dark:bg-neutral-800 rounded-lg hover:bg-neutral-200 dark:hover:bg-neutral-700 transition"
          >
            <Check size={16} />
            Mark all read
          </button>
          <button
            onClick={handleDeleteAll}
            className="flex items-center gap-2 px-4 py-2 bg-red-100 dark:bg-red-900/20 text-red-600 rounded-lg hover:bg-red-200 dark:hover:bg-red-900/40 transition"
          >
            <Trash2 size={16} />
            Clear all
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-2">
        {['all', 'info', 'success', 'warning', 'alert'].map(type => (
          <button
            key={type}
            onClick={() => {
              setFilterType(type);
              setCurrentPage(1);
            }}
            className={`px-4 py-2 rounded-full text-sm font-medium capitalize transition ${
              filterType === type
                ? 'bg-black dark:bg-white text-white dark:text-black'
                : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200 dark:hover:bg-neutral-700'
            }`}
          >
            {type}
          </button>
        ))}
      </div>

      <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 overflow-hidden">
        {isLoading ? (
          <div className="p-12 flex justify-center">
            <Loader2 size={32} className="animate-spin text-neutral-400" />
          </div>
        ) : notifications.length === 0 ? (
          <div className="p-12 text-center text-neutral-500">
            No notifications found
          </div>
        ) : (
          <div className="divide-y divide-neutral-200 dark:divide-neutral-800">
            {notifications.map(notification => (
              <div
                key={notification._id}
                className={`p-4 flex gap-4 transition-colors ${
                  !notification.isRead
                    ? 'bg-blue-50/50 dark:bg-blue-900/10'
                    : 'hover:bg-neutral-50 dark:hover:bg-neutral-800/50'
                }`}
              >
                <div className="mt-1 flex-shrink-0">
                  {getIcon(notification.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <p
                      className={`text-sm ${
                        !notification.isRead
                          ? 'font-semibold text-black dark:text-white'
                          : 'text-neutral-700 dark:text-neutral-300'
                      }`}
                    >
                      {notification.title}
                    </p>
                    <span className="text-xs text-neutral-400 whitespace-nowrap flex items-center gap-1">
                      <Clock size={12} />
                      {new Date(notification.createdAt).toLocaleString()}
                    </span>
                  </div>
                  <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">
                    {notification.message}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {!notification.isRead && (
                    <button
                      onClick={() => handleMarkAsRead(notification._id)}
                      className="p-2 text-blue-500 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded-full"
                      title="Mark as read"
                    >
                      <CheckCircle size={16} />
                    </button>
                  )}
                  <button
                    onClick={() => handleDelete(notification._id)}
                    className="p-2 text-neutral-400 hover:text-red-500 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-full"
                    title="Delete"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Pagination */}
      {pagination && pagination.pages > 1 && (
        <div className="flex justify-center gap-2 mt-4">
          <button
            disabled={currentPage === 1 || isLoading}
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            className="px-3 py-1 rounded border disabled:opacity-50"
          >
            Prev
          </button>
          <span className="px-3 py-1">
            {currentPage} / {pagination.pages}
          </span>
          <button
            disabled={
              currentPage >= pagination.pages || isLoading || isPreviousData
            }
            onClick={() => {
              if (!isPreviousData && currentPage < pagination.pages) {
                setCurrentPage(p => p + 1);
              }
            }}
            className="px-3 py-1 rounded border disabled:opacity-50"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
};

export default Notifications;
