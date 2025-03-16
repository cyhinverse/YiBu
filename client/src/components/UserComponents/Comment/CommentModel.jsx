import { useContext, useRef, useEffect } from "react";
import { DataContext } from "../../../DataProvider";
import { useComments } from "./hooks/useComments";
import { CommentHeader, CommentItem } from "./components";
import "./index.css";

const initialComments = [
  {
    id: 1,
    user: "Alice Smith",
    avatar: "https://i.pravatar.cc/150?img=1",
    text: "This is awesome! The design looks incredible. I love how you've incorporated those subtle animations. 🚀",
    time: "2 hours ago",
    likes: 5,
    liked: false,
    replies: [],
  },
  {
    id: 2,
    user: "Bob Johnson",
    avatar: "https://i.pravatar.cc/150?img=2",
    text: "Nice post! The color palette is perfect. Would love to see more content like this. 🔥",
    time: "1 hour ago",
    likes: 3,
    liked: true,
    replies: [
      {
        id: 21,
        user: "Charlie Davis",
        avatar: "https://i.pravatar.cc/150?img=3",
        text: "I agree with you! The attention to detail is impressive.",
        time: "30 minutes ago",
        likes: 1,
        liked: false,
      },
    ],
  },
];

const CommentModel = () => {
  const { setOpenComment } = useContext(DataContext);
  const scrollRef = useRef(null);

  const {
    comments,
    setComments,
    reply,
    replyToChild,
    handleAddComment,
    handleAddReply,
    handleLike,
    handleReplyClick,
    handleCreateNewComment,
  } = useComments(initialComments);

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

  const commentsCount = comments.reduce(
    (total, cmt) => total + 1 + cmt.replies.length,
    0
  );

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/5 p-4"
      onClick={() => setOpenComment(false)}
    >
      <div
        className="bg-white w-[600px] h-[700px] border border-gray-300 rounded-xl flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <CommentHeader
          commentsCount={commentsCount}
          onAddComment={handleAddNewComment}
          onClose={() => setOpenComment(false)}
        />

        <div
          ref={scrollRef}
          className="flex-1 overflow-y-auto p-6 space-y-6 bg-gradient-to-b from-white to-gray-50 overscroll-contain"
          style={{
            scrollBehavior: "smooth",
            WebkitOverflowScrolling: "touch",
          }}
        >
          {comments.map((comment) => (
            <CommentItem
              key={comment.id}
              comment={comment}
              onLike={handleLike}
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
