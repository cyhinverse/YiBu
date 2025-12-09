import { createSlice } from "@reduxjs/toolkit";
import {
  createLike,
  deleteLike,
  getLikeStatus,
  getAllLikes,
  toggleLike,
  getLikedPosts,
} from "../actions/likeActions";

const initialState = {
  likesByPost: {}, // { [postId]: { isLiked: boolean, count: number } }
  likedPostsList: [], // List of posts liked by user
  loading: false,
  error: null,
};

const likeSlice = createSlice({
  name: "like",
  initialState,
  reducers: {
    resetLikes: (state) => {
      state.likesByPost = {};
      state.likedPostsList = [];
      state.loading = false;
      state.error = null;
    },
    // Manual updates if needed for optimistic UI before thunk completes (thunk handles it via fulfilled mostly)
    updateLikeLocal: (state, action) => {
      const { postId, isLiked, count } = action.payload;
      state.likesByPost[postId] = { isLiked, count };
    },
    // Alias for Post component compatibility
    setPostLikeStatus: (state, action) => {
      const { postId, isLiked, count } = action.payload;
      state.likesByPost[postId] = { isLiked, count };
    },
  },
  extraReducers: (builder) => {
    // getLikeStatus
    builder.addCase(getLikeStatus.fulfilled, (state, action) => {
      const { postId, data } = action.payload;
      state.likesByPost[postId] = {
        isLiked: data.isLiked,
        count: data.count,
      };
    });

    // getAllLikes
    builder.addCase(getAllLikes.fulfilled, (state, action) => {
      // Assuming payload is an array of like statuses or object
      const likesData = action.payload;
      // Logic depends on exact API response structure.
      // If it's Array of { postId, isLiked, count }
      if (Array.isArray(likesData)) {
        likesData.forEach((item) => {
          state.likesByPost[item.postId] = {
            isLiked: item.isLiked,
            count: item.count,
          };
        });
      }
    });

    // toggleLike
    builder.addCase(toggleLike.fulfilled, (state, action) => {
      const { postId, data } = action.payload;
      // API might return new status
      state.likesByPost[postId] = {
        isLiked: data.isLiked,
        count: data.count,
      };
    });

    // getLikedPosts
    builder
      .addCase(getLikedPosts.pending, (state) => {
        state.loading = true;
      })
      .addCase(getLikedPosts.fulfilled, (state, action) => {
        state.loading = false;
        state.likedPostsList = action.payload;
      })
      .addCase(getLikedPosts.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });

    // createLike & deleteLike
    // Usually these might be used if toggleLike isn't available or for specific cases.
    // They would likely update likesByPost similarly.
    builder.addCase(createLike.fulfilled, () => {
      // Update if response gives context
    });
    builder.addCase(deleteLike.fulfilled, () => {
      // Update if response gives context
    });
  },
});

export const { resetLikes, updateLikeLocal, setPostLikeStatus } =
  likeSlice.actions;

export default likeSlice.reducer;
