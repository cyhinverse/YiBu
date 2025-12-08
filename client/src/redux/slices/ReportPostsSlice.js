import { createSlice } from "@reduxjs/toolkit";
import {
  createReport,
  getUserReports,
  getReportById,
} from "../actions/reportActions";

const initialState = {
  reportedPosts: {}, // Object with postId as key and reason as value
  userReports: [],
  currentReportDetails: null,
  loading: false,
  error: null,
};

const reportedPostsSlice = createSlice({
  name: "reportedPosts",
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    removeReportLocal: (state, action) => {
        const postId = action.payload;
        delete state.reportedPosts[postId];
    }
  },
  extraReducers: (builder) => {
    // createReport
    builder
      .addCase(createReport.pending, (state) => {
        state.loading = true;
      })
      .addCase(createReport.fulfilled, (state, action) => {
        state.loading = false;
        // Check if payload contains the report info we need to store
        // Assuming we store that we reported this post
        const report = action.payload; // Typically the created report object
        if (report && (report.postId || report.post)) {
             state.reportedPosts[report.postId || report.post] = report.reason;
        }
      })
      .addCase(createReport.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });

    // getUserReports
    builder
        .addCase(getUserReports.fulfilled, (state, action) => {
            state.userReports = action.payload;
        });

    // getReportById
    builder
        .addCase(getReportById.fulfilled, (state, action) => {
            state.currentReportDetails = action.payload;
        });
  },
});

export const { clearError, removeReportLocal } = reportedPostsSlice.actions;

export default reportedPostsSlice.reducer;
