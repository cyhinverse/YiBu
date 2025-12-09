import { createSlice } from "@reduxjs/toolkit";
import {
  createReport,
  reportPost,
  reportComment,
  reportUser,
  reportMessage,
  getMyReports,
  getReportById,
} from "../actions/reportActions";

const initialState = {
  myReports: [],
  currentReport: null,
  pagination: {
    page: 1,
    limit: 20,
    hasMore: true,
  },
  loading: false,
  error: null,
  submitSuccess: false,
};

const reportSlice = createSlice({
  name: "report",
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    clearSubmitSuccess: (state) => {
      state.submitSuccess = false;
    },
    clearCurrentReport: (state) => {
      state.currentReport = null;
    },
    resetReportState: () => initialState,
  },
  extraReducers: (builder) => {
    builder
      // Create Report
      .addCase(createReport.pending, (state) => {
        state.loading = true;
        state.submitSuccess = false;
      })
      .addCase(createReport.fulfilled, (state, action) => {
        state.loading = false;
        state.submitSuccess = true;
        state.myReports.unshift(action.payload);
      })
      .addCase(createReport.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Report Post
      .addCase(reportPost.pending, (state) => {
        state.loading = true;
        state.submitSuccess = false;
      })
      .addCase(reportPost.fulfilled, (state, action) => {
        state.loading = false;
        state.submitSuccess = true;
        state.myReports.unshift(action.payload);
      })
      .addCase(reportPost.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Report Comment
      .addCase(reportComment.pending, (state) => {
        state.loading = true;
        state.submitSuccess = false;
      })
      .addCase(reportComment.fulfilled, (state, action) => {
        state.loading = false;
        state.submitSuccess = true;
        state.myReports.unshift(action.payload);
      })
      .addCase(reportComment.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Report User
      .addCase(reportUser.pending, (state) => {
        state.loading = true;
        state.submitSuccess = false;
      })
      .addCase(reportUser.fulfilled, (state, action) => {
        state.loading = false;
        state.submitSuccess = true;
        state.myReports.unshift(action.payload);
      })
      .addCase(reportUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Report Message
      .addCase(reportMessage.pending, (state) => {
        state.loading = true;
        state.submitSuccess = false;
      })
      .addCase(reportMessage.fulfilled, (state, action) => {
        state.loading = false;
        state.submitSuccess = true;
        state.myReports.unshift(action.payload);
      })
      .addCase(reportMessage.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Get My Reports
      .addCase(getMyReports.pending, (state) => {
        state.loading = true;
      })
      .addCase(getMyReports.fulfilled, (state, action) => {
        state.loading = false;
        const { reports, pagination, isLoadMore } = action.payload;
        if (isLoadMore) {
          state.myReports = [...state.myReports, ...reports];
        } else {
          state.myReports = reports;
        }
        state.pagination = pagination;
      })
      .addCase(getMyReports.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Get Report by ID
      .addCase(getReportById.fulfilled, (state, action) => {
        state.currentReport = action.payload;
      });
  },
});

export const {
  clearError,
  clearSubmitSuccess,
  clearCurrentReport,
  resetReportState,
} = reportSlice.actions;
export default reportSlice.reducer;
