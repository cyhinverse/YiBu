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

  const handleConversationKeyDown = (event, chat) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      setSelectedChat(chat);
    }
  };

  return (
    <div
      className={`w-full md:w-80 border-r border-neutral-200 dark:border-neutral-800 flex flex-col ${
        selectedChat ? 'hidden md:flex' : 'flex'
      }`}
    >
      <div className="p-4 border-b border-[var(--color-border)]">
        <h2 className="text-lg font-semibold text-[var(--color-content)] mb-3">
          Tin nhắn
        </h2>
        <div className="relative">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-tertiary)]"
          />
          <input
            type="text"
            placeholder="Tìm cuộc trò chuyện..."
            value={searchTerm}
            aria-label="Search conversations"
            onChange={e => setSearchTerm(e.target.value)}
            className="admin-input w-full pl-9"
          />
        </div>
      </div>


      <div className="flex-1 overflow-y-auto">
        {loading && !conversations ? (
          <div className="flex justify-center p-4">
            <Loader2 className="animate-spin text-[var(--color-text-tertiary)]" />
          </div>
        ) : filteredConversations.length === 0 ? (
          <div className="p-4 text-center text-[var(--color-text-secondary)] text-sm">
            Không tìm thấy cuộc trò chuyện
          </div>
        ) : (

          filteredConversations.map(chat => {
            const participant =
              chat.participants?.find(p => p._id !== currentUser?._id) ||
              chat.participants?.[0] ||
              {};
            const name = chat.name || participant.name || 'Người dùng';
            const avatar =
              chat.icon || participant.avatar || '/images/default-avatar.png';
            const lastMsg = chat.lastMessage?.content || 'Chưa có tin nhắn';
            const time = chat.lastMessage?.createdAt
              ? new Date(chat.lastMessage.createdAt).toLocaleDateString('vi-VN')
              : '';

            return (
              <div
                key={chat._id || chat.id}
                onClick={() => setSelectedChat(chat)}
                onKeyDown={event => handleConversationKeyDown(event, chat)}
                role="button"
                tabIndex={0}
                className={`p-3 flex gap-3 cursor-pointer hover:bg-[var(--color-surface-hover)] transition-colors ${
                  selectedChat?._id === chat._id
                    ? 'bg-[var(--color-surface-secondary)]'
                    : ''
                }`}
              >

                <img
                  src={avatar}
                  alt={name}
                  className="w-11 h-11 rounded-full object-cover border border-neutral-200 dark:border-neutral-700"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start">
                    <h3 className="font-semibold text-sm text-neutral-900 dark:text-white truncate">
                      {name}
                    </h3>
                    <span className="text-xs text-neutral-400">{time}</span>
                  </div>
                  <p className="text-xs text-neutral-500 truncate dark:text-neutral-400 mt-0.5">
                    {chat.lastMessage?.sender === 'me' ? 'Bạn: ' : ''}
                    {lastMsg}
                  </p>
                </div>
                {chat.unreadCount > 0 && (
                  <div className="w-5 h-5 bg-rose-500 rounded-full flex items-center justify-center self-center">
                    <span className="text-[10px] font-bold text-white">
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
