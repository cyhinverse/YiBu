import { CatchError } from "../../configs/CatchError.js";
import Notification from "../../models/mongodb/Notifications.js";
import { io } from "../../socket.js";

const createNotification = CatchError(async (req, res) => {
  console.log("CreateNotification received request body:", req.body);
  console.log("CreateNotification user from token:", req.user);

  const { recipient, sender, type, content, post, comment } = req.body;

  if (!recipient || !type || !content) {
    console.log("Missing required fields:", {
      hasRecipient: !!recipient,
      hasType: !!type,
      hasContent: !!content,
    });
    return res.status(400).json({
      code: 0,
      message: "Thiếu thông tin cần thiết",
      details: {
        recipient: recipient ? "provided" : "missing",
        type: type ? "provided" : "missing",
        content: content ? "provided" : "missing",
      },
    });
  }

  const notification = await Notification.create({
    recipient,
    sender: sender || req.user.id,
    type,
    content,
    post,
    comment,
    isRead: false,
  });

  await notification.populate("sender", "name avatar");

  io.to(recipient.toString()).emit("notification:new", notification);

  res.status(201).json({
    code: 1,
    message: "Đã tạo thông báo",
    notification,
  });
}, "Create notification failed");

const NotificationController = {
  createNotification,

  getNotifications: CatchError(async (req, res) => {
    const userId = req.user.id;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    console.log(
      `Fetching notifications for user ${userId}, page ${page}, limit ${limit}`
    );

    const totalNotifications = await Notification.countDocuments({
      recipient: userId,
    });
    const totalPages = Math.ceil(totalNotifications / limit);

    try {
      const notifications = await Notification.find({ recipient: userId })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate("sender", "username name avatar")
        .populate("post", "caption media")
        .populate("comment", "content");

      console.log(`Found ${notifications.length} notifications`);

      const processedNotifications = notifications.map((notification) => {
        const notificationObj = notification.toObject();

        if (!notificationObj.sender) {
          notificationObj.sender = {
            _id: notification.sender || "unknown",
            username: "Người dùng",
            name: "Người dùng",
            avatar: "https://via.placeholder.com/40",
          };
        } else if (notificationObj.sender) {
          if (!notificationObj.sender.username && notificationObj.sender.name) {
            notificationObj.sender.username = notificationObj.sender.name;
          }
          if (!notificationObj.sender.name && notificationObj.sender.username) {
            notificationObj.sender.name = notificationObj.sender.username;
          }
        }

        if (notificationObj.post) {
          if (!notificationObj.post.media) {
            notificationObj.post.media = [];
          }
        }

        if (
          notificationObj.type === "save" &&
          !notificationObj.content.includes("đã lưu bài viết")
        ) {
          notificationObj.content = `${
            notificationObj.sender.username ||
            notificationObj.sender.name ||
            "Người dùng"
          } đã lưu bài viết của bạn`;
        }

        return notificationObj;
      });

      res.json({
        code: 1,
        notifications: processedNotifications,
        pagination: {
          page,
          limit,
          totalNotifications,
          totalPages,
          hasMore: page < totalPages,
        },
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

    const notification = await Notification.findOneAndUpdate(
      {
        _id: notificationId,
        recipient: userId,
      },
      { isRead: true },
      { new: true }
    );

    if (!notification) {
      return res.status(404).json({
        code: 0,
        message: "Thông báo không tồn tại",
      });
    }

    res.json({
      code: 1,
      message: "Đã đánh dấu đã đọc",
      notification,
    });
  }, "Mark notification as read failed"),

  markAllAsRead: CatchError(async (req, res) => {
    const userId = req.user.id;

    await Notification.updateMany(
      {
        recipient: userId,
        isRead: false,
      },
      { isRead: true }
    );

    res.json({
      code: 1,
      message: "Đã đánh dấu tất cả là đã đọc",
    });
  }, "Mark all notifications as read failed"),

  deleteNotification: CatchError(async (req, res) => {
    const { notificationId } = req.params;
    const userId = req.user.id;

    const notification = await Notification.findOneAndDelete({
      _id: notificationId,
      recipient: userId,
    });

    if (!notification) {
      return res.status(404).json({
        code: 0,
        message: "Thông báo không tồn tại",
      });
    }

    res.json({
      code: 1,
      message: "Đã xóa thông báo",
    });
  }, "Delete notification failed"),

  getUnreadCount: CatchError(async (req, res) => {
    const userId = req.user.id;

    const unreadCount = await Notification.countDocuments({
      recipient: userId,
      isRead: false,
    });

    res.json({
      code: 1,
      unreadCount,
    });
  }, "Get unread count failed"),
};

export default NotificationController;
