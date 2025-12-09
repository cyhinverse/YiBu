import { createAsyncThunk } from "@reduxjs/toolkit";
import api from "../../axios/axiosConfig";
import { COMMENT_API } from "../../axios/apiEndpoint";

// Create Comment
export const createComment = createAsyncThunk(
  "comment/createComment",
  async ({ postId, content, parentId = null }, { rejectWithValue }) => {
    try {
      const response = await api.post(COMMENT_API.CREATE, {
        postId,
        content,
        parentId,
      });
      return { ...response.data, postId };
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Tạo bình luận thất bại"
      );
    }
  }
);

// Get Comments by Post
export const getCommentsByPost = createAsyncThunk(
  "comment/getCommentsByPost",
  async (
    { postId, page = 1, limit = 20, sort = "newest" },
    { rejectWithValue }
  ) => {
    try {
      const response = await api.get(COMMENT_API.GET_BY_POST(postId), {
        params: { page, limit, sort },
      });
      return { ...response.data, postId, isLoadMore: page > 1 };
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Lấy bình luận thất bại"
      );
    }
  }
);

// Get Comment Replies
export const getCommentReplies = createAsyncThunk(
  "comment/getCommentReplies",
  async ({ commentId, page = 1, limit = 10 }, { rejectWithValue }) => {
    try {
      const response = await api.get(COMMENT_API.GET_REPLIES(commentId), {
        params: { page, limit },
      });
      return { ...response.data, commentId, isLoadMore: page > 1 };
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Lấy phản hồi bình luận thất bại"
      );
    }
  }
);

// Update Comment
export const updateComment = createAsyncThunk(
  "comment/updateComment",
  async ({ commentId, content }, { rejectWithValue }) => {
    try {
      const response = await api.put(COMMENT_API.UPDATE(commentId), {
        content,
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Cập nhật bình luận thất bại"
      );
    }
  }
);

// Delete Comment
export const deleteComment = createAsyncThunk(
  "comment/deleteComment",
  async ({ commentId, postId }, { rejectWithValue }) => {
    try {
      await api.delete(COMMENT_API.DELETE(commentId));
      return { commentId, postId };
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Xóa bình luận thất bại"
      );
    }
  }
);

// Like Comment
export const likeComment = createAsyncThunk(
  "comment/likeComment",
  async (commentId, { rejectWithValue }) => {
    try {
      const response = await api.post(COMMENT_API.LIKE(commentId));
      return { commentId, ...response.data };
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Thích bình luận thất bại"
      );
    }
  }
);

// Unlike Comment
export const unlikeComment = createAsyncThunk(
  "comment/unlikeComment",
  async (commentId, { rejectWithValue }) => {
    try {
      await api.delete(COMMENT_API.UNLIKE(commentId));
      return { commentId };
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Bỏ thích bình luận thất bại"
      );
    }
  }
);
