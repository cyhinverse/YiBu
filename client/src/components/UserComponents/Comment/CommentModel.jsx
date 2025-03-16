import { useContext, useState } from "react";
import { DataContext } from "../../../DataProvider";
import { CircleEllipsis, X, Send, MessageSquare } from "lucide-react";

const CommentModel = () => {
  const { setOpenComment } = useContext(DataContext);
  const [comment, setComment] = useState("");
  const [reply, setReply] = useState(null);
  const [comments, setComments] = useState([
    { id: 1, user: "Alice", text: "This is awesome! 🚀", replies: [] },
    { id: 2, user: "Bob", text: "Nice post! 🔥", replies: [] },
  ]);

  const handleAddComment = (parentId = null) => {
    if (comment.trim() === "") return;

    if (parentId === null) {
      setComments([
        ...comments,
        { id: Date.now(), user: "You", text: comment, replies: [] },
      ]);
    } else {
      setComments(
        comments.map((cmt) =>
          cmt.id === parentId
            ? {
                ...cmt,
                replies: [
                  ...cmt.replies,
                  { id: Date.now(), user: "You", text: comment },
                ],
              }
            : cmt
        )
      );
    }

    setComment("");
    setReply(null);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/5 p-4"
      onClick={() => setOpenComment(false)}
    >
      <div
        className="bg-white w-[600px] h-[650px] border border-gray-300 rounded-xl shadow-lg flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center px-4 h-[60px] border-b border-gray-300">
          <span className="font-semibold text-lg">Comments</span>
          <button className="p-2 hover:bg-gray-200 rounded-full">
            <CircleEllipsis />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {comments.map((cmt) => (
            <div key={cmt.id}>
              <div className="flex items-start space-x-3">
                <div className="w-10 h-10 rounded-full bg-gray-300 flex items-center justify-center text-gray-600 font-bold">
                  {cmt.user[0]}
                </div>
                <div className="bg-gray-100 p-3 rounded-lg">
                  <p className="font-semibold text-sm">{cmt.user}</p>
                  <p className="text-sm">{cmt.text}</p>
                  <button
                    className="text-xs text-purple-500 mt-1 flex items-center space-x-1"
                    onClick={() => setReply(cmt.id)}
                  >
                    <MessageSquare size={14} /> <span>Reply</span>
                  </button>
                </div>
              </div>

              <div className="ml-10 mt-2 border-l-2 border-gray-300 pl-3 space-y-2">
                {cmt.replies.map((reply) => (
                  <div key={reply.id} className="flex items-start space-x-3">
                    <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center text-gray-600 font-bold">
                      {reply.user[0]}
                    </div>
                    <div className="bg-gray-200 p-2 rounded-lg">
                      <p className="font-semibold text-xs">{reply.user}</p>
                      <p className="text-xs">{reply.text}</p>
                    </div>
                  </div>
                ))}
              </div>

              {reply === cmt.id && (
                <div className="ml-10 mt-2 flex items-center space-x-2">
                  <input
                    type="text"
                    className="flex-1 p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-400"
                    placeholder="Reply..."
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    onKeyDown={(e) =>
                      e.key === "Enter" && handleAddComment(cmt.id)
                    }
                  />
                  <button
                    className={`p-2 rounded-full ${
                      comment.trim()
                        ? "bg-purple-400 text-white"
                        : "bg-gray-300 text-gray-500"
                    }`}
                    onClick={() => handleAddComment(cmt.id)}
                    disabled={!comment.trim()}
                  >
                    <Send size={18} />
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Input Box */}
        <div className="border-t border-gray-300 p-3 flex items-center space-x-3">
          <input
            type="text"
            className="flex-1 p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-400"
            placeholder="Write a comment..."
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAddComment()}
          />
          <button
            className={`p-2 rounded-full ${
              comment.trim()
                ? "bg-purple-400 text-white"
                : "bg-gray-300 text-gray-500"
            }`}
            onClick={() => handleAddComment()}
            disabled={!comment.trim()}
          >
            <Send size={18} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default CommentModel;
