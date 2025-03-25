import api from "../axios/axiosConfig";
import { REPORT_API_ENDPOINTS } from "../axios/apiEndpoint";

const ReportService = {
  createReport: async (reportData) => {
    try {
      const response = await api.post(
        REPORT_API_ENDPOINTS.CREATE_REPORT,
        reportData
      );
      return response.data;
    } catch (error) {
      console.error("Error creating report:", error);
      throw error;
    }
  },

  getUserReports: async (userId, page = 1, limit = 10) => {
    try {
      const response = await api.get(
        `${REPORT_API_ENDPOINTS.GET_USER_REPORTS}/${userId}`,
        {
          params: { page, limit },
        }
      );
      return response.data;
    } catch (error) {
      console.error("Error fetching user reports:", error);
      throw error;
    }
  },

  getReportById: async (reportId) => {
    try {
      const response = await api.get(
        `${REPORT_API_ENDPOINTS.GET_REPORT_DETAILS}/${reportId}`
      );
      return response.data;
    } catch (error) {
      console.error(`Error fetching report with ID ${reportId}:`, error);
      throw error;
    }
  },

  getAllReports: async (page = 1, limit = 10, filter = {}) => {
    try {
      const response = await api.get(REPORT_API_ENDPOINTS.GET_ALL_REPORTS, {
        params: { page, limit, ...filter },
      });
      return response.data;
    } catch (error) {
      console.error("Error fetching all reports:", error);
      throw error;
    }
  },

  updateReportStatus: async (reportId, status, notes) => {
    try {
      const response = await api.post(
        `${REPORT_API_ENDPOINTS.UPDATE_REPORT_STATUS}/${reportId}`,
        { status, notes }
      );
      return response.data;
    } catch (error) {
      console.error(`Error updating report status for ID ${reportId}:`, error);
      throw error;
    }
  },

  resolveReport: async (reportId, action, notes) => {
    try {
      const response = await api.post(
        `${REPORT_API_ENDPOINTS.RESOLVE_REPORT}/${reportId}`,
        { action, notes }
      );
      return response.data;
    } catch (error) {
      console.error(`Error resolving report with ID ${reportId}:`, error);
      throw error;
    }
  },

  dismissReport: async (reportId, reason) => {
    try {
      const response = await api.post(
        `${REPORT_API_ENDPOINTS.DISMISS_REPORT}/${reportId}`,
        { reason }
      );
      return response.data;
    } catch (error) {
      console.error(`Error dismissing report with ID ${reportId}:`, error);
      throw error;
    }
  },

  addReportComment: async (reportId, comment) => {
    try {
      const response = await api.post(
        `${REPORT_API_ENDPOINTS.ADD_REPORT_COMMENT}/${reportId}`,
        { comment }
      );
      return response.data;
    } catch (error) {
      console.error(
        `Error adding comment to report with ID ${reportId}:`,
        error
      );
      throw error;
    }
  },
};

export default ReportService;
