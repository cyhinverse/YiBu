import { useState } from "react";
import {
  Bell,
  Heart,
  MessageCircle,
  UserPlus,
  Repeat2,
  Check,
  Filter,
} from "lucide-react";

// Fake notifications data
const FAKE_NOTIFICATIONS = [
  {
    _id: "n1",
    type: "like",
    message: "Sarah Chen liked your post",
    user: {
      name: "Sarah Chen",
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=sarah",
    },
    createdAt: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
    isRead: false,
  },
  {
    _id: "n2",
    type: "comment",
    message: 'Mike Johnson commented: "Great work!"',
    user: {
      name: "Mike Johnson",
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=mike",
    },
    createdAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
    isRead: false,
  },
  {
    _id: "n3",
    type: "follow",
    message: "Emma Wilson started following you",
    user: {
      name: "Emma Wilson",
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=emma",
    },
    createdAt: new Date(Date.now() - 1000 * 60 * 60).toISOString(),
    isRead: true,
  },
  {
    _id: "n4",
    type: "repost",
    message: "Alex Rivera reposted your post",
    user: {
      name: "Alex Rivera",
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=alex",
    },
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
    isRead: true,
  },
  {
    _id: "n5",
    type: "like",
    message: "Jordan Lee and 5 others liked your post",
    user: {
      name: "Jordan Lee",
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=jordan",
    },
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(),
    isRead: true,
  },
];

const formatTime = (dateStr) => {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "now";
  if (diffMins < 60) return `${diffMins}m`;
  if (diffHours < 24) return `${diffHours}h`;
  if (diffDays < 7) return `${diffDays}d`;
  return date.toLocaleDateString();
};

const getNotificationIcon = (type) => {
  switch (type) {
    case "like":
      return <Heart size={16} className="text-red-500" />;
    case "comment":
      return <MessageCircle size={16} className="text-blue-500" />;
    case "follow":
      return <UserPlus size={16} className="text-green-500" />;
    case "repost":
      return <Repeat2 size={16} className="text-purple-500" />;
    default:
      return <Bell size={16} className="text-neutral-500" />;
  }
};

const NotificationPanel = () => {
  const [notifications, setNotifications] = useState(FAKE_NOTIFICATIONS);
  const [filter, setFilter] = useState("all");

  const filteredNotifications = notifications.filter((n) => {
    if (filter === "all") return true;
    if (filter === "unread") return !n.isRead;
    return true;
  });

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const markAllAsRead = () => {
    setNotifications(notifications.map((n) => ({ ...n, isRead: true })));
  };

  const markAsRead = (id) => {
    setNotifications(
      notifications.map((n) => (n._id === id ? { ...n, isRead: true } : n))
    );
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
                onClick={markAllAsRead}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-full transition-colors"
              >
                <Check size={14} />
                Mark all read
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
            onClick={() => setFilter("all")}
            className={`flex-1 py-3 text-sm font-medium transition-colors relative ${
              filter === "all"
                ? "text-black dark:text-white"
                : "text-neutral-500 hover:text-black dark:hover:text-white"
            }`}
          >
            All
            {filter === "all" && (
              <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-12 h-1 bg-black dark:bg-white rounded-full" />
            )}
          </button>
          <button
            onClick={() => setFilter("unread")}
            className={`flex-1 py-3 text-sm font-medium transition-colors relative ${
              filter === "unread"
                ? "text-black dark:text-white"
                : "text-neutral-500 hover:text-black dark:hover:text-white"
            }`}
          >
            Unread {unreadCount > 0 && `(${unreadCount})`}
            {filter === "unread" && (
              <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-12 h-1 bg-black dark:bg-white rounded-full" />
            )}
          </button>
        </div>
      </div>

      {/* Notifications List */}
      <div>
        {filteredNotifications.length === 0 ? (
          <div className="p-8 text-center">
            <Bell size={32} className="mx-auto text-neutral-300 mb-2" />
            <p className="text-neutral-500 text-sm">No notifications</p>
          </div>
        ) : (
          filteredNotifications.map((notification) => (
            <div
              key={notification._id}
              onClick={() => markAsRead(notification._id)}
              className={`flex items-start gap-3 p-4 border-b border-neutral-100 dark:border-neutral-800 cursor-pointer transition-colors ${
                !notification.isRead
                  ? "bg-neutral-50 dark:bg-neutral-800/50"
                  : "hover:bg-neutral-50 dark:hover:bg-neutral-800/30"
              }`}
            >
              {/* Avatar */}
              <div className="relative flex-shrink-0">
                <img
                  src={notification.user.avatar}
                  alt={notification.user.name}
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
                      ? "text-black dark:text-white font-medium"
                      : "text-neutral-600 dark:text-neutral-400"
                  }`}
                >
                  {notification.message}
                </p>
                <p className="text-xs text-neutral-400 mt-1">
                  {formatTime(notification.createdAt)}
                </p>
              </div>

              {/* Unread Indicator */}
              {!notification.isRead && (
                <div className="w-2 h-2 rounded-full bg-black dark:bg-white flex-shrink-0 mt-2" />
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default NotificationPanel;
