import { createAsyncThunk } from "@reduxjs/toolkit";
import api from "../../axios/axiosConfig";
import { USER_API_ENDPOINTS, SETTINGS_API_ENDPOINTS, PROFILE_API_ENDPOINTS } from "../../axios/apiEndpoint";

export const getAllUsers = createAsyncThunk(
  "user/getAllUsers",
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get(USER_API_ENDPOINTS.GET_ALL_USER);
      // Assuming response.data.data based on userService logic before
      return response.data.data || [];
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

export const getUserById = createAsyncThunk(
  "user/getUserById",
  async (id, { rejectWithValue }) => {
    try {
      const response = await api.get(`${USER_API_ENDPOINTS.GET_USER_BY_ID}/${id}`);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

export const getProfileById = createAsyncThunk(
  "user/getProfileById",
  async (id, { rejectWithValue }) => {
    try {
      const response = await api.get(`${PROFILE_API_ENDPOINTS.GET_PROFILE_BY_ID.replace(':id', id)}`);
      return response.data;
    } catch (error) {
       return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

export const searchUsers = createAsyncThunk(
  "user/searchUsers",
  async (query, { rejectWithValue }) => {
    try {
      const response = await api.get(`${USER_API_ENDPOINTS.SEARCH_USERS}?query=${encodeURIComponent(query)}`);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

export const getTopUsersByLikes = createAsyncThunk(
  "user/getTopUsersByLikes",
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get(USER_API_ENDPOINTS.GET_TOP_USERS_BY_LIKES);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

// This seems to be update user profile settings (avatar etc)
export const updateProfileSettings = createAsyncThunk(
  "user/updateProfileSettings",
  async (formData, { rejectWithValue }) => {
    try {
      // formData contains files, header Content-Type handled by axios if FormData passed?
      // Yes, axios automatic with FormData
      const response = await api.put(SETTINGS_API_ENDPOINTS.UPDATE_PROFILE, formData);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

export const updateUser = createAsyncThunk(
  "user/updateUser",
  async (data, { rejectWithValue }) => {
    try {
      // If this is simple update not profile settings
      const response = await api.put(USER_API_ENDPOINTS.UPDATE_USER, data);
      return { userId: data.id, updatedData: response.data };
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

export const deleteUser = createAsyncThunk(
  "user/deleteUser",
  async (userId, { rejectWithValue }) => {
    try {
      // userService used delete with data body? api.delete(url, { data: { id: userId } })
      await api.delete(USER_API_ENDPOINTS.DELETE_USER, { data: { id: userId } });
      return userId;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

export const followUser = createAsyncThunk(
  "user/followUser",
  async (targetUserId, { rejectWithValue }) => {
    try {
      const response = await api.post(USER_API_ENDPOINTS.FOLLOW_USER, { targetUserId });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

export const unfollowUser = createAsyncThunk(
  "user/unfollowUser",
  async (targetUserId, { rejectWithValue }) => {
    try {
      const response = await api.post(USER_API_ENDPOINTS.UNFOLLOW_USER, { targetUserId });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

export const checkFollowStatus = createAsyncThunk(
  "user/checkFollowStatus",
  async (targetUserId, { rejectWithValue }) => {
    try {
      const response = await api.get(`${USER_API_ENDPOINTS.CHECK_FOLLOW_STATUS}/${targetUserId}`);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

export const getFollowersByUserId = createAsyncThunk(
  "user/getFollowersByUserId",
  async (userId, { rejectWithValue }) => {
    try {
      // userService used post for this? api.post(url, { id: userId })
      const response = await api.post(USER_API_ENDPOINTS.GET_FOLLOWER_BY_USERID, { id: userId });
      return { userId, followers: response.data };
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

// Settings Actions
export const getUserSettings = createAsyncThunk(
  "user/getSettings",
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get(SETTINGS_API_ENDPOINTS.GET_ALL_SETTINGS);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

export const updatePrivacySettings = createAsyncThunk(
  "user/updatePrivacy",
  async (data, { rejectWithValue }) => {
    try {
      const response = await api.put(SETTINGS_API_ENDPOINTS.UPDATE_PRIVACY, data);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

export const updateNotificationSettings = createAsyncThunk(
  "user/updateNotificationSettings",
  async (data, { rejectWithValue }) => {
    try {
      const response = await api.put(SETTINGS_API_ENDPOINTS.UPDATE_NOTIFICATION, data);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

export const updateSecuritySettings = createAsyncThunk(
  "user/updateSecurity",
  async (data, { rejectWithValue }) => {
    try {
      const response = await api.put(SETTINGS_API_ENDPOINTS.UPDATE_SECURITY, data);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

export const updateContentSettings = createAsyncThunk(
  "user/updateContent",
  async (data, { rejectWithValue }) => {
    try {
      const response = await api.put(SETTINGS_API_ENDPOINTS.UPDATE_CONTENT, data);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

export const updateThemeSettings = createAsyncThunk(
  "user/updateTheme",
  async (data, { rejectWithValue }) => {
    try {
      const response = await api.put(SETTINGS_API_ENDPOINTS.UPDATE_THEME, data);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

// Trusted Devices
export const addTrustedDevice = createAsyncThunk(
  "user/addTrustedDevice",
  async (data, { rejectWithValue }) => {
    try {
      const response = await api.post(SETTINGS_API_ENDPOINTS.ADD_TRUSTED_DEVICE, data);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

export const removeTrustedDevice = createAsyncThunk(
  "user/removeTrustedDevice",
  async (deviceId, { rejectWithValue }) => {
    try {
      const response = await api.delete(`${SETTINGS_API_ENDPOINTS.REMOVE_TRUSTED_DEVICE}/${deviceId}`);
      if(response.status === 200){
        return deviceId;
      }
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

// Block Management
export const getBlockList = createAsyncThunk(
  "user/getBlockList",
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get(SETTINGS_API_ENDPOINTS.GET_BLOCK_LIST);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

export const blockUser = createAsyncThunk(
  "user/blockUser",
  async (data, { rejectWithValue }) => {
    try {
      const response = await api.post(SETTINGS_API_ENDPOINTS.BLOCK_USER, data);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

export const unblockUser = createAsyncThunk(
  "user/unblockUser",
  async (blockedUserId, { rejectWithValue }) => {
    try {
      const response = await api.delete(`${SETTINGS_API_ENDPOINTS.UNBLOCK_USER}/${blockedUserId}`);
      if(response.status === 200){
        return blockedUserId;
      }
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);