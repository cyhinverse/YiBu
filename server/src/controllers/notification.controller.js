import { CatchError } from "../configs/CatchError.js";
import NotificationService from "../services/Notification.service.js";
import { formatResponse } from "../helpers/formatResponse.js";
import { getPaginationParams } from "../helpers/pagination.js";
import SocketService from "../services/Socket.Service.js";

const createNotification = CatchError(async (req, res) => {
  const { recipient, sender, type, content, post, comment } = req.body;

  try {
    const notification = await NotificationService.createNotification(
      recipient,
      sender || req.user.id,
      type,
      content,
      post,
      comment
    );

    // Use SocketService
    SocketService.emitNotification(recipient.toString(), notification);

    return formatResponse(res, 201, 1, "Đã tạo thông báo", notification);
  } catch (error) {
    if (error.message === "Thiếu thông tin cần thiết") {
      error.statusCode = 400;
    }
    throw error;
  }
});

const NotificationController = {
  createNotification,

  getNotifications: CatchError(async (req, res) => {
    const userId = req.user.id;
    const { page, limit } = getPaginationParams(req.query, { defaultLimit: 20 });

    const result = await NotificationService.getNotifications(
      userId,
      page,
      limit
    );

    return formatResponse(res, 200, 1, "Success", null, {
        notifications: result.notifications,
        pagination: result.pagination,
    });
  }),

  markAsRead: CatchError(async (req, res) => {
    const { notificationId } = req.params;
    const userId = req.user.id;

    try {
      const notification = await NotificationService.markAsRead(
        notificationId,
        userId
      );
      return formatResponse(res, 200, 1, "Đã đánh dấu đã đọc", notification);
    } catch (error) {
      if (error.message === "Thông báo không tồn tại") {
        error.statusCode = 404;
      }
      throw error;
    }
  }),

  markAllAsRead: CatchError(async (req, res) => {
    const userId = req.user.id;
    await NotificationService.markAllAsRead(userId);
    return formatResponse(res, 200, 1, "Đã đánh dấu tất cả là đã đọc");
  }),

  deleteNotification: CatchError(async (req, res) => {
    const { notificationId } = req.params;
    const userId = req.user.id;

    try {
      await NotificationService.deleteNotification(notificationId, userId);
      return formatResponse(res, 200, 1, "Đã xóa thông báo");
    } catch (error) {
      if (error.message === "Thông báo không tồn tại") {
        error.statusCode = 404;
      }
      throw error;
    }
  }),

  getUnreadCount: CatchError(async (req, res) => {
    const userId = req.user.id;
    const unreadCount = await NotificationService.getUnreadCount(userId);
    return formatResponse(res, 200, 1, "Success", null, { unreadCount });
  }),
};

export default NotificationController;
