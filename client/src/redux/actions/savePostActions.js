import { createAsyncThunk } from "@reduxjs/toolkit";
import api from "../../axios/axiosConfig";
import { SAVE_POST_API_ENDPOINTS } from "../../axios/apiEndpoint";

export const savePost = createAsyncThunk(
  "savePost/save",
  async (postId, { rejectWithValue }) => {
    try {
      const response = await api.post(`${SAVE_POST_API_ENDPOINTS.BASE}/${postId}`);
      return { postId, data: response.data };
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

export const unsavePost = createAsyncThunk(
  "savePost/unsave",
  async (postId, { rejectWithValue }) => {
    try {
      const response = await api.delete(`${SAVE_POST_API_ENDPOINTS.BASE}/${postId}`);
      return { postId, data: response.data };
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

export const getSavedPosts = createAsyncThunk(
  "savePost/getSavedPosts",
  async ({ page, limit }, { rejectWithValue }) => {
    try {
      const response = await api.get(`${SAVE_POST_API_ENDPOINTS.BASE}?page=${page}&limit=${limit}`);
      
      // Restructure logic from service to unwrap "post" object
      if (response.data && response.data.savedPosts) {
        response.data.savedPosts = response.data.savedPosts
          .filter((item) => item && item.post)
          .map((item) => {
            return {
              ...item.post,
              savedId: item._id,
            };
          });
      }
      // If savedPosts missing, handle it? Service did. 
      if (response.data && !response.data.savedPosts) {
          response.data.savedPosts = [];
      }

      return response.data;
    } catch (error) {
      // Logic for retry was in service, simpler now as per user request
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

export const checkSavedStatus = createAsyncThunk(
  "savePost/checkStatus",
  async (postId, { rejectWithValue }) => {
    try {
      const response = await api.get(`${SAVE_POST_API_ENDPOINTS.CHECK}/${postId}`);
      return { postId, data: response.data };
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);
