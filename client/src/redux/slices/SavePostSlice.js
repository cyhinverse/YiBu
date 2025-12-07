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
      state.savedPosts = action.payload || [];
      if (Array.isArray(action.payload)) {
        action.payload.forEach((post) => {
          if (post && post._id) {
            state.savedStatus[post._id] = true;
          }
        });
      }
    },
    addSavedPost: (state, action) => {
      if (action.payload && action.payload._id) {
        const existingPostIndex = state.savedPosts.findIndex(
          (post) => post._id === action.payload._id
        );

        if (existingPostIndex === -1) {
          state.savedPosts.unshift(action.payload);
        }

        state.savedStatus[action.payload._id] = true;
      }
    },
    removeSavedPost: (state, action) => {
      if (!action.payload) return;

      state.savedPosts = state.savedPosts.filter(
        (post) => post && post._id !== action.payload
      );
      state.savedStatus[action.payload] = false;
    },
    setSavedStatus: (state, action) => {
      const { postId, status } = action.payload;
      if (postId) {
        state.savedStatus[postId] = status;
      }
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
  setSavedPosts,
  addSavedPost,
  removeSavedPost,
  setSavedStatus,
  setLoading,
  setError,
  clearError,
} = savePostSlice.actions;

export default savePostSlice.reducer;
