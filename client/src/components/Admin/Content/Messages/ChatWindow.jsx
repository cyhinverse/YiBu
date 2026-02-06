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
      <div className="flex-1 hidden md:flex flex-col items-center justify-center text-[var(--color-text-secondary)]">
        <div className="w-14 h-12 bg-[var(--color-surface-secondary)] rounded-full flex items-center justify-center mb-3">
          <MessageSquare size={28} strokeWidth={1.5} />
        </div>
        <h3 className="text-lg font-semibold text-[var(--color-content)] mb-1">
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
      <div className="h-12 border-b border-[var(--color-border)] flex items-center justify-between px-4 bg-[var(--color-surface)] z-10">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setSelectedChat(null)}
            onKeyDown={event => {
              if (event.key === 'Escape') {
                setSelectedChat(null);
              }
            }}
            className="md:hidden p-1.5 -ml-1 text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-hover)] rounded-lg transition-colors"
            aria-label="Quay lại danh sách"
          >
            <MoreHorizontal size={18} />
          </button>
          <img
            src={
              selectedChat.icon ||
              selectedChat.participants?.[0]?.avatar ||
              '/images/default-avatar.png'
            }
            alt={
              selectedChat.name ||
              selectedChat.participants?.[0]?.name ||
              'Chat avatar'
            }
            className="w-9 h-9 rounded-full object-cover border border-[var(--color-border)]"
          />
          <div>
            <h3 className="font-semibold text-sm text-[var(--color-content)]">
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
        <div className="flex gap-1 text-[var(--color-text-tertiary)]">
          <button
            type="button"
            className="p-2 hover:bg-[var(--color-surface-hover)] rounded-lg transition-colors hover:text-[var(--color-content)]"
            aria-label="Gọi thoại"
            title="Gọi thoại"
          >
            <Phone size={18} strokeWidth={1.6} />
          </button>
          <button
            type="button"
            className="p-2 hover:bg-[var(--color-surface-hover)] rounded-lg transition-colors hover:text-[var(--color-content)]"
            aria-label="Gọi video"
            title="Gọi video"
          >
            <Video size={18} strokeWidth={1.6} />
          </button>
          <button
            type="button"
            className="p-2 hover:bg-[var(--color-surface-hover)] rounded-lg transition-colors hover:text-[var(--color-content)]"
            aria-label="Tùy chọn"
            title="Tùy chọn"
          >
            <MoreVertical size={18} strokeWidth={1.6} />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-[var(--color-surface-secondary)]">
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
                    ? 'bg-[var(--color-primary)] text-[var(--color-primary-foreground)] rounded-tr-none'
                    : 'bg-[var(--color-surface)] text-[var(--color-content)] rounded-tl-none border border-[var(--color-border)]'
                }`}
              >
                <p>{msg.content}</p>
                <span
                  className={`text-[10px] block mt-1 ${
                    isMe
                      ? 'text-[var(--color-primary-foreground)]/70'
                      : 'text-[var(--color-text-tertiary)]'
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
        className="p-3 bg-[var(--color-surface)] border-t border-[var(--color-border)] flex items-center gap-2"
      >
        <button
          type="button"
          className="p-2 text-[var(--color-text-tertiary)] hover:bg-[var(--color-surface-hover)] rounded-lg transition-colors"
        >
          <Paperclip size={18} strokeWidth={1.5} />
        </button>
        <button
          type="button"
          className="p-2 text-[var(--color-text-tertiary)] hover:bg-[var(--color-surface-hover)] rounded-lg transition-colors"
        >
          <Image size={18} strokeWidth={1.5} />
        </button>
        <input
          type="text"
          value={messageInput}
          id="message-input"
          onChange={e => setMessageInput(e.target.value)}
          placeholder="Nhập tin nhắn..."
          aria-label="Message input"
          className="admin-input flex-1"
        />
        <button
          type="button"
          className="p-2 text-[var(--color-text-tertiary)] hover:bg-[var(--color-surface-hover)] rounded-lg transition-colors"
        >
          <Smile size={18} strokeWidth={1.5} />
        </button>
        <button
          type="submit"
          disabled={!messageInput.trim()}
          className="p-2.5 bg-[var(--color-primary)] text-[var(--color-primary-foreground)] rounded-xl hover:opacity-90 disabled:opacity-40 transition-opacity"
        >
          <Send size={16} />
        </button>
      </form>
    </div>

  );
};

export default ChatWindow;
