import React from 'react';
import {
  Send,
  MoreVertical,
  Phone,
  Video,
  Image,
  Paperclip,
  Smile,
  MoreHorizontal,
  MessageSquare,
} from 'lucide-react';

const ChatWindow = ({
  selectedChat,
  setSelectedChat,
  messages,
  currentUser,
  messageInput,
  setMessageInput,
  handleSend,
  messagesEndRef,
}) => {
  if (!selectedChat) {
    return (
      <div className="flex-1 hidden md:flex flex-col items-center justify-center text-neutral-500">
        <div className="w-14 h-14 bg-neutral-100 dark:bg-neutral-800 rounded-full flex items-center justify-center mb-3">
          <MessageSquare size={28} strokeWidth={1.5} />
        </div>
        <h3 className="text-lg font-bold text-neutral-900 dark:text-white mb-1">
          Tin nhắn
        </h3>
        <p className="text-sm">Chọn cuộc trò chuyện để bắt đầu</p>
      </div>
    );
  }

  return (
    <div
      className={`flex-1 flex flex-col ${
        !selectedChat ? 'hidden md:flex' : 'flex'
      }`}
    >
      {/* Header */}
      <div className="h-14 border-b border-neutral-200 dark:border-neutral-800 flex items-center justify-between px-4 bg-white dark:bg-neutral-900 z-10">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setSelectedChat(null)}
            className="md:hidden p-1.5 -ml-1 text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg transition-colors"
          >
            <MoreHorizontal size={18} />
          </button>
          <img
            src={
              selectedChat.icon ||
              selectedChat.participants?.[0]?.avatar ||
              '/images/default-avatar.png'
            }
            alt="User"
            className="w-9 h-9 rounded-full object-cover border border-neutral-200 dark:border-neutral-700"
          />
          <div>
            <h3 className="font-semibold text-sm text-neutral-900 dark:text-white">
              {selectedChat.name ||
                selectedChat.participants?.[0]?.name ||
                'Cuộc trò chuyện'}
            </h3>
            <span className="text-[11px] text-emerald-500 flex items-center gap-1">
              <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></span>{' '}
              Trực tuyến
            </span>
          </div>
        </div>
        <div className="flex gap-1 text-neutral-400">
          <button className="p-2 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg transition-colors hover:text-neutral-900 dark:hover:text-white">
            <Phone size={18} strokeWidth={1.5} />
          </button>
          <button className="p-2 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg transition-colors hover:text-neutral-900 dark:hover:text-white">
            <Video size={18} strokeWidth={1.5} />
          </button>
          <button className="p-2 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg transition-colors hover:text-neutral-900 dark:hover:text-white">
            <MoreVertical size={18} strokeWidth={1.5} />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-neutral-50 dark:bg-neutral-950/50">
        {(messages?.data || messages || []).map((msg, idx) => {
          const isMe =
            msg.sender?._id === currentUser?._id ||
            msg.isOwner ||
            msg.sender === 'me' ||
            msg.isMe;

          return (
            <div
              key={idx}
              className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[70%] rounded-2xl px-4 py-2 ${
                  isMe
                    ? 'bg-black text-white dark:bg-white dark:text-black rounded-tr-none'
                    : 'bg-white dark:bg-neutral-800 text-black dark:text-white rounded-tl-none border border-neutral-200 dark:border-neutral-700'
                }`}
              >
                <p>{msg.content}</p>
                <span
                  className={`text-[10px] block mt-1 ${
                    isMe ? 'text-neutral-400' : 'text-neutral-500'
                  }`}
                >
                  {new Date(msg.createdAt).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form
        onSubmit={handleSend}
        className="p-3 bg-white dark:bg-neutral-900 border-t border-neutral-200 dark:border-neutral-800 flex items-center gap-2"
      >
        <button
          type="button"
          className="p-2 text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg transition-colors"
        >
          <Paperclip size={18} strokeWidth={1.5} />
        </button>
        <button
          type="button"
          className="p-2 text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg transition-colors"
        >
          <Image size={18} strokeWidth={1.5} />
        </button>
        <input
          type="text"
          value={messageInput}
          onChange={e => setMessageInput(e.target.value)}
          placeholder="Nhập tin nhắn..."
          className="flex-1 bg-neutral-100 dark:bg-neutral-800 rounded-xl px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-neutral-200 dark:focus:ring-neutral-700 transition-all"
        />
        <button
          type="button"
          className="p-2 text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg transition-colors"
        >
          <Smile size={18} strokeWidth={1.5} />
        </button>
        <button
          type="submit"
          disabled={!messageInput.trim()}
          className="p-2.5 bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 rounded-xl hover:opacity-90 disabled:opacity-40 transition-opacity"
        >
          <Send size={16} />
        </button>
      </form>
    </div>
  );
};

export default ChatWindow;
