import { createAsyncThunk } from '@reduxjs/toolkit';
import api from '@/axios/axiosConfig';
import { ADMIN_API, REPORT_API } from '@/axios/apiEndpoint';

// Helper to extract data from response
// Server returns { code, message, data } format, we need to extract the actual data
const extractData = response => {
  const responseData = response.data;
  return responseData?.data !== undefined ? responseData.data : responseData;
};

// ========== Dashboard ==========

// Get Dashboard Stats
export const getDashboardStats = createAsyncThunk(
  'admin/getDashboardStats',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get(ADMIN_API.GET_DASHBOARD_STATS);
      return extractData(response);
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Lấy thống kê dashboard thất bại'
      );
    }
  }
);

// Get User Growth
export const getUserGrowth = createAsyncThunk(
  'admin/getUserGrowth',
  async ({ startDate, endDate } = {}, { rejectWithValue }) => {
    try {
      const response = await api.get(ADMIN_API.GET_USER_GROWTH, {
        params: { startDate, endDate },
      });
      return extractData(response);
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Lấy phân tích tăng trưởng thất bại'
      );
    }
  }
);

// Get Post Stats
export const getPostStats = createAsyncThunk(
  'admin/getPostStats',
  async ({ period = 'month' } = {}, { rejectWithValue }) => {
    try {
      const response = await api.get(ADMIN_API.GET_POST_STATS, {
        params: { period },
      });
      return extractData(response);
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Lấy thống kê bài viết thất bại'
      );
    }
  }
);

// Get Top Users
export const getTopUsers = createAsyncThunk(
  'admin/getTopUsers',
  async ({ page = 1, limit = 50 } = {}, { rejectWithValue }) => {
    try {
      const response = await api.get(ADMIN_API.GET_TOP_USERS, {
        params: { page, limit },
      });
      return extractData(response);
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Lấy top người dùng thất bại'
      );
    }
  }
);

// ========== Users ==========

// Get All Users
export const getAllUsers = createAsyncThunk(
  'admin/getAllUsers',
  async (
    { page = 1, limit = 20, search, status, role } = {},
    { rejectWithValue }
  ) => {
    try {
      const response = await api.get(ADMIN_API.GET_ALL_USERS, {
        params: { page, limit, search, status, role },
      });
      const data = extractData(response);
      return { ...data, isLoadMore: page > 1 };
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Lấy danh sách người dùng thất bại'
      );
    }
  }
);

// Get Banned Users
export const getBannedUsers = createAsyncThunk(
  'admin/getBannedUsers',
  async ({ page = 1, limit = 20 } = {}, { rejectWithValue }) => {
    try {
      const response = await api.get(ADMIN_API.GET_BANNED_USERS, {
        params: { page, limit },
      });
      return extractData(response);
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message ||
          'Lấy danh sách người dùng bị cấm thất bại'
      );
    }
  }
);

// Get User by ID
export const getUserById = createAsyncThunk(
  'admin/getUserById',
  async (userId, { rejectWithValue }) => {
    try {
      const response = await api.get(ADMIN_API.GET_USER_DETAILS(userId));
      return extractData(response);
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Lấy thông tin người dùng thất bại'
      );
    }
  }
);

// Get User Posts (Admin)
export const getAdminUserPosts = createAsyncThunk(
  'admin/getAdminUserPosts',
  async ({ userId, page = 1, limit = 20 }, { rejectWithValue }) => {
    try {
      const response = await api.get(`/api/admin/users/${userId}/posts`, {
        params: { page, limit },
      });
      return extractData(response);
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Lấy danh sách bài viết thất bại'
      );
    }
  }
);

// Get User Reports (Admin)
export const getAdminUserReports = createAsyncThunk(
  'admin/getAdminUserReports',
  async ({ userId, page = 1, limit = 20 }, { rejectWithValue }) => {
    try {
      const response = await api.get(`/api/admin/users/${userId}/reports`, {
        params: { page, limit },
      });
      return extractData(response);
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Lấy danh sách báo cáo thất bại'
      );
    }
  }
);

// Update User
export const updateUser = createAsyncThunk(
  'admin/updateUser',
  async ({ userId, data }, { rejectWithValue }) => {
    try {
      const response = await api.put(ADMIN_API.UPDATE_USER(userId), data);
      return extractData(response);
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Cập nhật người dùng thất bại'
      );
    }
  }
);

// Delete User
export const deleteUser = createAsyncThunk(
  'admin/deleteUser',
  async (userId, { rejectWithValue }) => {
    try {
      await api.delete(ADMIN_API.DELETE_USER(userId));
      return { userId };
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Xóa người dùng thất bại'
      );
    }
  }
);

// Ban User
export const banUser = createAsyncThunk(
  'admin/banUser',
  async ({ userId, reason, duration }, { rejectWithValue }) => {
    try {
      const response = await api.post(ADMIN_API.BAN_USER, {
        userId,
        reason,
        duration,
      });
      const data = extractData(response);
      return {
        userId,
        reason,
        bannedAt: new Date().toISOString(),
        ...data,
      };
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Cấm người dùng thất bại'
      );
    }
  }
);

// Unban User
export const unbanUser = createAsyncThunk(
  'admin/unbanUser',
  async ({ userId }, { rejectWithValue }) => {
    try {
      await api.post(ADMIN_API.UNBAN_USER, { userId });
      return { userId };
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Bỏ cấm người dùng thất bại'
      );
    }
  }
);

// Suspend User
export const suspendUser = createAsyncThunk(
  'admin/suspendUser',
  async ({ userId, reason, duration }, { rejectWithValue }) => {
    try {
      const response = await api.post(ADMIN_API.SUSPEND_USER, {
        userId,
        reason,
        duration,
      });
      const data = extractData(response);
      return { userId, ...data };
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Tạm khóa người dùng thất bại'
      );
    }
  }
);

// Warn User
export const warnUser = createAsyncThunk(
  'admin/warnUser',
  async ({ userId, reason }, { rejectWithValue }) => {
    try {
      const response = await api.post(ADMIN_API.WARN_USER, {
        userId,
        reason,
      });
      const data = extractData(response);
      return { userId, ...data };
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Cảnh báo người dùng thất bại'
      );
    }
  }
);

// ========== Posts ==========

// Get All Posts
export const getAllPosts = createAsyncThunk(
  'admin/getAllPosts',
  async (
    { page = 1, limit = 20, search, status } = {},
    { rejectWithValue }
  ) => {
    try {
      const response = await api.get(ADMIN_API.GET_ALL_POSTS, {
        params: { page, limit, search, status },
      });
      const data = extractData(response);
      return { ...data, isLoadMore: page > 1 };
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Lấy danh sách bài viết thất bại'
      );
    }
  }
);

// Get Post Reports (Admin)
export const getAdminPostReports = createAsyncThunk(
  'admin/getPostReports',
  async ({ postId, page = 1, limit = 20 }, { rejectWithValue }) => {
    try {
      const response = await api.get(`/api/admin/posts/${postId}/reports`, {
        params: { page, limit },
      });
      return extractData(response);
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Lấy danh sách báo cáo bài viết thất bại'
      );
    }
  }
);

// Moderate Post
export const moderatePost = createAsyncThunk(
  'admin/moderatePost',
  async ({ postId, action, reason }, { rejectWithValue }) => {
    try {
      const response = await api.post(ADMIN_API.MODERATE_POST(postId), {
        action,
        reason,
      });
      const data = extractData(response);
      return { postId, ...data };
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Xử lý bài viết thất bại'
      );
    }
  }
);

// Approve Post
export const approvePost = createAsyncThunk(
  'admin/approvePost',
  async (postId, { rejectWithValue }) => {
    try {
      await api.post(ADMIN_API.APPROVE_POST(postId));
      return { postId };
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Duyệt bài viết thất bại'
      );
    }
  }
);

// Delete Post
export const deletePost = createAsyncThunk(
  'admin/deletePost',
  async (postId, { rejectWithValue }) => {
    try {
      await api.delete(ADMIN_API.DELETE_POST(postId));
      return { postId };
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Xóa bài viết thất bại'
      );
    }
  }
);

// Get All Comments
export const getAllComments = createAsyncThunk(
  'admin/getAllComments',
  async (
    { page = 1, limit = 20, search, status } = {},
    { rejectWithValue }
  ) => {
    try {
      const response = await api.get(ADMIN_API.GET_ALL_COMMENTS, {
        params: { page, limit, search, status },
      });
      const data = extractData(response);
      return { ...data, isLoadMore: page > 1 };
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Lấy danh sách bình luận thất bại'
      );
    }
  }
);

// Moderate Comment
export const moderateComment = createAsyncThunk(
  'admin/moderateComment',
  async ({ commentId, action, reason }, { rejectWithValue }) => {
    try {
      const response = await api.post(ADMIN_API.MODERATE_COMMENT(commentId), {
        action,
        reason,
      });
      const data = extractData(response);
      return { commentId, ...data };
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Xử lý bình luận thất bại'
      );
    }
  }
);

// Delete Comment
export const deleteComment = createAsyncThunk(
  'admin/deleteComment',
  async (commentId, { rejectWithValue }) => {
    try {
      await api.delete(ADMIN_API.DELETE_COMMENT(commentId));
      return { commentId };
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Xóa bình luận thất bại'
      );
    }
  }
);

// ========== Reports ==========

// Get All Reports
export const getAllReports = createAsyncThunk(
  'admin/getAllReports',
  async ({ page = 1, limit = 20, status, type } = {}, { rejectWithValue }) => {
    try {
      const response = await api.get(ADMIN_API.GET_REPORTS, {
        params: { page, limit, status, type },
      });
      const data = extractData(response);
      return { ...data, isLoadMore: page > 1 };
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Lấy danh sách báo cáo thất bại'
      );
    }
  }
);

// Get Pending Reports
export const getPendingReports = createAsyncThunk(
  'admin/getPendingReports',
  async ({ page = 1, limit = 20 } = {}, { rejectWithValue }) => {
    try {
      const response = await api.get(ADMIN_API.GET_PENDING_REPORTS, {
        params: { page, limit },
      });
      return extractData(response);
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Lấy báo cáo chờ xử lý thất bại'
      );
    }
  }
);

// Get User Reports
export const getUserReports = createAsyncThunk(
  'admin/getUserReports',
  async (userId, { rejectWithValue }) => {
    try {
      const response = await api.get(ADMIN_API.GET_USER_REPORTS(userId));
      return extractData(response);
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Lấy báo cáo người dùng thất bại'
      );
    }
  }
);

// Review Report
export const reviewReport = createAsyncThunk(
  'admin/reviewReport',
  async ({ reportId, decision, actionTaken, notes }, { rejectWithValue }) => {
    try {
      const response = await api.post(ADMIN_API.REVIEW_REPORT(reportId), {
        decision,
        actionTaken,
        notes,
      });
      return extractData(response);
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Cập nhật trạng thái báo cáo thất bại'
      );
    }
  }
);

// Start Report Review
export const startReportReview = createAsyncThunk(
  'admin/startReportReview',
  async (reportId, { rejectWithValue }) => {
    try {
      const response = await api.post(ADMIN_API.START_REPORT_REVIEW(reportId));
      const data = extractData(response);
      return { reportId, ...data };
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Bắt đầu xem xét báo cáo thất bại'
      );
    }
  }
);

// Resolve Report
export const resolveReport = createAsyncThunk(
  'admin/resolveReport',
  async ({ reportId, decision, actionTaken, notes }, { rejectWithValue }) => {
    try {
      const response = await api.put(ADMIN_API.RESOLVE_REPORT(reportId), {
        decision,
        actionTaken,
        notes,
      });
      const data = extractData(response);
      return { reportId, ...data };
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Giải quyết báo cáo thất bại'
      );
    }
  }
);

// Update Report Status
export const updateReportStatus = createAsyncThunk(
  'admin/updateReportStatus',
  async ({ reportId, status, notes }, { rejectWithValue }) => {
    try {
      const response = await api.put(REPORT_API.UPDATE_STATUS(reportId), {
        status,
        notes,
      });
      const data = extractData(response);
      return { reportId, ...data };
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Cập nhật trạng thái báo cáo thất bại'
      );
    }
  }
);

// Health Check
export const healthCheck = createAsyncThunk(
  'admin/healthCheck',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get(ADMIN_API.HEALTH);
      return extractData(response);
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Kiểm tra trạng thái hệ thống thất bại'
      );
    }
  }
);

// Broadcast Notification
export const broadcastNotification = createAsyncThunk(
  'admin/broadcastNotification',
  async (
    { title, message, type, targetAudience, priority, link },
    { rejectWithValue }
  ) => {
    try {
      const response = await api.post(ADMIN_API.BROADCAST, {
        title,
        message,
        type,
        targetAudience,
        priority,
        link,
      });
      return extractData(response);
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Gửi thông báo hàng loạt thất bại'
      );
    }
  }
);

// Get System Health
export const getSystemHealth = createAsyncThunk(
  'admin/getSystemHealth',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get(ADMIN_API.GET_SYSTEM_HEALTH);
      return extractData(response);
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Lấy trạng thái hệ thống thất bại'
      );
    }
  }
);

// Get Admin Logs
export const getAdminLogs = createAsyncThunk(
  'admin/getAdminLogs',
  async (
    { page = 1, limit = 50, level, startDate, endDate } = {},
    { rejectWithValue }
  ) => {
    try {
      const response = await api.get(ADMIN_API.GET_LOGS, {
        params: { page, limit, level, startDate, endDate },
      });
      return extractData(response);
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Lấy nhật ký admin thất bại'
      );
    }
  }
);

// ======================================
// Settings Actions
// ======================================

export const getSystemSettings = createAsyncThunk(
  'admin/getSystemSettings',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get(ADMIN_API.GET_SYSTEM_SETTINGS);
      return extractData(response);
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Lấy cài đặt hệ thống thất bại'
      );
    }
  }
);

export const updateSystemSettings = createAsyncThunk(
  'admin/updateSystemSettings',
  async (settings, { rejectWithValue }) => {
    try {
      const response = await api.put(
        ADMIN_API.UPDATE_SYSTEM_SETTINGS,
        settings
      );
      return extractData(response);
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Cập nhật cài đặt thất bại'
      );
    }
  }
);

// ======================================
// Revenue Actions
// ======================================

export const getRevenueStats = createAsyncThunk(
  'admin/getRevenueStats',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get(ADMIN_API.GET_REVENUE_STATS);
      return extractData(response);
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Lấy thống kê doanh thu thất bại'
      );
    }
  }
);

export const getTransactions = createAsyncThunk(
  'admin/getTransactions',
  async ({ page = 1, limit = 20, status, type } = {}, { rejectWithValue }) => {
    try {
      const response = await api.get(ADMIN_API.GET_TRANSACTIONS, {
        params: { page, limit, status, type },
      });
      const data = extractData(response);
      return { ...data, isLoadMore: page > 1 };
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Lấy danh sách giao dịch thất bại'
      );
    }
  }
);

// ======================================
// Interactions Actions
// ======================================

export const getInteractions = createAsyncThunk(
  'admin/getInteractions',
  async ({ page = 1, limit = 20, type, search } = {}, { rejectWithValue }) => {
    try {
      const response = await api.get(ADMIN_API.GET_INTERACTIONS, {
        params: { page, limit, type, search },
      });
      const data = extractData(response);
      return { ...data, isLoadMore: page > 1 };
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Lấy danh sách tương tác thất bại'
      );
    }
  }
);
