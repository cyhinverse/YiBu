import { useState } from "react";
import { Link } from "react-router-dom";
import {
  Bell,
  Heart,
  MessageCircle,
  UserPlus,
  Repeat,
  AtSign,
  Check,
  Settings,
} from "lucide-react";

// Fake notifications
const FAKE_NOTIFICATIONS = [
  {
    _id: "n1",
    type: "like",
    user: {
      name: "Sarah Chen",
      username: "sarahchen",
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=sarah",
      isVerified: true,
    },
    content: "liked your post",
    post: "Just shipped a new feature! 🚀",
    time: "2m",
    isRead: false,
  },
  {
    _id: "n2",
    type: "follow",
    user: {
      name: "Mike Johnson",
      username: "mikej",
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=mike",
      isVerified: false,
    },
    content: "started following you",
    time: "15m",
    isRead: false,
  },
  {
    _id: "n3",
    type: "comment",
    user: {
      name: "Emma Wilson",
      username: "emmaw",
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=emma",
      isVerified: true,
    },
    content: "commented on your post",
    comment: "This is amazing! Great work 👏",
    time: "1h",
    isRead: false,
  },
  {
    _id: "n4",
    type: "repost",
    user: {
      name: "Alex Kim",
      username: "alexk",
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=alex",
      isVerified: false,
    },
    content: "reposted your post",
    post: "Beautiful morning for coding ☕",
    time: "3h",
    isRead: true,
  },
  {
    _id: "n5",
    type: "mention",
    user: {
      name: "Jessica Lee",
      username: "jessical",
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=jessica",
      isVerified: true,
    },
    content: "mentioned you in a post",
    post: "Working with @johndoe on this project!",
    time: "5h",
    isRead: true,
  },
  {
    _id: "n6",
    type: "like",
    user: {
      name: "David Park",
      username: "davidp",
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=david",
      isVerified: false,
    },
    content: "liked your comment",
    time: "1d",
    isRead: true,
  },
];

const getNotificationIcon = (type) => {
  switch (type) {
    case "like":
      return <Heart size={16} className="text-red-500" fill="currentColor" />;
    case "comment":
      return <MessageCircle size={16} className="text-blue-500" />;
    case "follow":
      return <UserPlus size={16} className="text-green-500" />;
    case "repost":
      return <Repeat size={16} className="text-purple-500" />;
    case "mention":
      return <AtSign size={16} className="text-orange-500" />;
    default:
      return <Bell size={16} className="text-neutral-500" />;
  }
};

const Notifications = () => {
  const [notifications, setNotifications] = useState(FAKE_NOTIFICATIONS);
  const [activeFilter, setActiveFilter] = useState("all");

  const filters = [
    { id: "all", label: "All" },
    { id: "unread", label: "Unread" },
    { id: "likes", label: "Likes" },
    { id: "comments", label: "Comments" },
    { id: "follows", label: "Follows" },
  ];

  const filteredNotifications = notifications.filter((notif) => {
    if (activeFilter === "all") return true;
    if (activeFilter === "unread") return !notif.isRead;
    if (activeFilter === "likes") return notif.type === "like";
    if (activeFilter === "comments") return notif.type === "comment";
    if (activeFilter === "follows") return notif.type === "follow";
    return true;
  });

  const markAllAsRead = () => {
    setNotifications((prev) =>
      prev.map((notif) => ({ ...notif, isRead: true }))
    );
  };

  const markAsRead = (id) => {
    setNotifications((prev) =>
      prev.map((notif) =>
        notif._id === id ? { ...notif, isRead: true } : notif
      )
    );
  };

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return (
    <div className="max-w-2xl mx-auto">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white/80 dark:bg-neutral-900/80 backdrop-blur-md border-b border-neutral-200 dark:border-neutral-800">
        <div className="px-4 py-3">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <Bell size={24} className="text-black dark:text-white" />
              <div>
                <h1 className="text-xl font-bold text-black dark:text-white">
                  Notifications
                </h1>
                {unreadCount > 0 && (
                  <p className="text-sm text-neutral-500">
                    {unreadCount} unread
                  </p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="text-sm text-black dark:text-white font-medium hover:underline"
                >
                  Mark all read
                </button>
              )}
              <Link
                to="/settings/notification"
                className="p-2 rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
              >
                <Settings size={18} className="text-neutral-500" />
              </Link>
            </div>
          </div>

          {/* Filters */}
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
            {filters.map((filter) => (
              <button
                key={filter.id}
                onClick={() => setActiveFilter(filter.id)}
                className={`px-4 py-1.5 text-sm font-medium rounded-full whitespace-nowrap transition-colors ${
                  activeFilter === filter.id
                    ? "bg-black dark:bg-white text-white dark:text-black"
                    : "bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200 dark:hover:bg-neutral-700"
                }`}
              >
                {filter.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Notifications List */}
      {filteredNotifications.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-neutral-500">
          <Bell size={48} className="mb-4 text-neutral-300" />
          <h2 className="text-lg font-semibold text-black dark:text-white mb-2">
            No notifications
          </h2>
          <p className="text-sm">You're all caught up!</p>
        </div>
      ) : (
        <div className="divide-y divide-neutral-100 dark:divide-neutral-800">
          {filteredNotifications.map((notif) => (
            <div
              key={notif._id}
              onClick={() => markAsRead(notif._id)}
              className={`flex items-start gap-3 px-4 py-4 hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors cursor-pointer ${
                !notif.isRead ? "bg-blue-50/50 dark:bg-blue-900/10" : ""
              }`}
            >
              {/* Avatar with Icon */}
              <div className="relative flex-shrink-0">
                <Link to={`/profile/${notif.user.username}`}>
                  <img
                    src={notif.user.avatar}
                    alt={notif.user.name}
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
                    to={`/profile/${notif.user.username}`}
                    className="font-semibold hover:underline"
                  >
                    {notif.user.name}
                  </Link>
                  {notif.user.isVerified && (
                    <span className="inline-flex items-center justify-center w-4 h-4 ml-1 rounded-full bg-black dark:bg-white">
                      <Check size={10} className="text-white dark:text-black" />
                    </span>
                  )}{" "}
                  {notif.content}
                </p>
                {notif.post && (
                  <p className="text-sm text-neutral-500 truncate mt-1">
                    "{notif.post}"
                  </p>
                )}
                {notif.comment && (
                  <p className="text-sm text-neutral-600 dark:text-neutral-400 mt-1 bg-neutral-100 dark:bg-neutral-800 rounded-lg px-3 py-2">
                    {notif.comment}
                  </p>
                )}
                <p className="text-xs text-neutral-400 mt-1">{notif.time}</p>
              </div>

              {/* Unread Indicator */}
              {!notif.isRead && (
                <div className="w-2 h-2 rounded-full bg-blue-500 flex-shrink-0 mt-2" />
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Notifications;
