import api from "../axios/axiosConfig";
import { SETTINGS_API_ENDPOINTS } from "../axios/apiEndpoint";

const UserSettingsService = {
  // Lấy tất cả cài đặt
  getAllSettings: async () => {
    try {
      const response = await api.get(SETTINGS_API_ENDPOINTS.GET_ALL_SETTINGS);
      return response.data;
    } catch (error) {
      console.error(
        "Lỗi khi lấy cài đặt:",
        error.response?.data || error.message
      );
      throw error;
    }
  },

  // Cập nhật cài đặt hồ sơ
  updateProfileSettings: async (profileData) => {
    try {
      console.log("Service - Dữ liệu gửi đi:", profileData);
      console.log(
        "Service - API Endpoint:",
        SETTINGS_API_ENDPOINTS.UPDATE_PROFILE
      );

      const response = await api.put(
        SETTINGS_API_ENDPOINTS.UPDATE_PROFILE,
        profileData
      );

      console.log("Service - Phản hồi từ server:", response.data);
      return response.data;
    } catch (error) {
      console.error(
        "Lỗi khi cập nhật hồ sơ:",
        error.response?.data || error.message
      );
      console.error("Chi tiết lỗi:", error);
      throw error;
    }
  },

  // Cập nhật cài đặt quyền riêng tư
  updatePrivacySettings: async (privacyData) => {
    try {
      const response = await api.put(
        SETTINGS_API_ENDPOINTS.UPDATE_PRIVACY,
        privacyData
      );
      return response.data;
    } catch (error) {
      console.error(
        "Lỗi khi cập nhật quyền riêng tư:",
        error.response?.data || error.message
      );
      throw error;
    }
  },

  // Cập nhật cài đặt thông báo
  updateNotificationSettings: async (notificationData) => {
    try {
      const response = await api.put(
        SETTINGS_API_ENDPOINTS.UPDATE_NOTIFICATION,
        notificationData
      );
      return response.data;
    } catch (error) {
      console.error(
        "Lỗi khi cập nhật thông báo:",
        error.response?.data || error.message
      );
      throw error;
    }
  },

  // Cập nhật cài đặt bảo mật
  updateSecuritySettings: async (securityData) => {
    try {
      const response = await api.put(
        SETTINGS_API_ENDPOINTS.UPDATE_SECURITY,
        securityData
      );
      return response.data;
    } catch (error) {
      console.error(
        "Lỗi khi cập nhật bảo mật:",
        error.response?.data || error.message
      );
      throw error;
    }
  },

  // Cập nhật cài đặt nội dung
  updateContentSettings: async (contentData) => {
    try {
      const response = await api.put(
        SETTINGS_API_ENDPOINTS.UPDATE_CONTENT,
        contentData
      );
      return response.data;
    } catch (error) {
      console.error(
        "Lỗi khi cập nhật nội dung:",
        error.response?.data || error.message
      );
      throw error;
    }
  },

  // Cập nhật cài đặt giao diện
  updateThemeSettings: async (themeData) => {
    try {
      const response = await api.put(
        SETTINGS_API_ENDPOINTS.UPDATE_THEME,
        themeData
      );
      return response.data;
    } catch (error) {
      console.error(
        "Lỗi khi cập nhật giao diện:",
        error.response?.data || error.message
      );
      throw error;
    }
  },

  // Thêm thiết bị tin cậy
  addTrustedDevice: async (deviceData) => {
    try {
      const response = await api.post(
        SETTINGS_API_ENDPOINTS.ADD_TRUSTED_DEVICE,
        deviceData
      );
      return response.data;
    } catch (error) {
      console.error(
        "Lỗi khi thêm thiết bị tin cậy:",
        error.response?.data || error.message
      );
      throw error;
    }
  },

  // Xóa thiết bị tin cậy
  removeTrustedDevice: async (deviceId) => {
    try {
      const response = await api.delete(
        `${SETTINGS_API_ENDPOINTS.REMOVE_TRUSTED_DEVICE}/${deviceId}`
      );
      return response.data;
    } catch (error) {
      console.error(
        "Lỗi khi xóa thiết bị tin cậy:",
        error.response?.data || error.message
      );
      throw error;
    }
  },

  // Chặn người dùng
  blockUser: async (blockedUserId) => {
    try {
      const response = await api.post(SETTINGS_API_ENDPOINTS.BLOCK_USER, {
        blockedUserId,
      });
      return response.data;
    } catch (error) {
      console.error(
        "Lỗi khi chặn người dùng:",
        error.response?.data || error.message
      );
      throw error;
    }
  },

  // Bỏ chặn người dùng
  unblockUser: async (blockedUserId) => {
    try {
      const response = await api.delete(
        `${SETTINGS_API_ENDPOINTS.UNBLOCK_USER}/${blockedUserId}`
      );
      return response.data;
    } catch (error) {
      console.error(
        "Lỗi khi bỏ chặn người dùng:",
        error.response?.data || error.message
      );
      throw error;
    }
  },

  // Lấy danh sách chặn
  getBlockList: async () => {
    try {
      const response = await api.get(SETTINGS_API_ENDPOINTS.GET_BLOCK_LIST);
      return response.data;
    } catch (error) {
      console.error(
        "Lỗi khi lấy danh sách chặn:",
        error.response?.data || error.message
      );
      throw error;
    }
  },
};

export default UserSettingsService;
