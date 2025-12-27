import { createAsyncThunk } from "@reduxjs/toolkit";
import api from "../../axios/axiosConfig";
import { AUTH_API } from "../../axios/apiEndpoint";

// Login
export const login = createAsyncThunk(
  "auth/login",
  async (credentials, { rejectWithValue }) => {
    try {
      const response = await api.post(AUTH_API.LOGIN, credentials);
      // Save token to localStorage
      if (response.data.accessToken) {
        localStorage.setItem("accessToken", response.data.accessToken);
      }
      // Server returns { data: user, accessToken }, transform to { user, accessToken }
      return {
        user: response.data.data,
        accessToken: response.data.accessToken,
      };
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Đăng nhập thất bại"
      );
    }
  }
);

// Register
export const register = createAsyncThunk(
  "auth/register",
  async (userData, { rejectWithValue }) => {
    try {
      const response = await api.post(AUTH_API.REGISTER, userData);
      // Save token to localStorage
      if (response.data.accessToken) {
        localStorage.setItem("accessToken", response.data.accessToken);
      }
      // Server returns { data: user, accessToken }, transform to { user, accessToken }
      return {
        user: response.data.data,
        accessToken: response.data.accessToken,
      };
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Đăng ký thất bại"
      );
    }
  }
);

// Google Auth
export const googleAuth = createAsyncThunk(
  "auth/googleAuth",
  async (tokenData, { rejectWithValue }) => {
    try {
      const response = await api.post(AUTH_API.GOOGLE_AUTH, tokenData);
      // Save token to localStorage
      if (response.data.accessToken) {
        localStorage.setItem("accessToken", response.data.accessToken);
      }
      // Server returns { data: user, accessToken }, transform to { user, accessToken }
      return {
        user: response.data.data,
        accessToken: response.data.accessToken,
      };
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Đăng nhập Google thất bại"
      );
    }
  }
);

// Logout
export const logout = createAsyncThunk(
  "auth/logout",
  async (_, { rejectWithValue }) => {
    try {
      await api.post(AUTH_API.LOGOUT);
      // Clear token from localStorage
      localStorage.removeItem("accessToken");
      return true;
    } catch (error) {
      // Still clear token even if API fails
      localStorage.removeItem("accessToken");
      return rejectWithValue(
        error.response?.data?.message || "Đăng xuất thất bại"
      );
    }
  }
);

// Logout All Devices
export const logoutAll = createAsyncThunk(
  "auth/logoutAll",
  async (_, { rejectWithValue }) => {
    try {
      await api.post(AUTH_API.LOGOUT_ALL);
      // Clear token from localStorage
      localStorage.removeItem("accessToken");
      return true;
    } catch (error) {
      // Still clear token even if API fails
      localStorage.removeItem("accessToken");
      return rejectWithValue(
        error.response?.data?.message || "Đăng xuất tất cả thiết bị thất bại"
      );
    }
  }
);

// Refresh Token
export const refreshToken = createAsyncThunk(
  "auth/refreshToken",
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.post(AUTH_API.REFRESH_TOKEN);
      // Save new token to localStorage
      if (response.data.accessToken) {
        localStorage.setItem("accessToken", response.data.accessToken);
      }
      return response.data;
    } catch (error) {
      // Clear token if refresh fails
      localStorage.removeItem("accessToken");
      return rejectWithValue(
        error.response?.data?.message || "Làm mới token thất bại"
      );
    }
  }
);

// Update Password
export const updatePassword = createAsyncThunk(
  "auth/updatePassword",
  async (passwordData, { rejectWithValue }) => {
    try {
      const response = await api.put(AUTH_API.UPDATE_PASSWORD, passwordData);
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Cập nhật mật khẩu thất bại"
      );
    }
  }
);

// Request Password Reset
export const requestPasswordReset = createAsyncThunk(
  "auth/requestPasswordReset",
  async (email, { rejectWithValue }) => {
    try {
      const response = await api.post(AUTH_API.REQUEST_PASSWORD_RESET, {
        email,
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Gửi yêu cầu đặt lại mật khẩu thất bại"
      );
    }
  }
);

// Reset Password
export const resetPassword = createAsyncThunk(
  "auth/resetPassword",
  async ({ token, newPassword }, { rejectWithValue }) => {
    try {
      const response = await api.post(AUTH_API.RESET_PASSWORD, {
        token,
        newPassword,
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Đặt lại mật khẩu thất bại"
      );
    }
  }
);

// Enable 2FA
export const enable2FA = createAsyncThunk(
  "auth/enable2FA",
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.post(AUTH_API.ENABLE_2FA);
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Kích hoạt 2FA thất bại"
      );
    }
  }
);

// Verify 2FA
export const verify2FA = createAsyncThunk(
  "auth/verify2FA",
  async (payload, { rejectWithValue }) => {
    try {
      const response = await api.post(AUTH_API.VERIFY_2FA, payload);
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Xác thực 2FA thất bại"
      );
    }
  }
);

// Disable 2FA
export const disable2FA = createAsyncThunk(
  "auth/disable2FA",
  async (code, { rejectWithValue }) => {
    try {
      const response = await api.post(AUTH_API.DISABLE_2FA, { code });
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Tắt 2FA thất bại"
      );
    }
  }
);

// Get Sessions
export const getSessions = createAsyncThunk(
  "auth/getSessions",
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get(AUTH_API.GET_SESSIONS);
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Lấy danh sách phiên thất bại"
      );
    }
  }
);

// Revoke Session
export const revokeSession = createAsyncThunk(
  "auth/revokeSession",
  async (sessionId, { rejectWithValue }) => {
    try {
      await api.delete(AUTH_API.REVOKE_SESSION(sessionId));
      return sessionId;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Thu hồi phiên thất bại"
      );
    }
  }
);
