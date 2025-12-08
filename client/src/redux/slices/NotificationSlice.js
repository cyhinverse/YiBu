import { createSlice } from "@reduxjs/toolkit";
import {
  getNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  getUnreadCount,
} from "../actions/notificationActions";

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
    addNotification: (state, action) => {
      const exists = state.notifications.some(
        (n) => n._id === action.payload._id
      );
      if (exists) return;

      state.notifications.unshift(action.payload);
      if (!action.payload.isRead) {
        state.unreadCount += 1;
      }
    },
    // Keep local optimistic updates if desired, or rely on thunks
  },
  extraReducers: (builder) => {
    // getNotifications
    builder
        .addCase(getNotifications.pending, (state) => {
            state.loading = true;
            state.error = null;
        })
        .addCase(getNotifications.fulfilled, (state, action) => {
            state.loading = false;
            // Assuming payload contains notifications array directly or data object
            // Adjust based on actual API response structure (checked service, returns response.data)
            // If response.data is array:
            if (Array.isArray(action.payload)) {
                 state.notifications = action.payload;
                 state.unreadCount = action.payload.filter(n => !n.isRead).length;
            } else if (action.payload.notifications) {
                // If paginated response
                state.notifications = action.payload.notifications;
                // update unread count if provided
            }
        })
        .addCase(getNotifications.rejected, (state, action) => {
            state.loading = false;
            state.error = action.payload;
        });

    // markAsRead
    builder.addCase(markAsRead.fulfilled, (state, action) => {
        const notifId = action.payload;
        const notification = state.notifications.find((n) => n._id === notifId);
        if (notification && !notification.isRead) {
            notification.isRead = true;
            state.unreadCount = Math.max(0, state.unreadCount - 1);
        }
    });

    // markAllAsRead
    builder.addCase(markAllAsRead.fulfilled, (state) => {
        state.notifications.forEach(n => n.isRead = true);
        state.unreadCount = 0;
    });

    // deleteNotification
    builder.addCase(deleteNotification.fulfilled, (state, action) => {
        const notifId = action.payload;
        const notification = state.notifications.find((n) => n._id === notifId);
        if (notification && !notification.isRead) {
             state.unreadCount = Math.max(0, state.unreadCount - 1);
        }
        state.notifications = state.notifications.filter(n => n._id !== notifId);
    });

    // getUnreadCount
    builder.addCase(getUnreadCount.fulfilled, (state, action) => {
         // Assuming payload acts as count or { count: 5 }
         // If payload is number
         if (typeof action.payload === 'number') {
             state.unreadCount = action.payload;
         } else if (action.payload.count !== undefined) {
             state.unreadCount = action.payload.count;
         }
    });
  },
});

export const { addNotification } = notificationSlice.actions;
export default notificationSlice.reducer;
