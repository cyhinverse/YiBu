import { CatchError } from "../configs/CatchError.js";
import { formatResponse } from "../helpers/formatResponse.js";
import { getPaginationParams } from "../helpers/pagination.js";
import ReportService from "../services/Report.Service.js";
import mongoose from "mongoose";

/**
 * Report Controller
 * Xử lý tất cả các request liên quan đến báo cáo vi phạm
 *
 * Các chức năng chính:
 * - Tạo báo cáo (post, comment, user, message)
 * - Lấy danh sách báo cáo của người dùng
 * - Admin: Quản lý và xử lý báo cáo
 */
const ReportController = {
  // ======================================
  // Create Reports
  // ======================================

  createReport: CatchError(async (req, res) => {
    const reporterId = req.user.id;
    const { targetType, targetId, category, reason, description } = req.body;

    if (!targetType || !targetId) {
      return formatResponse(
        res,
        400,
        0,
        "Target type and target ID are required"
      );
    }

    if (!category || !reason) {
      return formatResponse(res, 400, 0, "Category and reason are required");
    }

    const report = await ReportService.createReport(
      reporterId,
      targetType,
      targetId,
      {
        category,
        reason,
        description,
      }
    );

    return formatResponse(res, 201, 1, "Report submitted successfully", report);
  }),

  reportPost: CatchError(async (req, res) => {
    const reporterId = req.user.id;
    const { postId } = req.params;
    const { category, reason, description } = req.body;

    if (!mongoose.Types.ObjectId.isValid(postId)) {
      return formatResponse(res, 400, 0, "Invalid post ID");
    }

    const report = await ReportService.reportPost(reporterId, postId, {
      category,
      reason,
      description,
    });

    return formatResponse(res, 201, 1, "Post reported successfully", report);
  }),

  reportComment: CatchError(async (req, res) => {
    const reporterId = req.user.id;
    const { commentId } = req.params;
    const { category, reason, description } = req.body;

    if (!mongoose.Types.ObjectId.isValid(commentId)) {
      return formatResponse(res, 400, 0, "Invalid comment ID");
    }

    const report = await ReportService.reportComment(reporterId, commentId, {
      category,
      reason,
      description,
    });

    return formatResponse(res, 201, 1, "Comment reported successfully", report);
  }),

  reportUser: CatchError(async (req, res) => {
    const reporterId = req.user.id;
    const { userId } = req.params;
    const { category, reason, description } = req.body;

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return formatResponse(res, 400, 0, "Invalid user ID");
    }

    const report = await ReportService.reportUser(reporterId, userId, {
      category,
      reason,
      description,
    });

    return formatResponse(res, 201, 1, "User reported successfully", report);
  }),

  reportMessage: CatchError(async (req, res) => {
    const reporterId = req.user.id;
    const { messageId } = req.params;
    const { category, reason, description } = req.body;

    if (!mongoose.Types.ObjectId.isValid(messageId)) {
      return formatResponse(res, 400, 0, "Invalid message ID");
    }

    const report = await ReportService.reportMessage(reporterId, messageId, {
      category,
      reason,
      description,
    });

    return formatResponse(res, 201, 1, "Message reported successfully", report);
  }),

  // ======================================
  // Get Reports (User)
  // ======================================

  getMyReports: CatchError(async (req, res) => {
    const userId = req.user.id;
    const { page, limit } = getPaginationParams(req.query);

    const result = await ReportService.getUserReports(userId, { page, limit });

    return formatResponse(res, 200, 1, "Success", {
      reports: result.reports,
      total: result.total,
      hasMore: result.hasMore,
    });
  }),

  getReportById: CatchError(async (req, res) => {
    const { reportId } = req.params;
    const userId = req.user.id;
    const isAdmin = req.user.isAdmin;

    if (!mongoose.Types.ObjectId.isValid(reportId)) {
      return formatResponse(res, 400, 0, "Invalid report ID");
    }

    const report = await ReportService.getReportById(reportId);

    // Non-admins can only view their own reports
    if (!isAdmin && report.reporter._id.toString() !== userId) {
      return formatResponse(res, 403, 0, "Not authorized to view this report");
    }

    return formatResponse(res, 200, 1, "Success", report);
  }),

  // ======================================
  // Admin: Get Reports
  // ======================================

  getAllReports: CatchError(async (req, res) => {
    if (!req.user.isAdmin) {
      return formatResponse(res, 403, 0, "Admin access required");
    }

    const { page, limit } = getPaginationParams(req.query);
    const { status, category, targetType, priority } = req.query;

    // Use getPendingReports for pending status, otherwise general query
    let result;
    if (status === "pending") {
      result = await ReportService.getPendingReports({
        page,
        limit,
        category,
        targetType,
        priority,
      });
    } else {
      result = await ReportService.getPendingReports({
        page,
        limit,
        category,
        targetType,
        priority,
      });
    }

    return formatResponse(res, 200, 1, "Success", {
      reports: result.reports,
      total: result.total,
      hasMore: result.hasMore,
    });
  }),

  getPendingReports: CatchError(async (req, res) => {
    if (!req.user.isAdmin) {
      return formatResponse(res, 403, 0, "Admin access required");
    }

    const { page, limit } = getPaginationParams(req.query);
    const { category, targetType, priority } = req.query;

    const result = await ReportService.getPendingReports({
      page,
      limit,
      category,
      targetType,
      priority,
    });

    return formatResponse(res, 200, 1, "Success", {
      reports: result.reports,
      total: result.total,
      hasMore: result.hasMore,
    });
  }),

  getReportsAgainstUser: CatchError(async (req, res) => {
    if (!req.user.isAdmin) {
      return formatResponse(res, 403, 0, "Admin access required");
    }

    const { userId } = req.params;
    const { page, limit } = getPaginationParams(req.query);
    const { status } = req.query;

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return formatResponse(res, 400, 0, "Invalid user ID");
    }

    const result = await ReportService.getReportsAgainstUser(userId, {
      page,
      limit,
      status,
    });

    return formatResponse(res, 200, 1, "Success", {
      reports: result.reports,
      total: result.total,
      hasMore: result.hasMore,
    });
  }),

  // ======================================
  // Admin: Manage Reports
  // ======================================

  startReview: CatchError(async (req, res) => {
    if (!req.user.isAdmin) {
      return formatResponse(res, 403, 0, "Admin access required");
    }

    const { reportId } = req.params;
    const adminId = req.user.id;

    if (!mongoose.Types.ObjectId.isValid(reportId)) {
      return formatResponse(res, 400, 0, "Invalid report ID");
    }

    const report = await ReportService.startReview(reportId, adminId);
    return formatResponse(res, 200, 1, "Review started", report);
  }),

  resolveReport: CatchError(async (req, res) => {
    if (!req.user.isAdmin) {
      return formatResponse(res, 403, 0, "Admin access required");
    }

    const { reportId } = req.params;
    const adminId = req.user.id;
    const { decision, actionTaken, notes } = req.body;

    if (!mongoose.Types.ObjectId.isValid(reportId)) {
      return formatResponse(res, 400, 0, "Invalid report ID");
    }

    if (!decision) {
      return formatResponse(
        res,
        400,
        0,
        "Decision is required (resolved/rejected/escalated)"
      );
    }

    const report = await ReportService.resolveReport(reportId, adminId, {
      decision,
      actionTaken,
      notes,
    });

    return formatResponse(res, 200, 1, `Report ${decision}`, report);
  }),

  // Alias for backward compatibility
  updateReportStatus: CatchError(async (req, res) => {
    if (!req.user.isAdmin) {
      return formatResponse(res, 403, 0, "Admin access required");
    }

    const { reportId } = req.params;
    const adminId = req.user.id;
    const { status, notes } = req.body;

    if (!mongoose.Types.ObjectId.isValid(reportId)) {
      return formatResponse(res, 400, 0, "Invalid report ID");
    }

    const report = await ReportService.resolveReport(reportId, adminId, {
      decision: status,
      notes,
    });

    return formatResponse(
      res,
      200,
      1,
      `Report status updated to ${status}`,
      report
    );
  }),
};

export default ReportController;
