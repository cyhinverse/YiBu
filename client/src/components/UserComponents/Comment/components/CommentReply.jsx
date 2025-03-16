import { Heart, MessageSquare, MoreHorizontal, Clock } from "lucide-react";

const CommentReply = ({
  reply,
  parentId,
  onLike,
  onReplyClick,
  allReplies,
}) => {
  const {
    id,
    user,
    avatar,
    text,
    time,
    likes,
    liked,
    isChildReply,
    replyToId,
  } = reply;

  return (
    <div
      className={`flex items-start space-x-3 transform-gpu transition-all duration-200 hover:translate-x-1 ${
        isChildReply ? "ml-6" : ""
      }`}
    >
      <img
        src={avatar}
        alt={user}
        className="w-8 h-8 rounded-full object-cover border-2 border-white shadow-md"
        loading="lazy"
      />
      <div className="flex-1">
        <div className="bg-white p-3 rounded-2xl shadow-sm border border-gray-100 hover:border-purple-200 transition-colors duration-200">
          <div className="flex justify-between items-center mb-1">
            <div className="flex items-center">
              <p className="font-semibold text-sm text-gray-800">{user}</p>
              {isChildReply && (
                <span className="text-xs text-gray-500 ml-2 flex items-center">
                  <span className="mx-1">→</span>
                  {allReplies.find((r) => r.id === replyToId)?.user || ""}
                </span>
              )}
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-xs text-gray-500 flex items-center">
                <Clock size={10} className="mr-1 text-gray-400" /> {time}
              </span>
              <button className="text-gray-400 hover:text-gray-600 transition-colors">
                <MoreHorizontal size={14} />
              </button>
            </div>
          </div>
          <p className="text-sm text-gray-700 leading-relaxed">{text}</p>
        </div>

        <div className="flex items-center mt-2 space-x-4 px-2">
          <button
            className={`text-xs flex items-center space-x-1 ${
              liked ? "text-pink-500" : "text-gray-500"
            } hover:text-pink-500 transition-colors duration-200 font-medium`}
            onClick={() => onLike(id, true, parentId)}
          >
            <Heart
              size={14}
              fill={liked ? "currentColor" : "none"}
              className={`${liked ? "animate-heartBeat" : ""}`}
            />
            <span>{likes > 0 ? likes : "Like"}</span>
          </button>
          <button
            className="text-xs text-gray-500 hover:text-purple-500 flex items-center space-x-1 transition-colors duration-200 font-medium"
            onClick={() => onReplyClick(parentId, id)}
          >
            <MessageSquare size={14} />
            <span>Reply</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default CommentReply;
