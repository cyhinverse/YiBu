import { createSlice } from '@reduxjs/toolkit';
import {
  createComment,
  getCommentsByPost,
  getCommentReplies,
  updateComment,
  deleteComment,
  likeComment,
  unlikeComment,
} from '@/redux/actions/commentActions';

const initialState = {
  comments: {},
  replies: {},
  loading: false,
  createLoading: false,
  error: null,
};

const commentSlice = createSlice({
  name: 'comment',
  initialState,
  reducers: {
    clearError: state => {
      state.error = null;
    },
    clearComments: (state, action) => {
      if (action.payload) {
        delete state.comments[action.payload];
      } else {
        state.comments = {};
      }
    },
    addCommentOptimistic: (state, action) => {
      const { postId, comment } = action.payload;
      if (!state.comments[postId]) {
        state.comments[postId] = [];
      }
      state.comments[postId].unshift(comment);
    },
    resetCommentState: () => initialState,
  },
  extraReducers: builder => {
    builder
      // Create Comment
      .addCase(createComment.pending, state => {
        state.createLoading = true;
      })
      .addCase(createComment.fulfilled, (state, action) => {
        state.createLoading = false;
        const { postId } = action.payload;
        // Handle { comment } or direct object
        const comment = action.payload.comment || action.payload;
        
        if (!state.comments[postId]) {
          state.comments[postId] = [];
        }

        if (comment.parentComment) {
          // Recursive helper to find parent and add reply
          const addReply = (comments) => {
             for (const cmt of comments) {
               if (cmt._id === comment.parentComment || cmt.id === comment.parentComment) {
                 if (!cmt.replies) cmt.replies = [];
                 cmt.replies.push(comment);
                 cmt.repliesCount = (cmt.repliesCount || 0) + 1;
                 return true;
               }
               if (cmt.replies?.length > 0) {
                 if (addReply(cmt.replies)) return true;
               }
             }
             return false;
          };
          addReply(state.comments[postId]);
        } else {
          state.comments[postId].unshift(comment);
        }
      })
      .addCase(createComment.rejected, (state, action) => {
        state.createLoading = false;
        state.error = action.payload;
      })
      // Get Comments by Post
      .addCase(getCommentsByPost.pending, state => {
        state.loading = true;
      })
      .addCase(getCommentsByPost.fulfilled, (state, action) => {
        state.loading = false;
        const { postId, isLoadMore } = action.payload;
        // Handle { comments } or direct array
        const comments =
          action.payload.comments ||
          (Array.isArray(action.payload) ? action.payload : []);
        if (isLoadMore && state.comments[postId]) {
          state.comments[postId] = [...state.comments[postId], ...comments];
        } else {
          state.comments[postId] = comments;
        }
      })
      .addCase(getCommentsByPost.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Get Comment Replies
      .addCase(getCommentReplies.fulfilled, (state, action) => {
        const { commentId, isLoadMore } = action.payload;
        // Handle { replies } or direct array
        const replies =
          action.payload.replies ||
          (Array.isArray(action.payload) ? action.payload : []);
        if (isLoadMore && state.replies[commentId]) {
          state.replies[commentId] = [...state.replies[commentId], ...replies];
        } else {
          state.replies[commentId] = replies;
        }
      })
      // Update Comment
      .addCase(updateComment.fulfilled, (state, action) => {
        const { postId } = action.payload;
        // Handle { comment } or direct object
        const comment = action.payload.comment || action.payload;
        if (state.comments[postId]) {
          const index = state.comments[postId].findIndex(
            c => c._id === comment._id || c.id === comment.id
          );
          if (index !== -1) {
            state.comments[postId][index] = comment;
          }
        }
      })
      // Delete Comment
      .addCase(deleteComment.fulfilled, (state, action) => {
        const { postId, commentId } = action.payload;
        if (state.comments[postId]) {
          state.comments[postId] = state.comments[postId].filter(
            c => c._id !== commentId && c.id !== commentId
          );
        }
      })
      // Like Comment
      .addCase(likeComment.fulfilled, (state, action) => {
        const { postId, commentId } = action.payload;
        if (state.comments[postId]) {
          const comment = state.comments[postId].find(
            c => c._id === commentId || c.id === commentId
          );
          if (comment) {
            comment.isLiked = true;
            comment.likesCount = (comment.likesCount || 0) + 1;
          }
        }
      })
      // Unlike Comment
      .addCase(unlikeComment.fulfilled, (state, action) => {
        const { postId, commentId } = action.payload;
        if (state.comments[postId]) {
          const comment = state.comments[postId].find(
            c => c._id === commentId || c.id === commentId
          );
          if (comment) {
            comment.isLiked = false;
            comment.likesCount = Math.max((comment.likesCount || 1) - 1, 0);
          }
        }
      });
  },
});

export const {
  clearError,
  clearComments,
  addCommentOptimistic,
  resetCommentState,
} = commentSlice.actions;
export default commentSlice.reducer;
