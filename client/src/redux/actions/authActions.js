import { createAsyncThunk } from "@reduxjs/toolkit";
import api from "../../axios/axiosConfig";
import { AUTH_API_ENDPOINTS } from "../../axios/apiEndpoint";

export const login = createAsyncThunk(
  "auth/login",
  async (credentials, { rejectWithValue }) => {
    try {
      const response = await api.post(AUTH_API_ENDPOINTS.LOGIN, credentials);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

export const register = createAsyncThunk(
  "auth/register",
  async (userData, { rejectWithValue }) => {
    try {
      const response = await api.post(AUTH_API_ENDPOINTS.REGISTER, userData);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

export const logout = createAsyncThunk(
  "auth/logout",
  async () => {
    try {
      await api.post(AUTH_API_ENDPOINTS.LOGOUT);
    } catch (error) {
      console.error("Logout error", error);
    }
  }
);

export const refreshToken = createAsyncThunk(
  "auth/refreshToken",
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.post(AUTH_API_ENDPOINTS.REFRESH_TOKEN);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

export const updateEmail = createAsyncThunk(
  "auth/updateEmail",
  async (email, { rejectWithValue }) => {
    try {
      const response = await api.put(AUTH_API_ENDPOINTS.UPDATE_EMAIL, { email });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

export const updatePassword = createAsyncThunk(
  "auth/updatePassword",
  async (data, { rejectWithValue }) => {
    try {
      const response = await api.put(AUTH_API_ENDPOINTS.UPDATE_PASSWORD, data);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

export const verifyAccount = createAsyncThunk(
  "auth/verifyAccount",
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.post(AUTH_API_ENDPOINTS.VERIFY_ACCOUNT);
      // Logic copied from service: return object for success/fail based on code
      if (response.data && response.data.code === 1) {
        return {
          success: true,
          message: response.data.message,
          email: response.data.sentTo,
        };
      } else {
        return {
          success: false,
          message: response.data.message || "Không thể gửi email xác thực",
        };
      }
    } catch (error) {
      // Logic copied from service catch block
      return {
          success: false,
          message: error.response?.data?.message || "Không thể gửi email xác thực. Vui lòng thử lại sau.",
      };
    }
  }
);

export const deleteAccount = createAsyncThunk(
  "auth/deleteAccount",
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.delete(AUTH_API_ENDPOINTS.DELETE_ACCOUNT);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);
