import { CatchError } from "../configs/CatchError.js";
import NotificationService from "../services/Notification.service.js";
import { formatResponse } from "../helpers/formatResponse.js";
import { getPaginationParams } from "../helpers/pagination.js";
import socketService from "../services/Socket.Service.js";

/**
 * Notification Controller
 * Handle all notification-related requests
 *
 * Main features:
 * - Create and retrieve notifications
 * - Mark as read
 * - Delete notifications
 * - Unread notification statistics
 * - Notification preferences
 */
const NotificationController = {

  /**
   * Create a new notification
   * @param {Object} req - Express request object
   * @param {Object} req.body - Request body
   * @param {string} req.body.recipient - ID of the notification recipient
   * @param {string} req.body.type - Type of notification
   * @param {string} [req.body.content] - Notification content
   * @param {string} [req.body.relatedPost] - ID of related post
   * @param {string} [req.body.relatedComment] - ID of related comment
   * @param {string} [req.body.groupKey] - Group key for notification grouping
   * @param {Object} [req.body.metadata] - Additional metadata
   * @param {string} [req.body.sender] - ID of sender (defaults to current user)
   * @param {Object} req.user - Authenticated user object
   * @param {string} req.user.id - Current user's ID
   * @param {Object} res - Express response object
   * @returns {Object} Response with created notification data
   */
  createNotification: CatchError(async (req, res) => {
    const {
      recipient,
      type,
      content,
      relatedPost,
      relatedComment,
      groupKey,
      metadata,
    } = req.body;
    const sender = req.body.sender || req.user.id;

    if (!recipient || !type) {
      return formatResponse(res, 400, 0, "Recipient and type are required");
    }

    const notification = await NotificationService.createNotification({
      recipient,
      sender,
      type,
      content,
      relatedPost,
      relatedComment,
      groupKey,
      metadata,
    });

    if (notification) {
      socketService.emitNotification(recipient.toString(), notification);
    }

    return formatResponse(res, 201, 1, "Đã tạo thông báo", notification);
  }),

  /**
   * Get notifications for current user
   * @param {Object} req - Express request object
   * @param {Object} req.query - Query parameters
   * @param {number} [req.query.page] - Page number for pagination
   * @param {number} [req.query.limit] - Number of items per page
   * @param {string} [req.query.type] - Filter by notification type
   * @param {string} [req.query.unreadOnly] - Filter to show only unread notifications ("true"/"false")
   * @param {Object} req.user - Authenticated user object
   * @param {string} req.user.id - Current user's ID
   * @param {Object} res - Express response object
   * @returns {Object} Response with notifications array, total count, unread count, and hasMore flag
   */
  getNotifications: CatchError(async (req, res) => {
    const userId = req.user.id;
    const { page, limit } = getPaginationParams(req.query, {
      defaultLimit: 20,
    });
    const { type, unreadOnly } = req.query;

    const result = await NotificationService.getNotifications(userId, {
      page,
      limit,
      type,
      unreadOnly: unreadOnly === "true",
    });

    return formatResponse(res, 200, 1, "Success", {
      notifications: result.notifications,
      total: result.total,
      unreadCount: result.unreadCount,
      hasMore: result.hasMore,
    });
  }),

  /**
   * Get single notification by ID
   * @param {Object} req - Express request object
   * @param {Object} req.params - Route parameters
   * @param {string} req.params.notificationId - ID of the notification to retrieve
   * @param {Object} req.user - Authenticated user object
   * @param {string} req.user.id - Current user's ID
   * @param {Object} res - Express response object
   * @returns {Object} Response with notification data or 404 if not found
   */
  getNotificationById: CatchError(async (req, res) => {
    const { notificationId } = req.params;
    const userId = req.user.id;

    const notification = await NotificationService.getNotificationById(
      notificationId,
      userId
    );

    if (!notification) {
      return formatResponse(res, 404, 0, "Thông báo không tồn tại");
    }

    return formatResponse(res, 200, 1, "Success", notification);
  }),

  /**
   * Mark a notification as read
   * @param {Object} req - Express request object
   * @param {Object} req.params - Route parameters
   * @param {string} req.params.notificationId - ID of the notification to mark as read
   * @param {Object} req.user - Authenticated user object
   * @param {string} req.user.id - Current user's ID
   * @param {Object} res - Express response object
   * @returns {Object} Response with updated notification data or 404 if not found
   */
  markAsRead: CatchError(async (req, res) => {
    const { notificationId } = req.params;
    const userId = req.user.id;

    const notification = await NotificationService.markAsRead(
      notificationId,
      userId
    );

    if (!notification) {
      return formatResponse(res, 404, 0, "Thông báo không tồn tại");
    }

    return formatResponse(res, 200, 1, "Đã đánh dấu đã đọc", notification);
  }),

  /**
   * Mark all notifications as read
   * @param {Object} req - Express request object
   * @param {Object} req.body - Request body
   * @param {string} [req.body.type] - Optional notification type to filter which notifications to mark as read
   * @param {Object} req.user - Authenticated user object
   * @param {string} req.user.id - Current user's ID
   * @param {Object} res - Express response object
   * @returns {Object} Response with result of the mark all operation
   */
  markAllAsRead: CatchError(async (req, res) => {
    const userId = req.user.id;
    const { type } = req.body;

    const result = await NotificationService.markAllAsRead(userId, type);
    return formatResponse(res, 200, 1, "Đã đánh dấu tất cả là đã đọc", result);
  }),

  /**
   * Delete a notification
   * @param {Object} req - Express request object
   * @param {Object} req.params - Route parameters
   * @param {string} req.params.notificationId - ID of the notification to delete
   * @param {Object} req.user - Authenticated user object
   * @param {string} req.user.id - Current user's ID
   * @param {Object} res - Express response object
   * @returns {Object} Response with success message or 404 if not found
   */
  deleteNotification: CatchError(async (req, res) => {
    const { notificationId } = req.params;
    const userId = req.user.id;

    const result = await NotificationService.deleteNotification(
      notificationId,
      userId
    );

    if (!result.success) {
      return formatResponse(res, 404, 0, "Thông báo không tồn tại");
    }

    return formatResponse(res, 200, 1, "Đã xóa thông báo");
  }),

  /**
   * Delete all notifications
   * @param {Object} req - Express request object
   * @param {Object} req.body - Request body
   * @param {string} [req.body.type] - Optional notification type to filter which notifications to delete
   * @param {Object} req.user - Authenticated user object
   * @param {string} req.user.id - Current user's ID
   * @param {Object} res - Express response object
   * @returns {Object} Response with deleted count and result data
   */
  deleteAllNotifications: CatchError(async (req, res) => {
    const userId = req.user.id;
    const { type } = req.body;

    const result = await NotificationService.deleteAllNotifications(
      userId,
      type
    );
    return formatResponse(
      res,
      200,
      1,
      `Đã xóa ${result.deletedCount} thông báo`,
      result
    );
  }),

  /**
   * Get total unread notification count
   * @param {Object} req - Express request object
   * @param {Object} req.user - Authenticated user object
   * @param {string} req.user.id - Current user's ID
   * @param {Object} res - Express response object
   * @returns {Object} Response with unreadCount number
   */
  getUnreadCount: CatchError(async (req, res) => {
    const userId = req.user.id;

    const unreadCount = await NotificationService.getUnreadCount(userId);
    return formatResponse(res, 200, 1, "Success", { unreadCount });
  }),

  /**
   * Get unread notification count by type
   * @param {Object} req - Express request object
   * @param {Object} req.user - Authenticated user object
   * @param {string} req.user.id - Current user's ID
   * @param {Object} res - Express response object
   * @returns {Object} Response with counts object grouped by notification type
   */
  getUnreadCountByType: CatchError(async (req, res) => {
    const userId = req.user.id;

    const counts = await NotificationService.getUnreadCountByType(userId);
    return formatResponse(res, 200, 1, "Success", counts);
  }),

  /**
   * Get notification preferences for current user
   * @param {Object} req - Express request object
   * @param {Object} req.user - Authenticated user object
   * @param {string} req.user.id - Current user's ID
   * @param {Object} res - Express response object
   * @returns {Object} Response with user's notification preferences
   */
  getNotificationPreferences: CatchError(async (req, res) => {
    const userId = req.user.id;

    const preferences = await NotificationService.getNotificationPreferences(
      userId
    );
    return formatResponse(res, 200, 1, "Success", preferences);
  }),

  /**
   * Update notification preferences
   * @param {Object} req - Express request object
   * @param {Object} req.body - Request body containing preference settings to update
   * @param {Object} req.user - Authenticated user object
   * @param {string} req.user.id - Current user's ID
   * @param {Object} res - Express response object
   * @returns {Object} Response with updated notification preferences
   */
  updateNotificationPreferences: CatchError(async (req, res) => {
    const userId = req.user.id;
    const preferences = req.body;

    const updated = await NotificationService.updateNotificationPreferences(
      userId,
      preferences
    );
    return formatResponse(
      res,
      200,
      1,
      "Đã cập nhật cài đặt thông báo",
      updated
    );
  }),
};

export default NotificationController;
