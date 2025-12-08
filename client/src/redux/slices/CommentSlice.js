import { createSlice } from "@reduxjs/toolkit";
import {
  createComment,
  getCommentsByPost,
  updateComment,
  deleteComment,
} from "../actions/commentActions";

const initialState = {
  commentsByPost: {}, // Object with postId as key and array of comments as value
  loading: false,
  error: null,
};

const commentSlice = createSlice({
  name: "comment",
  initialState,
  reducers: {
      clearError: (state) => {
          state.error = null;
      }
  },
  extraReducers: (builder) => {
    // createComment
    builder
        .addCase(createComment.fulfilled, (state, action) => {
            const comment = action.payload;
            const postId = comment.postId || comment.post; // Adjust based on actual payload
            if (postId) {
                if (!state.commentsByPost[postId]) {
                    state.commentsByPost[postId] = [];
                }
                state.commentsByPost[postId].push(comment);
            }
        });

    // getCommentsByPost
    builder
        .addCase(getCommentsByPost.pending, (state) => {
            state.loading = true;
        })
        .addCase(getCommentsByPost.fulfilled, (state, action) => {
            state.loading = false;
            const { postId, comments } = action.payload;
            state.commentsByPost[postId] = comments;
        })
        .addCase(getCommentsByPost.rejected, (state, action) => {
            state.loading = false;
            state.error = action.payload;
        });

    // updateComment
    builder
        .addCase(updateComment.fulfilled, (state, action) => {
             const updatedComment = action.payload;
             const postId = updatedComment.postId || updatedComment.post;
             if (postId && state.commentsByPost[postId]) {
                 const index = state.commentsByPost[postId].findIndex(c => c._id === updatedComment._id);
                 if (index !== -1) {
                     state.commentsByPost[postId][index] = updatedComment;
                 }
             }
        });

    // deleteComment
    builder
        .addCase(deleteComment.fulfilled, (state, action) => {
            const commentId = action.payload;
            // Need to find which post it belongs to, or iterate all
            Object.keys(state.commentsByPost).forEach(postId => {
                state.commentsByPost[postId] = state.commentsByPost[postId].filter(c => c._id !== commentId);
            });
        });
  },
});

export const { clearError } = commentSlice.actions;
export default commentSlice.reducer;
