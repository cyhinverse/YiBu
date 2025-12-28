import { useState, useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';
import {
  Send,
  Search,
  MoreVertical,
  Phone,
  Video,
  Image,
  Paperclip,
  Smile,
  MoreHorizontal,
  Loader2,
  MessageSquare,
} from 'lucide-react';
import {
  useConversations,
  useMessages,
  useSendMessage,
  useMarkAsRead,
} from '@/hooks/useMessageQuery';
import toast from 'react-hot-toast';

const Messages = () => {
  const { user: currentUser } = useSelector(state => state.auth);

  const [selectedChat, setSelectedChat] = useState(null);
  const [messageInput, setMessageInput] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const messagesEndRef = useRef(null);

  const { data: conversationsData, isLoading: conversationsLoading } =
    useConversations({ page: 1, limit: 20 });

  const selectedChatId = selectedChat?._id || selectedChat?.id;
  const { data: messagesData, isLoading: messagesLoading } = useMessages({
    conversationId: selectedChatId,
    page: 1,
  });

  const sendMessageMutation = useSendMessage();
  const markAsReadMutation = useMarkAsRead();

  useEffect(() => {
    if (selectedChatId) {
      markAsReadMutation.mutate(selectedChatId);
    }
  }, [selectedChatId]);

  // Scroll to bottom
  const messages = messagesData?.messages || messagesData || [];
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, selectedChat]);

  const handleSend = async e => {
    e.preventDefault();
    if (!messageInput.trim() || !selectedChatId) return;

    try {
      await sendMessageMutation.mutateAsync({
        conversationId: selectedChatId,
        content: messageInput,
        type: 'text',
      });
      setMessageInput('');
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Gửi tin nhắn thất bại');
    }
  };

  const loading = conversationsLoading || messagesLoading;
  const conversations =
    conversationsData?.conversations || conversationsData || [];

  const conversationList = Array.isArray(conversations) ? conversations : [];

  const filteredConversations = conversationList.filter(c => {
    const name = c.name || c.participants?.[0]?.name || 'Chat';
    return name.toLowerCase().includes(searchTerm.toLowerCase());
  });

  return (
    <div className="h-[calc(100vh-8rem)] bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 flex overflow-hidden">
      {/* Sidebar - Chat List */}
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

      {/* Main Chat Area */}
      {selectedChat ? (
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
                  <span className="w-2 h-2 bg-green-500 rounded-full"></span>{' '}
                  Online
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
      ) : (
        <div className="flex-1 hidden md:flex flex-col items-center justify-center text-neutral-500">
          <div className="w-16 h-16 bg-neutral-100 dark:bg-neutral-800 rounded-full flex items-center justify-center mb-4">
            <MessageSquare size={32} />
          </div>
          <h3 className="text-xl font-bold text-black dark:text-white mb-2">
            Your Messages
          </h3>
          <p>Select a conversation to start chatting</p>
        </div>
      )}
    </div>
  );
};

export default Messages;
