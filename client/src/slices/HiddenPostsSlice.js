import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  hiddenPosts: [], // Danh sách id của các bài viết đã ẩn
  loading: false,
  error: null,
};

const hiddenPostsSlice = createSlice({
  name: "hiddenPosts",
  initialState,
  reducers: {
    hidePost: (state, action) => {
      const postId = action.payload;
      if (!state.hiddenPosts.includes(postId)) {
        state.hiddenPosts.push(postId);
      }
    },
    showPost: (state, action) => {
      const postId = action.payload;
      state.hiddenPosts = state.hiddenPosts.filter((id) => id !== postId);
    },
    setHiddenPosts: (state, action) => {
      state.hiddenPosts = action.payload;
    },
    setLoading: (state, action) => {
      state.loading = action.payload;
    },
    setError: (state, action) => {
      state.error = action.payload;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
});

export const {
  hidePost,
  showPost,
  setHiddenPosts,
  setLoading,
  setError,
  clearError,
} = hiddenPostsSlice.actions;

export default hiddenPostsSlice.reducer;
