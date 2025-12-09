import { createSlice } from "@reduxjs/toolkit";
import {
  createComment,
  getCommentsByPost,
  getCommentReplies,
  updateComment,
  deleteComment,
  likeComment,
  unlikeComment,
} from "../actions/commentActions";

const initialState = {
  comments: {},
  replies: {},
  loading: false,
  createLoading: false,
  error: null,
};

const commentSlice = createSlice({
  name: "comment",
  initialState,
  reducers: {
    clearError: (state) => {
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
  extraReducers: (builder) => {
    builder
      // Create Comment
      .addCase(createComment.pending, (state) => {
        state.createLoading = true;
      })
      .addCase(createComment.fulfilled, (state, action) => {
        state.createLoading = false;
        const { postId, comment } = action.payload;
        if (!state.comments[postId]) {
          state.comments[postId] = [];
        }
        state.comments[postId].unshift(comment);
      })
      .addCase(createComment.rejected, (state, action) => {
        state.createLoading = false;
        state.error = action.payload;
      })
      // Get Comments by Post
      .addCase(getCommentsByPost.pending, (state) => {
        state.loading = true;
      })
      .addCase(getCommentsByPost.fulfilled, (state, action) => {
        state.loading = false;
        const { postId, comments } = action.payload;
        state.comments[postId] = comments;
      })
      .addCase(getCommentsByPost.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Get Comment Replies
      .addCase(getCommentReplies.fulfilled, (state, action) => {
        const { commentId, replies } = action.payload;
        state.replies[commentId] = replies;
      })
      // Update Comment
      .addCase(updateComment.fulfilled, (state, action) => {
        const { postId, comment } = action.payload;
        if (state.comments[postId]) {
          const index = state.comments[postId].findIndex(
            (c) => c.id === comment.id
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
            (c) => c.id !== commentId
          );
        }
      })
      // Like Comment
      .addCase(likeComment.fulfilled, (state, action) => {
        const { postId, commentId } = action.payload;
        if (state.comments[postId]) {
          const comment = state.comments[postId].find(
            (c) => c.id === commentId
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
            (c) => c.id === commentId
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
