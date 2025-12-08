import { createSlice } from "@reduxjs/toolkit";
import {
  savePost,
  unsavePost,
  getSavedPosts,
  checkSavedStatus,
} from "../actions/savePostActions";

const initialState = {
  savedPosts: [],
  savedStatus: {}, // { [postId]: boolean }
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
    setLoading: (state, action) => {
      state.loading = action.payload;
    },
    setError: (state, action) => {
      state.error = action.payload;
    },
    setSavedPosts: (state, action) => {
      state.savedPosts = action.payload;
    },
    removeSavedPost: (state, action) => {
        const postId = action.payload;
        state.savedPosts = state.savedPosts.filter((post) => post._id !== postId);
        state.savedStatus[postId] = false;
    },
    // Optimistic update
    setSavedStatusLocal: (state, action) => {
         const { postId, status } = action.payload;
         state.savedStatus[postId] = status;
    }
  },
  extraReducers: (builder) => {
    // savePost
    builder
        .addCase(savePost.fulfilled, (state, action) => {
            const { postId } = action.payload;
            state.savedStatus[postId] = true;
            // Optionally add to savedPosts if we have the full post object. 
            // The API response might return it. 
            // If response.data.data includes post details, push it.
        });

    // unsavePost
    builder
        .addCase(unsavePost.fulfilled, (state, action) => {
            const { postId } = action.payload;
            state.savedStatus[postId] = false;
            state.savedPosts = state.savedPosts.filter(p => p._id !== postId && p.post?._id !== postId);
        });

    // getSavedPosts
    builder
        .addCase(getSavedPosts.pending, (state) => {
            state.loading = true;
        })
        .addCase(getSavedPosts.fulfilled, (state, action) => {
            state.loading = false;
            // Adjust based on structure. Service restructure logic suggests savedPosts array.
            const savedPostsData = action.payload.savedPosts || [];
            state.savedPosts = savedPostsData;
            
            // Sync status
            savedPostsData.forEach(item => {
                const id = item._id || (item.post ? item.post._id : null);
                if (id) state.savedStatus[id] = true;
            });
        })
        .addCase(getSavedPosts.rejected, (state, action) => {
            state.loading = false;
            state.error = action.payload;
        });

    // checkSavedStatus
    builder
        .addCase(checkSavedStatus.fulfilled, (state, action) => {
            const { postId, data } = action.payload;
            // data might be { isSaved: true }
            state.savedStatus[postId] = !!data.isSaved; 
        });
  },
});

export const { clearError, setSavedStatusLocal, setLoading, setError, setSavedPosts, removeSavedPost } = savePostSlice.actions;

export default savePostSlice.reducer;
