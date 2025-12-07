import { createSlice } from "@reduxjs/toolkit";


const initialState = {
  likesByPost: {}, 
  loading: false,
  error: null,
};


const likeSlice = createSlice({
  name: "like",
  initialState,
  reducers: {

    setPostLikeStatus: (state, action) => {
      const { postId, isLiked, count } = action.payload;
      if (!postId) return;

      state.likesByPost[postId] = {
        isLiked: isLiked ?? false,
        count: count ?? 0,
      };
    },


    updateLikeCount: (state, action) => {
      const { postId, count } = action.payload;
      if (!postId) return;

      if (state.likesByPost[postId]) {
        state.likesByPost[postId].count = count ?? 0;
      } else {
        state.likesByPost[postId] = {
          isLiked: false,
          count: count ?? 0,
        };
      }
    },


    toggleLike: (state, action) => {
      const { postId } = action.payload;
      if (!postId) return;

      if (state.likesByPost[postId]) {
        const currentStatus = state.likesByPost[postId];
        state.likesByPost[postId] = {
          isLiked: !currentStatus.isLiked,
          count: currentStatus.isLiked
            ? Math.max(0, currentStatus.count - 1)
            : currentStatus.count + 1,
        };
      } else {

        state.likesByPost[postId] = {
          isLiked: true,
          count: 1,
        };
      }
    },

    setLoading: (state, action) => {
      state.loading = action.payload;
    },


    setError: (state, action) => {
      state.error = action.payload;
    },


    resetLikes: (state) => {
      Object.assign(state, initialState);
    },
  },
});

export const {
  setPostLikeStatus,
  updateLikeCount,
  toggleLike,
  setLoading,
  setError,
  resetLikes,
} = likeSlice.actions;

export default likeSlice.reducer;
