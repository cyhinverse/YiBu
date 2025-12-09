import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Edit, MoreHorizontal, MessageCircle } from "lucide-react";

// Fake conversations data
const FAKE_CONVERSATIONS = [
  {
    _id: "1",
    user: {
      _id: "u1",
      name: "Sarah Chen",
      username: "sarahchen",
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=sarah",
    },
    latestMessage: {
      content: "That sounds great! Let me know when you're free.",
      createdAt: new Date(Date.now() - 1000 * 60 * 2).toISOString(),
    },
    unreadCount: 2,
    online: true,
  },
  {
    _id: "2",
    user: {
      _id: "u2",
      name: "Mike Johnson",
      username: "mikej",
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=mike",
    },
    latestMessage: {
      content: "Thanks for sharing the code!",
      createdAt: new Date(Date.now() - 1000 * 60 * 60).toISOString(),
    },
    unreadCount: 0,
    online: false,
  },
  {
    _id: "3",
    user: {
      _id: "u3",
      name: "Emma Wilson",
      username: "emmaw",
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=emma",
    },
    latestMessage: {
      content: "See you tomorrow at the meeting 👋",
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString(),
    },
    unreadCount: 0,
    online: true,
  },
  {
    _id: "4",
    user: {
      _id: "u4",
      name: "Alex Rivera",
      username: "alexr",
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=alex",
    },
    latestMessage: {
      content: "The new design looks amazing!",
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
    },
    unreadCount: 0,
    online: false,
  },
];

const formatTime = (dateStr) => {
  if (!dateStr) return "";
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

const MainMessage = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [conversations] = useState(FAKE_CONVERSATIONS);

  const filtered = conversations.filter(
    (c) =>
      c.user?.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.user?.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="h-full flex flex-col bg-white dark:bg-neutral-900">
      {/* Header */}
      <div className="p-4 border-b border-neutral-200 dark:border-neutral-800">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-xl font-bold text-black dark:text-white">
            Messages
          </h1>
          <div className="flex items-center gap-2">
            <button className="p-2 rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors">
              <Edit size={20} className="text-neutral-500" />
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <Search
            size={18}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400"
          />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search conversations"
            className="w-full pl-10 pr-4 py-2.5 rounded-full bg-neutral-100 dark:bg-neutral-800 text-black dark:text-white placeholder:text-neutral-400 text-sm focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white"
          />
        </div>
      </div>

      {/* Conversation List */}
      <div className="flex-1 overflow-y-auto">
        {filtered.length === 0 ? (
          <div className="p-8 text-center">
            <MessageCircle
              size={32}
              className="mx-auto text-neutral-300 mb-2"
            />
            <p className="text-neutral-500 text-sm">No conversations found</p>
          </div>
        ) : (
          filtered.map((conversation) => (
            <div
              key={conversation._id}
              onClick={() =>
                navigate(`/messages/${conversation.user._id}`, {
                  state: { selectedUser: conversation.user },
                })
              }
              className="flex items-center gap-3 p-3 cursor-pointer hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors"
            >
              {/* Avatar */}
              <div className="relative flex-shrink-0">
                <img
                  src={conversation.user.avatar}
                  alt={conversation.user.name}
                  className="w-12 h-12 rounded-full object-cover border-2 border-neutral-200 dark:border-neutral-700"
                />
                {conversation.online && (
                  <div className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-500 rounded-full border-2 border-white dark:border-neutral-900" />
                )}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-sm text-black dark:text-white truncate">
                    {conversation.user.name}
                  </span>
                  <span className="text-xs text-neutral-400">
                    {formatTime(conversation.latestMessage?.createdAt)}
                  </span>
                </div>
                <p
                  className={`text-sm truncate ${
                    conversation.unreadCount > 0
                      ? "text-black dark:text-white font-medium"
                      : "text-neutral-500"
                  }`}
                >
                  {conversation.latestMessage?.content}
                </p>
              </div>

              {/* Unread Badge */}
              {conversation.unreadCount > 0 && (
                <div className="w-5 h-5 rounded-full bg-black dark:bg-white flex items-center justify-center flex-shrink-0">
                  <span className="text-xs font-medium text-white dark:text-black">
                    {conversation.unreadCount}
                  </span>
                </div>
              )}

              {/* More Options */}
              <button
                onClick={(e) => e.stopPropagation()}
                className="p-1.5 rounded-full hover:bg-neutral-200 dark:hover:bg-neutral-700 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <MoreHorizontal size={16} className="text-neutral-400" />
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default MainMessage;
