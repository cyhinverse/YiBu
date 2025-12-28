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

// Recursive helper to add reply to tree
const addReplyToTree = (comments, newComment) => {
  return comments.map(cmt => {
    // If this is the direct parent
    if (cmt._id === newComment.parentComment) {
      return {
        ...cmt,
        replies: [...(cmt.replies || []), newComment],
        repliesCount: (cmt.repliesCount || 0) + 1,
      };
    }
    // If it has replies, look deeper
    if (cmt.replies?.length > 0) {
      return {
        ...cmt,
        replies: addReplyToTree(cmt.replies, newComment),
      };
    }
    return cmt;
  });
};

// Recursive helper to update comment in tree
const updateCommentInTree = (comments, updatedComment) => {
  return comments.map(cmt => {
    if (cmt._id === updatedComment._id) {
      // Preserve replies
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

// Recursive helper to remove comment from tree
const removeCommentFromTree = (comments, commentId) => {
  return comments
    .filter(cmt => cmt._id !== commentId)
    .map(cmt => {
      if (cmt.replies?.length > 0) {
        return {
          ...cmt,
          replies: removeCommentFromTree(cmt.replies, commentId),
          // We might want to decrement repliesCount here if we knew the parent
          // But tree structure naturally removes it.
          // If we need to update parent's repliesCount, we need more complex logic
          // For now assuming simplistic removal is fine.
        };
      }
      return cmt;
    });
};

/**
 * Custom hook để quản lý comments của một post
 * @param {string} postId - ID của post
 * @returns {Object} - State và các hàm xử lý comment
 */
const useComments = postId => {
  const { socket } = useSocketContext();
  const { user } = useSelector(state => state.auth);
  const queryClient = useQueryClient();
  const [replyingTo, setReplyingTo] = useState(null); // { commentId, username }
  const [localError, setLocalError] = useState(null);

  // Queries
  const {
    data: commentsData,
    isLoading: loading,
    refetch,
  } = usePostComments(postId);

  const comments = commentsData?.comments || commentsData || [];

  // Mutations
  const createMutation = useCreateComment();
  const updateMutation = useUpdateComment();
  const deleteMutation = useDeleteComment();
  const likeMutation = useToggleLikeComment();

  // Add comment
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
        setLocalError(err?.message || 'Không thể thêm bình luận');
        return null;
      }
    },
    [postId, createMutation]
  );

  // Update comment
  const editComment = useCallback(
    async (commentId, content) => {
      if (!content.trim()) return false;
      try {
        await updateMutation.mutateAsync({ commentId, content });
        return true;
      } catch (err) {
        setLocalError(err?.message || 'Không thể cập nhật bình luận');
        return false;
      }
    },
    [updateMutation]
  );

  // Delete comment
  const removeComment = useCallback(
    async commentId => {
      try {
        await deleteMutation.mutateAsync({ commentId });
        return true;
      } catch (err) {
        setLocalError(err?.message || 'Không thể xóa bình luận');
        return false;
      }
    },
    [deleteMutation]
  );

  // Like/Unlike comment
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

  // Reply handlers
  const startReply = useCallback((commentId, username) => {
    setReplyingTo({ commentId, username });
  }, []);

  const cancelReply = useCallback(() => {
    setReplyingTo(null);
  }, []);

  // Update Cache Helper
  const updateCache = useCallback(
    updater => {
      queryClient.setQueryData(['comments', postId], oldData => {
        const oldComments = oldData?.comments || oldData || [];
        const newComments = updater(oldComments);
        // Return same structure as API
        return oldData?.comments
          ? { ...oldData, comments: newComments }
          : newComments;
      });
    },
    [queryClient, postId]
  );

  // Socket handlers
  const handleNewComment = useCallback(
    data => {
      if (data.postId !== postId) return;
      const newComment = data.comment;

      updateCache(prev => {
        if (!newComment.parentComment) {
          // Check duplicate
          if (prev.some(c => c._id === newComment._id)) return prev;
          return [{ ...newComment, replies: [] }, ...prev];
        }
        return addReplyToTree(prev, newComment);
      });
    },
    [postId, updateCache]
  );

  const handleUpdateComment = useCallback(
    data => {
      if (data.postId !== postId) return;
      const updated = data.comment || data;
      updateCache(prev => updateCommentInTree(prev, updated));
    },
    [postId, updateCache]
  );

  const handleDeleteComment = useCallback(
    data => {
      if (data.postId !== postId) return;
      const { commentId } = data;
      updateCache(prev => removeCommentFromTree(prev, commentId));
    },
    [postId, updateCache]
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

  const totalCount = comments?.reduce(
    (sum, cmt) => sum + 1 + (cmt.replies?.length || 0),
    0
  );

  return {
    comments,
    loading,
    error: localError, // Return local error for mutation failures
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
