import { useContext, useRef, useEffect } from "react";
import { DataContext } from "../../../DataProvider";
import { useComments } from "./hooks/useComments";
import { CommentHeader, CommentItem } from "./components";
import { RefreshCw, AlertTriangle } from "lucide-react";
import "./index.css";

const LoadingSpinner = ({ message }) => (
  <div className="flex flex-col items-center justify-center py-8">
    <div className="animate-spin w-8 h-8 text-purple-500 mb-2">
      <RefreshCw size={24} />
    </div>
    <p className="text-gray-500 text-sm">{message}</p>
  </div>
);

const ErrorAlert = ({ message, description, onRetry }) => (
  <div className=" border border-red-100 rounded-md p-4 mb-4">
    <div className="flex items-start">
      <div className="flex-shrink-0 text-red-500 mr-3">
        <AlertTriangle size={20} />
      </div>
      <div className="flex-1">
        <h4 className="text-sm font-medium text-red-800 mb-1">{message}</h4>
        <p className="text-sm text-red-600">{description}</p>
        {onRetry && (
          <button
            onClick={onRetry}
            className="mt-2 text-sm text-blue-500 hover:underline focus:outline-none"
          >
            Thử lại
          </button>
        )}
      </div>
    </div>
  </div>
);

const CommentModel = ({ postId, onClose }) => {
  const { setOpenComment } = useContext(DataContext);
  const scrollRef = useRef(null);

  const {
    comments,
    setComments,
    reply,
    replyToChild,
    loading,
    error,
    handleAddComment,
    handleAddReply,
    handleUpdateComment,
    handleDeleteComment,
    handleReplyClick,
    handleCreateNewComment,
    refreshComments,
    commentCount,
  } = useComments([], postId);

  useEffect(() => {
    if (scrollRef.current) {
      const scrollContainer = scrollRef.current;
      scrollContainer.style.willChange = "scroll-position";

      const handleScroll = () => {};

      scrollContainer.addEventListener("scroll", handleScroll, {
        passive: true,
      });

      return () => {
        scrollContainer.removeEventListener("scroll", handleScroll);
        scrollContainer.style.willChange = "auto";
      };
    }
  }, []);

  const handleAddNewComment = () => {
    const newComment = handleCreateNewComment();

    setTimeout(() => {
      if (scrollRef.current) {
        scrollRef.current.scrollTop = 0;
      }
    }, 10);

    return newComment;
  };

  const handleClose = () => {
    if (onClose) {
      onClose();
    } else {
      setOpenComment(false);
    }
  };

  const commentsCount = comments.reduce(
    (total, cmt) => total + 1 + (cmt.replies?.length || 0),
    0
  );

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/5 p-4"
      onClick={handleClose}
    >
      <div
        className=" w-[600px] h-[700px] border border-gray-300 rounded-xl flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <CommentHeader
          commentsCount={commentsCount}
          onAddComment={handleAddNewComment}
          onClose={handleClose}
        />

        <div
          ref={scrollRef}
          className="flex-1 overflow-y-auto p-6 space-y-6 bg-black overscroll-contain"
          style={{
            scrollBehavior: "smooth",
            WebkitOverflowScrolling: "touch",
          }}
        >
          {loading && <LoadingSpinner message="Đang tải bình luận..." />}

          {error && (
            <ErrorAlert
              message="Lỗi"
              description={error}
              onRetry={refreshComments}
            />
          )}

          {!loading && comments.length === 0 && (
            <div className="text-center text-gray-500 py-8">
              Chưa có bình luận nào. Hãy trở thành người đầu tiên bình luận!
            </div>
          )}

          {comments.map((comment) => (
            <CommentItem
              key={comment._id}
              comment={comment}
              onDelete={handleDeleteComment}
              onUpdate={handleUpdateComment}
              onReplyClick={handleReplyClick}
              onAddReply={handleAddReply}
              reply={reply}
              replyToChild={replyToChild}
              currentComment={comments}
              setCurrentComment={setComments}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default CommentModel;
