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
        <div className="w-16 h-16 bg-neutral-100 dark:bg-neutral-800 rounded-full flex items-center justify-center mb-4">
          <MessageSquare size={32} />
        </div>
        <h3 className="text-xl font-bold text-black dark:text-white mb-2">
          Your Messages
        </h3>
        <p>Select a conversation to start chatting</p>
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
      <div className="h-16 border-b border-neutral-200 dark:border-neutral-800 flex items-center justify-between px-6 bg-white dark:bg-neutral-900 z-10">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setSelectedChat(null)}
            className="md:hidden p-2 -ml-2 text-neutral-500"
          >
            <MoreHorizontal />
          </button>
          <img
            src={
              selectedChat.icon ||
              selectedChat.participants?.[0]?.avatar ||
              '/images/default-avatar.png'
            }
            alt="User"
            className="w-10 h-10 rounded-full object-cover"
          />
          <div>
            <h3 className="font-bold text-black dark:text-white">
              {selectedChat.name ||
                selectedChat.participants?.[0]?.name ||
                'Chat'}
            </h3>
            <span className="text-xs text-green-500 flex items-center gap-1">
              <span className="w-2 h-2 bg-green-500 rounded-full"></span> Online
            </span>
          </div>
        </div>
        <div className="flex gap-4 text-neutral-500">
          <button className="hover:text-black dark:hover:text-white">
            <Phone size={20} />
          </button>
          <button className="hover:text-black dark:hover:text-white">
            <Video size={20} />
          </button>
          <button className="hover:text-black dark:hover:text-white">
            <MoreVertical size={20} />
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
        className="p-4 bg-white dark:bg-neutral-900 border-t border-neutral-200 dark:border-neutral-800 flex items-center gap-3"
      >
        <button
          type="button"
          className="p-2 text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-full"
        >
          <Paperclip size={20} />
        </button>
        <button
          type="button"
          className="p-2 text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-full"
        >
          <Image size={20} />
        </button>
        <input
          type="text"
          value={messageInput}
          onChange={e => setMessageInput(e.target.value)}
          placeholder="Type a message..."
          className="flex-1 bg-neutral-100 dark:bg-neutral-800 rounded-full px-4 py-2.5 outline-none focus:ring-2 focus:ring-black dark:focus:ring-white transition-all"
        />
        <button
          type="button"
          className="p-2 text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-full"
        >
          <Smile size={20} />
        </button>
        <button
          type="submit"
          disabled={!messageInput.trim()}
          className="p-3 bg-black dark:bg-white text-white dark:text-black rounded-full hover:opacity-90 disabled:opacity-50 transition-opacity"
        >
          <Send size={18} />
        </button>
      </form>
    </div>
  );
};

export default ChatWindow;
