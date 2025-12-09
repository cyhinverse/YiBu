import { createSlice } from "@reduxjs/toolkit";
import {
  // Dashboard
  getDashboardStats,
  getUserGrowth,
  getPostStats,
  getTopUsers,
  // Users
  getAllUsers,
  getUserById,
  updateUser,
  deleteUser,
  banUser,
  unbanUser,
  getBannedUsers,
  suspendUser,
  warnUser,
  // Posts
  getAllPosts,
  moderatePost,
  approvePost,
  deletePost,
  moderateComment,
  deleteComment,
  // Reports
  getAllReports,
  getPendingReports,
  getUserReports,
  reviewReport,
  startReportReview,
  resolveReport,
  // System
  healthCheck,
  broadcastNotification,
  getSystemHealth,
  getAdminLogs,
} from "../actions/adminActions";

const initialState = {
  // Dashboard
  stats: null,
  userGrowth: null,
  postStats: null,
  topUsers: [],
  // Users
  users: [],
  bannedUsers: [],
  currentUser: null,
  // Posts
  posts: [],
  // Reports
  reports: [],
  pendingReports: [],
  userReports: [],
  currentReport: null,
  // System
  systemHealth: null,
  adminLogs: [],
  // Pagination
  pagination: {
    page: 1,
    limit: 20,
    total: 0,
    hasMore: true,
  },
  // UI State
  loading: false,
  error: null,
};

const adminSlice = createSlice({
  name: "admin",
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    clearCurrentUser: (state) => {
      state.currentUser = null;
    },
    clearCurrentReport: (state) => {
      state.currentReport = null;
    },
    resetAdminState: () => initialState,
  },
  extraReducers: (builder) => {
    builder
      // ========== Dashboard ==========
      // Get Dashboard Stats
      .addCase(getDashboardStats.pending, (state) => {
        state.loading = true;
      })
      .addCase(getDashboardStats.fulfilled, (state, action) => {
        state.loading = false;
        state.stats = action.payload;
      })
      .addCase(getDashboardStats.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Get User Growth
      .addCase(getUserGrowth.fulfilled, (state, action) => {
        state.userGrowth = action.payload;
      })
      // Get Post Stats
      .addCase(getPostStats.fulfilled, (state, action) => {
        state.postStats = action.payload;
      })
      // Get Top Users
      .addCase(getTopUsers.fulfilled, (state, action) => {
        state.topUsers = action.payload;
      })
      // ========== Users ==========
      // Get All Users
      .addCase(getAllUsers.pending, (state) => {
        state.loading = true;
      })
      .addCase(getAllUsers.fulfilled, (state, action) => {
        state.loading = false;
        const { users, pagination, isLoadMore } = action.payload;
        if (isLoadMore) {
          state.users = [...state.users, ...users];
        } else {
          state.users = users;
        }
        state.pagination = pagination;
      })
      .addCase(getAllUsers.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Get User by ID
      .addCase(getUserById.fulfilled, (state, action) => {
        state.currentUser = action.payload;
      })
      // Update User
      .addCase(updateUser.fulfilled, (state, action) => {
        const index = state.users.findIndex((u) => u.id === action.payload.id);
        if (index !== -1) {
          state.users[index] = action.payload;
        }
        if (state.currentUser?.id === action.payload.id) {
          state.currentUser = action.payload;
        }
      })
      // Delete User
      .addCase(deleteUser.fulfilled, (state, action) => {
        state.users = state.users.filter((u) => u.id !== action.payload.userId);
      })
      // Ban User
      .addCase(banUser.fulfilled, (state, action) => {
        const user = state.users.find((u) => u.id === action.payload.userId);
        if (user) {
          user.isBanned = true;
          user.bannedAt = action.payload.bannedAt;
          user.banReason = action.payload.reason;
          state.bannedUsers.push(user);
        }
      })
      // Unban User
      .addCase(unbanUser.fulfilled, (state, action) => {
        const user = state.users.find((u) => u.id === action.payload.userId);
        if (user) {
          user.isBanned = false;
          user.bannedAt = null;
          user.banReason = null;
        }
        state.bannedUsers = state.bannedUsers.filter(
          (u) => u.id !== action.payload.userId
        );
      })
      // Get Banned Users
      .addCase(getBannedUsers.fulfilled, (state, action) => {
        state.bannedUsers = action.payload;
      })
      // Suspend User
      .addCase(suspendUser.fulfilled, (state, action) => {
        const user = state.users.find((u) => u.id === action.payload.userId);
        if (user) {
          user.isSuspended = true;
        }
      })
      // Warn User
      .addCase(warnUser.fulfilled, (state, action) => {
        const user = state.users.find((u) => u.id === action.payload.userId);
        if (user) {
          user.warningCount = (user.warningCount || 0) + 1;
        }
      })
      // ========== Posts ==========
      // Get All Posts
      .addCase(getAllPosts.pending, (state) => {
        state.loading = true;
      })
      .addCase(getAllPosts.fulfilled, (state, action) => {
        state.loading = false;
        const { posts, pagination, isLoadMore } = action.payload;
        if (isLoadMore) {
          state.posts = [...state.posts, ...posts];
        } else {
          state.posts = posts;
        }
        state.pagination = pagination;
      })
      .addCase(getAllPosts.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Moderate Post
      .addCase(moderatePost.fulfilled, (state, action) => {
        const index = state.posts.findIndex(
          (p) => p.id === action.payload.postId
        );
        if (index !== -1) {
          state.posts[index] = { ...state.posts[index], ...action.payload };
        }
      })
      // Approve Post
      .addCase(approvePost.fulfilled, (state, action) => {
        const post = state.posts.find((p) => p.id === action.payload.postId);
        if (post) {
          post.isApproved = true;
        }
      })
      // Delete Post
      .addCase(deletePost.fulfilled, (state, action) => {
        state.posts = state.posts.filter((p) => p.id !== action.payload.postId);
      })
      // Moderate Comment
      .addCase(moderateComment.fulfilled, (state, action) => {
        // Handle comment moderation if needed
      })
      // Delete Comment
      .addCase(deleteComment.fulfilled, (state, action) => {
        // Handle comment deletion if needed
      })
      // ========== Reports ==========
      // Get All Reports
      .addCase(getAllReports.pending, (state) => {
        state.loading = true;
      })
      .addCase(getAllReports.fulfilled, (state, action) => {
        state.loading = false;
        const { reports, pagination, isLoadMore } = action.payload;
        if (isLoadMore) {
          state.reports = [...state.reports, ...reports];
        } else {
          state.reports = reports;
        }
        state.pagination = pagination;
      })
      .addCase(getAllReports.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Get Pending Reports
      .addCase(getPendingReports.fulfilled, (state, action) => {
        state.pendingReports = action.payload;
      })
      // Get User Reports
      .addCase(getUserReports.fulfilled, (state, action) => {
        state.userReports = action.payload;
      })
      // Review Report
      .addCase(reviewReport.fulfilled, (state, action) => {
        const index = state.reports.findIndex(
          (r) => r.id === action.payload.id
        );
        if (index !== -1) {
          state.reports[index] = action.payload;
        }
        if (state.currentReport?.id === action.payload.id) {
          state.currentReport = action.payload;
        }
      })
      // Start Report Review
      .addCase(startReportReview.fulfilled, (state, action) => {
        const index = state.reports.findIndex(
          (r) => r.id === action.payload.reportId
        );
        if (index !== -1) {
          state.reports[index].status = "in_review";
        }
      })
      // Resolve Report
      .addCase(resolveReport.fulfilled, (state, action) => {
        const index = state.reports.findIndex(
          (r) => r.id === action.payload.reportId
        );
        if (index !== -1) {
          state.reports[index].status = "resolved";
        }
        state.pendingReports = state.pendingReports.filter(
          (r) => r.id !== action.payload.reportId
        );
      })
      // Health Check
      .addCase(healthCheck.fulfilled, (state, action) => {
        // Can be used to check system health status
      })
      // Broadcast Notification
      .addCase(broadcastNotification.pending, (state) => {
        state.loading = true;
      })
      .addCase(broadcastNotification.fulfilled, (state) => {
        state.loading = false;
      })
      .addCase(broadcastNotification.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Get System Health
      .addCase(getSystemHealth.fulfilled, (state, action) => {
        state.systemHealth = action.payload;
      })
      // Get Admin Logs
      .addCase(getAdminLogs.pending, (state) => {
        state.loading = true;
      })
      .addCase(getAdminLogs.fulfilled, (state, action) => {
        state.loading = false;
        state.adminLogs = action.payload;
      })
      .addCase(getAdminLogs.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const {
  clearError,
  clearCurrentUser,
  clearCurrentReport,
  resetAdminState,
} = adminSlice.actions;
export default adminSlice.reducer;
