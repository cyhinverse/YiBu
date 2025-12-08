import { createAsyncThunk } from "@reduxjs/toolkit";
import api from "../../axios/axiosConfig";
import { POST_API_ENDPOINTS } from "../../axios/apiEndpoint";

export const getAllPost = createAsyncThunk(
  "post/getAllPost",
  async ({ page, limit }, { rejectWithValue }) => {
    try {
      const response = await api.get(`${POST_API_ENDPOINTS.GET_ALL_USER}?page=${page}&limit=${limit}`);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

export const createPost = createAsyncThunk(
  "post/createPost",
  async (postData, { rejectWithValue }) => {
    try {
      const response = await api.post(POST_API_ENDPOINTS.CREATE_POST, postData, {
          headers: { "Content-Type": "multipart/form-data" },
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

export const getPostUserById = createAsyncThunk(
  "post/getPostUserById",
  async (userId, { rejectWithValue }) => {
    try {
      const response = await api.get(`${POST_API_ENDPOINTS.GET_POST_USER_BY_ID}/${userId}`);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

export const deletePost = createAsyncThunk(
  "post/deletePost",
  async (postId, { rejectWithValue }) => {
    try {
      await api.delete(`${POST_API_ENDPOINTS.DELETE_POST}/${postId}`);
      return postId;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

export const reportPost = createAsyncThunk(
  "post/reportPost",
  async ({ postId, reason }, { rejectWithValue }) => {
    try {
      const response = await api.post(`${POST_API_ENDPOINTS.REPORT_POST}/${postId}`, { reason });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);
