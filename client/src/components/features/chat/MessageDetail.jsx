import { useState, useRef, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  MoreHorizontal,
  Send,
  Image as ImageIcon,
  Smile,
  CheckCheck,
} from "lucide-react";

// Fake user data
const FAKE_USERS = {
  u1: {
    _id: "u1",
    name: "Sarah Chen",
    username: "sarahchen",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=sarah",
  },
  u2: {
    _id: "u2",
    name: "Mike Johnson",
    username: "mikej",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=mike",
  },
  u3: {
    _id: "u3",
    name: "Emma Wilson",
    username: "emmaw",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=emma",
  },
  u4: {
    _id: "u4",
    name: "Alex Rivera",
    username: "alexr",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=alex",
  },
};

const CURRENT_USER = {
  _id: "me",
  name: "John Doe",
  username: "johndoe",
  avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=johndoe",
};

// Fake messages
const FAKE_MESSAGES = [
  {
    _id: "m1",
    content: "Hey! How are you doing?",
    sender: { _id: "u1" },
    createdAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
    isRead: true,
  },
  {
    _id: "m2",
    content: "I'm doing great, thanks! Working on a new project.",
    sender: { _id: "me" },
    createdAt: new Date(Date.now() - 1000 * 60 * 25).toISOString(),
    isRead: true,
  },
  {
    _id: "m3",
    content: "That sounds exciting! What kind of project?",
    sender: { _id: "u1" },
    createdAt: new Date(Date.now() - 1000 * 60 * 20).toISOString(),
    isRead: true,
  },
  {
    _id: "m4",
    content:
      "It's a social media app with a clean, minimal design. Black and white theme.",
    sender: { _id: "me" },
    createdAt: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
    isRead: true,
  },
  {
    _id: "m5",
    content: "That sounds great! Let me know when you're free to show me.",
    sender: { _id: "u1" },
    createdAt: new Date(Date.now() - 1000 * 60 * 2).toISOString(),
    isRead: true,
  },
];

const formatTime = (dateStr) => {
  return new Date(dateStr).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
};

const MessageBubble = ({
  message,
  isSentByCurrentUser,
  showAvatar,
  receiverUser,
}) => {
  return (
    <div
      className={`flex mb-2 ${
        isSentByCurrentUser ? "justify-end" : "justify-start"
      }`}
    >
      <div
        className={`flex max-w-[75%] ${
          isSentByCurrentUser ? "flex-row-reverse" : "flex-row"
        } items-end gap-2`}
      >
        {/* Avatar */}
        {!isSentByCurrentUser && (
          <div className="w-8 h-8 flex-shrink-0">
            {showAvatar ? (
              <img
                src={receiverUser?.avatar}
                alt={receiverUser?.username}
                className="w-8 h-8 rounded-full object-cover border border-neutral-200 dark:border-neutral-700"
              />
            ) : (
              <div className="w-8" />
            )}
          </div>
        )}

        {/* Bubble */}
        <div
          className={`relative px-4 py-2.5 text-sm ${
            isSentByCurrentUser
              ? "bg-black dark:bg-white text-white dark:text-black rounded-2xl rounded-br-md"
              : "bg-neutral-100 dark:bg-neutral-800 text-black dark:text-white rounded-2xl rounded-bl-md"
          }`}
        >
          <p className="whitespace-pre-wrap leading-relaxed">
            {message.content}
          </p>
          <div
            className={`text-[10px] mt-1 flex items-center justify-end ${
              isSentByCurrentUser
                ? "text-white/70 dark:text-black/50"
                : "text-neutral-400"
            }`}
          >
            {formatTime(message.createdAt)}
            {isSentByCurrentUser && message.isRead && (
              <CheckCheck size={12} className="ml-1" />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const MessageDetail = () => {
  const { userId: receiverId } = useParams();
  const navigate = useNavigate();
  const [messages, setMessages] = useState(FAKE_MESSAGES);
  const [messageText, setMessageText] = useState("");
  const messagesEndRef = useRef(null);

  const receiverUser = FAKE_USERS[receiverId] || {
    _id: receiverId,
    name: "Unknown User",
    username: "unknown",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=default",
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = () => {
    if (!messageText.trim()) return;

    const newMessage = {
      _id: `m${Date.now()}`,
      content: messageText,
      sender: { _id: "me" },
      createdAt: new Date().toISOString(),
      isRead: false,
    };

    setMessages([...messages, newMessage]);
    setMessageText("");
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="h-full flex flex-col bg-white dark:bg-neutral-900">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-neutral-200 dark:border-neutral-800">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate("/messages")}
            className="p-2 -ml-2 rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
          >
            <ArrowLeft size={20} className="text-neutral-500" />
          </button>
          <img
            src={receiverUser.avatar}
            alt={receiverUser.name}
            className="w-10 h-10 rounded-full object-cover border-2 border-neutral-200 dark:border-neutral-700"
          />
          <div>
            <h2 className="font-semibold text-black dark:text-white">
              {receiverUser.name}
            </h2>
            <p className="text-xs text-neutral-500">@{receiverUser.username}</p>
          </div>
        </div>
        <button className="p-2 rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors">
          <MoreHorizontal size={20} className="text-neutral-500" />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4">
        {messages.map((message, index) => {
          const isSentByCurrentUser = message.sender._id === "me";
          const showAvatar =
            !isSentByCurrentUser &&
            (index === 0 ||
              messages[index - 1]?.sender._id !== message.sender._id);

          return (
            <MessageBubble
              key={message._id}
              message={message}
              isSentByCurrentUser={isSentByCurrentUser}
              showAvatar={showAvatar}
              receiverUser={receiverUser}
            />
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t border-neutral-200 dark:border-neutral-800">
        <div className="flex items-center gap-3">
          <button className="p-2 rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors">
            <ImageIcon size={20} className="text-neutral-500" />
          </button>
          <button className="p-2 rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors">
            <Smile size={20} className="text-neutral-500" />
          </button>
          <input
            type="text"
            value={messageText}
            onChange={(e) => setMessageText(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Start a new message"
            className="flex-1 px-4 py-2.5 rounded-full bg-neutral-100 dark:bg-neutral-800 text-black dark:text-white placeholder:text-neutral-400 text-sm focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white"
          />
          <button
            onClick={handleSend}
            disabled={!messageText.trim()}
            className={`p-2.5 rounded-full transition-all ${
              messageText.trim()
                ? "bg-black dark:bg-white text-white dark:text-black hover:opacity-80"
                : "bg-neutral-200 dark:bg-neutral-700 text-neutral-400 cursor-not-allowed"
            }`}
          >
            <Send size={18} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default MessageDetail;
