import { useState } from "react";

export const useComments = (initialComments = []) => {
  const [comments, setComments] = useState(initialComments);
  const [reply, setReply] = useState(null);
  const [replyToChild, setReplyToChild] = useState(null);

  const handleAddComment = (text) => {
    if (text.trim() === "") return;

    const newComment = {
      id: Date.now(),
      user: "You",
      avatar: "https://i.pravatar.cc/150?img=5",
      text,
      time: "Just now",
      likes: 0,
      liked: false,
      replies: [],
    };

    setComments([newComment, ...comments]);
    return newComment;
  };

  const handleAddReply = (parentId, childId = null, text) => {
    if (text.trim() === "") {
      setReply(null);
      setReplyToChild(null);
      return;
    }

    const newReply = {
      id: Date.now(),
      user: "You",
      avatar: "https://i.pravatar.cc/150?img=5",
      text,
      time: "Just now",
      likes: 0,
      liked: false,
      isChildReply: childId ? true : false,
      replyToId: childId,
    };

    setComments(
      comments.map((cmt) =>
        cmt.id === parentId
          ? {
              ...cmt,
              replies: [...cmt.replies, newReply],
            }
          : cmt
      )
    );

    setReply(null);
    setReplyToChild(null);
    return newReply;
  };

  const handleLike = (commentId, isReply = false, parentId = null) => {
    if (!isReply) {
      setComments(
        comments.map((cmt) =>
          cmt.id === commentId
            ? {
                ...cmt,
                likes: cmt.liked ? cmt.likes - 1 : cmt.likes + 1,
                liked: !cmt.liked,
              }
            : cmt
        )
      );
    } else {
      setComments(
        comments.map((cmt) =>
          cmt.id === parentId
            ? {
                ...cmt,
                replies: cmt.replies.map((reply) =>
                  reply.id === commentId
                    ? {
                        ...reply,
                        likes: reply.liked ? reply.likes - 1 : reply.likes + 1,
                        liked: !reply.liked,
                      }
                    : reply
                ),
              }
            : cmt
        )
      );
    }
  };

  const handleReplyClick = (commentId, childId = null) => {
    if (reply === commentId && replyToChild === childId) {
      setReply(null);
      setReplyToChild(null);
    } else {
      setReply(commentId);
      setReplyToChild(childId);
    }
  };

  const handleCreateNewComment = () => {
    setReply(null);
    setReplyToChild(null);

    const newComment = {
      id: Date.now(),
      user: "You",
      avatar: "https://i.pravatar.cc/150?img=5",
      text: "New comment placeholder - click to edit",
      time: "Just now",
      likes: 0,
      liked: false,
      replies: [],
      isEditing: true,
    };

    setComments([newComment, ...comments]);
    return newComment;
  };

  return {
    comments,
    setComments,
    reply,
    replyToChild,
    handleAddComment,
    handleAddReply,
    handleLike,
    handleReplyClick,
    handleCreateNewComment,
  };
};
