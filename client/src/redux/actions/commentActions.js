import { createAsyncThunk } from "@reduxjs/toolkit";
import api from "../../axios/axiosConfig";
import { COMMENT_API_ENDPOINTS } from "../../axios/apiEndpoint";

export const createComment = createAsyncThunk(
  "comment/createComment",
  async (data, { rejectWithValue }) => {
    try {
      const response = await api.post(COMMENT_API_ENDPOINTS.CREATE_COMMENT, data);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

export const getCommentsByPost = createAsyncThunk(
  "comment/getCommentsByPost",
  async (postId, { rejectWithValue }) => {
    try {
      const response = await api.get(`${COMMENT_API_ENDPOINTS.GET_COMMENTS_BY_POST}/${postId}`);
      return { postId, comments: response.data };
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

export const updateComment = createAsyncThunk(
  "comment/updateComment",
  async ({ commentId, data }, { rejectWithValue }) => {
    try {
      const response = await api.put(`${COMMENT_API_ENDPOINTS.UPDATE_COMMENT}/${commentId}`, data);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

export const deleteComment = createAsyncThunk(
  "comment/deleteComment",
  async (commentId, { rejectWithValue }) => {
    try {
      await api.delete(`${COMMENT_API_ENDPOINTS.DELETE_COMMENT}/${commentId}`);
      return commentId;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);
