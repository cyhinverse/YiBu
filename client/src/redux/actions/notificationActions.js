import { createAsyncThunk } from "@reduxjs/toolkit";
import api from "../../axios/axiosConfig";
import { NOTIFICATION_API_ENDPOINTS } from "../../axios/apiEndpoint";

export const getNotifications = createAsyncThunk(
  "notification/getNotifications",
  async ({ page, limit }, { rejectWithValue }) => {
    try {
      const response = await api.get(`${NOTIFICATION_API_ENDPOINTS.BASE}?page=${page}&limit=${limit}`);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

export const markAsRead = createAsyncThunk(
  "notification/markAsRead",
  async (notificationId, { rejectWithValue }) => {
    try {
      const response = await api.put(`${NOTIFICATION_API_ENDPOINTS.BASE}/${notificationId}/read`);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

export const markAllAsRead = createAsyncThunk(
  "notification/markAllAsRead",
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.post(NOTIFICATION_API_ENDPOINTS.READ_ALL);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

export const deleteNotification = createAsyncThunk(
  "notification/deleteNotification",
  async (notificationId, { rejectWithValue }) => {
    try {
      await api.delete(`${NOTIFICATION_API_ENDPOINTS.BASE}/${notificationId}`);
      return notificationId;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

export const getUnreadCount = createAsyncThunk(
  "notification/getUnreadCount",
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get(NOTIFICATION_API_ENDPOINTS.UNREAD_COUNT);
      return response.data; // data usually contains { count: ... }
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);
