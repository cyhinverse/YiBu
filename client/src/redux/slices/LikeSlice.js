import { createSlice } from "@reduxjs/toolkit";
import {
  createLike,
  deleteLike,
  toggleLike,
  getLikeStatus,
  getBatchLikeStatus,
  getPostLikes,
  getMyLikedPosts,
} from "../actions/likeActions";

const initialState = {
  likeStatus: {},
  postLikes: {},
  likedPosts: [],
  loading: false,
  error: null,
};

const likeSlice = createSlice({
  name: "like",
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    setLikeStatusOptimistic: (state, action) => {
      const { postId, isLiked, likesCount } = action.payload;
      state.likeStatus[postId] = { isLiked, likesCount };
    },
    resetLikeState: () => initialState,
  },
  extraReducers: (builder) => {
    builder
      // Create Like
      .addCase(createLike.fulfilled, (state, action) => {
        const { postId, likesCount } = action.payload;
        state.likeStatus[postId] = { isLiked: true, likesCount };
      })
      // Delete Like
      .addCase(deleteLike.fulfilled, (state, action) => {
        const { postId, likesCount } = action.payload;
        state.likeStatus[postId] = { isLiked: false, likesCount };
      })
      // Toggle Like
      .addCase(toggleLike.fulfilled, (state, action) => {
        const { postId, isLiked, likesCount } = action.payload;
        state.likeStatus[postId] = { isLiked, likesCount };
      })
      // Get Like Status
      .addCase(getLikeStatus.fulfilled, (state, action) => {
        const { postId, isLiked, likesCount } = action.payload;
        state.likeStatus[postId] = { isLiked, likesCount };
      })
      // Get Batch Like Status
      .addCase(getBatchLikeStatus.fulfilled, (state, action) => {
        action.payload.forEach(({ postId, isLiked, likesCount }) => {
          state.likeStatus[postId] = { isLiked, likesCount };
        });
      })
      // Get Post Likes
      .addCase(getPostLikes.pending, (state) => {
        state.loading = true;
      })
      .addCase(getPostLikes.fulfilled, (state, action) => {
        state.loading = false;
        const { postId, users } = action.payload;
        state.postLikes[postId] = users;
      })
      .addCase(getPostLikes.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Get My Liked Posts
      .addCase(getMyLikedPosts.pending, (state) => {
        state.loading = true;
      })
      .addCase(getMyLikedPosts.fulfilled, (state, action) => {
        state.loading = false;
        state.likedPosts = action.payload;
      })
      .addCase(getMyLikedPosts.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { clearError, setLikeStatusOptimistic, resetLikeState } =
  likeSlice.actions;
export default likeSlice.reducer;
