import { useState } from "react";
import { X, Send, Heart, MoreHorizontal, MessageCircle } from "lucide-react";

// Fake comments data
const FAKE_COMMENTS = [
  {
    _id: "c1",
    content: "This is amazing! Great work 🎉",
    createdAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
    user: {
      name: "Sarah Chen",
      username: "sarahchen",
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=sarah",
    },
    likes: 12,
    replies: [
      {
        _id: "r1",
        content: "Thank you so much! 🙏",
        createdAt: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
        user: {
          name: "John Doe",
          username: "johndoe",
          avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=johndoe",
        },
        likes: 3,
      },
    ],
  },
  {
    _id: "c2",
    content: "Love this design! Clean and minimal.",
    createdAt: new Date(Date.now() - 1000 * 60 * 60).toISOString(),
    user: {
      name: "Mike Johnson",
      username: "mikej",
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=mike",
    },
    likes: 5,
    replies: [],
  },
  {
    _id: "c3",
    content: "Can you share the source code? Would love to learn from this.",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
    user: {
      name: "Emma Wilson",
      username: "emmaw",
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=emma",
    },
    likes: 8,
    replies: [],
  },
];

const formatTime = (date) => {
  const now = new Date();
  const postDate = new Date(date);
  const diffMs = now - postDate;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "now";
  if (diffMins < 60) return `${diffMins}m`;
  if (diffHours < 24) return `${diffHours}h`;
  if (diffDays < 7) return `${diffDays}d`;
  return postDate.toLocaleDateString();
};

const CommentItem = ({ comment }) => {
  const [isLiked, setIsLiked] = useState(false);
  const [showReplies, setShowReplies] = useState(false);

  return (
    <div className="space-y-3">
      <div className="flex gap-3">
        <img
          src={comment.user.avatar}
          alt={comment.user.name}
          className="w-8 h-8 rounded-full object-cover border border-neutral-200 dark:border-neutral-700 flex-shrink-0"
        />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-medium text-sm text-black dark:text-white">
              {comment.user.name}
            </span>
            <span className="text-xs text-neutral-400">
              {formatTime(comment.createdAt)}
            </span>
          </div>
          <p className="text-sm text-black dark:text-white leading-relaxed">
            {comment.content}
          </p>
          <div className="flex items-center gap-4 mt-2">
            <button
              onClick={() => setIsLiked(!isLiked)}
              className={`flex items-center gap-1 text-xs ${
                isLiked ? "text-red-500" : "text-neutral-400 hover:text-red-500"
              } transition-colors`}
            >
              <Heart size={14} className={isLiked ? "fill-current" : ""} />
              <span>{comment.likes + (isLiked ? 1 : 0)}</span>
            </button>
            {comment.replies?.length > 0 && (
              <button
                onClick={() => setShowReplies(!showReplies)}
                className="flex items-center gap-1 text-xs text-neutral-400 hover:text-black dark:hover:text-white transition-colors"
              >
                <MessageCircle size={14} />
                <span>{comment.replies.length} replies</span>
              </button>
            )}
            <button className="text-xs text-neutral-400 hover:text-black dark:hover:text-white transition-colors">
              Reply
            </button>
          </div>
        </div>
        <button className="p-1 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-400 opacity-0 group-hover:opacity-100 transition-opacity self-start">
          <MoreHorizontal size={16} />
        </button>
      </div>

      {/* Replies */}
      {showReplies && comment.replies?.length > 0 && (
        <div className="ml-11 space-y-3 pt-2 border-l-2 border-neutral-100 dark:border-neutral-800 pl-4">
          {comment.replies.map((reply) => (
            <div key={reply._id} className="flex gap-3">
              <img
                src={reply.user.avatar}
                alt={reply.user.name}
                className="w-6 h-6 rounded-full object-cover border border-neutral-200 dark:border-neutral-700 flex-shrink-0"
              />
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-medium text-xs text-black dark:text-white">
                    {reply.user.name}
                  </span>
                  <span className="text-[11px] text-neutral-400">
                    {formatTime(reply.createdAt)}
                  </span>
                </div>
                <p className="text-xs text-black dark:text-white leading-relaxed">
                  {reply.content}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const CommentModel = ({ postId, onClose }) => {
  const [comments] = useState(FAKE_COMMENTS);
  const [newComment, setNewComment] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    // Simulate adding comment
    setNewComment("");
  };

  const totalComments = comments.reduce(
    (total, cmt) => total + 1 + (cmt.replies?.length || 0),
    0
  );

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg bg-white dark:bg-neutral-900 rounded-2xl flex flex-col max-h-[80vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-neutral-200 dark:border-neutral-800">
          <h3 className="font-semibold text-black dark:text-white">
            Comments{" "}
            <span className="text-neutral-400 font-normal">
              ({totalComments})
            </span>
          </h3>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
          >
            <X size={18} className="text-neutral-400" />
          </button>
        </div>

        {/* Comments List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {comments.length === 0 ? (
            <div className="text-center py-8">
              <MessageCircle
                size={32}
                className="mx-auto text-neutral-300 mb-2"
              />
              <p className="text-neutral-500 text-sm">No comments yet</p>
              <p className="text-neutral-400 text-xs">
                Be the first to comment!
              </p>
            </div>
          ) : (
            comments.map((comment) => (
              <CommentItem key={comment._id} comment={comment} />
            ))
          )}
        </div>

        {/* Input */}
        <form
          onSubmit={handleSubmit}
          className="p-4 border-t border-neutral-200 dark:border-neutral-800"
        >
          <div className="flex items-center gap-3">
            <img
              src="https://api.dicebear.com/7.x/avataaars/svg?seed=johndoe"
              alt="Your avatar"
              className="w-8 h-8 rounded-full object-cover border border-neutral-200 dark:border-neutral-700"
            />
            <div className="flex-1 relative">
              <input
                type="text"
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Write a comment..."
                className="w-full px-4 py-2.5 pr-10 rounded-full bg-neutral-100 dark:bg-neutral-800 text-black dark:text-white placeholder:text-neutral-400 text-sm focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white"
              />
              <button
                type="submit"
                disabled={!newComment.trim()}
                className={`absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-full transition-colors ${
                  newComment.trim()
                    ? "text-black dark:text-white hover:bg-neutral-200 dark:hover:bg-neutral-700"
                    : "text-neutral-300 cursor-not-allowed"
                }`}
              >
                <Send size={16} />
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CommentModel;
