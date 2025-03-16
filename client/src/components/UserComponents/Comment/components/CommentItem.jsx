import {
  Heart,
  MessageSquare,
  Share2,
  MoreHorizontal,
  Clock,
} from "lucide-react";
import CommentReply from "./CommentReply";
import ReplyInput from "./ReplyInput";
import CommentDecoration from "./CommentDecoration";

const CommentItem = ({
  comment,
  onLike,
  onReplyClick,
  onAddReply,
  reply,
  replyToChild,
  currentComment,
  setCurrentComment,
}) => {
  const { id, user, avatar, text, time, likes, liked, replies, isEditing } =
    comment;

  return (
    <div className="transform-gpu transition-all duration-200 hover:translate-x-1">
      {/* Main comment */}
      <div className="flex items-start space-x-4">
        <img
          src={avatar}
          alt={user}
          className="w-10 h-10 rounded-full object-cover border-2 border-white shadow-md"
          loading="lazy"
        />
        <div className="flex-1">
          {isEditing ? (
            <div className="bg-white p-4 rounded-2xl shadow-sm border border-purple-200 transition-colors duration-200">
              <div className="flex justify-between items-center mb-3">
                <p className="font-semibold text-gray-800">{user}</p>
                <span className="text-xs text-gray-500 flex items-center">
                  <Clock size={12} className="mr-1 text-gray-400" /> {time}
                </span>
              </div>
              <div
                className="w-full p-3 border border-gray-200 rounded-lg bg-white"
                contentEditable
                suppressContentEditableWarning
                onInput={(e) => {
                  const selection = window.getSelection();
                  const range = selection.getRangeAt(0);
                  const offset = range.startOffset;

                  setCurrentComment(
                    currentComment.map((c) =>
                      c.id === id
                        ? { ...c, text: e.currentTarget.textContent || "" }
                        : c
                    )
                  );

                  setTimeout(() => {
                    try {
                      const newRange = document.createRange();
                      newRange.setStart(
                        e.currentTarget.childNodes[0] || e.currentTarget,
                        Math.min(
                          offset,
                          (e.currentTarget.textContent || "").length
                        )
                      );
                      newRange.collapse(true);
                      selection.removeAllRanges();
                      selection.addRange(newRange);
                    } catch (err) {
                      console.log("Error setting cursor position:", err);
                    }
                  }, 0);
                }}
                ref={(el) => {
                  if (el && isEditing) {
                    if (text === "New comment placeholder - click to edit") {
                      el.textContent = "";
                    } else if (!el.textContent) {
                      el.textContent = text;
                    }
                    el.focus();

                    const range = document.createRange();
                    const selection = window.getSelection();
                    if (el.childNodes.length > 0) {
                      const lastNode = el.childNodes[el.childNodes.length - 1];
                      range.setStart(lastNode, lastNode.length || 0);
                    } else {
                      range.setStart(el, 0);
                    }
                    range.collapse(true);
                    selection.removeAllRanges();
                    selection.addRange(range);
                  }
                }}
              ></div>
              <div className="flex justify-end mt-2 space-x-2">
                <button
                  className="px-3 py-1 text-xs bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-md transition-colors duration-200"
                  onClick={() => {
                    setCurrentComment(
                      currentComment.filter((c) => c.id !== id)
                    );
                  }}
                >
                  Cancel
                </button>
                <button
                  className="px-3 py-1 text-xs bg-purple-500 hover:bg-purple-600 text-white rounded-md transition-colors duration-200"
                  onClick={() => {
                    if (
                      text.trim() === "" ||
                      text === "New comment placeholder - click to edit"
                    ) {
                      setCurrentComment(
                        currentComment.filter((c) => c.id !== id)
                      );
                      return;
                    }
                    setCurrentComment(
                      currentComment.map((c) =>
                        c.id === id ? { ...c, isEditing: false } : c
                      )
                    );
                  }}
                >
                  Post
                </button>
              </div>
            </div>
          ) : (
            <>
              <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 hover:border-purple-200 transition-colors duration-200">
                <div className="flex justify-between items-center mb-2">
                  <p className="font-semibold text-gray-800">{user}</p>
                  <div className="flex items-center space-x-2">
                    <span className="text-xs text-gray-500 flex items-center">
                      <Clock size={12} className="mr-1 text-gray-400" /> {time}
                    </span>
                    <button className="text-gray-400 hover:text-gray-600 transition-colors">
                      <MoreHorizontal size={16} />
                    </button>
                  </div>
                </div>
                <p className="text-gray-700 leading-relaxed">{text}</p>
              </div>

              <div className="flex items-center mt-3 space-x-6 px-2">
                <button
                  className={`text-xs flex items-center space-x-1.5 ${
                    liked ? "text-pink-500" : "text-gray-500"
                  } hover:text-pink-500 transition-colors duration-200 font-medium`}
                  onClick={() => onLike(id)}
                >
                  <Heart
                    size={16}
                    fill={liked ? "currentColor" : "none"}
                    className={`${liked ? "animate-heartBeat" : ""}`}
                  />
                  <span>{likes > 0 ? likes : "Like"}</span>
                </button>
                <button
                  className="text-xs text-gray-500 hover:text-purple-500 flex items-center space-x-1.5 transition-colors duration-200 font-medium"
                  onClick={() => onReplyClick(id)}
                >
                  <MessageSquare size={16} />
                  <span>Reply</span>
                </button>
                <button className="text-xs text-gray-500 hover:text-blue-500 flex items-center space-x-1.5 transition-colors duration-200 font-medium">
                  <Share2 size={16} />
                  <span>Share</span>
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Replies section */}
      {replies.length > 0 && (
        <div className="ml-14 mt-4 pl-6 space-y-4 relative">
          <CommentDecoration replies={replies} />

          {replies.map((replyItem) => (
            <CommentReply
              key={replyItem.id}
              reply={replyItem}
              parentId={id}
              onLike={onLike}
              onReplyClick={onReplyClick}
              allReplies={replies}
            />
          ))}
        </div>
      )}

      {/* Reply input */}
      {reply === id && (
        <ReplyInput
          parentId={id}
          replyToChild={replyToChild}
          onAddReply={onAddReply}
          replies={replies}
        />
      )}
    </div>
  );
};

export default CommentItem;
