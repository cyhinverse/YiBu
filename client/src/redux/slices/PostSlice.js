import { createSlice } from "@reduxjs/toolkit";
import {
  getAllPosts,
  getExploreFeed,
  getPersonalizedFeed,
  getTrendingPosts,
  searchPosts,
  getPostsByHashtag,
  getTrendingHashtags,
  createPost,
  getPostsByUser,
  getPostById,
  updatePost,
  deletePost,
  sharePost,
  reportPost,
} from "../actions/postActions";

const initialState = {
  posts: [],
  explorePosts: [],
  personalizedPosts: [],
  trendingPosts: [],
  userPosts: [],
  searchResults: [],
  hashtagPosts: [],
  trendingHashtags: [],
  currentPost: null,
  pagination: {
    page: 1,
    limit: 10,
    total: 0,
    hasMore: true,
  },
  loading: false,
  createLoading: false,
  error: null,
};

const postSlice = createSlice({
  name: "post",
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    clearPosts: (state) => {
      state.posts = [];
      state.pagination = { ...initialState.pagination };
    },
    clearSearchResults: (state) => {
      state.searchResults = [];
    },
    setCurrentPost: (state, action) => {
      state.currentPost = action.payload;
    },
    addNewPost: (state, action) => {
      state.posts.unshift(action.payload);
    },
    updatePostInList: (state, action) => {
      const index = state.posts.findIndex((p) => p.id === action.payload.id);
      if (index !== -1) {
        state.posts[index] = { ...state.posts[index], ...action.payload };
      }
    },
    removePostFromList: (state, action) => {
      state.posts = state.posts.filter((p) => p.id !== action.payload);
      state.userPosts = state.userPosts.filter((p) => p.id !== action.payload);
    },
    resetPostState: () => initialState,
  },
  extraReducers: (builder) => {
    builder
      // Get All Posts
      .addCase(getAllPosts.pending, (state) => {
        state.loading = true;
      })
      .addCase(getAllPosts.fulfilled, (state, action) => {
        state.loading = false;
        const { posts, pagination, isLoadMore } = action.payload;
        if (isLoadMore) {
          state.posts = [...state.posts, ...posts];
        } else {
          state.posts = posts;
        }
        state.pagination = pagination;
      })
      .addCase(getAllPosts.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Get Explore Feed
      .addCase(getExploreFeed.pending, (state) => {
        state.loading = true;
      })
      .addCase(getExploreFeed.fulfilled, (state, action) => {
        state.loading = false;
        state.explorePosts = action.payload.posts;
      })
      .addCase(getExploreFeed.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Get Personalized Feed
      .addCase(getPersonalizedFeed.pending, (state) => {
        state.loading = true;
      })
      .addCase(getPersonalizedFeed.fulfilled, (state, action) => {
        state.loading = false;
        state.personalizedPosts = action.payload.posts;
      })
      .addCase(getPersonalizedFeed.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Get Trending Posts
      .addCase(getTrendingPosts.fulfilled, (state, action) => {
        state.trendingPosts = action.payload;
      })
      // Search Posts
      .addCase(searchPosts.pending, (state) => {
        state.loading = true;
      })
      .addCase(searchPosts.fulfilled, (state, action) => {
        state.loading = false;
        state.searchResults = action.payload;
      })
      .addCase(searchPosts.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Get Posts by Hashtag
      .addCase(getPostsByHashtag.fulfilled, (state, action) => {
        state.hashtagPosts = action.payload;
      })
      // Get Trending Hashtags
      .addCase(getTrendingHashtags.fulfilled, (state, action) => {
        state.trendingHashtags = action.payload;
      })
      // Create Post
      .addCase(createPost.pending, (state) => {
        state.createLoading = true;
      })
      .addCase(createPost.fulfilled, (state, action) => {
        state.createLoading = false;
        state.posts.unshift(action.payload);
        state.userPosts.unshift(action.payload);
      })
      .addCase(createPost.rejected, (state, action) => {
        state.createLoading = false;
        state.error = action.payload;
      })
      // Get Posts by User
      .addCase(getPostsByUser.pending, (state) => {
        state.loading = true;
      })
      .addCase(getPostsByUser.fulfilled, (state, action) => {
        state.loading = false;
        state.userPosts = action.payload;
      })
      .addCase(getPostsByUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Get Post by ID
      .addCase(getPostById.pending, (state) => {
        state.loading = true;
      })
      .addCase(getPostById.fulfilled, (state, action) => {
        state.loading = false;
        state.currentPost = action.payload;
      })
      .addCase(getPostById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Update Post
      .addCase(updatePost.fulfilled, (state, action) => {
        const index = state.posts.findIndex((p) => p.id === action.payload.id);
        if (index !== -1) {
          state.posts[index] = action.payload;
        }
        const userIndex = state.userPosts.findIndex(
          (p) => p.id === action.payload.id
        );
        if (userIndex !== -1) {
          state.userPosts[userIndex] = action.payload;
        }
        if (state.currentPost?.id === action.payload.id) {
          state.currentPost = action.payload;
        }
      })
      // Delete Post
      .addCase(deletePost.fulfilled, (state, action) => {
        state.posts = state.posts.filter((p) => p.id !== action.payload.postId);
        state.userPosts = state.userPosts.filter(
          (p) => p.id !== action.payload.postId
        );
        if (state.currentPost?.id === action.payload.postId) {
          state.currentPost = null;
        }
      })
      // Share Post
      .addCase(sharePost.fulfilled, (state, action) => {
        const index = state.posts.findIndex(
          (p) => p.id === action.payload.postId
        );
        if (index !== -1) {
          state.posts[index].sharesCount =
            (state.posts[index].sharesCount || 0) + 1;
        }
      })
      // Report Post
      .addCase(reportPost.fulfilled, (state, action) => {
        // Optionally hide the reported post
      });
  },
});

export const {
  clearError,
  clearPosts,
  clearSearchResults,
  setCurrentPost,
  addNewPost,
  updatePostInList,
  removePostFromList,
  resetPostState,
} = postSlice.actions;
export default postSlice.reducer;
