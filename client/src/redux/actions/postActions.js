import { createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../axios/axiosConfig';
import { POST_API } from '../../axios/apiEndpoint';

// Get All Posts (Feed)
export const getAllPosts = createAsyncThunk(
  'post/getAllPosts',
  async ({ page = 1, limit = 20 }, { rejectWithValue }) => {
    try {
      const response = await api.get(POST_API.GET_ALL, {
        params: { page, limit },
      });
      return { ...response.data, isLoadMore: page > 1 };
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Lấy bài viết thất bại'
      );
    }
  }
);

// Get Explore Feed
export const getExploreFeed = createAsyncThunk(
  'post/getExploreFeed',
  async ({ page = 1, limit = 20 }, { rejectWithValue }) => {
    try {
      const response = await api.get(POST_API.GET_EXPLORE, {
        params: { page, limit },
      });
      return { ...response.data, isLoadMore: page > 1 };
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Lấy bài viết khám phá thất bại'
      );
    }
  }
);

// Get Personalized Feed
export const getPersonalizedFeed = createAsyncThunk(
  'post/getPersonalizedFeed',
  async ({ page = 1, limit = 20 }, { rejectWithValue }) => {
    try {
      const response = await api.get(POST_API.GET_PERSONALIZED, {
        params: { page, limit },
      });
      return { ...response.data, isLoadMore: page > 1 };
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Lấy bài viết cá nhân hóa thất bại'
      );
    }
  }
);

// Get Trending Posts
export const getTrendingPosts = createAsyncThunk(
  'post/getTrendingPosts',
  async ({ page = 1, limit = 20 }, { rejectWithValue }) => {
    try {
      const response = await api.get(POST_API.GET_TRENDING, {
        params: { page, limit },
      });
      return { ...response.data, isLoadMore: page > 1 };
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Lấy bài viết xu hướng thất bại'
      );
    }
  }
);

// Search Posts
export const searchPosts = createAsyncThunk(
  'post/searchPosts',
  async ({ query, page = 1, limit = 20 }, { rejectWithValue }) => {
    try {
      const response = await api.get(POST_API.SEARCH, {
        params: { q: query, page, limit },
      });
      return { ...response.data, isLoadMore: page > 1 };
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Tìm kiếm bài viết thất bại'
      );
    }
  }
);

// Get Posts by Hashtag
export const getPostsByHashtag = createAsyncThunk(
  'post/getPostsByHashtag',
  async ({ hashtag, page = 1, limit = 20 }, { rejectWithValue }) => {
    try {
      const response = await api.get(POST_API.GET_BY_HASHTAG(hashtag), {
        params: { page, limit },
      });
      return { ...response.data, hashtag, isLoadMore: page > 1 };
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Lấy bài viết theo hashtag thất bại'
      );
    }
  }
);

// Get Trending Hashtags
export const getTrendingHashtags = createAsyncThunk(
  'post/getTrendingHashtags',
  async (limit = 10, { rejectWithValue }) => {
    try {
      const response = await api.get(POST_API.GET_TRENDING_HASHTAGS, {
        params: { limit },
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Lấy hashtag xu hướng thất bại'
      );
    }
  }
);

// Create Post
export const createPost = createAsyncThunk(
  'post/createPost',
  async (postData, { rejectWithValue }) => {
    try {
      const response = await api.post(POST_API.CREATE, postData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Tạo bài viết thất bại'
      );
    }
  }
);

// Get Post by ID
export const getPostById = createAsyncThunk(
  'post/getPostById',
  async (postId, { rejectWithValue }) => {
    try {
      const response = await api.get(POST_API.GET_BY_ID(postId));
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Lấy chi tiết bài viết thất bại'
      );
    }
  }
);

// Get Posts by User
export const getPostsByUser = createAsyncThunk(
  'post/getPostsByUser',
  async ({ userId, page = 1, limit = 20 }, { rejectWithValue }) => {
    try {
      const response = await api.get(POST_API.GET_BY_USER(userId), {
        params: { page, limit },
      });
      return { ...response.data, userId, isLoadMore: page > 1 };
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Lấy bài viết của người dùng thất bại'
      );
    }
  }
);

// Update Post
export const updatePost = createAsyncThunk(
  'post/updatePost',
  async ({ postId, data }, { rejectWithValue }) => {
    try {
      const response = await api.put(POST_API.UPDATE(postId), data, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Cập nhật bài viết thất bại'
      );
    }
  }
);

// Delete Post
export const deletePost = createAsyncThunk(
  'post/deletePost',
  async (postId, { rejectWithValue }) => {
    try {
      await api.delete(POST_API.DELETE(postId));
      return { postId };
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Xóa bài viết thất bại'
      );
    }
  }
);

// Share Post
export const sharePost = createAsyncThunk(
  'post/sharePost',
  async ({ postId, content }, { rejectWithValue }) => {
    try {
      const response = await api.post(POST_API.SHARE(postId), {
        content,
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Chia sẻ bài viết thất bại'
      );
    }
  }
);

// Report Post
export const reportPost = createAsyncThunk(
  'post/reportPost',
  async ({ postId, reason, description }, { rejectWithValue }) => {
    try {
      const response = await api.post(POST_API.REPORT(postId), {
        reason,
        description,
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Báo cáo bài viết thất bại'
      );
    }
  }
);
