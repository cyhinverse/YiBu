import { createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../axios/axiosConfig';
import { REPORT_API } from '../../axios/apiEndpoint';

// Helper to extract data from response
// Server returns { code, message, data } format, we need to extract the actual data
const extractData = response => {
  const responseData = response.data;
  return responseData?.data !== undefined ? responseData.data : responseData;
};

// Create Report (Generic)
export const createReport = createAsyncThunk(
  'report/createReport',
  async ({ type, targetId, reason, description }, { rejectWithValue }) => {
    try {
      const response = await api.post(REPORT_API.CREATE, {
        type,
        targetId,
        reason,
        description,
      });
      return extractData(response);
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Tạo báo cáo thất bại'
      );
    }
  }
);

// Report Post
export const reportPost = createAsyncThunk(
  'report/reportPost',
  async ({ postId, reason, description }, { rejectWithValue }) => {
    try {
      const response = await api.post(REPORT_API.REPORT_POST(postId), {
        reason,
        description,
      });
      return extractData(response);
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Báo cáo bài viết thất bại'
      );
    }
  }
);

// Report Comment
export const reportComment = createAsyncThunk(
  'report/reportComment',
  async ({ commentId, reason, description }, { rejectWithValue }) => {
    try {
      const response = await api.post(REPORT_API.REPORT_COMMENT(commentId), {
        reason,
        description,
      });
      return extractData(response);
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Báo cáo bình luận thất bại'
      );
    }
  }
);

// Report User
export const reportUser = createAsyncThunk(
  'report/reportUser',
  async ({ userId, reason, description }, { rejectWithValue }) => {
    try {
      const response = await api.post(REPORT_API.REPORT_USER(userId), {
        reason,
        description,
      });
      return extractData(response);
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Báo cáo người dùng thất bại'
      );
    }
  }
);

// Report Message
export const reportMessage = createAsyncThunk(
  'report/reportMessage',
  async ({ messageId, reason, description }, { rejectWithValue }) => {
    try {
      const response = await api.post(REPORT_API.REPORT_MESSAGE(messageId), {
        reason,
        description,
      });
      return extractData(response);
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Báo cáo tin nhắn thất bại'
      );
    }
  }
);

// Get My Reports
export const getMyReports = createAsyncThunk(
  'report/getMyReports',
  async ({ page = 1, limit = 20, status } = {}, { rejectWithValue }) => {
    try {
      const response = await api.get(REPORT_API.GET_MY_REPORTS, {
        params: { page, limit, status },
      });
      const data = extractData(response);
      return { ...data, isLoadMore: page > 1 };
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Lấy báo cáo của tôi thất bại'
      );
    }
  }
);

// Get Report by ID
export const getReportById = createAsyncThunk(
  'report/getReportById',
  async (reportId, { rejectWithValue }) => {
    try {
      const response = await api.get(REPORT_API.GET_BY_ID(reportId));
      return extractData(response);
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Lấy chi tiết báo cáo thất bại'
      );
    }
  }
);
