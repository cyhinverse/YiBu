import { useState } from 'react';
import { Link } from 'react-router-dom'; // Link works fine
import {
  Bell,
  Heart,
  MessageCircle,
  UserPlus,
  Repeat,
  AtSign,
  Settings,
  Loader2,
} from 'lucide-react';
import {
  useNotifications,
  useUnreadCount,
  useMarkAsRead,
  useMarkAllAsRead,
} from '../../hooks/useNotificationQuery';
import { formatDistanceToNow } from 'date-fns';
import { vi } from 'date-fns/locale';
import toast from 'react-hot-toast';

const getNotificationIcon = type => {
  switch (type) {
    case 'like':
      return <Heart size={16} className="text-red-500" fill="currentColor" />;
    case 'comment':
      return <MessageCircle size={16} className="text-blue-500" />;
    case 'follow':
      return <UserPlus size={16} className="text-green-500" />;
    case 'repost':
      return <Repeat size={16} className="text-purple-500" />;
    case 'mention':
      return <AtSign size={16} className="text-orange-500" />;
    default:
      return <Bell size={16} className="text-neutral-500" />;
  }
};

const getNotificationContent = notification => {
  switch (notification.type) {
    case 'like':
      return 'đã thích bài viết của bạn';
    case 'comment':
      return 'đã bình luận về bài viết của bạn';
    case 'follow':
      return 'đã bắt đầu theo dõi bạn';
    case 'repost':
      return 'đã chia sẻ bài viết của bạn';
    case 'mention':
      return 'đã nhắc đến bạn trong một bài viết';
    default:
      return 'có thông báo mới';
  }
};

const Notifications = () => {
  const [activeFilter, setActiveFilter] = useState('all');

  // React Query Hooks
  const { data, isLoading, isFetchingNextPage, fetchNextPage, hasNextPage } =
    useNotifications(activeFilter);

  const { data: unreadCount = 0 } = useUnreadCount();
  const { mutate: markAsRead } = useMarkAsRead();
  const { mutate: markAllAsRead } = useMarkAllAsRead();

  // Combine pages
  const notifications =
    data?.pages?.flatMap(page => page.notifications || page) || [];

  const filters = [
    { id: 'all', label: 'Tất cả' },
    { id: 'unread', label: 'Chưa đọc' },
    { id: 'like', label: 'Lượt thích' },
    { id: 'comment', label: 'Bình luận' },
    { id: 'follow', label: 'Theo dõi' },
  ];

  const handleFilterChange = filterId => {
    setActiveFilter(filterId);
  };

  const filteredNotifications = notifications.filter(notif => {
    if (activeFilter === 'all') return true;
    if (activeFilter === 'unread') return !notif.isRead;
    return notif.type === activeFilter;
  });

  const handleMarkAllRead = () => {
    markAllAsRead(undefined, {
      onError: () => toast.error('Không thể đánh dấu tất cả là đã đọc'),
    });
  };

  const handleMarkRead = id => {
    markAsRead(id);
  };

  return (
    <div className="max-w-2xl mx-auto min-h-screen bg-white dark:bg-black">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white/80 dark:bg-black/80 backdrop-blur-md border-b border-neutral-200 dark:border-neutral-800">
        <div className="px-4 py-3">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <Bell size={24} className="text-black dark:text-white" />
              <div>
                <h1 className="text-xl font-bold text-black dark:text-white">
                  Thông báo
                </h1>
                {unreadCount > 0 && (
                  <p className="text-sm text-neutral-500">
                    {unreadCount} chưa đọc
                  </p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllRead}
                  className="text-sm text-black dark:text-white font-medium hover:underline"
                >
                  Đánh dấu tất cả đã đọc
                </button>
              )}
              <Link
                to="/settings/notification"
                className="p-2 rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
                title="Cài đặt thông báo"
              >
                <Settings size={18} className="text-neutral-500" />
              </Link>
            </div>
          </div>

          {/* Filters */}
          <div className="flex gap-2 overflow-x-auto pb-1 hide-scrollbar">
            {filters.map(filter => (
              <button
                key={filter.id}
                onClick={() => handleFilterChange(filter.id)}
                className={`px-4 py-1.5 text-sm font-medium rounded-full whitespace-nowrap transition-colors ${
                  activeFilter === filter.id
                    ? 'bg-black dark:bg-white text-white dark:text-black'
                    : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200 dark:hover:bg-neutral-700'
                }`}
              >
                {filter.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Notifications List */}
      {isLoading && notifications.length === 0 ? (
        <div className="flex justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-neutral-400" />
        </div>
      ) : filteredNotifications.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-neutral-500">
          <Bell size={48} className="mb-4 text-neutral-300" />
          <h2 className="text-lg font-semibold text-black dark:text-white mb-2">
            Không có thông báo nào
          </h2>
          <p className="text-sm">Bạn đã cập nhật tất cả!</p>
        </div>
      ) : (
        <div className="divide-y divide-neutral-100 dark:divide-neutral-800">
          {filteredNotifications.map(notif => {
            const sender = notif.sender || notif.user;
            if (!sender) return null;

            return (
              <div
                key={notif._id}
                onClick={() => !notif.isRead && handleMarkRead(notif._id)}
                className={`flex items-start gap-3 px-4 py-4 hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors cursor-pointer ${
                  !notif.isRead ? 'bg-blue-50/50 dark:bg-blue-900/10' : ''
                }`}
              >
                {/* Avatar with Icon */}
                <div className="relative flex-shrink-0">
                  <Link
                    to={`/profile/${sender.username}`}
                    onClick={e => e.stopPropagation()}
                  >
                    <img
                      src={sender.avatar || 'https://via.placeholder.com/40'}
                      alt={sender.name}
                      className="w-12 h-12 rounded-full object-cover border-2 border-neutral-200 dark:border-neutral-700"
                    />
                  </Link>
                  <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-white dark:bg-neutral-900 flex items-center justify-center border border-neutral-200 dark:border-neutral-700">
                    {getNotificationIcon(notif.type)}
                  </div>
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-black dark:text-white">
                    <Link
                      to={`/profile/${sender.username}`}
                      className="font-bold hover:underline"
                      onClick={e => e.stopPropagation()}
                    >
                      {sender.name}
                    </Link>{' '}
                    {getNotificationContent(notif)}
                  </p>

                  {/* Additional Content depending on type */}
                  {(notif.postId || notif.post) && (
                    <Link
                      to={`/post/${
                        notif.postId || notif.post?._id || notif.post
                      }`}
                      className="block mt-1"
                      onClick={e => e.stopPropagation()}
                    >
                      <p className="text-sm text-neutral-500 truncate hover:underline">
                        "{notif.post?.caption || notif.preview || 'Bài viết'}"
                      </p>
                    </Link>
                  )}
                  {notif.comment && (
                    <p className="text-sm text-neutral-600 dark:text-neutral-400 mt-1 bg-neutral-100 dark:bg-neutral-800 rounded-lg px-3 py-2">
                      {notif.comment.content || notif.comment}
                    </p>
                  )}

                  <p className="text-xs text-neutral-400 mt-1">
                    {formatDistanceToNow(new Date(notif.createdAt), {
                      addSuffix: true,
                      locale: vi,
                    })}
                  </p>
                </div>

                {/* Unread Indicator */}
                {!notif.isRead && (
                  <div className="w-2.5 h-2.5 rounded-full bg-blue-500 flex-shrink-0 mt-2" />
                )}
              </div>
            );
          })}

          {/* Load More Trigger */}
          {hasNextPage && (
            <div className="flex justify-center p-4">
              <button
                onClick={() => fetchNextPage()}
                disabled={isFetchingNextPage}
                className="text-sm text-blue-500 hover:underline"
              >
                {isFetchingNextPage ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  'Xem thêm'
                )}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Notifications;
