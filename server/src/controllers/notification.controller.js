import { CatchError } from "../configs/CatchError.js";
import NotificationService from "../services/Notification.service.js";
import { formatResponse } from "../helpers/formatResponse.js";
import { getPaginationParams } from "../helpers/pagination.js";
import socketService from "../services/Socket.Service.js";

const NotificationController = {
  // ======================================
  // Create Notification (Admin/System use)
  // ======================================

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

  // ======================================
  // Get Notifications
  // ======================================

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

  // ======================================
  // Mark as Read
  // ======================================

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

  markAllAsRead: CatchError(async (req, res) => {
    const userId = req.user.id;
    const { type } = req.body;

    const result = await NotificationService.markAllAsRead(userId, type);
    return formatResponse(res, 200, 1, "Đã đánh dấu tất cả là đã đọc", result);
  }),

  // ======================================
  // Delete Notifications
  // ======================================

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

  // ======================================
  // Stats
  // ======================================

  getUnreadCount: CatchError(async (req, res) => {
    const userId = req.user.id;

    const unreadCount = await NotificationService.getUnreadCount(userId);
    return formatResponse(res, 200, 1, "Success", { unreadCount });
  }),

  getUnreadCountByType: CatchError(async (req, res) => {
    const userId = req.user.id;

    const counts = await NotificationService.getUnreadCountByType(userId);
    return formatResponse(res, 200, 1, "Success", counts);
  }),

  // ======================================
  // Notification Settings
  // ======================================

  getNotificationPreferences: CatchError(async (req, res) => {
    const userId = req.user.id;

    const preferences = await NotificationService.getNotificationPreferences(
      userId
    );
    return formatResponse(res, 200, 1, "Success", preferences);
  }),

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
