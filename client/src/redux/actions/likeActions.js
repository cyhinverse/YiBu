import { createAsyncThunk } from "@reduxjs/toolkit";
import api from "../../axios/axiosConfig";
import { LIKE_API_ENDPOINTS } from "../../axios/apiEndpoint";

export const createLike = createAsyncThunk(
  "like/createLike",
  async (data, { rejectWithValue }) => {
    try {
      const response = await api.post(LIKE_API_ENDPOINTS.CREATE_LIKE, data);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

export const deleteLike = createAsyncThunk(
  "like/deleteLike",
  async (data, { rejectWithValue }) => {
    try {
      // Like service used post for delete in some cases or delete method?
      // Looking at apiEndpoint: DELETE_LIKE: "/api/like/delete"
      // Usually POST if body needed, or DELETE if query params. Service likely used POST or DELETE with data.
      // Assuming standard implementation:
      const response = await api.post(LIKE_API_ENDPOINTS.DELETE_LIKE, data);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

export const getLikeStatus = createAsyncThunk(
  "like/getLikeStatus",
  async (postId, { rejectWithValue }) => {
    try {
      const response = await api.get(`${LIKE_API_ENDPOINTS.GET_LIKE_STATUS}/${postId}`);
      return { postId, data: response.data };
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

export const getAllLikes = createAsyncThunk(
  "like/getAllLikes",
  async (postIds, { rejectWithValue }) => {
    try {
      // Assuming postIds is array, pass as body to POST or query?
      // Service GET_ALL_LIKES: likely POST with list of IDs
      const response = await api.post(LIKE_API_ENDPOINTS.GET_ALL_LIKES, { postIds });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

export const toggleLike = createAsyncThunk(
  "like/toggleLike",
  async (postId, { rejectWithValue }) => {
    try {
      const response = await api.post(`${LIKE_API_ENDPOINTS.TOGGLE_LIKE}/${postId}`);
      return { postId, data: response.data };
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

export const getLikedPosts = createAsyncThunk(
  "like/getLikedPosts",
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get(LIKE_API_ENDPOINTS.GET_LIKED_POSTS);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);
