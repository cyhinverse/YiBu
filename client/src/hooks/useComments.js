import { useState, useEffect, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useSocketContext } from '../contexts/SocketContext';
import {
  createComment,
  getCommentsByPost,
  updateComment,
  deleteComment,
  likeComment,
  unlikeComment,
} from '../redux/actions/commentActions';

/**
 * Custom hook để quản lý comments của một post
 * @param {string} postId - ID của post
 * @returns {Object} - State và các hàm xử lý comment
 */
const useComments = postId => {
  const dispatch = useDispatch();
  const { socket } = useSocketContext();
  const { user } = useSelector(state => state.auth);

  // State
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [replyingTo, setReplyingTo] = useState(null); // { commentId, username }

  // Fetch comments
  const fetchComments = useCallback(async () => {
    if (!postId) return;

    setLoading(true);
    setError(null);

    try {
      const result = await dispatch(
        getCommentsByPost({ postId, page: 1, limit: 50 })
      ).unwrap();
      setComments(result.comments || []);
    } catch (err) {
      setError(err?.message || 'Không thể tải bình luận');
      console.error('Fetch comments error:', err);
    } finally {
      setLoading(false);
    }
  }, [postId, dispatch]);

  // Add comment
  const addComment = useCallback(
    async (content, parentId = null) => {
      if (!content.trim()) return null;

      try {
        const result = await dispatch(
          createComment({ postId, content, parentId })
        ).unwrap();
        // Socket sẽ broadcast comment mới, không cần update state thủ công
        return result;
      } catch (err) {
        setError(err?.message || 'Không thể thêm bình luận');
        return null;
      }
    },
    [postId, dispatch]
  );

  // Update comment
  const editComment = useCallback(
    async (commentId, content) => {
      if (!content.trim()) return false;

      try {
        await dispatch(updateComment({ commentId, content })).unwrap();
        return true;
      } catch (err) {
        setError(err?.message || 'Không thể cập nhật bình luận');
        return false;
      }
    },
    [dispatch]
  );

  // Delete comment
  const removeComment = useCallback(
    async commentId => {
      try {
        await dispatch(deleteComment({ commentId, postId })).unwrap();
        return true;
      } catch (err) {
        setError(err?.message || 'Không thể xóa bình luận');
        return false;
      }
    },
    [dispatch, postId]
  );

  // Like/Unlike comment
  const toggleLike = useCallback(
    async (commentId, isLiked) => {
      try {
        if (isLiked) {
          await dispatch(unlikeComment(commentId)).unwrap();
        } else {
          await dispatch(likeComment(commentId)).unwrap();
        }
        return true;
      } catch (err) {
        console.error('Toggle like error:', err);
        return false;
      }
    },
    [dispatch]
  );

  // Reply handlers
  const startReply = useCallback((commentId, username) => {
    setReplyingTo({ commentId, username });
  }, []);

  const cancelReply = useCallback(() => {
    setReplyingTo(null);
  }, []);

  // Socket handlers
  const handleNewComment = useCallback(
    data => {
      if (data.postId !== postId) return;

      const newComment = data.comment;
      setComments(prev => {
        // Nếu là reply
        if (newComment.parentComment) {
          return prev.map(cmt => {
            if (cmt._id === newComment.parentComment) {
              return {
                ...cmt,
                replies: [...(cmt.replies || []), newComment],
              };
            }
            return cmt;
          });
        }
        // Comment mới
        return [{ ...newComment, replies: [] }, ...prev];
      });
    },
    [postId]
  );

  const handleUpdateComment = useCallback(
    data => {
      if (data.postId !== postId) return;

      const updated = data.comment;
      setComments(prev =>
        prev.map(cmt => {
          if (cmt._id === updated._id) {
            return { ...cmt, content: updated.content };
          }
          // Check replies
          if (cmt.replies?.length) {
            return {
              ...cmt,
              replies: cmt.replies.map(r =>
                r._id === updated._id ? { ...r, content: updated.content } : r
              ),
            };
          }
          return cmt;
        })
      );
    },
    [postId]
  );

  const handleDeleteComment = useCallback(
    data => {
      if (data.postId !== postId) return;

      const { commentId } = data;
      setComments(prev => {
        // Check root comments
        if (prev.some(c => c._id === commentId)) {
          return prev.filter(c => c._id !== commentId);
        }
        // Check replies
        return prev.map(cmt => ({
          ...cmt,
          replies: cmt.replies?.filter(r => r._id !== commentId) || [],
        }));
      });
    },
    [postId]
  );

  // Socket setup
  useEffect(() => {
    if (!postId || !socket) return;

    socket.emit('join_post', postId);
    socket.on('new_comment', handleNewComment);
    socket.on('update_comment', handleUpdateComment);
    socket.on('delete_comment', handleDeleteComment);

    return () => {
      socket.off('new_comment', handleNewComment);
      socket.off('update_comment', handleUpdateComment);
      socket.off('delete_comment', handleDeleteComment);
      socket.emit('leave_post', postId);
    };
  }, [
    postId,
    socket,
    handleNewComment,
    handleUpdateComment,
    handleDeleteComment,
  ]);

  // Initial fetch
  useEffect(() => {
    fetchComments();
  }, [fetchComments]);

  // Computed
  const totalCount = comments.reduce(
    (sum, cmt) => sum + 1 + (cmt.replies?.length || 0),
    0
  );

  return {
    // State
    comments,
    loading,
    error,
    totalCount,
    currentUser: user,
    replyingTo,

    // Actions
    addComment,
    editComment,
    removeComment,
    toggleLike,
    startReply,
    cancelReply,
    refresh: fetchComments,
  };
};

export default useComments;
