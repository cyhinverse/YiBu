import Notification from "../models/Notification.js";
import { getPaginationResponse } from "../helpers/pagination.js";

class NotificationService {
  static async createNotification(
    recipientId,
    senderId,
    type,
    content,
    postId = null,
    commentId = null
  ) {
    if (!recipientId || !type || !content) {
      throw new Error("Thiếu thông tin cần thiết");
    }

    const notification = await Notification.create({
      recipient: recipientId,
      sender: senderId,
      type,
      content,
      post: postId,
      comment: commentId,
      isRead: false,
    });

    await notification.populate("sender", "name profile.avatar");

    return notification;
  }

  static async getNotifications(userId, page = 1, limit = 20) {
    const skip = (page - 1) * limit;

    const totalNotifications = await Notification.countDocuments({
      recipient: userId,
    });
    const totalPages = Math.ceil(totalNotifications / limit);

    const notifications = await Notification.find({ recipient: userId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate("sender", "username name profile.avatar")
      .populate("post", "caption media")
      .populate("comment", "content");

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

    const { pagination } = getPaginationResponse({ data: processedNotifications, total: totalNotifications, page, limit });

    return {
      notifications: processedNotifications,
      pagination,
    };
  }

  static async markAsRead(notificationId, userId) {
    const notification = await Notification.findOneAndUpdate(
      {
        _id: notificationId,
        recipient: userId,
      },
      { isRead: true },
      { new: true }
    );

    if (!notification) {
      throw new Error("Thông báo không tồn tại");
    }

    return notification;
  }

  static async markAllAsRead(userId) {
    const result = await Notification.updateMany(
      {
        recipient: userId,
        isRead: false,
      },
      { isRead: true }
    );

    return {
      modifiedCount: result.modifiedCount,
    };
  }

  static async deleteNotification(notificationId, userId) {
    const notification = await Notification.findOneAndDelete({
      _id: notificationId,
      recipient: userId,
    });

    if (!notification) {
      throw new Error("Thông báo không tồn tại");
    }

    return notification;
  }

  static async getUnreadCount(userId) {
    const unreadCount = await Notification.countDocuments({
      recipient: userId,
      isRead: false,
    });

    return unreadCount;
  }
}

export default NotificationService;
