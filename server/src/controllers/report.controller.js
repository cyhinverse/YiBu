import { CatchError } from "../configs/CatchError.js";
import { formatResponse } from "../helpers/formatResponse.js";
import { getPaginationParams } from "../helpers/pagination.js";
import ReportService from "../services/Report.Service.js";
import mongoose from "mongoose";

/**
 * Report Controller
 * Handle all violation report-related requests
 *
 * Main features:
 * - Create reports (post, comment, user, message)
 * - Get user's report list
 * - Admin: Manage and process reports
 */
const ReportController = {

  /**
   * Create a new report
   * @param {Object} req - Express request object
   * @param {Object} req.body - Request body
   * @param {string} req.body.targetType - Type of target being reported (post/comment/user/message)
   * @param {string} req.body.targetId - ID of the target being reported
   * @param {string} req.body.category - Report category
   * @param {string} req.body.reason - Reason for the report
   * @param {string} [req.body.description] - Additional description
   * @param {Object} req.user - Authenticated user object
   * @param {string} req.user.id - Current user's ID (reporter)
   * @param {Object} res - Express response object
   * @returns {Object} Response with created report data
   */
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

  /**
   * Report a post
   * @param {Object} req - Express request object
   * @param {Object} req.params - Route parameters
   * @param {string} req.params.postId - ID of the post to report
   * @param {Object} req.body - Request body
   * @param {string} req.body.category - Report category
   * @param {string} req.body.reason - Reason for the report
   * @param {string} [req.body.description] - Additional description
   * @param {Object} req.user - Authenticated user object
   * @param {string} req.user.id - Current user's ID (reporter)
   * @param {Object} res - Express response object
   * @returns {Object} Response with created report data or 400 if invalid post ID
   */
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

  /**
   * Report a comment
   * @param {Object} req - Express request object
   * @param {Object} req.params - Route parameters
   * @param {string} req.params.commentId - ID of the comment to report
   * @param {Object} req.body - Request body
   * @param {string} req.body.category - Report category
   * @param {string} req.body.reason - Reason for the report
   * @param {string} [req.body.description] - Additional description
   * @param {Object} req.user - Authenticated user object
   * @param {string} req.user.id - Current user's ID (reporter)
   * @param {Object} res - Express response object
   * @returns {Object} Response with created report data or 400 if invalid comment ID
   */
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

  /**
   * Report a user
   * @param {Object} req - Express request object
   * @param {Object} req.params - Route parameters
   * @param {string} req.params.userId - ID of the user to report
   * @param {Object} req.body - Request body
   * @param {string} req.body.category - Report category
   * @param {string} req.body.reason - Reason for the report
   * @param {string} [req.body.description] - Additional description
   * @param {Object} req.user - Authenticated user object
   * @param {string} req.user.id - Current user's ID (reporter)
   * @param {Object} res - Express response object
   * @returns {Object} Response with created report data or 400 if invalid user ID
   */
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

  /**
   * Report a message
   * @param {Object} req - Express request object
   * @param {Object} req.params - Route parameters
   * @param {string} req.params.messageId - ID of the message to report
   * @param {Object} req.body - Request body
   * @param {string} req.body.category - Report category
   * @param {string} req.body.reason - Reason for the report
   * @param {string} [req.body.description] - Additional description
   * @param {Object} req.user - Authenticated user object
   * @param {string} req.user.id - Current user's ID (reporter)
   * @param {Object} res - Express response object
   * @returns {Object} Response with created report data or 400 if invalid message ID
   */
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

  /**
   * Get current user's reports
   * @param {Object} req - Express request object
   * @param {Object} req.query - Query parameters
   * @param {number} [req.query.page] - Page number for pagination
   * @param {number} [req.query.limit] - Number of items per page
   * @param {Object} req.user - Authenticated user object
   * @param {string} req.user.id - Current user's ID
   * @param {Object} res - Express response object
   * @returns {Object} Response with reports array, total count, and hasMore flag
   */
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

  /**
   * Get report by ID
   * @param {Object} req - Express request object
   * @param {Object} req.params - Route parameters
   * @param {string} req.params.reportId - ID of the report to retrieve
   * @param {Object} req.user - Authenticated user object
   * @param {string} req.user.id - Current user's ID
   * @param {boolean} req.user.isAdmin - Whether the user is an admin
   * @param {Object} res - Express response object
   * @returns {Object} Response with report data, 400 if invalid ID, or 403 if not authorized
   */
  getReportById: CatchError(async (req, res) => {
    const { reportId } = req.params;
    const userId = req.user.id;
    const isAdmin = req.user.isAdmin;

    if (!mongoose.Types.ObjectId.isValid(reportId)) {
      return formatResponse(res, 400, 0, "Invalid report ID");
    }

    const report = await ReportService.getReportById(reportId);

    if (!isAdmin && report.reporter._id.toString() !== userId) {
      return formatResponse(res, 403, 0, "Not authorized to view this report");
    }

    return formatResponse(res, 200, 1, "Success", report);
  }),


  /**
   * Get all reports (admin only)
   * @param {Object} req - Express request object
   * @param {Object} req.query - Query parameters
   * @param {number} [req.query.page] - Page number for pagination
   * @param {number} [req.query.limit] - Number of items per page
   * @param {string} [req.query.status] - Filter by report status
   * @param {string} [req.query.category] - Filter by report category
   * @param {string} [req.query.targetType] - Filter by target type
   * @param {string} [req.query.priority] - Filter by priority level
   * @param {Object} req.user - Authenticated user object
   * @param {boolean} req.user.isAdmin - Whether the user is an admin
   * @param {Object} res - Express response object
   * @returns {Object} Response with reports array, total count, and hasMore flag, or 403 if not admin
   */
  getAllReports: CatchError(async (req, res) => {
    if (!req.user.isAdmin) {
      return formatResponse(res, 403, 0, "Admin access required");
    }

    const { page, limit } = getPaginationParams(req.query);
    const { status, category, targetType, priority } = req.query;

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

  /**
   * Get pending reports (admin only)
   * @param {Object} req - Express request object
   * @param {Object} req.query - Query parameters
   * @param {number} [req.query.page] - Page number for pagination
   * @param {number} [req.query.limit] - Number of items per page
   * @param {string} [req.query.category] - Filter by report category
   * @param {string} [req.query.targetType] - Filter by target type
   * @param {string} [req.query.priority] - Filter by priority level
   * @param {Object} req.user - Authenticated user object
   * @param {boolean} req.user.isAdmin - Whether the user is an admin
   * @param {Object} res - Express response object
   * @returns {Object} Response with pending reports array, total count, and hasMore flag, or 403 if not admin
   */
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

  /**
   * Get reports against a specific user (admin only)
   * @param {Object} req - Express request object
   * @param {Object} req.params - Route parameters
   * @param {string} req.params.userId - ID of the user to get reports against
   * @param {Object} req.query - Query parameters
   * @param {number} [req.query.page] - Page number for pagination
   * @param {number} [req.query.limit] - Number of items per page
   * @param {string} [req.query.status] - Filter by report status
   * @param {Object} req.user - Authenticated user object
   * @param {boolean} req.user.isAdmin - Whether the user is an admin
   * @param {Object} res - Express response object
   * @returns {Object} Response with reports array, total count, and hasMore flag, or 400/403 on error
   */
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

  /**
   * Start reviewing a report (admin only)
   * @param {Object} req - Express request object
   * @param {Object} req.params - Route parameters
   * @param {string} req.params.reportId - ID of the report to start reviewing
   * @param {Object} req.user - Authenticated user object
   * @param {string} req.user.id - Admin user's ID
   * @param {boolean} req.user.isAdmin - Whether the user is an admin
   * @param {Object} res - Express response object
   * @returns {Object} Response with updated report data, or 400/403 on error
   */
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

  /**
   * Resolve a report (admin only)
   * @param {Object} req - Express request object
   * @param {Object} req.params - Route parameters
   * @param {string} req.params.reportId - ID of the report to resolve
   * @param {Object} req.body - Request body
   * @param {string} req.body.decision - Decision for the report (resolved/rejected/escalated)
   * @param {string} [req.body.actionTaken] - Action taken on the report
   * @param {string} [req.body.notes] - Additional notes about the resolution
   * @param {Object} req.user - Authenticated user object
   * @param {string} req.user.id - Admin user's ID
   * @param {boolean} req.user.isAdmin - Whether the user is an admin
   * @param {Object} res - Express response object
   * @returns {Object} Response with resolved report data, or 400/403 on error
   */
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

  /**
   * Update report status (admin only)
   * @param {Object} req - Express request object
   * @param {Object} req.params - Route parameters
   * @param {string} req.params.reportId - ID of the report to update
   * @param {Object} req.body - Request body
   * @param {string} req.body.status - New status for the report
   * @param {string} [req.body.notes] - Additional notes about the status update
   * @param {Object} req.user - Authenticated user object
   * @param {string} req.user.id - Admin user's ID
   * @param {boolean} req.user.isAdmin - Whether the user is an admin
   * @param {Object} res - Express response object
   * @returns {Object} Response with updated report data, or 400/403 on error
   */
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
