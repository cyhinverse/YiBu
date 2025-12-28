import React from 'react';
import { Search, Loader2 } from 'lucide-react';

const ChatSidebar = ({
  conversations,
  loading,
  selectedChat,
  setSelectedChat,
  currentUser,
  searchTerm,
  setSearchTerm,
}) => {
  const conversationList = Array.isArray(conversations) ? conversations : [];

  const filteredConversations = conversationList.filter(c => {
    const name = c.name || c.participants?.[0]?.name || 'Chat';
    return name.toLowerCase().includes(searchTerm.toLowerCase());
  });

  return (
    <div
      className={`w-full md:w-80 border-r border-neutral-200 dark:border-neutral-800 flex flex-col ${
        selectedChat ? 'hidden md:flex' : 'flex'
      }`}
    >
      <div className="p-4 border-b border-neutral-200 dark:border-neutral-800">
        <h2 className="text-xl font-bold text-black dark:text-white mb-4">
          Messages
        </h2>
        <div className="relative">
          <Search
            size={18}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400"
          />
          <input
            type="text"
            placeholder="Search conversations..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-lg bg-neutral-100 dark:bg-neutral-800 border-none focus:ring-2 focus:ring-neutral-300 dark:focus:ring-neutral-700 outline-none"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {loading && !conversations ? (
          <div className="flex justify-center p-4">
            <Loader2 className="animate-spin" />
          </div>
        ) : filteredConversations.length === 0 ? (
          <div className="p-4 text-center text-neutral-500">
            No conversations found
          </div>
        ) : (
          filteredConversations.map(chat => {
            const participant =
              chat.participants?.find(p => p._id !== currentUser?._id) ||
              chat.participants?.[0] ||
              {};
            const name = chat.name || participant.name || 'Unknown User';
            const avatar =
              chat.icon || participant.avatar || '/images/default-avatar.png';
            const lastMsg = chat.lastMessage?.content || 'No messages yet';
            const time = chat.lastMessage?.createdAt
              ? new Date(chat.lastMessage.createdAt).toLocaleDateString()
              : '';

            return (
              <div
                key={chat._id || chat.id}
                onClick={() => setSelectedChat(chat)}
                className={`p-4 flex gap-3 cursor-pointer hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors ${
                  selectedChat?._id === chat._id
                    ? 'bg-neutral-100 dark:bg-neutral-800'
                    : ''
                }`}
              >
                <img
                  src={avatar}
                  alt={name}
                  className="w-12 h-12 rounded-full object-cover bg-neutral-200"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start">
                    <h3 className="font-semibold text-black dark:text-white truncate">
                      {name}
                    </h3>
                    <span className="text-xs text-neutral-500">{time}</span>
                  </div>
                  <p className="text-sm text-neutral-500 truncate dark:text-neutral-400">
                    {chat.lastMessage?.sender === 'me' ? 'You: ' : ''}
                    {lastMsg}
                  </p>
                </div>
                {chat.unreadCount > 0 && (
                  <div className="w-5 h-5 bg-red-500 rounded-full flex items-center justify-center">
                    <span className="text-xs text-white pb-0.5">
                      {chat.unreadCount}
                    </span>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default ChatSidebar;
