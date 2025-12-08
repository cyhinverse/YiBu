import { useState, useEffect, useRef, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useSocketContext } from "../../../../../contexts/SocketContext";
import {
  createComment,
  getCommentsByPost,
  updateComment,
  deleteComment,
} from "../../../../../redux/actions/commentActions";

export const useComments = (initialComments = [], postId = null) => {
  const [comments, setComments] = useState(initialComments);
  const [reply, setReply] = useState(null);
  const [replyToChild, setReplyToChild] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [commentCount, setCommentCount] = useState(0);

  const dispatch = useDispatch();
  const { socket } = useSocketContext();
  const { user: currentUser } = useSelector((state) => state.auth);

  // Keep a ref to comments to access the latest value in socket handlers without triggering re-renders
  const commentsRef = useRef(comments);
  useEffect(() => {
    commentsRef.current = comments;
  }, [comments]);

  // Xử lý khi có comment mới qua socket
  const handleRealTimeNewComment = useCallback(
    (data) => {
      if (data.postId !== postId) return;

      const newComment = data.comment;

      // Kiểm tra xem đã có comment này chưa (using ref)
      const exists = commentsRef.current.some((c) => c._id === newComment._id);
      if (exists) return;

      // Nếu là comment gốc
      if (!newComment.parentComment) {
        setComments((prevComments) => [
          {
            ...newComment,
            replies: [],
          },
          ...prevComments,
        ]);
      } else {
        // Nếu là reply
        setComments((prevComments) =>
          prevComments.map((cmt) =>
            cmt._id === newComment.parentComment
              ? { ...cmt, replies: [...(cmt.replies || []), newComment] }
              : cmt
          )
        );
      }

      // Cập nhật số lượng comment
      setCommentCount(data.commentCount || 0);
    },
    [postId]
  );

  // Xử lý khi có cập nhật comment qua socket
  const handleRealTimeUpdateComment = useCallback(
    (data) => {
      if (data.postId !== postId) return;

      const updatedComment = data.comment;

      // Tìm và cập nhật comment trong state
      setComments((prevComments) => {
        // Kiểm tra xem có phải comment gốc không
        const rootIndex = prevComments.findIndex(
          (c) => c._id === updatedComment._id
        );

        if (rootIndex !== -1) {
          // Cập nhật comment gốc
          const newComments = [...prevComments];
          newComments[rootIndex] = {
            ...newComments[rootIndex],
            content: updatedComment.content,
            updatedAt: updatedComment.updatedAt,
          };
          return newComments;
        } else {
          // Tìm trong replies
          return prevComments.map((cmt) => {
            if (!cmt.replies) return cmt;

            const replyIndex = cmt.replies.findIndex(
              (r) => r._id === updatedComment._id
            );
            if (replyIndex === -1) return cmt;

            const newReplies = [...cmt.replies];
            newReplies[replyIndex] = {
              ...newReplies[replyIndex],
              content: updatedComment.content,
              updatedAt: updatedComment.updatedAt,
            };

            return {
              ...cmt,
              replies: newReplies,
            };
          });
        }
      });

      // Cập nhật số lượng comment
      setCommentCount(data.commentCount || 0);
    },
    [postId]
  );

  // Xử lý khi có xóa comment qua socket
  const handleRealTimeDeleteComment = useCallback(
    (data) => {
      if (data.postId !== postId) return;

      const commentId = data.commentId;

      // Xóa comment khỏi state
      setComments((prevComments) => {
        // Kiểm tra xem có phải comment gốc không
        const isRoot = prevComments.some((c) => c._id === commentId);

        if (isRoot) {
          // Xóa comment gốc
          return prevComments.filter((c) => c._id !== commentId);
        } else {
          // Tìm và xóa trong replies
          return prevComments.map((cmt) => {
            if (!cmt.replies) return cmt;

            return {
              ...cmt,
              replies: cmt.replies.filter((r) => r._id !== commentId),
            };
          });
        }
      });

      // Cập nhật số lượng comment
      setCommentCount(data.commentCount || 0);
    },
    [postId]
  );

  // Tham gia room của bài viết khi component được mount
  useEffect(() => {
    if (postId && socket) {
      socket.emit("join_post", postId);

      // Đăng ký lắng nghe các sự kiện comment
      socket.on("new_comment", handleRealTimeNewComment);
      socket.on("update_comment", handleRealTimeUpdateComment);
      socket.on("delete_comment", handleRealTimeDeleteComment);

      return () => {
        // Hủy đăng ký khi component unmount
        socket.off("new_comment", handleRealTimeNewComment);
        socket.off("update_comment", handleRealTimeUpdateComment);
        socket.off("delete_comment", handleRealTimeDeleteComment);
        socket.emit("leave_post", postId);
      };
    }
  }, [
    postId,
    socket,
    handleRealTimeNewComment,
    handleRealTimeUpdateComment,
    handleRealTimeDeleteComment,
  ]);

  const fetchComments = useCallback(async () => {
    if (!postId) return;

    setLoading(true);
    try {
      const result = await dispatch(getCommentsByPost(postId)).unwrap();
      if (result && result.comments) {
        setComments(result.comments);
        // Assuming response might have count, otherwise calc
        setCommentCount(result.comments.length || 0); 
      }
    } catch (err) {
      setError("Không thể tải bình luận. Vui lòng thử lại sau.");
      console.error("Lỗi khi tải bình luận:", err);
    } finally {
      setLoading(false);
    }
  }, [postId, dispatch]);

  // Lấy comments khi có postId
  useEffect(() => {
    if (postId) {
      fetchComments();
    }
  }, [postId, fetchComments]);

  const handleAddComment = async (text) => {
    if (text.trim() === "") return;

    try {
      const result = await dispatch(
        createComment({
          content: text,
          postId: postId,
          parentComment: null,
        })
      ).unwrap();

      if (result) {
        // Cập nhật comments với comment mới từ server
        const newComment = {
          ...result,
          replies: [],
        };

        // Không cần setComments ở đây vì sẽ nhận qua socket
        // setComments([newComment, ...comments]);

        // Cập nhật count locally if needed or rely on socket
        // setCommentCount(prev => prev + 1);

        return newComment;
      }
    } catch (err) {
      setError("Không thể thêm bình luận. Vui lòng thử lại.");
      console.error("Lỗi khi thêm bình luận:", err);
      return null;
    }
  };

  const handleAddReply = async (parentId, childId = null, text) => {
    if (text.trim() === "") {
      setReply(null);
      setReplyToChild(null);
      return;
    }

    try {
      // Nếu parentId là null hoặc bắt đầu bằng "temp-", thì đây là comment gốc mới
      if (
        !parentId ||
        (typeof parentId === "string" && parentId.startsWith("temp-"))
      ) {
        return await handleAddComment(text);
      }

      const result = await dispatch(
        createComment({
          content: text,
          postId: postId,
          parentComment: parentId,
        })
      ).unwrap();

      if (result) {
        // Không cần cập nhật UI ở đây vì sẽ nhận qua socket

        setReply(null);
        setReplyToChild(null);

        return result;
      }
    } catch (err) {
      setError("Không thể trả lời bình luận. Vui lòng thử lại.");
      console.error("Lỗi khi trả lời bình luận:", err);
      setReply(null);
      setReplyToChild(null);
      return null;
    }
  };

  const handleUpdateComment = async (commentId, text) => {
    if (text.trim() === "") return false;

    try {
      await dispatch(
        updateComment({
          commentId,
          data: { content: text },
        })
      ).unwrap();

      // Không cần cập nhật UI ở đây vì sẽ nhận qua socket
      return true;
    } catch (err) {
      setError("Không thể cập nhật bình luận. Vui lòng thử lại.");
      console.error("Lỗi khi cập nhật bình luận:", err);
      return false;
    }
  };

  const handleDeleteComment = async (
    commentId,
    isReply = false,
    parentId = null
  ) => {
    // Nếu là ID tạm thời, chỉ cần xóa khỏi UI
    if (typeof commentId === "string" && commentId.startsWith("temp-")) {
      setComments(comments.filter((cmt) => cmt._id !== commentId));
      return true;
    }

    try {
      await dispatch(deleteComment(commentId)).unwrap();

      // Không cần cập nhật UI ở đây vì sẽ nhận qua socket
      return true;
    } catch (err) {
      setError("Không thể xóa bình luận. Vui lòng thử lại.");
      console.error("Lỗi khi xóa bình luận:", err);
      return false;
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

    // Tạo placeholder để người dùng nhập nội dung mới
    const tempId = `temp-${Date.now()}-${Math.random()
      .toString(36)
      .substr(2, 9)}`;
    const newComment = {
      _id: tempId,
      user: {
        _id: currentUser?._id,
        name: currentUser?.name,
        profile: { avatar: currentUser?.profile?.avatar || "" },
      },
      content: "",
      createdAt: new Date().toISOString(),
      replies: [],
      isEditing: true,
      isTemp: true,
    };

    setComments([newComment, ...comments]);
    return newComment;
  };

  return {
    comments,
    setComments,
    reply,
    replyToChild,
    loading,
    error,
    commentCount,
    handleAddComment,
    handleAddReply,
    handleUpdateComment,
    handleDeleteComment,
    handleReplyClick,
    handleCreateNewComment,
    refreshComments: fetchComments,
  };
};
