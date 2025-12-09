import { useState } from "react";
import {
  MoreHorizontal,
  Heart,
  MessageCircle,
  Send,
  Bookmark,
  Eye,
  X,
} from "lucide-react";

// Fake post data for component testing
const formatCount = (count) => {
  if (count >= 1000000) {
    return (count / 1000000).toFixed(1).replace(/\.0$/, "") + "M";
  }
  if (count >= 1000) {
    return (count / 1000).toFixed(1).replace(/\.0$/, "") + "K";
  }
  return count.toString();
};

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

const Post = ({ data }) => {
  const [isLiked, setIsLiked] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [likeCount, setLikeCount] = useState(data?.likeCount || 0);
  const [showOptions, setShowOptions] = useState(false);
  const [showImage, setShowImage] = useState(null);
  const [showComments, setShowComments] = useState(false);

  const user = data?.user || {
    name: "Unknown User",
    username: "unknown",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=default",
  };

  const handleLike = () => {
    setIsLiked(!isLiked);
    setLikeCount(isLiked ? likeCount - 1 : likeCount + 1);
  };

  const handleSave = () => {
    setIsSaved(!isSaved);
  };

  if (!data) return null;

  return (
    <article className="rounded-2xl border border-neutral-200 dark:border-neutral-800 p-4 bg-white dark:bg-neutral-900 hover:border-neutral-300 dark:hover:border-neutral-700 transition-colors">
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="relative group">
            <img
              className="w-11 h-11 rounded-full object-cover border-2 border-neutral-200 dark:border-neutral-700"
              src={user.avatar}
              alt={user.name}
            />
            <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full border-2 border-white dark:border-neutral-900 opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-black dark:text-white hover:underline cursor-pointer">
                {user.name}
              </span>
              {user.verified && (
                <div className="w-4 h-4 rounded-full bg-black dark:bg-white flex items-center justify-center">
                  <svg
                    width="10"
                    height="10"
                    viewBox="0 0 24 24"
                    fill="white"
                    className="dark:fill-black"
                  >
                    <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
                  </svg>
                </div>
              )}
            </div>
            <div className="flex items-center gap-1.5 text-sm text-neutral-500">
              <span>@{user.username}</span>
              <span>•</span>
              <span>{formatTime(data.createdAt)}</span>
            </div>
          </div>
        </div>

        <button
          onClick={() => setShowOptions(!showOptions)}
          className="p-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-400 hover:text-black dark:hover:text-white transition-all"
        >
          <MoreHorizontal size={18} />
        </button>
      </div>

      {/* Content */}
      {data.caption && (
        <p className="text-black dark:text-white leading-relaxed mb-3 whitespace-pre-wrap break-words">
          {data.caption}
        </p>
      )}

      {/* Media */}
      {data.media && data.media.length > 0 && (
        <div
          className={`rounded-xl overflow-hidden mb-3 ${
            data.media.length === 1 ? "" : "grid gap-1"
          } ${data.media.length === 2 ? "grid-cols-2" : ""} ${
            data.media.length >= 3 ? "grid-cols-2" : ""
          }`}
        >
          {data.media.slice(0, 4).map((item, index) => (
            <div
              key={index}
              className={`relative overflow-hidden ${
                data.media.length === 3 && index === 0 ? "row-span-2" : ""
              } ${data.media.length === 1 ? "max-h-[450px]" : "aspect-square"}`}
            >
              {item.type === "video" ? (
                <video
                  autoPlay
                  playsInline
                  muted
                  loop
                  className="w-full h-full object-cover"
                >
                  <source src={item.url} type="video/mp4" />
                </video>
              ) : (
                <img
                  className={`w-full h-full object-cover cursor-pointer hover:scale-105 transition-transform duration-300 ${
                    data.media.length === 1 ? "max-h-[450px]" : ""
                  }`}
                  src={item.url}
                  alt={`Post media ${index + 1}`}
                  onClick={() => setShowImage(item.url)}
                />
              )}
              {data.media.length > 4 && index === 3 && (
                <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center">
                  <span className="text-white text-2xl font-bold">
                    +{data.media.length - 4}
                  </span>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Stats Row */}
      <div className="flex items-center gap-4 py-2 mb-2 text-sm text-neutral-400">
        <span className="flex items-center gap-1">
          <Eye size={14} />
          {formatCount(data.viewCount || 0)} views
        </span>
      </div>

      {/* Divider */}
      <div className="h-px bg-neutral-200 dark:bg-neutral-800 mb-3" />

      {/* Action Buttons */}
      <div className="flex items-center justify-between">
        {/* Left Actions */}
        <div className="flex items-center gap-1">
          {/* Like */}
          <button
            onClick={handleLike}
            className={`flex items-center gap-2 px-3 py-2 rounded-full transition-all ${
              isLiked
                ? "text-red-500 bg-red-50 dark:bg-red-500/10"
                : "text-neutral-500 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10"
            }`}
          >
            <Heart size={18} className={isLiked ? "fill-current" : ""} />
            {likeCount > 0 && (
              <span className="text-sm font-medium">
                {formatCount(likeCount)}
              </span>
            )}
          </button>

          {/* Comment */}
          <button
            onClick={() => setShowComments(true)}
            className="flex items-center gap-2 px-3 py-2 rounded-full text-neutral-500 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-500/10 transition-all"
          >
            <MessageCircle size={18} />
            {data.commentCount > 0 && (
              <span className="text-sm font-medium">
                {formatCount(data.commentCount)}
              </span>
            )}
          </button>

          {/* Share */}
          <button className="flex items-center gap-2 px-3 py-2 rounded-full text-neutral-500 hover:text-green-500 hover:bg-green-50 dark:hover:bg-green-500/10 transition-all">
            <Send size={18} />
          </button>
        </div>

        {/* Right Actions */}
        <button
          onClick={handleSave}
          className={`p-2 rounded-full transition-all ${
            isSaved
              ? "text-yellow-500 bg-yellow-50 dark:bg-yellow-500/10"
              : "text-neutral-500 hover:text-yellow-500 hover:bg-yellow-50 dark:hover:bg-yellow-500/10"
          }`}
        >
          <Bookmark size={18} className={isSaved ? "fill-current" : ""} />
        </button>
      </div>

      {/* Image Modal */}
      {showImage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90"
          onClick={() => setShowImage(null)}
        >
          <img
            src={showImage}
            alt="Full view"
            className="max-w-[90vw] max-h-[90vh] rounded-xl"
          />
          <button
            className="absolute top-4 right-4 bg-white/10 backdrop-blur-sm text-white p-2.5 rounded-xl hover:bg-white/20 transition-colors"
            onClick={() => setShowImage(null)}
          >
            <X size={20} />
          </button>
        </div>
      )}

      {/* Options Modal */}
      {showOptions && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
          onClick={() => setShowOptions(false)}
        >
          <div
            className="w-full max-w-sm bg-white dark:bg-neutral-900 rounded-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <button className="w-full px-4 py-3 text-left hover:bg-neutral-100 dark:hover:bg-neutral-800 text-black dark:text-white border-b border-neutral-200 dark:border-neutral-800">
              Report post
            </button>
            <button className="w-full px-4 py-3 text-left hover:bg-neutral-100 dark:hover:bg-neutral-800 text-black dark:text-white border-b border-neutral-200 dark:border-neutral-800">
              Hide post
            </button>
            <button className="w-full px-4 py-3 text-left hover:bg-neutral-100 dark:hover:bg-neutral-800 text-black dark:text-white border-b border-neutral-200 dark:border-neutral-800">
              Copy link
            </button>
            <button
              onClick={() => setShowOptions(false)}
              className="w-full px-4 py-3 text-left hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-500"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Comments Modal Placeholder */}
      {showComments && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
          onClick={() => setShowComments(false)}
        >
          <div
            className="w-full max-w-lg bg-white dark:bg-neutral-900 rounded-2xl max-h-[80vh] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-4 border-b border-neutral-200 dark:border-neutral-800">
              <h3 className="font-semibold text-black dark:text-white">
                Comments
              </h3>
              <button
                onClick={() => setShowComments(false)}
                className="p-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800"
              >
                <X size={18} className="text-neutral-400" />
              </button>
            </div>
            <div className="p-4 text-center text-neutral-500">
              No comments yet
            </div>
          </div>
        </div>
      )}
    </article>
  );
};

export default Post;
