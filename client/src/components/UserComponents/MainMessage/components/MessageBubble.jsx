import React from "react";
import { MoreVertical, Trash2 } from "lucide-react";

const MessageBubble = ({
  message,
  isSentByCurrentUser,
  showAvatar,
  isConsecutiveMessage,
  receiverUser,
  showMessageOptions,
  setShowMessageOptions,
  handleDeleteMessage,
  formatTime,
}) => {
  return (
    <div
      className={`flex items-end ${
        isSentByCurrentUser ? "justify-end" : "justify-start"
      } ${isConsecutiveMessage ? "mt-1" : "mt-3"} w-full`}
    >
      {/* Show avatar only for other user's messages */}
      {!isSentByCurrentUser && (
        <div
          className={`flex-shrink-0 ${showAvatar ? "visible" : "invisible"}`}
        >
          <div className="w-9 h-9 rounded-full overflow-hidden mr-2 border border-gray-100 shadow-sm">
            <img
              src={receiverUser?.avatar || "https://via.placeholder.com/40"}
              alt={receiverUser?.username || "User"}
              className="w-full h-full object-cover"
            />
          </div>
        </div>
      )}

      {/* Message bubble styling */}
      <div
        className={`relative group ${
          isSentByCurrentUser ? "max-w-[80%]" : "max-w-[80%]"
        }`}
      >
        {/* Option button for current user's messages */}
        {isSentByCurrentUser && (
          <button
            onClick={() =>
              setShowMessageOptions(
                message._id === showMessageOptions ? null : message._id
              )
            }
            className="absolute -left-10 top-1/2 transform -translate-y-1/2 p-2 rounded-full bg-white text-gray-400 hover:text-gray-600 opacity-0 group-hover:opacity-100 transition-all duration-200 hover:bg-gray-50 shadow-sm z-10"
          >
            <MoreVertical size={16} />
          </button>
        )}

        {/* Message options dropdown */}
        {showMessageOptions === message._id && (
          <div className="absolute right-0 bottom-full mb-2 bg-white rounded-lg shadow-lg border border-gray-100 z-20 transition-all duration-200 transform origin-bottom-right animate-dropdown">
            <button
              onClick={() => handleDeleteMessage(message)}
              className="flex items-center w-full px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors rounded-lg"
            >
              <Trash2 size={14} className="mr-2" />
              Xóa tin nhắn
            </button>
          </div>
        )}

        <div
          className={`${
            isSentByCurrentUser
              ? "bg-indigo-100 text-gray-800 rounded-2xl rounded-tr-sm"
              : "bg-white text-gray-800 rounded-2xl rounded-tl-sm shadow-sm border border-gray-100"
          } px-4 py-3 text-sm inline-block`}
        >
          {/* Message media */}
          {message.media && (
            <div className="mb-2 rounded-lg overflow-hidden">
              <img
                src={message.media}
                alt="Media"
                className="max-w-full rounded-lg object-cover"
                onClick={() => window.open(message.media, "_blank")}
              />
            </div>
          )}

          {/* Message text */}
          {message.content && (
            <div className="break-words whitespace-pre-wrap">
              {message.content}
            </div>
          )}

          {/* Time and read status */}
          <div
            className={`text-xs mt-1.5 flex items-center ${
              isSentByCurrentUser ? "justify-end" : "justify-start"
            } text-gray-400`}
          >
            <span>{formatTime(message.createdAt)}</span>
            {isSentByCurrentUser && message.isRead && (
              <span className="ml-1 text-indigo-500">✓</span>
            )}
          </div>
        </div>
      </div>

      {/* Show avatar placeholder for current user's messages to maintain balance */}
      {isSentByCurrentUser && (
        <div className="flex-shrink-0 w-9 h-9 ml-2 invisible">
          {/* Invisible placeholder */}
        </div>
      )}
    </div>
  );
};

export default MessageBubble;
