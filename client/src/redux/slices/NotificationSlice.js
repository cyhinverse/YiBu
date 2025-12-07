import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  notifications: [],
  unreadCount: 0,
  loading: false,
  error: null,
};

const notificationSlice = createSlice({
  name: "notification",
  initialState,
  reducers: {
    setNotifications: (state, action) => {
      state.notifications = action.payload;
      state.unreadCount = action.payload.filter(
        (notif) => !notif.isRead
      ).length;
    },
    addNotification: (state, action) => {
      console.log("Adding notification to state:", action.payload);

      if (!action.payload || !action.payload._id) {
        console.error("Invalid notification data:", action.payload);
        return;
      }

      const exists = state.notifications.some(
        (n) => n._id === action.payload._id
      );
      if (exists) {
        console.log(
          "Notification already exists, skipping:",
          action.payload._id
        );
        return;
      }

      state.notifications.unshift(action.payload);

      if (!action.payload.isRead) {
        state.unreadCount += 1;
      }

      console.log("Current notification state:", {
        count: state.notifications.length,
        unread: state.unreadCount,
      });
    },
    markAsRead: (state, action) => {
      const notifId = action.payload;
      const notification = state.notifications.find((n) => n._id === notifId);
      if (notification && !notification.isRead) {
        notification.isRead = true;
        state.unreadCount = Math.max(0, state.unreadCount - 1);
      }
    },
    markAllAsRead: (state) => {
      state.notifications.forEach((notif) => {
        notif.isRead = true;
      });
      state.unreadCount = 0;
    },
    setLoading: (state, action) => {
      state.loading = action.payload;
    },
    setError: (state, action) => {
      state.error = action.payload;
    },
  },
});

export const {
  setNotifications,
  addNotification,
  markAsRead,
  markAllAsRead,
  setLoading,
  setError,
} = notificationSlice.actions;

export default notificationSlice.reducer;
