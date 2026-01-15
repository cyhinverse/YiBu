import { useState, useCallback, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useSocketContext } from '@/contexts/SocketContext';
import { useQueryClient } from '@tanstack/react-query';
import {
  usePostComments,
  useCreateComment,
  useUpdateComment,
  useDeleteComment,
  useToggleLikeComment,
} from './useCommentQuery';

/**
 * Add reply to comment tree (recursive)
 * @param {Array} comments - Comments list
 * @param {Object} newComment - New comment to add
 * @returns {Array} Updated comments list
 */
const addReplyToTree = (comments, newComment) => {
  return comments.map(cmt => {
    if (cmt._id === newComment.parentComment) {
      return {
        ...cmt,
        replies: [...(cmt.replies || []), newComment],
        repliesCount: (cmt.repliesCount || 0) + 1,
      };
    }
    if (cmt.replies?.length > 0) {
      return {
        ...cmt,
        replies: addReplyToTree(cmt.replies, newComment),
      };
    }
    return cmt;
  });
};

/**
 * Update comment in tree (recursive)
 * @param {Array} comments - Comments list
 * @param {Object} updatedComment - Updated comment data
 * @returns {Array} Updated comments list
 */
const updateCommentInTree = (comments, updatedComment) => {
  return comments.map(cmt => {
    if (cmt._id === updatedComment._id) {
      return { ...cmt, ...updatedComment, replies: cmt.replies };
    }
    if (cmt.replies?.length > 0) {
      return {
        ...cmt,
        replies: updateCommentInTree(cmt.replies, updatedComment),
      };
    }
    return cmt;
  });
};

/**
 * Remove comment from tree (recursive)
 * @param {Array} comments - Comments list
 * @param {string} commentId - Comment ID to remove
 * @returns {Array} Updated comments list
 */
const removeCommentFromTree = (comments, commentId) => {
  return comments
    .filter(cmt => cmt._id !== commentId)
    .map(cmt => {
      if (cmt.replies?.length > 0) {
        return {
          ...cmt,
          replies: removeCommentFromTree(cmt.replies, commentId),
        };
      }
      return cmt;
    });
};

/**
 * Hook to manage comments for a post
 * @param {string} postId - Post ID
 * @returns {Object} State and comment handler functions
 * @returns {Array} returns.comments - Comments list
 * @returns {boolean} returns.loading - Loading state
 * @returns {string|null} returns.error - Error message
 * @returns {number} returns.totalCount - Total comments count
 * @returns {Object|null} returns.currentUser - Current user
 * @returns {Object|null} returns.replyingTo - Reply target info
 * @returns {Function} returns.addComment - Add comment function
 * @returns {Function} returns.editComment - Edit comment function
 * @returns {Function} returns.removeComment - Remove comment function
 * @returns {Function} returns.toggleLike - Toggle like function
 * @returns {Function} returns.startReply - Start reply function
 * @returns {Function} returns.cancelReply - Cancel reply function
 * @returns {Function} returns.refresh - Refresh comments function
 */
const useComments = postId => {
  const { socket } = useSocketContext();
  const { user } = useSelector(state => state.auth);
  const queryClient = useQueryClient();
  const [replyingTo, setReplyingTo] = useState(null);
  const [localError, setLocalError] = useState(null);

  const {
    data: commentsData,
    isLoading: loading,
    refetch,
  } = usePostComments(postId);

  const comments = commentsData?.comments || commentsData || [];

  const createMutation = useCreateComment();
  const updateMutation = useUpdateComment();
  const deleteMutation = useDeleteComment();
  const likeMutation = useToggleLikeComment();

  /**
   * Add a new comment
   * @param {string} content - Comment content
   * @param {string|null} [parentId=null] - Parent comment ID (for replies)
   * @returns {Promise<Object|null>} New comment or null on error
   */
  const addComment = useCallback(
    async (content, parentId = null) => {
      if (!content.trim()) return null;
      setLocalError(null);
      try {
        const result = await createMutation.mutateAsync({
          postId,
          content,
          parentId,
        });
        return result;
      } catch (err) {
        setLocalError(err?.message || 'Failed to add comment');
        return null;
      }
    },
    [postId, createMutation]
  );

  /**
   * Edit a comment
   * @param {string} commentId - Comment ID
   * @param {string} content - New content
   * @returns {Promise<boolean>} Success/failure result
   */
  const editComment = useCallback(
    async (commentId, content) => {
      if (!content.trim()) return false;
      try {
        await updateMutation.mutateAsync({ commentId, content });
        return true;
      } catch (err) {
        setLocalError(err?.message || 'Failed to update comment');
        return false;
      }
    },
    [updateMutation]
  );

  /**
   * Remove a comment
   * @param {string} commentId - Comment ID to remove
   * @returns {Promise<boolean>} Success/failure result
   */
  const removeComment = useCallback(
    async commentId => {
      try {
        await deleteMutation.mutateAsync({ commentId });
        return true;
      } catch (err) {
        setLocalError(err?.message || 'Failed to delete comment');
        return false;
      }
    },
    [deleteMutation]
  );

  /**
   * Toggle like/unlike on a comment
   * @param {string} commentId - Comment ID
   * @param {boolean} isLiked - Current like status
   * @returns {Promise<boolean>} Success/failure result
   */
  const toggleLike = useCallback(
    async (commentId, isLiked) => {
      try {
        await likeMutation.mutateAsync({ commentId, isLiked });
        return true;
      } catch (err) {
        console.error('Toggle like error:', err);
        return false;
      }
    },
    [likeMutation]
  );

  /**
   * Start replying to a comment
   * @param {string} commentId - Comment ID to reply to
   * @param {string} username - Username of comment author
   */
  const startReply = useCallback((commentId, username) => {
    setReplyingTo({ commentId, username });
  }, []);

  /**
   * Cancel reply
   */
  const cancelReply = useCallback(() => {
    setReplyingTo(null);
  }, []);

  /**
   * Update React Query cache
   * @param {Function} updater - Cache updater function
   */
  const updateCache = useCallback(
    updater => {
      queryClient.setQueryData(['comments', postId], oldData => {
        const oldComments = oldData?.comments || oldData || [];
        const newComments = updater(oldComments);
        return oldData?.comments
          ? { ...oldData, comments: newComments }
          : newComments;
      });
    },
    [queryClient, postId]
  );

  /**
   * Handle new comment from socket
   * @param {Object} data - New comment data
   */
  const handleNewComment = useCallback(
    data => {
      if (data.postId !== postId) return;
      const newComment = data.comment;

      updateCache(prev => {
        if (!newComment.parentComment) {
          if (prev.some(c => c._id === newComment._id)) return prev;
          return [{ ...newComment, replies: [] }, ...prev];
        }
        return addReplyToTree(prev, newComment);
      });
    },
    [postId, updateCache]
  );

  /**
   * Handle comment update from socket
   * @param {Object} data - Updated comment data
   */
  const handleUpdateComment = useCallback(
    data => {
      if (data.postId !== postId) return;
      const updated = data.comment || data;
      updateCache(prev => updateCommentInTree(prev, updated));
    },
    [postId, updateCache]
  );

  /**
   * Handle comment deletion from socket
   * @param {Object} data - Deleted comment data
   */
  const handleDeleteComment = useCallback(
    data => {
      if (data.postId !== postId) return;
      const { commentId } = data;
      updateCache(prev => removeCommentFromTree(prev, commentId));
    },
    [postId, updateCache]
  );

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

  const totalCount = comments?.reduce(
    (sum, cmt) => sum + 1 + (cmt.replies?.length || 0),
    0
  );

  return {
    comments,
    loading,
    error: localError,
    totalCount: totalCount || 0,
    currentUser: user,
    replyingTo,
    addComment,
    editComment,
    removeComment,
    toggleLike,
    startReply,
    cancelReply,
    refresh: refetch,
  };
};

export default useComments;
