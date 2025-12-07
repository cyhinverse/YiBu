import { useState } from "react";
import { Send, MessageSquare, X } from "lucide-react";

const ReplyInput = ({ parentId, replyToChild, onAddReply, replies }) => {
  const [comment, setComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!comment.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      await onAddReply(parentId, replyToChild, comment);
      setComment("");
    } catch (error) {
      console.error("Lỗi khi gửi trả lời:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Tìm người dùng mà chúng ta đang trả lời
  const replyToUser = replyToChild
    ? replies.find((r) => r._id === replyToChild)?.user?.name
    : null;

  return (
    <div className={`mt-4 ml-14 flex items-center space-x-2 animate-slideIn`}>
      {replyToChild && (
        <div className="text-xs text-purple-500 font-medium mb-1 absolute -mt-5 flex items-center">
          <MessageSquare size={12} className="mr-1" />
          Đang trả lời {replyToUser || "người dùng"}
        </div>
      )}
      <input
        type="text"
        className="flex-1 p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-purple-300 bg-white shadow-sm"
        placeholder={
          replyToChild
            ? `Trả lời ${replyToUser || "người dùng"}...`
            : "Viết trả lời..."
        }
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && comment.trim() && !isSubmitting) {
            handleSubmit();
          }
        }}
        autoFocus
        disabled={isSubmitting}
      />
      <button
        className={`p-3 rounded-full transition-all duration-300 ${
          comment.trim() && !isSubmitting
            ? "bg-gradient-to-r from-purple-500 to-indigo-500 text-white shadow-lg hover:shadow-xl hover:from-purple-600 hover:to-indigo-600 transform hover:scale-105"
            : "bg-gray-200 text-gray-400"
        }`}
        onClick={handleSubmit}
        disabled={!comment.trim() || isSubmitting}
      >
        <Send size={18} />
      </button>
      {replyToChild && (
        <button
          className="absolute right-14 -mt-5 text-xs text-gray-500 hover:text-gray-700 bg-white rounded-full p-1 shadow-sm"
          onClick={() => onAddReply(parentId, null, "")}
          disabled={isSubmitting}
        >
          <X size={12} />
        </button>
      )}
    </div>
  );
};

export default ReplyInput;
