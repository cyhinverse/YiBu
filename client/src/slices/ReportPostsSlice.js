import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  reportedPosts: {}, // Object với key là ID post và value là lý do báo cáo
  loading: false,
  error: null,
};

const reportedPostsSlice = createSlice({
  name: "reportedPosts",
  initialState,
  reducers: {
    reportPost: (state, action) => {
      const { postId, reason } = action.payload;
      state.reportedPosts[postId] = reason;
    },
    removeReport: (state, action) => {
      const postId = action.payload;
      delete state.reportedPosts[postId];
    },
    setReportedPosts: (state, action) => {
      state.reportedPosts = action.payload;
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
  reportPost,
  removeReport,
  setReportedPosts,
  setLoading,
  setError,
  clearError,
} = reportedPostsSlice.actions;

export default reportedPostsSlice.reducer;
