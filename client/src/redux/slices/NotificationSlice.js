import { createSlice } from '@reduxjs/toolkit';
import {
  getNotifications,
  getUnreadCount,
  getUnreadCountByType,
  getNotificationById,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  deleteAllNotifications,
  getPreferences,
  updatePreferences,
} from '../actions/notificationActions';

const initialState = {
  notifications: [],
  unreadCount: 0,
  unreadByType: {},
  preferences: null,
  pagination: {
    page: 1,
    limit: 20,
    hasMore: true,
  },
  loading: false,
  error: null,
};

const notificationSlice = createSlice({
  name: 'notification',
  initialState,
  reducers: {
    clearError: state => {
      state.error = null;
    },
    addNotification: (state, action) => {
      state.notifications.unshift(action.payload);
      state.unreadCount += 1;
      if (action.payload.type) {
        state.unreadByType[action.payload.type] =
          (state.unreadByType[action.payload.type] || 0) + 1;
      }
    },
    clearNotifications: state => {
      state.notifications = [];
      state.pagination = { ...initialState.pagination };
    },
    resetNotificationState: () => initialState,
  },
  extraReducers: builder => {
    builder
      // Get Notifications
      .addCase(getNotifications.pending, state => {
        state.loading = true;
      })
      .addCase(getNotifications.fulfilled, (state, action) => {
        state.loading = false;
        const { notifications, pagination, isLoadMore } = action.payload;
        if (isLoadMore) {
          state.notifications = [...state.notifications, ...notifications];
        } else {
          state.notifications = notifications;
        }
        state.pagination = pagination;
      })
      .addCase(getNotifications.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Get Unread Count
      .addCase(getUnreadCount.fulfilled, (state, action) => {
        // Action payload is already a number from the action
        state.unreadCount = action.payload ?? 0;
        console.log('Notification unreadCount set to:', state.unreadCount);
      })
      // Get Unread Count by Type
      .addCase(getUnreadCountByType.fulfilled, (state, action) => {
        state.unreadByType = action.payload;
      })
      // Get Notification by ID
      .addCase(getNotificationById.fulfilled, (state, action) => {
        const notifId = action.payload._id || action.payload.id;
        const index = state.notifications.findIndex(
          n => (n._id || n.id) === notifId
        );
        if (index !== -1) {
          state.notifications[index] = action.payload;
        }
      })
      // Mark as Read
      .addCase(markAsRead.fulfilled, (state, action) => {
        const notification = state.notifications.find(
          n => (n._id || n.id) === action.payload.notificationId
        );
        if (notification && !notification.isRead) {
          notification.isRead = true;
          state.unreadCount = Math.max(state.unreadCount - 1, 0);
          if (notification.type && state.unreadByType[notification.type]) {
            state.unreadByType[notification.type] -= 1;
          }
        }
      })
      // Mark All as Read
      .addCase(markAllAsRead.fulfilled, state => {
        state.notifications.forEach(n => {
          n.isRead = true;
        });
        state.unreadCount = 0;
        state.unreadByType = {};
      })
      // Delete Notification
      .addCase(deleteNotification.fulfilled, (state, action) => {
        const notification = state.notifications.find(
          n => (n._id || n.id) === action.payload.notificationId
        );
        if (notification && !notification.isRead) {
          state.unreadCount = Math.max(state.unreadCount - 1, 0);
        }
        state.notifications = state.notifications.filter(
          n => (n._id || n.id) !== action.payload.notificationId
        );
      })
      // Delete All Notifications
      .addCase(deleteAllNotifications.fulfilled, state => {
        state.notifications = [];
        state.unreadCount = 0;
        state.unreadByType = {};
      })
      // Get Preferences
      .addCase(getPreferences.fulfilled, (state, action) => {
        state.preferences = action.payload;
      })
      // Update Preferences
      .addCase(updatePreferences.fulfilled, (state, action) => {
        state.preferences = action.payload;
      });
  },
});

export const {
  clearError,
  addNotification,
  clearNotifications,
  resetNotificationState,
} = notificationSlice.actions;
export default notificationSlice.reducer;
