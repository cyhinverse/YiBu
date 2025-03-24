import React from "react";
import { Send } from "lucide-react";
import MessageBubble from "./MessageBubble";

const MessageList = ({
  loading,
  loadingError,
  retryFetchMessages,
  messages,
  receiverUser,
  isSenderCurrentUser,
  messagesEndRef,
  showMessageOptions,
  setShowMessageOptions,
  handleDeleteMessage,
}) => {
  // Format time
  const formatTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  // Format date
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return "Today";
    } else if (date.toDateString() === yesterday.toDateString()) {
      return "Yesterday";
    } else {
      return date.toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
        year:
          date.getFullYear() !== today.getFullYear() ? "numeric" : undefined,
      });
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (loadingError) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center max-w-md mx-auto space-y-4">
        <div className="bg-red-100 rounded-full p-3">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-8 w-8 text-red-500"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
        </div>
        <p className="text-red-600 font-medium">
          {loadingError || "Failed to load messages"}
        </p>
        <button
          className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
          onClick={retryFetchMessages}
        >
          Try Again
        </button>
      </div>
    );
  }

  if (messages.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center animate-fadeIn">
        <div className="w-16 h-16 rounded-full bg-indigo-50 flex items-center justify-center mb-4">
          <Send size={22} className="text-indigo-600" />
        </div>
        <h3 className="text-base font-semibold mb-2 text-gray-700">
          Chưa có tin nhắn
        </h3>
        <p className="text-gray-500 text-sm max-w-xs mb-4">
          Hãy bắt đầu cuộc trò chuyện với{" "}
          {receiverUser?.username || "người dùng này"}
        </p>
        <button
          onClick={() => {
            document.getElementById("messageInput")?.focus();
          }}
          className="bg-indigo-600 text-white text-sm px-5 py-2 rounded-full hover:bg-indigo-700 transition-all duration-300 shadow-md hover:shadow-lg"
        >
          Gửi tin nhắn đầu tiên
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Messages content */}
      {messages.map((message, index) => {
        if (!message || !message._id) return null;

        const hasSender =
          message.sender &&
          (message.sender._id || typeof message.sender === "string");
        if (!hasSender) return null;
        const isSentByCurrentUser = isSenderCurrentUser(message);

        const showAvatar =
          index === 0 ||
          (index > 0 &&
            isSenderCurrentUser !== isSenderCurrentUser(messages[index - 1]));

        const isConsecutiveMessage =
          index > 0 &&
          messages[index - 1] &&
          isSentByCurrentUser === isSenderCurrentUser(messages[index - 1]);

        const shouldShowDateSeparator =
          index === 0 ||
          (index > 0 &&
            new Date(message.createdAt).toLocaleDateString() !==
              new Date(messages[index - 1].createdAt).toLocaleDateString());

        return (
          <React.Fragment key={message._id}>
            {shouldShowDateSeparator && (
              <div className="flex justify-center my-4">
                <div className="  text-xs px-5 py-1.5 rounded-full">
                  {formatDate(message.createdAt)}
                </div>
              </div>
            )}

            <MessageBubble
              message={message}
              isSentByCurrentUser={isSentByCurrentUser}
              showAvatar={showAvatar}
              isConsecutiveMessage={isConsecutiveMessage}
              receiverUser={receiverUser}
              showMessageOptions={showMessageOptions}
              setShowMessageOptions={setShowMessageOptions}
              handleDeleteMessage={handleDeleteMessage}
              formatTime={formatTime}
            />
          </React.Fragment>
        );
      })}
      <div ref={messagesEndRef} className="h-2" />
    </div>
  );
};

export default MessageList;
