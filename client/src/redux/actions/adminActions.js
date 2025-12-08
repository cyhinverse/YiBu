import { createAsyncThunk } from "@reduxjs/toolkit";
import api from "../../axios/axiosConfig";
import { ADMIN_API_ENDPOINTS } from "../../axios/apiEndpoint";

export const getDashboardStats = createAsyncThunk(
  "admin/getDashboardStats",
  async (timeRange = "week", { rejectWithValue }) => {
    try {
      const response = await api.get(`${ADMIN_API_ENDPOINTS.GET_DASHBOARD_STATS}?timeRange=${timeRange}`);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

export const getRecentActivities = createAsyncThunk(
  "admin/getRecentActivities",
  async (limit, { rejectWithValue }) => {
    try {
      const response = await api.get(`${ADMIN_API_ENDPOINTS.GET_RECENT_ACTIVITIES}?limit=${limit || 10}`);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

export const getAllUsersAdmin = createAsyncThunk(
  "admin/getAllUsers",
  async ({ page, limit, filter }, { rejectWithValue }) => {
    try {
      const response = await api.get(ADMIN_API_ENDPOINTS.GET_ALL_USERS, {
          params: { page, limit, ...filter }
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

export const getUserDetailsAdmin = createAsyncThunk(
  "admin/getUserDetails",
  async (userId, { rejectWithValue }) => {
    try {
      const response = await api.get(`${ADMIN_API_ENDPOINTS.GET_USER_DETAILS}/${userId}`);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

export const updateUserAdmin = createAsyncThunk(
  "admin/updateUser",
  async ({ userId, userData }, { rejectWithValue }) => {
    try {
      const response = await api.put(`${ADMIN_API_ENDPOINTS.UPDATE_USER}/${userId}`, userData);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

export const deleteUserAdmin = createAsyncThunk(
  "admin/deleteUser",
  async (userId, { rejectWithValue }) => {
    try {
      await api.delete(`${ADMIN_API_ENDPOINTS.DELETE_USER}/${userId}`);
      return userId;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

export const banUser = createAsyncThunk(
  "admin/banUser",
  async ({ userId, reason, duration }, { rejectWithValue }) => {
    try {
      const response = await api.post(ADMIN_API_ENDPOINTS.BAN_USER, { userId, reason, duration }); // Corrected: endpoint is /ban-user, but route is /users/ban which expects body. Router: router.post("/users/ban", AdminController.banUser);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

export const unbanUser = createAsyncThunk(
  "admin/unbanUser",
  async (userId, { rejectWithValue }) => {
    try {
      const response = await api.post(ADMIN_API_ENDPOINTS.UNBAN_USER, { userId }); // Router: router.post("/users/unban", AdminController.unbanUser);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

// Banned Accounts
export const getBannedAccounts = createAsyncThunk(
  "admin/getBannedAccounts",
  async ({ page, limit }, { rejectWithValue }) => {
    try {
      const response = await api.get(ADMIN_API_ENDPOINTS.GET_BANNED_ACCOUNTS, { params: { page, limit }});
      return response.data;
    } catch (error) {
       return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

export const getBanHistory = createAsyncThunk(
  "admin/getBanHistory",
  async (userId, { rejectWithValue }) => {
    try {
      const response = await api.get(`${ADMIN_API_ENDPOINTS.GET_BAN_HISTORY}/${userId}`);
      return response.data;
    } catch (error) {
       return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

export const extendBan = createAsyncThunk(
  "admin/extendBan",
  async (data, { rejectWithValue }) => {
    try {
      const response = await api.put(ADMIN_API_ENDPOINTS.EXTEND_BAN, data);
      return response.data;
    } catch (error) {
       return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

export const temporaryUnban = createAsyncThunk(
  "admin/temporaryUnban",
  async (data, { rejectWithValue }) => {
    try {
      const response = await api.post(ADMIN_API_ENDPOINTS.TEMPORARY_UNBAN, data);
      return response.data;
    } catch (error) {
       return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);


export const getAllPostsAdmin = createAsyncThunk(
  "admin/getAllPosts",
  async ({ page, limit, filter }, { rejectWithValue }) => {
    try {
      const response = await api.get(ADMIN_API_ENDPOINTS.GET_ALL_POSTS, {
          params: { page, limit, ...filter }
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

export const getPostDetailsAdmin = createAsyncThunk(
  "admin/getPostDetails",
  async (postId, { rejectWithValue }) => {
    try {
      const response = await api.get(`${ADMIN_API_ENDPOINTS.GET_POST_DETAILS}/${postId}`);
      return response.data;
    } catch (error) {
       return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

export const deletePostAdmin = createAsyncThunk(
  "admin/deletePost",
  async ({ postId, reason }, { rejectWithValue }) => {
    try {
      await api.delete(`${ADMIN_API_ENDPOINTS.DELETE_POST}/${postId}`, { data: { reason } });
      return postId;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

export const approvePost = createAsyncThunk(
  "admin/approvePost",
  async (postId, { rejectWithValue }) => {
    try {
      const response = await api.post(`${ADMIN_API_ENDPOINTS.APPROVE_POST}/${postId}`); // Router: router.post("/posts/approve/:postId", ...);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

export const getAllCommentsAdmin = createAsyncThunk(
  "admin/getAllComments",
  async ({ page, limit, filter }, { rejectWithValue }) => {
    try {
      const response = await api.get(ADMIN_API_ENDPOINTS.GET_ALL_COMMENTS, {
          params: { page, limit, ...filter }
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

export const deleteCommentAdmin = createAsyncThunk(
  "admin/deleteComment",
  async ({ commentId, reason }, { rejectWithValue }) => {
    try {
      await api.delete(`${ADMIN_API_ENDPOINTS.DELETE_COMMENT}/${commentId}`, { data: { reason } });
      return commentId;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

export const getAllReportsAdmin = createAsyncThunk(
  "admin/getAllReports",
  async ({ page, limit, filter }, { rejectWithValue }) => {
    try {
      const response = await api.get(ADMIN_API_ENDPOINTS.GET_ALL_REPORTS, {
          params: { page, limit, ...filter }
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

// Router: router.post("/reports/resolve/:reportId", ...);
export const resolveReport = createAsyncThunk(
  "admin/resolveReport",
  async ({ reportId, action, notes }, { rejectWithValue }) => {
    try {
      const response = await api.post(`${ADMIN_API_ENDPOINTS.RESOLVE_REPORT}/${reportId}`, { action, notes });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

// Router: router.post("/reports/dismiss/:reportId", ...);
export const dismissReport = createAsyncThunk(
  "admin/dismissReport",
  async ({ reportId, reason }, { rejectWithValue }) => {
    try {
      const response = await api.post(`${ADMIN_API_ENDPOINTS.DISMISS_REPORT}/${reportId}`, { reason });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

export const updateReportStatusAdmin = createAsyncThunk(
  "admin/updateReportStatus",
  async ({ reportId, status, notes }, { rejectWithValue }) => {
    try {
       const response = await api.put(`${ADMIN_API_ENDPOINTS.UPDATE_REPORT_STATUS}/${reportId}`, { status, notes });
       return response.data;
    } catch (error) {
       return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

export const addReportCommentAdmin = createAsyncThunk(
  "admin/addReportComment",
  async ({ reportId, comment }, { rejectWithValue }) => {
    try {
       const response = await api.post(`${ADMIN_API_ENDPOINTS.ADD_REPORT_COMMENT}/${reportId}/comment`, { comment });
       return response.data;
    } catch (error) {
       return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

// Interactions
export const getInteractionStats = createAsyncThunk(
  "admin/getInteractionStats",
  async (timeRange, { rejectWithValue }) => {
    try {
       const response = await api.get(`${ADMIN_API_ENDPOINTS.GET_INTERACTION_STATS}?timeRange=${timeRange}`);
       return response.data;
    } catch (error) {
       return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

export const getInteractionTimeline = createAsyncThunk(
  "admin/getInteractionTimeline",
  async (timeRange, { rejectWithValue }) => {
    try {
       const response = await api.get(`${ADMIN_API_ENDPOINTS.GET_INTERACTION_TIMELINE}?timeRange=${timeRange}`);
       return response.data;
    } catch (error) {
       return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

export const getUserInteractions = createAsyncThunk(
  "admin/getUserInteractions",
  async ({ page, limit }, { rejectWithValue }) => {
    try {
       const response = await api.get(ADMIN_API_ENDPOINTS.GET_USER_INTERACTIONS, { params: { page, limit }});
       return response.data;
    } catch (error) {
       return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

export const getSpamAccounts = createAsyncThunk(
  "admin/getSpamAccounts",
  async ({ page, limit }, { rejectWithValue }) => {
    try {
       const response = await api.get(ADMIN_API_ENDPOINTS.GET_SPAM_ACCOUNTS, { params: { page, limit }});
       return response.data;
    } catch (error) {
       return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

export const flagAccount = createAsyncThunk(
  "admin/flagAccount",
  async (data, { rejectWithValue }) => {
    try {
       const response = await api.post(ADMIN_API_ENDPOINTS.FLAG_ACCOUNT, data);
       return response.data;
    } catch (error) {
       return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

export const removeInteraction = createAsyncThunk(
  "admin/removeInteraction",
  async (interactionId, { rejectWithValue }) => {
    try {
       await api.delete(`${ADMIN_API_ENDPOINTS.REMOVE_INTERACTION}/${interactionId}`);
       return interactionId;
    } catch (error) {
       return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

export const getInteractionTypes = createAsyncThunk(
  "admin/getInteractionTypes",
  async (_, { rejectWithValue }) => {
    try {
       const response = await api.get(ADMIN_API_ENDPOINTS.GET_INTERACTION_TYPES);
       return response.data;
    } catch (error) {
       return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

// Admin Settings
export const getAdminSettings = createAsyncThunk(
  "admin/getSettings",
  async (_, { rejectWithValue }) => {
    try {
       const response = await api.get(ADMIN_API_ENDPOINTS.GET_ADMIN_SETTINGS);
       return response.data;
    } catch (error) {
       return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

export const updateAdminSettings = createAsyncThunk(
  "admin/updateSettings",
  async (data, { rejectWithValue }) => {
    try {
       const response = await api.put(ADMIN_API_ENDPOINTS.UPDATE_ADMIN_SETTINGS, data);
       return response.data;
    } catch (error) {
       return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

export const updateSecuritySettingsAdmin = createAsyncThunk(
  "admin/updateSecuritySettings",
  async (data, { rejectWithValue }) => {
    try {
       const response = await api.put(ADMIN_API_ENDPOINTS.UPDATE_SECURITY_SETTINGS, data);
       return response.data;
    } catch (error) {
       return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

export const updateContentPolicy = createAsyncThunk(
  "admin/updateContentPolicy",
  async (data, { rejectWithValue }) => {
    try {
       const response = await api.put(ADMIN_API_ENDPOINTS.UPDATE_CONTENT_POLICY, data);
       return response.data;
    } catch (error) {
       return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

export const updateUserPermissions = createAsyncThunk(
  "admin/updateUserPermissions",
  async (data, { rejectWithValue }) => {
    try {
       const response = await api.put(ADMIN_API_ENDPOINTS.UPDATE_USER_PERMISSIONS, data);
       return response.data;
    } catch (error) {
       return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

export const updateNotificationSettingsAdmin = createAsyncThunk(
  "admin/updateNotificationSettings",
  async (data, { rejectWithValue }) => {
    try {
       const response = await api.put(ADMIN_API_ENDPOINTS.UPDATE_NOTIFICATION_SETTINGS, data);
       return response.data;
    } catch (error) {
       return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

export const getSystemHealth = createAsyncThunk(
  "admin/getSystemHealth",
  async (_, { rejectWithValue }) => {
    try {
       const response = await api.get(ADMIN_API_ENDPOINTS.GET_SYSTEM_HEALTH);
       return response.data;
    } catch (error) {
       return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

export const updateSystemConfig = createAsyncThunk(
  "admin/updateSystemConfig",
  async (data, { rejectWithValue }) => {
    try {
       const response = await api.put(ADMIN_API_ENDPOINTS.UPDATE_SYSTEM_CONFIG, data);
       return response.data;
    } catch (error) {
       return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);
