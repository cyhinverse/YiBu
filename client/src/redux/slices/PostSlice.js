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
      const index = state.posts.findIndex((p) => p._id === action.payload.id);
      if (index !== -1) {
        state.posts[index] = { ...state.posts[index], ...action.payload };
      }
    },
    removePostFromList: (state, action) => {
      state.posts = state.posts.filter((p) => p._id !== action.payload);
      state.userPosts = state.userPosts.filter((p) => p._id !== action.payload);
    },
    resetPostState: () => initialState,
  },
  extraReducers: (builder) => {
    builder
      // Get All Posts
      .addCase(getAllPosts.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getAllPosts.fulfilled, (state, action) => {
        state.loading = false;
        const { isLoadMore } = action.payload;
        const posts = action.payload.data?.posts || [];
        
        if (isLoadMore) {
          state.posts = [...state.posts, ...posts];
        } else {
          state.posts = posts;
        }
        
        // Update pagination if available
        if (action.payload.data?.hasMore !== undefined) {
          state.pagination = {
            ...state.pagination,
            hasMore: action.payload.data.hasMore,
            total: action.payload.data.total || state.pagination.total
          };
        } else if (action.payload.pagination) {
             state.pagination = action.payload.pagination;
        }
      })
      .addCase(getAllPosts.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Get Explore Feed
      .addCase(getExploreFeed.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getExploreFeed.fulfilled, (state, action) => {
        state.loading = false;
        state.explorePosts = action.payload.data?.posts || [];
      })
      .addCase(getExploreFeed.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Get Personalized Feed
      .addCase(getPersonalizedFeed.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getPersonalizedFeed.fulfilled, (state, action) => {
        state.loading = false;
        state.personalizedPosts = action.payload.data?.posts || [];
        // Update pagination hasMore if available in data
        if (action.payload.data?.hasMore !== undefined) {
          state.pagination = {
            ...state.pagination,
            hasMore: action.payload.data.hasMore,
          };
        }
      })
      .addCase(getPersonalizedFeed.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Get Trending Posts
      .addCase(getTrendingPosts.fulfilled, (state, action) => {
        state.trendingPosts = action.payload.data?.posts || [];
      })
      // Search Posts
      .addCase(searchPosts.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(searchPosts.fulfilled, (state, action) => {
        state.loading = false;
        state.searchResults = action.payload.data?.posts || [];
      })
      .addCase(searchPosts.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Get Posts by Hashtag
      .addCase(getPostsByHashtag.fulfilled, (state, action) => {
        state.hashtagPosts = action.payload.data?.posts || [];
      })
      // Get Trending Hashtags
      .addCase(getTrendingHashtags.fulfilled, (state, action) => {
         // This one is usually just data.
         state.trendingHashtags = action.payload; 
      })
      // Create Post
      .addCase(createPost.pending, (state) => {
        state.createLoading = true;
        state.error = null;
      })
      .addCase(createPost.fulfilled, (state, action) => {
        state.createLoading = false;
        // Create post usually returns the created post object. If it is wrapped in data...
        // action.payload might be { code: 1, data: { ...post } }
        const newPost = action.payload.data || action.payload;
        state.posts.unshift(newPost);
        state.userPosts.unshift(newPost);
      })
      .addCase(createPost.rejected, (state, action) => {
        state.createLoading = false;
        state.error = action.payload;
      })
      // Get Posts by User
      .addCase(getPostsByUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getPostsByUser.fulfilled, (state, action) => {
        state.loading = false;
        state.userPosts = action.payload.data?.posts || [];
      })
      .addCase(getPostsByUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Get Post by ID
      .addCase(getPostById.pending, (state) => {
        state.loading = true;
        state.error = null;
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
      .addCase(updatePost.pending, (state) => {
        state.createLoading = true;
        state.error = null;
      })
      .addCase(updatePost.fulfilled, (state, action) => {
        state.createLoading = false;
        const updatedPost = action.payload.data || action.payload;
        
        const index = state.posts.findIndex((p) => p._id === updatedPost._id);
        if (index !== -1) {
          state.posts[index] = updatedPost;
        }
        
        const userIndex = state.userPosts.findIndex(
          (p) => p._id === updatedPost._id
        );
        if (userIndex !== -1) {
          state.userPosts[userIndex] = updatedPost;
        }
        
        if (state.currentPost?._id === updatedPost._id) {
          state.currentPost = updatedPost;
        }
      })
      .addCase(updatePost.rejected, (state, action) => {
        state.createLoading = false;
        state.error = action.payload;
      })
      // Delete Post
      .addCase(deletePost.fulfilled, (state, action) => {
        state.posts = state.posts.filter((p) => p._id !== action.payload.postId);
        state.userPosts = state.userPosts.filter(
          (p) => p._id !== action.payload.postId
        );
        if (state.currentPost?._id === action.payload.postId) {
          state.currentPost = null;
        }
      })
      // Share Post
      .addCase(sharePost.fulfilled, (state, action) => {
        const index = state.posts.findIndex(
          (p) => p._id === action.payload.postId
        );
        if (index !== -1) {
          state.posts[index].sharesCount =
            (state.posts[index].sharesCount || 0) + 1;
        }
      })
      // Report Post
      .addCase(reportPost.fulfilled, (state, action) => {
        const index = state.posts.findIndex(
          (p) => p._id === action.payload.postId
        );
        if (index !== -1) {
          state.posts[index].reportsCount =
            (state.posts[index].reportsCount || 0) + 1;
        }
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
