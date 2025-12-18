import { createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../axios/axiosConfig';
import { SAVE_POST_API } from '../../axios/apiEndpoint';

// Helper to extract data from response
// Server returns { code, message, data } format, we need to extract the actual data
const extractData = response => {
  const responseData = response.data;
  return responseData?.data !== undefined ? responseData.data : responseData;
};

// Get Saved Posts
export const getSavedPosts = createAsyncThunk(
  'savePost/getSavedPosts',
  async ({ page = 1, limit = 20 } = {}, { rejectWithValue }) => {
    try {
      const response = await api.get(SAVE_POST_API.GET_ALL, {
        params: { page, limit },
      });
      const data = extractData(response);
      return { ...data, isLoadMore: page > 1 };
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Lấy bài viết đã lưu thất bại'
      );
    }
  }
);

// Get Collections
export const getCollections = createAsyncThunk(
  'savePost/getCollections',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get(SAVE_POST_API.GET_COLLECTIONS);
      return extractData(response);
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Lấy bộ sưu tập thất bại'
      );
    }
  }
);

// Check Save Status
export const checkSaveStatus = createAsyncThunk(
  'savePost/checkSaveStatus',
  async (postId, { rejectWithValue }) => {
    try {
      const response = await api.get(SAVE_POST_API.CHECK_STATUS(postId));
      const data = extractData(response);
      return { postId, ...data };
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Kiểm tra trạng thái lưu thất bại'
      );
    }
  }
);

// Save Post
export const savePost = createAsyncThunk(
  'savePost/savePost',
  async ({ postId, collectionId }, { rejectWithValue }) => {
    try {
      const response = await api.post(SAVE_POST_API.SAVE(postId), {
        collectionId,
      });
      const data = extractData(response);
      return { postId, collectionId, ...data };
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Lưu bài viết thất bại'
      );
    }
  }
);

// Unsave Post
export const unsavePost = createAsyncThunk(
  'savePost/unsavePost',
  async (postId, { rejectWithValue }) => {
    try {
      await api.delete(SAVE_POST_API.UNSAVE(postId));
      return { postId };
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Bỏ lưu bài viết thất bại'
      );
    }
  }
);
