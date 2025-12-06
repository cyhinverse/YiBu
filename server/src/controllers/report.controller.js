import { CatchError } from "../configs/CatchError.js";
import { formatResponse } from "../helpers/formatResponse.js";
import { getPaginationParams, getPaginationResponse } from "../helpers/pagination.js";
import ReportService from "../services/Report.Service.js";

export const createReport = CatchError(async (req, res) => {
  const reporterId = req.user.id;
  
  const report = await ReportService.createReport(reporterId, req.body);

  return formatResponse(res, 201, 1, "Report submitted successfully", report);
});

export const getAllReports = CatchError(async (req, res) => {
  // Check if user is admin
  if (!req.user.isAdmin) {
    const error = new Error("Unauthorized. Admin access required.");
    error.statusCode = 403;
    throw error;
  }

  const { page, limit, skip } = getPaginationParams(req.query);
  
  const { reports, totalReports } = await ReportService.getAllReports(req.query, page, limit, skip);

  const { pagination } = getPaginationResponse({ data: reports, total: totalReports, page, limit });

  return formatResponse(res, 200, 1, "Success", null, {
    reports,
    pagination,
  });
});

export const getReportById = CatchError(async (req, res) => {
  const reportId = req.params.reportId;
  const userId = req.user.id;
  const isAdmin = req.user.isAdmin;

  const reportData = await ReportService.getReportById(reportId, userId, isAdmin);

  return formatResponse(res, 200, 1, "Success", reportData);
});

export const getReportsByUser = CatchError(async (req, res) => {
  const userId = req.params.userId;
  const requesterId = req.user.id;
  const isAdmin = req.user.isAdmin;
  const { page, limit, skip } = getPaginationParams(req.query);

  const { reports, totalReports } = await ReportService.getReportsByUser(userId, requesterId, isAdmin, page, limit, skip);

  const { pagination } = getPaginationResponse({ data: reports, total: totalReports, page, limit });

  return formatResponse(res, 200, 1, "Success", null, {
    reports,
    pagination,
  });
});

export const updateReportStatus = CatchError(async (req, res) => {
  // Check if user is admin
  if (!req.user.isAdmin) {
    const error = new Error("Unauthorized. Admin access required.");
    error.statusCode = 403;
    throw error;
  }

  const reportId = req.params.reportId;
  const { status, notes } = req.body;

  const report = await ReportService.updateReportStatus(reportId, status, notes, req.user.id);

  return formatResponse(res, 200, 1, `Report status updated to ${status}`, report);
});

export const addReportComment = CatchError(async (req, res) => {
  // Check if user is admin
  if (!req.user.isAdmin) {
    const error = new Error("Unauthorized. Admin access required.");
    error.statusCode = 403;
    throw error;
  }

  const reportId = req.params.reportId;
  const { comment } = req.body;

  const report = await ReportService.addReportComment(reportId, comment, req.user.id);

  return formatResponse(res, 200, 1, "Comment added to report", report);
});

