import { CatchError } from "../../configs/CatchError.js";
import NotificationService from "../../services/Notification.service.js";
import { io } from "../../socket.js";

const createNotification = CatchError(async (req, res) => {
  console.log("CreateNotification received request body:", req.body);
  console.log("CreateNotification user from token:", req.user);

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

    io.to(recipient.toString()).emit("notification:new", notification);

    res.status(201).json({
      code: 1,
      message: "Đã tạo thông báo",
      notification,
    });
  } catch (error) {
    if (error.message === "Thiếu thông tin cần thiết") {
      console.log("Missing required fields:", {
        hasRecipient: !!recipient,
        hasType: !!type,
        hasContent: !!content,
      });
      return res.status(400).json({
        code: 0,
        message: error.message,
        details: {
          recipient: recipient ? "provided" : "missing",
          type: type ? "provided" : "missing",
          content: content ? "provided" : "missing",
        },
      });
    }
    throw error;
  }
}, "Create notification failed");

const NotificationController = {
  createNotification,

  getNotifications: CatchError(async (req, res) => {
    const userId = req.user.id;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;

    console.log(
      `Fetching notifications for user ${userId}, page ${page}, limit ${limit}`
    );

    try {
      const result = await NotificationService.getNotifications(
        userId,
        page,
        limit
      );
      console.log(`Found ${result.notifications.length} notifications`);

      res.json({
        code: 1,
        notifications: result.notifications,
        pagination: result.pagination,
      });
    } catch (error) {
      console.error("Error fetching notifications:", error);
      res.status(500).json({
        code: 0,
        message: "Lỗi khi lấy thông báo",
        error: error.message,
      });
    }
  }, "Get notifications failed"),

  markAsRead: CatchError(async (req, res) => {
    const { notificationId } = req.params;
    const userId = req.user.id;

    try {
      const notification = await NotificationService.markAsRead(
        notificationId,
        userId
      );

      res.json({
        code: 1,
        message: "Đã đánh dấu đã đọc",
        notification,
      });
    } catch (error) {
      if (error.message === "Thông báo không tồn tại") {
        return res.status(404).json({
          code: 0,
          message: error.message,
        });
      }
      throw error;
    }
  }, "Mark notification as read failed"),

  markAllAsRead: CatchError(async (req, res) => {
    const userId = req.user.id;

    await NotificationService.markAllAsRead(userId);

    res.json({
      code: 1,
      message: "Đã đánh dấu tất cả là đã đọc",
    });
  }, "Mark all notifications as read failed"),

  deleteNotification: CatchError(async (req, res) => {
    const { notificationId } = req.params;
    const userId = req.user.id;

    try {
      await NotificationService.deleteNotification(notificationId, userId);

      res.json({
        code: 1,
        message: "Đã xóa thông báo",
      });
    } catch (error) {
      if (error.message === "Thông báo không tồn tại") {
        return res.status(404).json({
          code: 0,
          message: error.message,
        });
      }
      throw error;
    }
  }, "Delete notification failed"),

  getUnreadCount: CatchError(async (req, res) => {
    const userId = req.user.id;

    const unreadCount = await NotificationService.getUnreadCount(userId);

    res.json({
      code: 1,
      unreadCount,
    });
  }, "Get unread count failed"),
};

export default NotificationController;
