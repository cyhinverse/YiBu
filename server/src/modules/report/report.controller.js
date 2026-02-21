import { CatchError } from '../../configs/CatchError.js';
import { sendCreated, sendOk } from '../../helpers/apiResponse.js';
import { getPaginationParams } from '../../utils/pagination.js';
import ReportService from './report.service.js';
import ApiError from '../../helpers/ApiError.js';


/**
 * Report Controller
 * Handle all violation report-related requests
 *
 * Main features:
 * - Create reports (post, comment, user, message)
 * - Get user's report list
 * - Admin: Manage and process reports
 */
const LEGACY_ACTION_TO_RESOLUTION = {
  dismiss: { decision: 'rejected', actionTaken: null },
  warn: { decision: 'resolved', actionTaken: 'warn_user' },
  hide_content: { decision: 'resolved', actionTaken: 'remove_content' },
  remove_content: { decision: 'resolved', actionTaken: 'remove_content' },
  suspend_user: { decision: 'resolved', actionTaken: 'suspend_user' },
  ban_user: { decision: 'resolved', actionTaken: 'ban_user' },
};

const LEGACY_RESOLUTION_TO_RESOLUTION = {
  dismissed: { decision: 'rejected', actionTaken: null },
  content_removed: { decision: 'resolved', actionTaken: 'remove_content' },
  user_warned: { decision: 'resolved', actionTaken: 'warn_user' },
  user_suspended: { decision: 'resolved', actionTaken: 'suspend_user' },
  user_banned: { decision: 'resolved', actionTaken: 'ban_user' },
};

const normalizeResolutionPayload = payload => {
  const { decision, actionTaken, action, resolution, notes } = payload;

  if (decision) {
    return { decision, actionTaken: actionTaken || null, notes };
  }

  if (action && LEGACY_ACTION_TO_RESOLUTION[action]) {
    return { ...LEGACY_ACTION_TO_RESOLUTION[action], notes };
  }

  if (resolution && LEGACY_RESOLUTION_TO_RESOLUTION[resolution]) {
    return { ...LEGACY_RESOLUTION_TO_RESOLUTION[resolution], notes };
  }

  if (actionTaken) {
    return { decision: 'resolved', actionTaken, notes };
  }

  return { decision: null, actionTaken: null, notes };
};

const getReporterId = report => {
  if (!report?.reporter) return null;
  if (report.reporter._id) return report.reporter._id.toString();
  return report.reporter.toString();
};

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
      throw ApiError.badRequest('Target type and target ID are required');
    }

    if (!reason) {
      throw ApiError.badRequest('Reason is required');
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

    return sendCreated(res, {
      message: 'Report submitted successfully',
      data: report,
    });

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

    if (!reason) {
      throw ApiError.badRequest('Reason is required');
    }


    const report = await ReportService.reportPost(reporterId, postId, {
      category,
      reason,
      description,
    });

    return sendCreated(res, {
      message: 'Post reported successfully',
      data: report,
    });

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

    if (!reason) {
      throw ApiError.badRequest('Reason is required');
    }


    const report = await ReportService.reportComment(reporterId, commentId, {
      category,
      reason,
      description,
    });

    return sendCreated(res, {
      message: 'Comment reported successfully',
      data: report,
    });

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

    if (!reason) {
      throw ApiError.badRequest('Reason is required');
    }


    const report = await ReportService.reportUser(reporterId, userId, {
      category,
      reason,
      description,
    });

    return sendCreated(res, {
      message: 'User reported successfully',
      data: report,
    });

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

    if (!reason) {
      throw ApiError.badRequest('Reason is required');
    }


    const report = await ReportService.reportMessage(reporterId, messageId, {
      category,
      reason,
      description,
    });

    return sendCreated(res, {
      message: 'Message reported successfully',
      data: report,
    });

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
    const { status } = req.query;

    const result = await ReportService.getUserReports(userId, {
      page,
      limit,
      status,
    });

    return sendOk(res, {
      message: 'Success',
      data: {
        reports: result.reports,
        total: result.total,
        hasMore: result.hasMore,
      },
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
   * @returns {Object} Response with report data or 403 if not authorized
   */
  getReportById: CatchError(async (req, res) => {
    const { reportId } = req.params;
    const userId = req.user.id;
    const isAdmin = req.user.isAdmin;

    const report = await ReportService.getReportById(reportId);

    const reporterId = getReporterId(report);
    if (!isAdmin && reporterId !== userId) {
      throw ApiError.forbidden('Not authorized to view this report');
    }

    return sendOk(res, {
      message: 'Success',
      data: report,
    });

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
      throw ApiError.forbidden('Admin access required');
    }

    const { page, limit } = getPaginationParams(req.query);
    const { status, category, targetType, priority, sort } = req.query;

    const result = await ReportService.getAllReports({
      page,
      limit,
      status,
      category,
      targetType,
      priority,
      sort,
    });

    return sendOk(res, {
      message: 'Success',
      data: {
        reports: result.reports,
        total: result.total,
        hasMore: result.hasMore,
      },
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
      throw ApiError.forbidden('Admin access required');
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

    return sendOk(res, {
      message: 'Success',
      data: {
        reports: result.reports,
        total: result.total,
        hasMore: result.hasMore,
      },
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
   * @returns {Object} Response with reports array, total count, and hasMore flag, or 403 on error
   */
  getReportsAgainstUser: CatchError(async (req, res) => {
    if (!req.user.isAdmin) {
      throw ApiError.forbidden('Admin access required');
    }

    const { userId } = req.params;
    const { page, limit } = getPaginationParams(req.query);
    const { status } = req.query;

    const result = await ReportService.getReportsAgainstUser(userId, {
      page,
      limit,
      status,
    });

    return sendOk(res, {
      message: 'Success',
      data: {
        reports: result.reports,
        total: result.total,
        hasMore: result.hasMore,
      },
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
   * @returns {Object} Response with updated report data or 403 on error
   */
  startReview: CatchError(async (req, res) => {
    if (!req.user.isAdmin) {
      throw ApiError.forbidden('Admin access required');
    }

    const { reportId } = req.params;
    const adminId = req.user.id;

    const report = await ReportService.startReview(reportId, adminId);
    return sendOk(res, {
      message: 'Review started',
      data: report,
    });
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
      throw ApiError.forbidden('Admin access required');
    }

    const { reportId } = req.params;
    const adminId = req.user.id;
    const { decision, actionTaken, notes } = normalizeResolutionPayload(
      req.body || {}
    );

    if (!decision) {
      throw ApiError.badRequest('Resolution input is required');
    }

    const report = await ReportService.resolveReport(reportId, adminId, {
      decision,
      actionTaken,
      notes,
    });

    return sendOk(res, {
      message: `Report ${decision}`,
      data: report,
    });
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
   * @returns {Object} Response with updated report data or 403 on error
   */
  updateReportStatus: CatchError(async (req, res) => {
    if (!req.user.isAdmin) {
      throw ApiError.forbidden('Admin access required');
    }

    const { reportId } = req.params;
    const adminId = req.user.id;
    const { status, notes } = req.body;

    const report = await ReportService.updateReportStatus(reportId, adminId, {
      status,
      notes,
    });

    return sendOk(res, {
      message: `Report status updated to ${status}`,
      data: report,
    });
  }),

};

export default ReportController;
