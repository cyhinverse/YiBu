import { createAsyncThunk } from "@reduxjs/toolkit";
import api from "../../axios/axiosConfig";
import { ADMIN_API } from "../../axios/apiEndpoint";

// ========== Dashboard ==========

// Get Dashboard Stats
export const getDashboardStats = createAsyncThunk(
  "admin/getDashboardStats",
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get(ADMIN_API.GET_DASHBOARD_STATS);
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Lấy thống kê dashboard thất bại"
      );
    }
  }
);

// Get User Growth
export const getUserGrowth = createAsyncThunk(
  "admin/getUserGrowth",
  async ({ startDate, endDate }, { rejectWithValue }) => {
    try {
      const response = await api.get(ADMIN_API.GET_USER_GROWTH, {
        params: { startDate, endDate },
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Lấy phân tích tăng trưởng thất bại"
      );
    }
  }
);

// Get Post Stats
export const getPostStats = createAsyncThunk(
  "admin/getPostStats",
  async ({ period = "month" }, { rejectWithValue }) => {
    try {
      const response = await api.get(ADMIN_API.GET_POST_STATS, {
        params: { period },
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Lấy thống kê bài viết thất bại"
      );
    }
  }
);

// Get Top Users
export const getTopUsers = createAsyncThunk(
  "admin/getTopUsers",
  async ({ page = 1, limit = 50 }, { rejectWithValue }) => {
    try {
      const response = await api.get(ADMIN_API.GET_TOP_USERS, {
        params: { page, limit },
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Lấy top người dùng thất bại"
      );
    }
  }
);

// ========== Users ==========

// Get All Users
export const getAllUsers = createAsyncThunk(
  "admin/getAllUsers",
  async (
    { page = 1, limit = 20, search, status, role },
    { rejectWithValue }
  ) => {
    try {
      const response = await api.get(ADMIN_API.GET_ALL_USERS, {
        params: { page, limit, search, status, role },
      });
      return { ...response.data, isLoadMore: page > 1 };
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Lấy danh sách người dùng thất bại"
      );
    }
  }
);

// Get Banned Users
export const getBannedUsers = createAsyncThunk(
  "admin/getBannedUsers",
  async ({ page = 1, limit = 20 }, { rejectWithValue }) => {
    try {
      const response = await api.get(ADMIN_API.GET_BANNED_USERS, {
        params: { page, limit },
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message ||
          "Lấy danh sách người dùng bị cấm thất bại"
      );
    }
  }
);

// Get User by ID
export const getUserById = createAsyncThunk(
  "admin/getUserById",
  async (userId, { rejectWithValue }) => {
    try {
      const response = await api.get(ADMIN_API.GET_USER_DETAILS(userId));
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Lấy thông tin người dùng thất bại"
      );
    }
  }
);

// Update User
export const updateUser = createAsyncThunk(
  "admin/updateUser",
  async ({ userId, data }, { rejectWithValue }) => {
    try {
      const response = await api.put(ADMIN_API.UPDATE_USER(userId), data);
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Cập nhật người dùng thất bại"
      );
    }
  }
);

// Delete User
export const deleteUser = createAsyncThunk(
  "admin/deleteUser",
  async (userId, { rejectWithValue }) => {
    try {
      await api.delete(ADMIN_API.DELETE_USER(userId));
      return { userId };
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Xóa người dùng thất bại"
      );
    }
  }
);

// Ban User
export const banUser = createAsyncThunk(
  "admin/banUser",
  async ({ userId, reason, duration }, { rejectWithValue }) => {
    try {
      const response = await api.post(ADMIN_API.BAN_USER, {
        userId,
        reason,
        duration,
      });
      return {
        userId,
        reason,
        bannedAt: new Date().toISOString(),
        ...response.data,
      };
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Cấm người dùng thất bại"
      );
    }
  }
);

// Unban User
export const unbanUser = createAsyncThunk(
  "admin/unbanUser",
  async (userId, { rejectWithValue }) => {
    try {
      await api.post(ADMIN_API.UNBAN_USER, { userId });
      return { userId };
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Bỏ cấm người dùng thất bại"
      );
    }
  }
);

// Suspend User
export const suspendUser = createAsyncThunk(
  "admin/suspendUser",
  async ({ userId, reason, duration }, { rejectWithValue }) => {
    try {
      const response = await api.post(ADMIN_API.SUSPEND_USER, {
        userId,
        reason,
        duration,
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Tạm khóa người dùng thất bại"
      );
    }
  }
);

// Warn User
export const warnUser = createAsyncThunk(
  "admin/warnUser",
  async ({ userId, reason }, { rejectWithValue }) => {
    try {
      const response = await api.post(ADMIN_API.WARN_USER, {
        userId,
        reason,
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Cảnh báo người dùng thất bại"
      );
    }
  }
);

// ========== Posts ==========

// Get All Posts
export const getAllPosts = createAsyncThunk(
  "admin/getAllPosts",
  async ({ page = 1, limit = 20, search, status }, { rejectWithValue }) => {
    try {
      const response = await api.get(ADMIN_API.GET_ALL_POSTS, {
        params: { page, limit, search, status },
      });
      return { ...response.data, isLoadMore: page > 1 };
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Lấy danh sách bài viết thất bại"
      );
    }
  }
);

// Moderate Post
export const moderatePost = createAsyncThunk(
  "admin/moderatePost",
  async ({ postId, action, reason }, { rejectWithValue }) => {
    try {
      const response = await api.post(ADMIN_API.MODERATE_POST(postId), {
        action,
        reason,
      });
      return { postId, ...response.data };
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Xử lý bài viết thất bại"
      );
    }
  }
);

// Approve Post
export const approvePost = createAsyncThunk(
  "admin/approvePost",
  async (postId, { rejectWithValue }) => {
    try {
      await api.post(ADMIN_API.APPROVE_POST(postId));
      return { postId };
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Duyệt bài viết thất bại"
      );
    }
  }
);

// Delete Post
export const deletePost = createAsyncThunk(
  "admin/deletePost",
  async (postId, { rejectWithValue }) => {
    try {
      await api.delete(ADMIN_API.DELETE_POST(postId));
      return { postId };
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Xóa bài viết thất bại"
      );
    }
  }
);

// Moderate Comment
export const moderateComment = createAsyncThunk(
  "admin/moderateComment",
  async ({ commentId, action, reason }, { rejectWithValue }) => {
    try {
      const response = await api.post(ADMIN_API.MODERATE_COMMENT(commentId), {
        action,
        reason,
      });
      return { commentId, ...response.data };
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Xử lý bình luận thất bại"
      );
    }
  }
);

// Delete Comment
export const deleteComment = createAsyncThunk(
  "admin/deleteComment",
  async (commentId, { rejectWithValue }) => {
    try {
      await api.delete(ADMIN_API.DELETE_COMMENT(commentId));
      return { commentId };
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Xóa bình luận thất bại"
      );
    }
  }
);

// ========== Reports ==========

// Get All Reports
export const getAllReports = createAsyncThunk(
  "admin/getAllReports",
  async ({ page = 1, limit = 20, status, type }, { rejectWithValue }) => {
    try {
      const response = await api.get(ADMIN_API.GET_REPORTS, {
        params: { page, limit, status, type },
      });
      return { ...response.data, isLoadMore: page > 1 };
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Lấy danh sách báo cáo thất bại"
      );
    }
  }
);

// Get Pending Reports
export const getPendingReports = createAsyncThunk(
  "admin/getPendingReports",
  async ({ page = 1, limit = 20 }, { rejectWithValue }) => {
    try {
      const response = await api.get(ADMIN_API.GET_PENDING_REPORTS, {
        params: { page, limit },
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Lấy báo cáo chờ xử lý thất bại"
      );
    }
  }
);

// Get User Reports
export const getUserReports = createAsyncThunk(
  "admin/getUserReports",
  async (userId, { rejectWithValue }) => {
    try {
      const response = await api.get(ADMIN_API.GET_USER_REPORTS(userId));
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Lấy báo cáo người dùng thất bại"
      );
    }
  }
);

// Review Report
export const reviewReport = createAsyncThunk(
  "admin/reviewReport",
  async ({ reportId, status, resolution }, { rejectWithValue }) => {
    try {
      const response = await api.put(ADMIN_API.REVIEW_REPORT(reportId), {
        status,
        resolution,
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Cập nhật trạng thái báo cáo thất bại"
      );
    }
  }
);

// Start Report Review
export const startReportReview = createAsyncThunk(
  "admin/startReportReview",
  async (reportId, { rejectWithValue }) => {
    try {
      const response = await api.post(ADMIN_API.START_REPORT_REVIEW(reportId));
      return { reportId, ...response.data };
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Bắt đầu xem xét báo cáo thất bại"
      );
    }
  }
);

// Resolve Report
export const resolveReport = createAsyncThunk(
  "admin/resolveReport",
  async ({ reportId, resolution }, { rejectWithValue }) => {
    try {
      const response = await api.post(ADMIN_API.RESOLVE_REPORT(reportId), {
        resolution,
      });
      return { reportId, ...response.data };
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Giải quyết báo cáo thất bại"
      );
    }
  }
);

// Health Check
export const healthCheck = createAsyncThunk(
  "admin/healthCheck",
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get(ADMIN_API.HEALTH);
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Kiểm tra trạng thái hệ thống thất bại"
      );
    }
  }
);

// Broadcast Notification
export const broadcastNotification = createAsyncThunk(
  "admin/broadcastNotification",
  async ({ title, message, targetUsers }, { rejectWithValue }) => {
    try {
      const response = await api.post(ADMIN_API.BROADCAST, {
        title,
        message,
        targetUsers,
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Gửi thông báo hàng loạt thất bại"
      );
    }
  }
);

// Get System Health
export const getSystemHealth = createAsyncThunk(
  "admin/getSystemHealth",
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get(ADMIN_API.GET_SYSTEM_HEALTH);
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Lấy trạng thái hệ thống thất bại"
      );
    }
  }
);

// Get Admin Logs
export const getAdminLogs = createAsyncThunk(
  "admin/getAdminLogs",
  async (
    { page = 1, limit = 50, level, startDate, endDate },
    { rejectWithValue }
  ) => {
    try {
      const response = await api.get(ADMIN_API.GET_LOGS, {
        params: { page, limit, level, startDate, endDate },
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Lấy nhật ký admin thất bại"
      );
    }
  }
);
