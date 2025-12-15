import { createSlice } from "@reduxjs/toolkit";
import {
  getSavedPosts,
  getCollections,
  checkSaveStatus,
  savePost,
  unsavePost,
} from "../actions/savePostActions";

const initialState = {
  savedPosts: [],
  collections: [],
  collectionPosts: {},
  saveStatus: {},
  pagination: {
    page: 1,
    limit: 20,
    hasMore: true,
  },
  loading: false,
  error: null,
};

const savePostSlice = createSlice({
  name: "savePost",
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    clearSavedPosts: (state) => {
      state.savedPosts = [];
      state.pagination = { ...initialState.pagination };
    },
    resetSavePostState: () => initialState,
  },
  extraReducers: (builder) => {
    builder
      // Get Saved Posts
      .addCase(getSavedPosts.pending, (state) => {
        state.loading = true;
      })
      .addCase(getSavedPosts.fulfilled, (state, action) => {
        state.loading = false;
        const { isLoadMore } = action.payload;
        const posts = action.payload.data?.posts || action.payload.posts || [];
        const pagination = action.payload.data?.pagination || action.payload.pagination;

        if (isLoadMore) {
          state.savedPosts = [...state.savedPosts, ...posts];
        } else {
          state.savedPosts = posts;
        }
        if (pagination) {
          state.pagination = pagination;
        }
      })
      .addCase(getSavedPosts.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Get Collections
      .addCase(getCollections.pending, (state) => {
        state.loading = true;
      })
      .addCase(getCollections.fulfilled, (state, action) => {
        state.loading = false;
        state.collections = action.payload.data || action.payload;
      })
      .addCase(getCollections.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Check Save Status
      .addCase(checkSaveStatus.fulfilled, (state, action) => {
        const { postId, isSaved, collectionId } = action.payload;
        state.saveStatus[postId] = { isSaved, collectionId };
      })
      // Save Post
      .addCase(savePost.fulfilled, (state, action) => {
        const { postId, post, collectionId } = action.payload;
        state.saveStatus[postId] = { isSaved: true, collectionId };
        if (post) {
          state.savedPosts.unshift(post);
        }
      })
      // Unsave Post
      .addCase(unsavePost.fulfilled, (state, action) => {
        const { postId } = action.payload;
        state.saveStatus[postId] = { isSaved: false, collectionId: null };
        state.savedPosts = state.savedPosts.filter((p) => p._id !== postId);
      });
  },
});

export const { clearError, clearSavedPosts, resetSavePostState } =
  savePostSlice.actions;
export default savePostSlice.reducer;
