import { createSlice } from '@reduxjs/toolkit';
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
} from '../actions/postActions';

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
  name: 'post',
  initialState,
  reducers: {
    clearError: state => {
      state.error = null;
    },
    clearPosts: state => {
      state.posts = [];
      state.pagination = { ...initialState.pagination };
    },
    clearSearchResults: state => {
      state.searchResults = [];
    },
    setCurrentPost: (state, action) => {
      state.currentPost = action.payload;
    },
    addNewPost: (state, action) => {
      state.posts.unshift(action.payload);
    },
    updatePostInList: (state, action) => {
      const index = state.posts.findIndex(p => p._id === action.payload.id);
      if (index !== -1) {
        state.posts[index] = { ...state.posts[index], ...action.payload };
      }
    },
    removePostFromList: (state, action) => {
      state.posts = state.posts.filter(p => p._id !== action.payload);
      state.userPosts = state.userPosts.filter(p => p._id !== action.payload);
    },
    updateCommentCount: (state, action) => {
      const { postId, action: updateAction } = action.payload;
      const updateCount = posts => {
        const index = posts.findIndex(p => p._id === postId);
        if (index !== -1) {
          if (updateAction === 'increment') {
            posts[index].commentsCount = (posts[index].commentsCount || 0) + 1;
          } else {
            posts[index].commentsCount = Math.max(
              (posts[index].commentsCount || 1) - 1,
              0
            );
          }
        }
      };

      updateCount(state.posts);
      updateCount(state.userPosts);
      updateCount(state.personalizedPosts);
      updateCount(state.trendingPosts);
      updateCount(state.explorePosts);
      updateCount(state.hashtagPosts);
      updateCount(state.searchResults);

      if (state.currentPost?._id === postId) {
        if (updateAction === 'increment') {
          state.currentPost.commentsCount =
            (state.currentPost.commentsCount || 0) + 1;
        } else {
          state.currentPost.commentsCount = Math.max(
            (state.currentPost.commentsCount || 1) - 1,
            0
          );
        }
      }
    },
    resetPostState: () => initialState,
  },
  extraReducers: builder => {
    builder
      // Get All Posts
      .addCase(getAllPosts.pending, state => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getAllPosts.fulfilled, (state, action) => {
        state.loading = false;
        const { isLoadMore } = action.payload;
        // Data is already extracted by extractData helper
        const posts = action.payload.posts || [];

        if (isLoadMore) {
          state.posts = [...state.posts, ...posts];
        } else {
          state.posts = posts;
        }

        // Update pagination if available
        if (action.payload.hasMore !== undefined) {
          state.pagination = {
            ...state.pagination,
            hasMore: action.payload.hasMore,
            total: action.payload.total || state.pagination.total,
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
      .addCase(getExploreFeed.pending, state => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getExploreFeed.fulfilled, (state, action) => {
        state.loading = false;
        // Data is already extracted
        state.explorePosts = action.payload.posts || [];
      })
      .addCase(getExploreFeed.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Get Personalized Feed
      .addCase(getPersonalizedFeed.pending, state => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getPersonalizedFeed.fulfilled, (state, action) => {
        state.loading = false;
        // Data is already extracted
        state.personalizedPosts = action.payload.posts || [];
        // Update pagination hasMore if available
        if (action.payload.hasMore !== undefined) {
          state.pagination = {
            ...state.pagination,
            hasMore: action.payload.hasMore,
          };
        }
      })
      .addCase(getPersonalizedFeed.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Get Trending Posts
      .addCase(getTrendingPosts.fulfilled, (state, action) => {
        // Data is already extracted
        state.trendingPosts = action.payload.posts || [];
      })
      // Search Posts
      .addCase(searchPosts.pending, state => {
        state.loading = true;
        state.error = null;
      })
      .addCase(searchPosts.fulfilled, (state, action) => {
        state.loading = false;
        // Data is already extracted
        state.searchResults = action.payload.posts || [];
      })
      .addCase(searchPosts.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Get Posts by Hashtag
      .addCase(getPostsByHashtag.fulfilled, (state, action) => {
        // Data is already extracted
        state.hashtagPosts = action.payload.posts || [];
      })
      // Get Trending Hashtags
      .addCase(getTrendingHashtags.fulfilled, (state, action) => {
        // This one is usually just data.
        state.trendingHashtags = action.payload;
      })
      // Create Post
      .addCase(createPost.pending, state => {
        state.createLoading = true;
        state.error = null;
      })
      .addCase(createPost.fulfilled, (state, action) => {
        state.createLoading = false;
        // Data is already extracted by extractData helper
        const newPost = action.payload.post || action.payload;
        state.posts.unshift(newPost);
        state.userPosts.unshift(newPost);
      })
      .addCase(createPost.rejected, (state, action) => {
        state.createLoading = false;
        state.error = action.payload;
      })
      // Get Posts by User
      .addCase(getPostsByUser.pending, state => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getPostsByUser.fulfilled, (state, action) => {
        state.loading = false;
        // Data is already extracted
        state.userPosts = action.payload.posts || [];
      })
      .addCase(getPostsByUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Get Post by ID
      .addCase(getPostById.pending, state => {
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
      .addCase(updatePost.pending, state => {
        state.createLoading = true;
        state.error = null;
      })
      .addCase(updatePost.fulfilled, (state, action) => {
        state.createLoading = false;
        // Data is already extracted
        const updatedPost = action.payload.post || action.payload;

        const index = state.posts.findIndex(p => p._id === updatedPost._id);
        if (index !== -1) {
          state.posts[index] = updatedPost;
        }

        const userIndex = state.userPosts.findIndex(
          p => p._id === updatedPost._id
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
        state.posts = state.posts.filter(p => p._id !== action.payload.postId);
        state.userPosts = state.userPosts.filter(
          p => p._id !== action.payload.postId
        );
        if (state.currentPost?._id === action.payload.postId) {
          state.currentPost = null;
        }
      })
      // Share Post
      .addCase(sharePost.fulfilled, (state, action) => {
        const index = state.posts.findIndex(
          p => p._id === action.payload.postId
        );
        if (index !== -1) {
          state.posts[index].sharesCount =
            (state.posts[index].sharesCount || 0) + 1;
        }
      })
      // Report Post
      .addCase(reportPost.fulfilled, (state, action) => {
        const index = state.posts.findIndex(
          p => p._id === action.payload.postId
        );
        if (index !== -1) {
          state.posts[index].reportsCount =
            (state.posts[index].reportsCount || 0) + 1;
        }
      })
      // Synchronize comment count from comment actions
      .addMatcher(
        action => action.type === 'comment/createComment/fulfilled',
        (state, action) => {
          const { postId, comment } = action.payload;
          // Only increment if it's a top-level comment (not a reply)
          // Replies increment parent comment's repliesCount handled in CommentSlice
          if (comment && !comment.parentComment) {
            const updateCount = posts => {
              const index = posts.findIndex(p => p._id === postId);
              if (index !== -1) {
                posts[index].commentsCount =
                  (posts[index].commentsCount || 0) + 1;
              }
            };

            updateCount(state.posts);
            updateCount(state.userPosts);
            updateCount(state.personalizedPosts);
            updateCount(state.trendingPosts);
            updateCount(state.explorePosts);
            updateCount(state.hashtagPosts);
            updateCount(state.searchResults);

            if (state.currentPost?._id === postId) {
              state.currentPost.commentsCount =
                (state.currentPost.commentsCount || 0) + 1;
            }
          }
        }
      )
      .addMatcher(
        action => action.type === 'comment/deleteComment/fulfilled',
        (state, action) => {
          const { postId, commentId, isReply } = action.payload;
          // We only decrement post's commentsCount if it was a top-level comment
          // Backend handles depth, but if we don't have it in payload, this is tricky
          // For now, assume if isReply is not set, it's a top-level comment
          if (!isReply) {
            const updateCount = posts => {
              const index = posts.findIndex(p => p._id === postId);
              if (index !== -1) {
                posts[index].commentsCount = Math.max(
                  (posts[index].commentsCount || 1) - 1,
                  0
                );
              }
            };

            updateCount(state.posts);
            updateCount(state.userPosts);
            updateCount(state.personalizedPosts);
            updateCount(state.trendingPosts);

            if (state.currentPost?._id === postId) {
              state.currentPost.commentsCount = Math.max(
                (state.currentPost.commentsCount || 1) - 1,
                0
              );
            }
          }
        }
      );
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
  updateCommentCount,
  resetPostState,
} = postSlice.actions;
export default postSlice.reducer;
