import { useState } from "react";
import {
  Search,
  Settings,
  Edit,
  MessageCircle,
  MoreHorizontal,
} from "lucide-react";

// Fake conversations data
const FAKE_CONVERSATIONS = [
  {
    id: "1",
    user: {
      name: "Sarah Chen",
      username: "sarahchen",
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=sarah",
      online: true,
    },
    lastMessage: "That sounds great! Let me know when you're free.",
    time: "2m",
    unread: 2,
  },
  {
    id: "2",
    user: {
      name: "Mike Johnson",
      username: "mikej",
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=mike",
      online: false,
    },
    lastMessage: "Thanks for sharing the code!",
    time: "1h",
    unread: 0,
  },
  {
    id: "3",
    user: {
      name: "Emma Wilson",
      username: "emmaw",
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=emma",
      online: true,
    },
    lastMessage: "See you tomorrow at the meeting 👋",
    time: "3h",
    unread: 0,
  },
  {
    id: "4",
    user: {
      name: "Alex Rivera",
      username: "alexr",
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=alex",
      online: false,
    },
    lastMessage: "The new design looks amazing!",
    time: "1d",
    unread: 0,
  },
];

const ConversationItem = ({ conversation, isActive, onClick }) => {
  return (
    <div
      onClick={onClick}
      className={`flex items-center gap-3 p-3 cursor-pointer transition-colors ${
        isActive
          ? "bg-neutral-100 dark:bg-neutral-800"
          : "hover:bg-neutral-50 dark:hover:bg-neutral-800/50"
      }`}
    >
      <div className="relative flex-shrink-0">
        <img
          src={conversation.user.avatar}
          alt={conversation.user.name}
          className="w-12 h-12 rounded-full object-cover border-2 border-neutral-200 dark:border-neutral-700"
        />
        {conversation.user.online && (
          <div className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-500 rounded-full border-2 border-white dark:border-neutral-900" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between">
          <span className="font-medium text-sm text-black dark:text-white truncate">
            {conversation.user.name}
          </span>
          <span className="text-xs text-neutral-400">{conversation.time}</span>
        </div>
        <p
          className={`text-sm truncate ${
            conversation.unread > 0
              ? "text-black dark:text-white font-medium"
              : "text-neutral-500"
          }`}
        >
          {conversation.lastMessage}
        </p>
      </div>
      {conversation.unread > 0 && (
        <div className="w-5 h-5 rounded-full bg-black dark:bg-white flex items-center justify-center flex-shrink-0">
          <span className="text-xs font-medium text-white dark:text-black">
            {conversation.unread}
          </span>
        </div>
      )}
    </div>
  );
};

function Message() {
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");

  const filteredConversations = FAKE_CONVERSATIONS.filter(
    (c) =>
      c.user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.user.username.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex w-full h-[100dvh]">
      {/* Left Sidebar (Conversation List) */}
      <div
        className={`w-full md:w-[380px] lg:w-[400px] flex-shrink-0 border-r border-neutral-200 dark:border-neutral-800 flex flex-col bg-white dark:bg-neutral-900 ${
          selectedConversation ? "hidden md:flex" : "flex"
        }`}
      >
        {/* Header */}
        <div className="p-4 border-b border-neutral-200 dark:border-neutral-800">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-xl font-bold text-black dark:text-white">
              Messages
            </h1>
            <div className="flex items-center gap-2">
              <button className="p-2 rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors">
                <Settings size={20} className="text-neutral-500" />
              </button>
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
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search messages"
              className="w-full pl-10 pr-4 py-2.5 rounded-full bg-neutral-100 dark:bg-neutral-800 text-black dark:text-white placeholder:text-neutral-400 text-sm focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white"
            />
          </div>
        </div>

        {/* Conversations */}
        <div className="flex-1 overflow-y-auto">
          {filteredConversations.length === 0 ? (
            <div className="p-8 text-center">
              <MessageCircle
                size={32}
                className="mx-auto text-neutral-300 mb-2"
              />
              <p className="text-neutral-500 text-sm">No conversations found</p>
            </div>
          ) : (
            filteredConversations.map((conversation) => (
              <ConversationItem
                key={conversation.id}
                conversation={conversation}
                isActive={selectedConversation?.id === conversation.id}
                onClick={() => setSelectedConversation(conversation)}
              />
            ))
          )}
        </div>
      </div>

      {/* Right Content (Chat Detail or Empty State) */}
      <div
        className={`flex-1 min-w-0 flex flex-col bg-white dark:bg-neutral-900 ${
          selectedConversation ? "flex" : "hidden md:flex"
        }`}
      >
        {selectedConversation ? (
          <>
            {/* Chat Header */}
            <div className="flex items-center justify-between p-4 border-b border-neutral-200 dark:border-neutral-800">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setSelectedConversation(null)}
                  className="md:hidden p-2 -ml-2 rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-800"
                >
                  ←
                </button>
                <img
                  src={selectedConversation.user.avatar}
                  alt={selectedConversation.user.name}
                  className="w-10 h-10 rounded-full object-cover border-2 border-neutral-200 dark:border-neutral-700"
                />
                <div>
                  <h2 className="font-semibold text-black dark:text-white">
                    {selectedConversation.user.name}
                  </h2>
                  <p className="text-xs text-neutral-500">
                    @{selectedConversation.user.username}
                  </p>
                </div>
              </div>
              <button className="p-2 rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-800">
                <MoreHorizontal size={20} className="text-neutral-500" />
              </button>
            </div>

            {/* Chat Messages */}
            <div className="flex-1 p-4 overflow-y-auto">
              <div className="text-center text-neutral-400 text-sm py-8">
                Start of your conversation with {selectedConversation.user.name}
              </div>
            </div>

            {/* Chat Input */}
            <div className="p-4 border-t border-neutral-200 dark:border-neutral-800">
              <div className="flex items-center gap-3">
                <input
                  type="text"
                  placeholder="Start a new message"
                  className="flex-1 px-4 py-3 rounded-full bg-neutral-100 dark:bg-neutral-800 text-black dark:text-white placeholder:text-neutral-400 text-sm focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white"
                />
                <button className="p-3 rounded-full bg-black dark:bg-white text-white dark:text-black hover:opacity-80 transition-opacity">
                  <Edit size={18} />
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center text-center p-8">
            <div className="max-w-md">
              <MessageCircle
                size={48}
                className="mx-auto text-neutral-300 mb-4"
              />
              <h2 className="text-2xl font-bold text-black dark:text-white mb-2">
                Select a message
              </h2>
              <p className="text-neutral-500 mb-6">
                Choose from your existing conversations, start a new one, or
                just keep swimming.
              </p>
              <button className="px-6 py-3 bg-black dark:bg-white text-white dark:text-black font-medium rounded-full hover:opacity-90 transition-opacity text-sm">
                New message
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default Message;
