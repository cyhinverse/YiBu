import { createAsyncThunk } from "@reduxjs/toolkit";
import api from "../../axios/axiosConfig";
import { LIKE_API } from "../../axios/apiEndpoint";

// Create Like
export const createLike = createAsyncThunk(
  "like/createLike",
  async (postId, { rejectWithValue }) => {
    try {
      const response = await api.post(LIKE_API.CREATE, { postId });
      return { postId, ...response.data };
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Thích bài viết thất bại"
      );
    }
  }
);

// Delete Like
export const deleteLike = createAsyncThunk(
  "like/deleteLike",
  async (postId, { rejectWithValue }) => {
    try {
      await api.delete(LIKE_API.DELETE, { data: { postId } });
      return { postId };
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Bỏ thích bài viết thất bại"
      );
    }
  }
);

// Toggle Like
export const toggleLike = createAsyncThunk(
  "like/toggleLike",
  async (postId, { rejectWithValue }) => {
    try {
      const response = await api.post(LIKE_API.TOGGLE, { postId });
      return { postId, ...response.data };
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Thay đổi trạng thái thích thất bại"
      );
    }
  }
);

// Get Like Status
export const getLikeStatus = createAsyncThunk(
  "like/getLikeStatus",
  async (postId, { rejectWithValue }) => {
    try {
      const response = await api.get(LIKE_API.GET_STATUS(postId));
      return { postId, ...response.data };
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Lấy trạng thái thích thất bại"
      );
    }
  }
);

// Get Batch Like Status
export const getBatchLikeStatus = createAsyncThunk(
  "like/getBatchLikeStatus",
  async (postIds, { rejectWithValue }) => {
    try {
      const response = await api.post(LIKE_API.GET_BATCH_STATUS, { postIds });
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message ||
          "Lấy trạng thái thích hàng loạt thất bại"
      );
    }
  }
);

// Get Post Likes
export const getPostLikes = createAsyncThunk(
  "like/getPostLikes",
  async ({ postId, page = 1, limit = 20 }, { rejectWithValue }) => {
    try {
      const response = await api.get(LIKE_API.GET_POST_LIKES(postId), {
        params: { page, limit },
      });
      return { ...response.data, postId, isLoadMore: page > 1 };
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Lấy danh sách người thích thất bại"
      );
    }
  }
);

// Get My Liked Posts
export const getMyLikedPosts = createAsyncThunk(
  "like/getMyLikedPosts",
  async ({ page = 1, limit = 20 }, { rejectWithValue }) => {
    try {
      const response = await api.get(LIKE_API.GET_MY_LIKES, {
        params: { page, limit },
      });
      return { ...response.data, isLoadMore: page > 1 };
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Lấy bài viết đã thích thất bại"
      );
    }
  }
);
