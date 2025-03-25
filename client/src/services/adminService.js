import api from "../axios/axiosConfig";
import { ADMIN_API_ENDPOINTS } from "../axios/apiEndpoint";

// Hàm helper để thực hiện retry
const retryApiCall = async (apiCallFn, maxRetries = 3, retryDelay = 1000) => {
  let retries = 0;

  while (retries < maxRetries) {
    try {
      return await apiCallFn();
    } catch (error) {
      retries++;
      if (retries >= maxRetries) {
        console.error(`Max retries (${maxRetries}) reached:`, error);
        throw error;
      }

      console.warn(
        `Retry attempt ${retries}/${maxRetries} after ${retryDelay}ms`
      );
      await new Promise((resolve) => setTimeout(resolve, retryDelay));
      // Tăng thời gian chờ giữa các lần thử
      retryDelay *= 1.5;
    }
  }
};

const AdminService = {
  // Dashboard
  getDashboardStats: async (timeRange = "week") => {
    return retryApiCall(async () => {
      try {
        const response = await api.get(
          `${ADMIN_API_ENDPOINTS.GET_DASHBOARD_STATS}?timeRange=${timeRange}`
        );
        return response.data;
      } catch (error) {
        console.error("Error fetching dashboard stats:", error);
        throw error;
      }
    });
  },

  getRecentActivities: async (limit = 10) => {
    return retryApiCall(async () => {
      try {
        const response = await api.get(
          `${ADMIN_API_ENDPOINTS.GET_RECENT_ACTIVITIES}?limit=${limit}`
        );
        return response.data;
      } catch (error) {
        console.error("Error fetching recent activities:", error);
        throw error;
      }
    });
  },

  // User management
  getAllUsers: async (page = 1, limit = 10, filter = {}) => {
    return retryApiCall(async () => {
      try {
        const response = await api.get(ADMIN_API_ENDPOINTS.GET_ALL_USERS, {
          params: { page, limit, ...filter },
        });
        return response.data;
      } catch (error) {
        console.error("Error fetching users:", error);
        throw error;
      }
    });
  },

  getUserDetails: async (userId) => {
    try {
      const response = await api.get(
        `${ADMIN_API_ENDPOINTS.GET_USER_DETAILS}/${userId}`
      );
      return response.data;
    } catch (error) {
      console.error(`Error fetching user ${userId}:`, error);
      throw error;
    }
  },

  updateUser: async (userId, userData) => {
    try {
      const response = await api.put(
        `${ADMIN_API_ENDPOINTS.UPDATE_USER}/${userId}`,
        userData
      );
      return response.data;
    } catch (error) {
      console.error(`Error updating user ${userId}:`, error);
      throw error;
    }
  },

  deleteUser: async (userId) => {
    try {
      const response = await api.delete(
        `${ADMIN_API_ENDPOINTS.DELETE_USER}/${userId}`
      );
      return response.data;
    } catch (error) {
      console.error(`Error deleting user ${userId}:`, error);
      throw error;
    }
  },

  banUser: async (userId, reason, duration) => {
    try {
      const response = await api.post(ADMIN_API_ENDPOINTS.BAN_USER, {
        userId,
        reason,
        duration,
      });
      return response.data;
    } catch (error) {
      console.error(`Error banning user ${userId}:`, error);
      throw error;
    }
  },

  unbanUser: async (userId) => {
    try {
      const response = await api.post(ADMIN_API_ENDPOINTS.UNBAN_USER, {
        userId,
      });
      return response.data;
    } catch (error) {
      console.error(`Error unbanning user ${userId}:`, error);
      throw error;
    }
  },

  // Post management
  getAllPosts: async (page = 1, limit = 10, filter = {}) => {
    try {
      const response = await api.get(ADMIN_API_ENDPOINTS.GET_ALL_POSTS, {
        params: { page, limit, ...filter },
      });
      return response.data;
    } catch (error) {
      console.error("Error fetching posts:", error);
      throw error;
    }
  },

  getPostDetails: async (postId) => {
    try {
      const response = await api.get(
        `${ADMIN_API_ENDPOINTS.GET_POST_DETAILS}/${postId}`
      );
      return response.data;
    } catch (error) {
      console.error(`Error fetching post ${postId}:`, error);
      throw error;
    }
  },

  deletePost: async (postId, reason) => {
    try {
      const response = await api.delete(
        `${ADMIN_API_ENDPOINTS.DELETE_POST}/${postId}`,
        {
          data: { reason },
        }
      );
      return response.data;
    } catch (error) {
      console.error(`Error deleting post ${postId}:`, error);
      throw error;
    }
  },

  approvePost: async (postId) => {
    try {
      const response = await api.post(
        `${ADMIN_API_ENDPOINTS.APPROVE_POST}/${postId}`
      );
      return response.data;
    } catch (error) {
      console.error(`Error approving post ${postId}:`, error);
      throw error;
    }
  },

  // Comment management
  getAllComments: async (page = 1, limit = 10, filter = {}) => {
    try {
      const response = await api.get(ADMIN_API_ENDPOINTS.GET_ALL_COMMENTS, {
        params: { page, limit, ...filter },
      });
      return response.data;
    } catch (error) {
      console.error("Error fetching comments:", error);
      throw error;
    }
  },

  deleteComment: async (commentId, reason) => {
    try {
      const response = await api.delete(
        `${ADMIN_API_ENDPOINTS.DELETE_COMMENT}/${commentId}`,
        {
          data: { reason },
        }
      );
      return response.data;
    } catch (error) {
      console.error(`Error deleting comment ${commentId}:`, error);
      throw error;
    }
  },

  // Report management
  getAllReports: async (page = 1, limit = 10, filter = {}) => {
    try {
      const response = await api.get(ADMIN_API_ENDPOINTS.GET_ALL_REPORTS, {
        params: { page, limit, ...filter },
      });
      return response.data;
    } catch (error) {
      console.error("Error fetching reports:", error);
      throw error;
    }
  },

  resolveReport: async (reportId, action, notes) => {
    try {
      const response = await api.post(
        `${ADMIN_API_ENDPOINTS.RESOLVE_REPORT}/${reportId}`,
        {
          action,
          notes,
        }
      );
      return response.data;
    } catch (error) {
      console.error(`Error resolving report ${reportId}:`, error);
      throw error;
    }
  },

  dismissReport: async (reportId, reason) => {
    try {
      const response = await api.post(
        `${ADMIN_API_ENDPOINTS.DISMISS_REPORT}/${reportId}`,
        {
          reason,
        }
      );
      return response.data;
    } catch (error) {
      console.error(`Error dismissing report ${reportId}:`, error);
      throw error;
    }
  },

  // Admin logs
  getSystemLogs: async (page = 1, limit = 10, filter = {}) => {
    try {
      const response = await api.get(ADMIN_API_ENDPOINTS.GET_SYSTEM_LOGS, {
        params: { page, limit, ...filter },
      });
      return response.data;
    } catch (error) {
      console.error("Error fetching system logs:", error);
      throw error;
    }
  },

  // Admin settings
  getAdminSettings: async () => {
    try {
      const response = await api.get(ADMIN_API_ENDPOINTS.GET_ADMIN_SETTINGS);
      return response.data;
    } catch (error) {
      console.error("Error fetching admin settings:", error);
      throw error;
    }
  },

  updateAdminSettings: async (settings) => {
    try {
      const response = await api.put(
        ADMIN_API_ENDPOINTS.UPDATE_ADMIN_SETTINGS,
        settings
      );
      return response.data;
    } catch (error) {
      console.error("Error updating admin settings:", error);
      throw error;
    }
  },

  // System settings
  updateSecuritySettings: async (securitySettings) => {
    try {
      const response = await api.put(
        ADMIN_API_ENDPOINTS.UPDATE_SECURITY_SETTINGS,
        securitySettings
      );
      return response.data;
    } catch (error) {
      console.error("Error updating security settings:", error);
      throw error;
    }
  },

  updateContentPolicy: async (contentPolicy) => {
    try {
      const response = await api.put(
        ADMIN_API_ENDPOINTS.UPDATE_CONTENT_POLICY,
        contentPolicy
      );
      return response.data;
    } catch (error) {
      console.error("Error updating content policy:", error);
      throw error;
    }
  },

  updateUserPermissions: async (permissions) => {
    try {
      const response = await api.put(
        ADMIN_API_ENDPOINTS.UPDATE_USER_PERMISSIONS,
        permissions
      );
      return response.data;
    } catch (error) {
      console.error("Error updating user permissions:", error);
      throw error;
    }
  },

  updateNotificationSettings: async (notificationSettings) => {
    try {
      const response = await api.put(
        ADMIN_API_ENDPOINTS.UPDATE_NOTIFICATION_SETTINGS,
        notificationSettings
      );
      return response.data;
    } catch (error) {
      console.error("Error updating notification settings:", error);
      throw error;
    }
  },

  getSystemHealth: async () => {
    try {
      const response = await api.get(ADMIN_API_ENDPOINTS.GET_SYSTEM_HEALTH);
      return response.data;
    } catch (error) {
      console.error("Error fetching system health:", error);
      throw error;
    }
  },

  updateSystemConfig: async (config) => {
    try {
      const response = await api.put(
        ADMIN_API_ENDPOINTS.UPDATE_SYSTEM_CONFIG,
        config
      );
      return response.data;
    } catch (error) {
      console.error("Error updating system configuration:", error);
      throw error;
    }
  },

  // Server health check
  serverHealthCheck: async () => {
    try {
      const response = await api.get("/api/admin/health");
      return response.data;
    } catch (error) {
      console.error("Server health check failed:", error);
      return { status: "error", message: error.message };
    }
  },

  // System alerts
  getSystemAlerts: async () => {
    try {
      const response = await api.get(ADMIN_API_ENDPOINTS.GET_SYSTEM_LOGS);
      return response.data;
    } catch (error) {
      console.error("Error fetching system alerts:", error);
      throw error;
    }
  },

  // Reports
  getReports: async (page = 1, limit = 10, filter = {}) => {
    try {
      const response = await api.get(ADMIN_API_ENDPOINTS.GET_ALL_REPORTS, {
        params: { page, limit, ...filter },
      });
      return response.data;
    } catch (error) {
      console.error("Error fetching reports:", error);
      throw error;
    }
  },

  // Interaction management
  getInteractionStats: async (timeRange = "week") => {
    try {
      const response = await api.get(
        ADMIN_API_ENDPOINTS.GET_INTERACTION_STATS,
        {
          params: { timeRange },
        }
      );
      return response.data;
    } catch (error) {
      console.error("Error fetching interaction stats:", error);
      throw error;
    }
  },

  getInteractionTimeline: async (type, timeRange = "week") => {
    try {
      const response = await api.get(
        ADMIN_API_ENDPOINTS.GET_INTERACTION_TIMELINE,
        {
          params: { type, timeRange },
        }
      );
      return response.data;
    } catch (error) {
      console.error("Error fetching interaction timeline:", error);
      throw error;
    }
  },

  getUserInteractions: async (page = 1, limit = 10, filter = {}) => {
    try {
      const response = await api.get(
        ADMIN_API_ENDPOINTS.GET_USER_INTERACTIONS,
        {
          params: { page, limit, ...filter },
        }
      );
      return response.data;
    } catch (error) {
      console.error("Error fetching user interactions:", error);
      throw error;
    }
  },

  getSpamAccounts: async (page = 1, limit = 10) => {
    try {
      const response = await api.get(ADMIN_API_ENDPOINTS.GET_SPAM_ACCOUNTS, {
        params: { page, limit },
      });
      return response.data;
    } catch (error) {
      console.error("Error fetching spam accounts:", error);
      throw error;
    }
  },

  flagAccount: async (userId, reason) => {
    try {
      const response = await api.post(ADMIN_API_ENDPOINTS.FLAG_ACCOUNT, {
        userId,
        reason,
      });
      return response.data;
    } catch (error) {
      console.error(`Error flagging account ${userId}:`, error);
      throw error;
    }
  },

  removeInteraction: async (interactionId, reason) => {
    try {
      const response = await api.delete(
        `${ADMIN_API_ENDPOINTS.REMOVE_INTERACTION}/${interactionId}`,
        {
          data: { reason },
        }
      );
      return response.data;
    } catch (error) {
      console.error(`Error removing interaction ${interactionId}:`, error);
      throw error;
    }
  },

  getInteractionTypes: async () => {
    try {
      const response = await api.get(ADMIN_API_ENDPOINTS.GET_INTERACTION_TYPES);
      return response.data;
    } catch (error) {
      console.error("Error fetching interaction types:", error);
      throw error;
    }
  },

  // Banned accounts management
  getBannedAccounts: async (page = 1, limit = 10, filter = {}) => {
    try {
      // Xử lý các tham số rỗng hoặc không hợp lệ
      const params = { page, limit };

      // Chỉ thêm search nếu nó là chuỗi không rỗng
      if (filter.search && filter.search.trim().length > 0) {
        params.search = filter.search.trim();
      }

      // Chỉ thêm banType nếu nó khác undefined và không phải 'all'
      if (filter.banType && filter.banType !== "all") {
        params.banType = filter.banType;
      }

      const response = await api.get(ADMIN_API_ENDPOINTS.GET_BANNED_ACCOUNTS, {
        params,
      });
      return response.data;
    } catch (error) {
      console.error("Error fetching banned accounts:", error);
      throw error;
    }
  },

  getBanHistory: async (userId) => {
    try {
      const response = await api.get(
        `${ADMIN_API_ENDPOINTS.GET_BAN_HISTORY}/${userId}`
      );
      return response.data;
    } catch (error) {
      console.error(`Error fetching ban history for user ${userId}:`, error);
      throw error;
    }
  },

  extendBan: async (userId, duration, reason) => {
    try {
      const response = await api.put(ADMIN_API_ENDPOINTS.EXTEND_BAN, {
        userId,
        duration,
        reason,
      });
      return response.data;
    } catch (error) {
      console.error(`Error extending ban for user ${userId}:`, error);
      throw error;
    }
  },

  temporaryUnban: async (userId, duration, reason) => {
    try {
      const response = await api.post(ADMIN_API_ENDPOINTS.TEMPORARY_UNBAN, {
        userId,
        duration,
        reason,
      });
      return response.data;
    } catch (error) {
      console.error(`Error temporarily unbanning user ${userId}:`, error);
      throw error;
    }
  },
};

export default AdminService;
