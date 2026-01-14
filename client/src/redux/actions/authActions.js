import { createAsyncThunk } from '@reduxjs/toolkit';
import api from '@/axios/axiosConfig';
import { AUTH_API } from '@/axios/apiEndpoint';

// Helper to extract data from response
const extractData = response => {
  const responseData = response.data;
  return responseData?.data !== undefined ? responseData.data : responseData;
};

// ========== Authentication ==========

export const login = createAsyncThunk(
  'auth/login',
  async ({ email, password }, { rejectWithValue }) => {
    try {
      const response = await api.post(AUTH_API.LOGIN, { email, password });
      return extractData(response);
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Đăng nhập thất bại'
      );
    }
  }
);

export const register = createAsyncThunk(
  'auth/register',
  async ({ email, password, username, name }, { rejectWithValue }) => {
    try {
      const response = await api.post(AUTH_API.REGISTER, {
        email,
        password,
        username,
        name,
      });
      return extractData(response);
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Đăng ký thất bại'
      );
    }
  }
);

export const googleAuth = createAsyncThunk(
  'auth/googleAuth',
  async (arg, { rejectWithValue }) => {
    try {
      // Handle both direct string and { credential: '...' } object
      const credential = typeof arg === 'string' ? arg : arg?.credential;

      if (!credential) {
        return rejectWithValue('Google credential is required');
      }

      const response = await api.post(AUTH_API.GOOGLE_AUTH, { credential });
      return extractData(response);
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Đăng nhập Google thất bại'
      );
    }
  }
);

export const logout = createAsyncThunk(
  'auth/logout',
  async (_, { rejectWithValue }) => {
    try {
      await api.post(AUTH_API.LOGOUT);
      return {};
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Đăng xuất thất bại'
      );
    }
  }
);

export const logoutAll = createAsyncThunk(
  'auth/logoutAll',
  async (_, { rejectWithValue }) => {
    try {
      await api.post(AUTH_API.LOGOUT_ALL);
      return {};
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Đăng xuất tất cả thiết bị thất bại'
      );
    }
  }
);

// ========== Password ==========

export const updatePassword = createAsyncThunk(
  'auth/updatePassword',
  async ({ currentPassword, newPassword }, { rejectWithValue }) => {
    try {
      const response = await api.put(AUTH_API.UPDATE_PASSWORD, {
        currentPassword,
        newPassword,
      });
      return extractData(response);
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Cập nhật mật khẩu thất bại'
      );
    }
  }
);

export const requestPasswordReset = createAsyncThunk(
  'auth/requestPasswordReset',
  async ({ email }, { rejectWithValue }) => {
    try {
      const response = await api.post(AUTH_API.REQUEST_PASSWORD_RESET, {
        email,
      });
      return extractData(response);
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Gửi yêu cầu đặt lại mật khẩu thất bại'
      );
    }
  }
);

export const resetPassword = createAsyncThunk(
  'auth/resetPassword',
  async ({ token, newPassword }, { rejectWithValue }) => {
    try {
      const response = await api.post(AUTH_API.RESET_PASSWORD, {
        token,
        newPassword,
      });
      return extractData(response);
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Đặt lại mật khẩu thất bại'
      );
    }
  }
);

// ========== 2FA ==========

export const enable2FA = createAsyncThunk(
  'auth/enable2FA',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.post(AUTH_API.ENABLE_2FA);
      return extractData(response);
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Bật 2FA thất bại'
      );
    }
  }
);

export const verify2FA = createAsyncThunk(
  'auth/verify2FA',
  async ({ code }, { rejectWithValue }) => {
    try {
      const response = await api.post(AUTH_API.VERIFY_2FA, { code });
      return extractData(response);
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Xác thực 2FA thất bại'
      );
    }
  }
);

export const disable2FA = createAsyncThunk(
  'auth/disable2FA',
  async ({ code }, { rejectWithValue }) => {
    try {
      const response = await api.post(AUTH_API.DISABLE_2FA, { code });
      return extractData(response);
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Tắt 2FA thất bại'
      );
    }
  }
);

// ========== Sessions ==========

export const getSessions = createAsyncThunk(
  'auth/getSessions',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get(AUTH_API.GET_SESSIONS);
      return extractData(response);
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Lấy danh sách phiên thất bại'
      );
    }
  }
);

export const revokeSession = createAsyncThunk(
  'auth/revokeSession',
  async ({ sessionId }, { rejectWithValue }) => {
    try {
      await api.delete(AUTH_API.REVOKE_SESSION(sessionId));
      return { sessionId };
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Thu hồi phiên thất bại'
      );
    }
  }
);
