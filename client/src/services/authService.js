import { AUTH_API_ENDPOINTS } from "../axios/apiEndpoint";
import api from "../axios/axiosConfig";

const Auth = {
  login: async (data) => {
    try {
      const res = await api.post(AUTH_API_ENDPOINTS.LOGIN, data);
      return res.data;
    } catch (error) {
      console.log("Login failed!", error.response?.data || error.message);
      throw error;
    }
  },
  register: async (data) => {
    try {
      // Log để debug
      console.log("Sending register data:", data);

      const res = await api.post(AUTH_API_ENDPOINTS.REGISTER, data);
      console.log("Register response:", res);

      // Trả về đúng format mà component Register.jsx đang mong đợi
      return {
        data: res.data,
        status: res.status,
      };
    } catch (error) {
      console.log(`Register failed !`, error.response?.data || error.message);
      // Log error để debug
      if (error.response) {
        console.log(
          "Server responded with:",
          error.response.status,
          error.response.data
        );
      } else if (error.request) {
        console.log("No response received:", error.request);
      } else {
        console.log("Error setting up request:", error.message);
      }
      throw error;
    }
  },
  refreshToken: async () => {
    try {
      const res = await api.post(AUTH_API_ENDPOINTS.REFRESH_TOKEN);
      return res.data;
    } catch (error) {
      console.log(
        `Reset accessToken failed !`,
        error.response?.data || error.message
      );
      throw error;
    }
  },
  logout: async () => {
    try {
      const res = await api.post(AUTH_API_ENDPOINTS.LOGOUT);
      return res.data;
    } catch (error) {
      console.log("Logout out failed !", error.response?.data || error.message);
      throw error;
    }
  },

  // New functions for account settings
  updateEmail: async (newEmail) => {
    try {
      const res = await api.put(AUTH_API_ENDPOINTS.UPDATE_EMAIL, {
        email: newEmail,
      });
      return res.data;
    } catch (error) {
      console.log(
        "Update email failed!",
        error.response?.data || error.message
      );
      throw error;
    }
  },

  updatePassword: async (data) => {
    try {
      const res = await api.put(AUTH_API_ENDPOINTS.UPDATE_PASSWORD, data);
      return res.data;
    } catch (error) {
      console.log(
        "Update password failed!",
        error.response?.data || error.message
      );
      throw error;
    }
  },

  connectSocialAccount: async (provider) => {
    try {
      const res = await api.post(AUTH_API_ENDPOINTS.CONNECT_SOCIAL, {
        provider,
      });
      return res.data;
    } catch (error) {
      console.log(
        `Connect to ${provider} failed!`,
        error.response?.data || error.message
      );
      throw error;
    }
  },

  verifyAccount: async () => {
    try {
      const res = await api.post(AUTH_API_ENDPOINTS.VERIFY_ACCOUNT);

      if (res.data && res.data.code === 1) {
        return {
          success: true,
          message: res.data.message,
          email: res.data.sentTo,
        };
      } else {
        return {
          success: false,
          message: res.data.message || "Không thể gửi email xác thực",
        };
      }
    } catch (error) {
      console.log(
        "Verify account failed!",
        error.response?.data || error.message
      );

      return {
        success: false,
        message:
          error.response?.data?.message ||
          "Không thể gửi email xác thực. Vui lòng thử lại sau.",
      };
    }
  },

  deleteAccount: async () => {
    try {
      const res = await api.delete(AUTH_API_ENDPOINTS.DELETE_ACCOUNT);
      return res.data;
    } catch (error) {
      console.log(
        "Delete account failed!",
        error.response?.data || error.message
      );
      throw error;
    }
  },
};

export default Auth;
