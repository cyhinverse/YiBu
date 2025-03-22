import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  savedPosts: [],
  savedStatus: {},
  loading: false,
  error: null,
};

const savePostSlice = createSlice({
  name: "savePost",
  initialState,
  reducers: {
    setSavedPosts: (state, action) => {
      state.savedPosts = action.payload;
    },
    addSavedPost: (state, action) => {
      state.savedPosts.unshift(action.payload);
      state.savedStatus[action.payload._id] = true;
    },
    removeSavedPost: (state, action) => {
      state.savedPosts = state.savedPosts.filter(
        (post) => post._id !== action.payload
      );
      state.savedStatus[action.payload] = false;
    },
    setSavedStatus: (state, action) => {
      const { postId, status } = action.payload;
      state.savedStatus[postId] = status;
    },
    setLoading: (state, action) => {
      state.loading = action.payload;
    },
    setError: (state, action) => {
      state.error = action.payload;
    },
  },
});

export const {
  setSavedPosts,
  addSavedPost,
  removeSavedPost,
  setSavedStatus,
  setLoading,
  setError,
} = savePostSlice.actions;

export default savePostSlice.reducer;
