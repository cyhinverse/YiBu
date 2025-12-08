import { createAsyncThunk } from "@reduxjs/toolkit";
import api from "../../axios/axiosConfig";
import { REPORT_API_ENDPOINTS } from "../../axios/apiEndpoint";

export const createReport = createAsyncThunk(
  "report/createReport",
  async (reportData, { rejectWithValue }) => {
    try {
      const response = await api.post(REPORT_API_ENDPOINTS.CREATE_REPORT, reportData);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

export const getUserReports = createAsyncThunk(
  "report/getUserReports",
  async ({ userId, page, limit }, { rejectWithValue }) => {
    try {
      const response = await api.get(`${REPORT_API_ENDPOINTS.GET_USER_REPORTS}/${userId}`, {
          params: { page, limit }
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

export const getReportById = createAsyncThunk(
  "report/getReportById",
  async (reportId, { rejectWithValue }) => {
    try {
      const response = await api.get(`${REPORT_API_ENDPOINTS.GET_REPORT_DETAILS}/${reportId}`);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);
