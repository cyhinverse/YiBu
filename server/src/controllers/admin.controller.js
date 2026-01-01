import UserService from '../services/User.Service.js';
import PostService from '../services/Post.Service.js';
import AdminService from '../services/Admin.Service.js';
import mongoose from 'mongoose';
import { CatchError } from '../configs/CatchError.js';
import { formatResponse } from '../helpers/formatResponse.js';
import {
  getPaginationParams,
  getPaginationResponse,
} from '../helpers/pagination.js';
import logger from '../configs/logger.js';

export const AdminController = {

  /**
   * Get dashboard statistics
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @returns {Object} Response with dashboard statistics data including user counts, post counts, and activity metrics
   */
  getDashboardStats: CatchError(async (req, res) => {
    const stats = await AdminService.getDashboardStats();
    return formatResponse(
      res,
      200,
      1,
      'Dashboard stats retrieved successfully',
      stats
    );
  }),

  /**
   * Get user growth statistics
   * @param {Object} req - Express request object
   * @param {Object} req.query - Query parameters
   * @param {number} [req.query.days=30] - Number of days to retrieve statistics for
   * @param {Object} res - Express response object
   * @returns {Object} Response with user growth statistics over the specified period
   */
  getUserGrowthStats: CatchError(async (req, res) => {
    const days = parseInt(req.query.days) || 30;
    const stats = await AdminService.getUserGrowthStats(days);
    return formatResponse(res, 200, 1, 'User growth stats retrieved', stats);
  }),

  /**
   * Get post statistics
   * @param {Object} req - Express request object
   * @param {Object} req.query - Query parameters
   * @param {number} [req.query.days=30] - Number of days to retrieve statistics for
   * @param {Object} res - Express response object
   * @returns {Object} Response with post statistics over the specified period
   */
  getPostStats: CatchError(async (req, res) => {
    const days = parseInt(req.query.days) || 30;
    const stats = await AdminService.getPostStats(days);
    return formatResponse(res, 200, 1, 'Post stats retrieved', stats);
  }),

  /**
   * Get top engaged users
   * @param {Object} req - Express request object
   * @param {Object} req.query - Query parameters
   * @param {number} [req.query.limit=10] - Maximum number of users to return
   * @param {Object} res - Express response object
   * @returns {Object} Response with array of top engaged users sorted by engagement metrics
   */
  getTopEngagedUsers: CatchError(async (req, res) => {
    const limit = parseInt(req.query.limit) || 10;
    const users = await AdminService.getTopEngagedUsers(limit);
    return formatResponse(res, 200, 1, 'Top engaged users retrieved', users);
  }),

  /**
   * Get user interactions
   * @param {Object} req - Express request object
   * @param {Object} req.query - Query parameters
   * @param {number} [req.query.page] - Page number for pagination
   * @param {number} [req.query.limit] - Number of items per page
   * @param {string} [req.query.type] - Filter by interaction type
   * @param {string} [req.query.search] - Search term for filtering interactions
   * @param {Object} res - Express response object
   * @returns {Object} Response with interactions array, stats, and pagination info
   */
  getInteractions: CatchError(async (req, res) => {
    const { page, limit } = getPaginationParams(req.query);
    const { type, search } = req.query;

    const result = await AdminService.getInteractions({
      page,
      limit,
      type,
      search,
    });

    return formatResponse(res, 200, 1, 'Interactions retrieved successfully', {
      interactions: result.interactions,
      stats: result.stats,
      pagination: {
        total: result.total,
        page: result.page,
        totalPages: result.totalPages,
        hasMore: result.hasMore,
      },
    });
  }),

  /**
   * Get all users with pagination and filters
   * @param {Object} req - Express request object
   * @param {Object} req.query - Query parameters
   * @param {number} [req.query.page] - Page number for pagination
   * @param {number} [req.query.limit] - Number of items per page
   * @param {string} [req.query.search] - Search term for filtering users
   * @param {string} [req.query.status] - Filter by user status
   * @param {string} [req.query.sortBy] - Field to sort by
   * @param {string} [req.query.sortOrder] - Sort order ('asc' or 'desc')
   * @param {Object} res - Express response object
   * @returns {Object} Response with users array and pagination info
   */
  getAllUsers: CatchError(async (req, res) => {
    const { page, limit } = getPaginationParams(req.query);
    const { search, status, sortBy, sortOrder } = req.query;

    const result = await AdminService.getAllUsers({
      page,
      limit,
      search,
      status,
      sortBy,
      sortOrder: sortOrder === 'asc' ? 1 : -1,
    });

    return formatResponse(res, 200, 1, 'Users retrieved successfully', {
      users: result.users,
      pagination: {
        total: result.total,
        page: result.page,
        totalPages: result.totalPages,
        hasMore: result.hasMore,
      },
    });
  }),

  /**
   * Get user details by ID
   * @param {Object} req - Express request object
   * @param {Object} req.params - Route parameters
   * @param {string} req.params.userId - ID of the user to retrieve
   * @param {Object} res - Express response object
   * @returns {Object} Response with user details or 400 if invalid user ID format
   */
  getUserDetails: CatchError(async (req, res) => {
    const { userId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return formatResponse(res, 400, 0, 'Invalid user ID format');
    }

    const user = await AdminService.getUserById(userId);
    return formatResponse(
      res,
      200,
      1,
      'User details retrieved successfully',
      user
    );
  }),

  /**
   * Get posts by user ID
   * @param {Object} req - Express request object
   * @param {Object} req.params - Route parameters
   * @param {string} req.params.userId - ID of the user whose posts to retrieve
   * @param {Object} req.query - Query parameters
   * @param {number} [req.query.page] - Page number for pagination
   * @param {number} [req.query.limit] - Number of items per page
   * @param {Object} res - Express response object
   * @returns {Object} Response with user's posts and pagination info, or 400 if invalid user ID
   */
  getUserPosts: CatchError(async (req, res) => {
    const { userId } = req.params;
    const { page, limit } = getPaginationParams(req.query);

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return formatResponse(res, 400, 0, 'Invalid user ID format');
    }

    const result = await AdminService.getUserPosts(userId, { page, limit });
    return formatResponse(
      res,
      200,
      1,
      'User posts retrieved successfully',
      result
    );
  }),

  /**
   * Get reports by user ID
   * @param {Object} req - Express request object
   * @param {Object} req.params - Route parameters
   * @param {string} req.params.userId - ID of the user whose reports to retrieve
   * @param {Object} req.query - Query parameters
   * @param {number} [req.query.page] - Page number for pagination
   * @param {number} [req.query.limit] - Number of items per page
   * @param {Object} res - Express response object
   * @returns {Object} Response with user's reports and pagination info, or 400 if invalid user ID
   */
  getUserReports: CatchError(async (req, res) => {
    const { userId } = req.params;
    const { page, limit } = getPaginationParams(req.query);

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return formatResponse(res, 400, 0, 'Invalid user ID format');
    }

    const result = await AdminService.getUserReports(userId, { page, limit });
    return formatResponse(
      res,
      200,
      1,
      'User reports retrieved successfully',
      result
    );
  }),

  /**
   * Update user information
   * @param {Object} req - Express request object
   * @param {Object} req.params - Route parameters
   * @param {string} req.params.userId - ID of the user to update
   * @param {Object} req.body - Request body containing user fields to update
   * @param {Object} req.user - Authenticated admin user object
   * @param {string} req.user.id - Admin user's ID
   * @param {Object} res - Express response object
   * @returns {Object} Response with updated user data, or 400 if invalid user ID
   */
  updateUser: CatchError(async (req, res) => {
    const { userId } = req.params;
    const adminId = req.user.id;

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return formatResponse(res, 400, 0, 'Invalid user ID format');
    }

    const updatedUser = await AdminService.updateUser(
      userId,
      req.body,
      adminId
    );
    return formatResponse(
      res,
      200,
      1,
      'User updated successfully',
      updatedUser
    );
  }),

  /**
   * Delete a user
   * @param {Object} req - Express request object
   * @param {Object} req.params - Route parameters
   * @param {string} req.params.userId - ID of the user to delete
   * @param {Object} req.user - Authenticated admin user object
   * @param {string} req.user.id - Admin user's ID
   * @param {Object} res - Express response object
   * @returns {Object} Response with success message, or 400 if invalid user ID
   */
  deleteUser: CatchError(async (req, res) => {
    const { userId } = req.params;
    const adminId = req.user.id;

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return formatResponse(res, 400, 0, 'Invalid user ID format');
    }

    await UserService.deleteUser(userId);

    logger.info(`User ${userId} deleted by admin ${adminId}`);

    return formatResponse(res, 200, 1, 'User deleted successfully');
  }),

  /**
   * Ban a user
   * @param {Object} req - Express request object
   * @param {Object} req.body - Request body
   * @param {string} req.body.userId - ID of the user to ban
   * @param {string} [req.body.reason] - Reason for banning the user
   * @param {Object} req.user - Authenticated admin user object
   * @param {string} req.user.id - Admin user's ID
   * @param {Object} res - Express response object
   * @returns {Object} Response with banned user data, or 400 if invalid user ID
   */
  banUser: CatchError(async (req, res) => {
    const { userId, reason } = req.body;
    const adminId = req.user.id;

    if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
      return formatResponse(res, 400, 0, 'Valid user ID is required');
    }

    const user = await AdminService.banUser(userId, adminId, reason);
    return formatResponse(res, 200, 1, 'User banned successfully', user);
  }),

  /**
   * Unban a user
   * @param {Object} req - Express request object
   * @param {Object} req.body - Request body
   * @param {string} req.body.userId - ID of the user to unban
   * @param {Object} req.user - Authenticated admin user object
   * @param {string} req.user.id - Admin user's ID
   * @param {Object} res - Express response object
   * @returns {Object} Response with unbanned user data, or 400 if invalid user ID
   */
  unbanUser: CatchError(async (req, res) => {
    const { userId } = req.body;
    const adminId = req.user.id;

    if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
      return formatResponse(res, 400, 0, 'Valid user ID is required');
    }

    const user = await AdminService.unbanUser(userId, adminId);
    return formatResponse(res, 200, 1, 'User unbanned successfully', user);
  }),

  /**
   * Suspend a user temporarily
   * @param {Object} req - Express request object
   * @param {Object} req.body - Request body
   * @param {string} req.body.userId - ID of the user to suspend
   * @param {number} [req.body.days] - Number of days to suspend the user
   * @param {string} [req.body.reason] - Reason for suspending the user
   * @param {Object} req.user - Authenticated admin user object
   * @param {string} req.user.id - Admin user's ID
   * @param {Object} res - Express response object
   * @returns {Object} Response with suspended user data, or 400 if invalid user ID
   */
  suspendUser: CatchError(async (req, res) => {
    const { userId, days, reason } = req.body;
    const adminId = req.user.id;

    if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
      return formatResponse(res, 400, 0, 'Valid user ID is required');
    }

    const user = await AdminService.suspendUser(userId, adminId, days, reason);
    return formatResponse(res, 200, 1, 'User suspended successfully', user);
  }),

  /**
   * Issue a warning to a user
   * @param {Object} req - Express request object
   * @param {Object} req.body - Request body
   * @param {string} req.body.userId - ID of the user to warn
   * @param {string} req.body.reason - Reason for the warning (required)
   * @param {Object} req.user - Authenticated admin user object
   * @param {string} req.user.id - Admin user's ID
   * @param {Object} res - Express response object
   * @returns {Object} Response with warned user data, or 400 if invalid user ID or missing reason
   */
  warnUser: CatchError(async (req, res) => {
    const { userId, reason } = req.body;
    const adminId = req.user.id;

    if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
      return formatResponse(res, 400, 0, 'Valid user ID is required');
    }

    if (!reason) {
      return formatResponse(res, 400, 0, 'Warning reason is required');
    }

    const user = await AdminService.warnUser(userId, adminId, reason);
    return formatResponse(res, 200, 1, 'Warning issued successfully', user);
  }),

  /**
   * Get list of banned users
   * @param {Object} req - Express request object
   * @param {Object} req.query - Query parameters
   * @param {number} [req.query.page] - Page number for pagination
   * @param {number} [req.query.limit] - Number of items per page
   * @param {Object} res - Express response object
   * @returns {Object} Response with banned users array and pagination info
   */
  getBannedUsers: CatchError(async (req, res) => {
    const { page, limit } = getPaginationParams(req.query);

    const result = await AdminService.getAllUsers({
      page,
      limit,
      status: 'banned',
    });

    return formatResponse(res, 200, 1, 'Banned users retrieved', {
      users: result.users,
      pagination: {
        total: result.total,
        page: result.page,
        totalPages: result.totalPages,
        hasMore: result.hasMore,
      },
    });
  }),

  /**
   * Get all posts with pagination and filters
   * @param {Object} req - Express request object
   * @param {Object} req.query - Query parameters
   * @param {number} [req.query.page] - Page number for pagination
   * @param {number} [req.query.limit] - Number of items per page
   * @param {string} [req.query.status] - Filter by post status
   * @param {string} [req.query.sortBy] - Field to sort by
   * @param {string} [req.query.sortOrder] - Sort order ('asc' or 'desc')
   * @param {Object} res - Express response object
   * @returns {Object} Response with posts array and pagination info
   */
  getAllPosts: CatchError(async (req, res) => {
    const { page, limit } = getPaginationParams(req.query);
    const { status, sortBy, sortOrder } = req.query;

    const result = await AdminService.getAllPosts({
      page,
      limit,
      status,
      sortBy,
      sortOrder: sortOrder === 'asc' ? 1 : -1,
    });

    return formatResponse(res, 200, 1, 'Posts retrieved successfully', {
      posts: result.posts,
      pagination: {
        total: result.total,
        page: result.page,
        totalPages: result.totalPages,
        hasMore: result.hasMore,
      },
    });
  }),

  /**
   * Get reports for a specific post
   * @param {Object} req - Express request object
   * @param {Object} req.params - Route parameters
   * @param {string} req.params.postId - ID of the post to get reports for
   * @param {Object} req.query - Query parameters
   * @param {number} [req.query.page] - Page number for pagination
   * @param {number} [req.query.limit] - Number of items per page
   * @param {Object} res - Express response object
   * @returns {Object} Response with post reports and pagination info, or 400 if invalid post ID
   */
  getPostReports: CatchError(async (req, res) => {
    const { postId } = req.params;
    const { page, limit } = getPaginationParams(req.query);

    if (!mongoose.Types.ObjectId.isValid(postId)) {
      return formatResponse(res, 400, 0, 'Invalid post ID format');
    }

    const result = await AdminService.getPostReports(postId, { page, limit });
    return formatResponse(
      res,
      200,
      1,
      'Post reports retrieved successfully',
      result
    );
  }),

  /**
   * Moderate a post (approve/reject/flag/remove)
   * @param {Object} req - Express request object
   * @param {Object} req.params - Route parameters
   * @param {string} req.params.postId - ID of the post to moderate
   * @param {Object} req.body - Request body
   * @param {string} req.body.action - Moderation action (approve/reject/flag/remove)
   * @param {string} [req.body.reason] - Reason for the moderation action
   * @param {Object} req.user - Authenticated admin user object
   * @param {string} req.user.id - Admin user's ID
   * @param {Object} res - Express response object
   * @returns {Object} Response with moderated post data, or 400 if invalid post ID or missing action
   */
  moderatePost: CatchError(async (req, res) => {
    const { postId } = req.params;
    const { action, reason } = req.body;
    const adminId = req.user.id;

    if (!mongoose.Types.ObjectId.isValid(postId)) {
      return formatResponse(res, 400, 0, 'Invalid post ID format');
    }

    if (!action) {
      return formatResponse(
        res,
        400,
        0,
        'Action is required (approve/reject/flag/remove)'
      );
    }

    const post = await AdminService.moderatePost(
      postId,
      adminId,
      action,
      reason
    );
    return formatResponse(res, 200, 1, `Post ${action}d successfully`, post);
  }),

  /**
   * Approve a post
   * @param {Object} req - Express request object
   * @param {Object} req.params - Route parameters
   * @param {string} req.params.postId - ID of the post to approve
   * @param {Object} req.user - Authenticated admin user object
   * @param {string} req.user.id - Admin user's ID
   * @param {Object} res - Express response object
   * @returns {Object} Response with approved post data, or 400 if invalid post ID
   */
  approvePost: CatchError(async (req, res) => {
    const { postId } = req.params;
    const adminId = req.user.id;

    if (!mongoose.Types.ObjectId.isValid(postId)) {
      return formatResponse(res, 400, 0, 'Invalid post ID format');
    }

    const post = await AdminService.moderatePost(postId, adminId, 'approve');
    return formatResponse(res, 200, 1, 'Post approved successfully', post);
  }),

  /**
   * Delete a post
   * @param {Object} req - Express request object
   * @param {Object} req.params - Route parameters
   * @param {string} req.params.postId - ID of the post to delete
   * @param {Object} req.body - Request body
   * @param {string} [req.body.reason] - Reason for deleting the post
   * @param {Object} req.user - Authenticated admin user object
   * @param {string} req.user.id - Admin user's ID
   * @param {Object} res - Express response object
   * @returns {Object} Response with success message, or 400 if invalid post ID
   */
  deletePost: CatchError(async (req, res) => {
    const { postId } = req.params;
    const { reason } = req.body;
    const adminId = req.user.id;

    if (!mongoose.Types.ObjectId.isValid(postId)) {
      return formatResponse(res, 400, 0, 'Invalid post ID format');
    }

    await AdminService.deletePost(postId, adminId, reason);
    return formatResponse(res, 200, 1, 'Post deleted successfully');
  }),

  /**
   * Get all comments with pagination and filters
   * @param {Object} req - Express request object
   * @param {Object} req.query - Query parameters
   * @param {number} [req.query.page] - Page number for pagination
   * @param {number} [req.query.limit] - Number of items per page
   * @param {string} [req.query.search] - Search term for filtering comments
   * @param {string} [req.query.status] - Filter by comment status
   * @param {string} [req.query.sortBy] - Field to sort by
   * @param {string} [req.query.sortOrder] - Sort order ('asc' or 'desc')
   * @param {Object} res - Express response object
   * @returns {Object} Response with comments array and pagination info
   */
  getAllComments: CatchError(async (req, res) => {
    const { page, limit } = getPaginationParams(req.query);
    const { search, status, sortBy, sortOrder } = req.query;

    const result = await AdminService.getAllComments({
      page,
      limit,
      search,
      status,
      sortBy,
      sortOrder: sortOrder === 'asc' ? 1 : -1,
    });

    return formatResponse(res, 200, 1, 'Comments retrieved successfully', {
      comments: result.comments,
      pagination: {
        total: result.total,
        page: result.page,
        totalPages: result.totalPages,
        hasMore: result.hasMore,
      },
    });
  }),

  /**
   * Moderate a comment
   * @param {Object} req - Express request object
   * @param {Object} req.params - Route parameters
   * @param {string} req.params.commentId - ID of the comment to moderate
   * @param {Object} req.body - Request body
   * @param {string} req.body.action - Moderation action to perform
   * @param {string} [req.body.reason] - Reason for the moderation action
   * @param {Object} req.user - Authenticated admin user object
   * @param {string} req.user.id - Admin user's ID
   * @param {Object} res - Express response object
   * @returns {Object} Response with moderated comment data, or 400 if invalid comment ID
   */
  moderateComment: CatchError(async (req, res) => {
    const { commentId } = req.params;
    const { action, reason } = req.body;
    const adminId = req.user.id;

    if (!mongoose.Types.ObjectId.isValid(commentId)) {
      return formatResponse(res, 400, 0, 'Invalid comment ID format');
    }

    const comment = await AdminService.moderateComment(
      commentId,
      adminId,
      action,
      reason
    );
    return formatResponse(
      res,
      200,
      1,
      `Comment ${action}d successfully`,
      comment
    );
  }),

  /**
   * Delete a comment
   * @param {Object} req - Express request object
   * @param {Object} req.params - Route parameters
   * @param {string} req.params.commentId - ID of the comment to delete
   * @param {Object} req.body - Request body
   * @param {string} [req.body.reason] - Reason for deleting the comment
   * @param {Object} req.user - Authenticated admin user object
   * @param {string} req.user.id - Admin user's ID
   * @param {Object} res - Express response object
   * @returns {Object} Response with deleted comment data, or 400 if invalid comment ID
   */
  deleteComment: CatchError(async (req, res) => {
    const { commentId } = req.params;
    const { reason } = req.body;
    const adminId = req.user.id;

    if (!mongoose.Types.ObjectId.isValid(commentId)) {
      return formatResponse(res, 400, 0, 'Invalid comment ID format');
    }

    const comment = await AdminService.moderateComment(
      commentId,
      adminId,
      'remove',
      reason
    );
    return formatResponse(res, 200, 1, 'Comment deleted successfully', comment);
  }),

  /**
   * Get all reports with pagination and filters
   * @param {Object} req - Express request object
   * @param {Object} req.query - Query parameters
   * @param {number} [req.query.page] - Page number for pagination
   * @param {number} [req.query.limit] - Number of items per page
   * @param {string} [req.query.status] - Filter by report status
   * @param {string} [req.query.category] - Filter by report category
   * @param {string} [req.query.priority] - Filter by priority level
   * @param {Object} res - Express response object
   * @returns {Object} Response with reports array and pagination info
   */
  getReports: CatchError(async (req, res) => {
    const { page, limit } = getPaginationParams(req.query);
    const { status, category, priority } = req.query;

    const result = await AdminService.getReports({
      page,
      limit,
      status,
      category,
      priority,
    });

    return formatResponse(res, 200, 1, 'Reports retrieved successfully', {
      reports: result.reports,
      pagination: {
        total: result.total,
        page: result.page,
        totalPages: result.totalPages,
        hasMore: result.hasMore,
      },
    });
  }),

  /**
   * Review a report
   * @param {Object} req - Express request object
   * @param {Object} req.params - Route parameters
   * @param {string} req.params.reportId - ID of the report to review
   * @param {Object} req.body - Request body
   * @param {string} req.body.decision - Decision for the report (resolved/rejected/escalated)
   * @param {string} [req.body.actionTaken] - Action taken on the report
   * @param {Object} req.user - Authenticated admin user object
   * @param {string} req.user.id - Admin user's ID
   * @param {Object} res - Express response object
   * @returns {Object} Response with reviewed report data, or 400 if invalid report ID or missing decision
   */
  reviewReport: CatchError(async (req, res) => {
    const { reportId } = req.params;
    const { decision, actionTaken } = req.body;
    const adminId = req.user.id;

    if (!mongoose.Types.ObjectId.isValid(reportId)) {
      return formatResponse(res, 400, 0, 'Invalid report ID format');
    }

    if (!decision) {
      return formatResponse(
        res,
        400,
        0,
        'Decision is required (resolved/rejected/escalated)'
      );
    }

    const report = await AdminService.reviewReport(
      reportId,
      adminId,
      decision,
      actionTaken
    );
    return formatResponse(res, 200, 1, 'Report reviewed successfully', report);
  }),

  /**
   * Broadcast notification to users
   * @param {Object} req - Express request object
   * @param {Object} req.body - Request body
   * @param {string} [req.body.title] - Notification title
   * @param {string} [req.body.message] - Notification message
   * @param {string} [req.body.content] - Notification content (alternative to title+message)
   * @param {string} [req.body.targetAudience] - Target audience for the notification
   * @param {string} [req.body.targetGroup] - Target group for the notification (defaults to 'all')
   * @param {string} [req.body.type] - Type of notification
   * @param {string} [req.body.priority] - Priority level of the notification
   * @param {string} [req.body.link] - Link associated with the notification
   * @param {Object} req.user - Authenticated admin user object
   * @param {string} req.user.id - Admin user's ID
   * @param {Object} res - Express response object
   * @returns {Object} Response with sent count and result data, or 400 if content is missing
   */
  broadcastNotification: CatchError(async (req, res) => {
    const {
      title,
      message,
      content,
      targetAudience,
      targetGroup,
      type,
      priority,
      link,
    } = req.body;
    const adminId = req.user.id;

    const finalContent = content || (title ? `${title}: ${message}` : message);
    const finalTargetGroup = targetGroup || targetAudience || 'all';

    if (!finalContent) {
      return formatResponse(res, 400, 0, 'Notification content is required');
    }

    const result = await AdminService.broadcastNotification(
      adminId,
      finalContent,
      finalTargetGroup
    );
    return formatResponse(
      res,
      200,
      1,
      `Notification sent to ${result.sentCount} users`,
      result
    );
  }),

  /**
   * Get system health status
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @returns {Object} Response with system health data including status, uptime, memory usage, and timestamp
   */
  getSystemHealth: CatchError(async (req, res) => {
    const health = {
      status: 'healthy',
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      timestamp: new Date(),
    };
    return formatResponse(res, 200, 1, 'System health retrieved', health);
  }),

  /**
   * Get admin activity logs
   * @param {Object} req - Express request object
   * @param {Object} req.query - Query parameters
   * @param {number} [req.query.page] - Page number for pagination
   * @param {number} [req.query.limit] - Number of items per page
   * @param {Object} res - Express response object
   * @returns {Object} Response with admin activity logs and pagination info
   */
  getAdminLogs: CatchError(async (req, res) => {
    const { page, limit } = getPaginationParams(req.query);

    const result = await AdminService.getAdminLogs({ page, limit });
    return formatResponse(res, 200, 1, 'Admin logs retrieved', result);
  }),

  /**
   * Get system settings
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @returns {Object} Response with current system settings
   */
  getSystemSettings: CatchError(async (req, res) => {
    const settings = await AdminService.getSystemSettings();
    return formatResponse(res, 200, 1, 'System settings retrieved', settings);
  }),

  /**
   * Update system settings
   * @param {Object} req - Express request object
   * @param {Object} req.body - Request body containing settings to update
   * @param {Object} req.user - Authenticated admin user object
   * @param {string} req.user.id - Admin user's ID
   * @param {Object} res - Express response object
   * @returns {Object} Response with updated system settings
   */
  updateSystemSettings: CatchError(async (req, res) => {
    const updatedSettings = await AdminService.updateSystemSettings(
      req.body,
      req.user.id
    );
    return formatResponse(
      res,
      200,
      1,
      'System settings updated',
      updatedSettings
    );
  }),

  /**
   * Get revenue statistics
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @returns {Object} Response with revenue statistics data
   */
  getRevenueStats: CatchError(async (req, res) => {
    const stats = await AdminService.getRevenueStats();
    return formatResponse(res, 200, 1, 'Revenue stats retrieved', stats);
  }),

  /**
   * Get transactions list
   * @param {Object} req - Express request object
   * @param {Object} req.query - Query parameters
   * @param {number} [req.query.page] - Page number for pagination
   * @param {number} [req.query.limit] - Number of items per page
   * @param {string} [req.query.status] - Filter by transaction status
   * @param {string} [req.query.type] - Filter by transaction type
   * @param {Object} res - Express response object
   * @returns {Object} Response with transactions array and pagination info
   */
  getTransactions: CatchError(async (req, res) => {
    const { page, limit } = getPaginationParams(req.query);
    const { status, type } = req.query;

    const result = await AdminService.getTransactions({
      page,
      limit,
      status,
      type,
    });
    return formatResponse(res, 200, 1, 'Transactions retrieved', result);
  }),
};
