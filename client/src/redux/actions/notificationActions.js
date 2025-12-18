import { createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../axios/axiosConfig';
import { NOTIFICATION_API } from '../../axios/apiEndpoint';

// Get Notifications
export const getNotifications = createAsyncThunk(
  'notification/getNotifications',
  async ({ page = 1, limit = 20, type }, { rejectWithValue }) => {
    try {
      const response = await api.get(NOTIFICATION_API.GET_ALL, {
        params: { page, limit, type },
      });
      const data = response.data.data || response.data;
      return {
        notifications: data.notifications || [],
        pagination: {
          page,
          limit,
          total: data.total || 0,
          hasMore: data.hasMore || false,
        },
        isLoadMore: page > 1,
      };
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Lấy thông báo thất bại'
      );
    }
  }
);

// Get Unread Count
export const getUnreadCount = createAsyncThunk(
  'notification/getUnreadCount',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get(NOTIFICATION_API.GET_UNREAD_COUNT);
      console.log('Notification unread count response:', response.data);
      // Return raw value, let reducer handle extraction
      const count =
        response.data.data?.unreadCount ??
        response.data?.unreadCount ??
        response.data ??
        0;
      return typeof count === 'number' ? count : 0;
    } catch (error) {
      console.error('Failed to get notification unread count:', error);
      return rejectWithValue(
        error.response?.data?.message || 'Lấy số thông báo chưa đọc thất bại'
      );
    }
  }
);

// Get Unread Count by Type
export const getUnreadCountByType = createAsyncThunk(
  'notification/getUnreadCountByType',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get(NOTIFICATION_API.GET_UNREAD_BY_TYPE);
      return response.data.data || response.data || {};
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Lấy số thông báo theo loại thất bại'
      );
    }
  }
);

// Get Notification by ID
export const getNotificationById = createAsyncThunk(
  'notification/getNotificationById',
  async (notificationId, { rejectWithValue }) => {
    try {
      const response = await api.get(
        NOTIFICATION_API.GET_BY_ID(notificationId)
      );
      return response.data.data || response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Lấy chi tiết thông báo thất bại'
      );
    }
  }
);

// Mark as Read
export const markAsRead = createAsyncThunk(
  'notification/markAsRead',
  async (notificationId, { rejectWithValue }) => {
    try {
      await api.put(NOTIFICATION_API.MARK_READ(notificationId));
      return { notificationId };
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Đánh dấu đã đọc thất bại'
      );
    }
  }
);

// Mark All as Read
export const markAllAsRead = createAsyncThunk(
  'notification/markAllAsRead',
  async (_, { rejectWithValue }) => {
    try {
      await api.post(NOTIFICATION_API.MARK_ALL_READ);
      return true;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Đánh dấu tất cả đã đọc thất bại'
      );
    }
  }
);

// Delete Notification
export const deleteNotification = createAsyncThunk(
  'notification/deleteNotification',
  async (notificationId, { rejectWithValue }) => {
    try {
      await api.delete(NOTIFICATION_API.DELETE(notificationId));
      return { notificationId };
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Xóa thông báo thất bại'
      );
    }
  }
);

// Delete All Notifications
export const deleteAllNotifications = createAsyncThunk(
  'notification/deleteAllNotifications',
  async (_, { rejectWithValue }) => {
    try {
      await api.delete(NOTIFICATION_API.DELETE_ALL);
      return true;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Xóa tất cả thông báo thất bại'
      );
    }
  }
);

// Get Preferences
export const getPreferences = createAsyncThunk(
  'notification/getPreferences',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get(NOTIFICATION_API.GET_PREFERENCES);
      return response.data.data || response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Lấy cài đặt thông báo thất bại'
      );
    }
  }
);

// Update Preferences
export const updatePreferences = createAsyncThunk(
  'notification/updatePreferences',
  async (preferences, { rejectWithValue }) => {
    try {
      const response = await api.put(
        NOTIFICATION_API.UPDATE_PREFERENCES,
        preferences
      );
      return response.data.data || response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Cập nhật cài đặt thông báo thất bại'
      );
    }
  }
);
