import Notification from "../models/Notification.js";

const notificationController = {
  getNotifications: async (req, res) => {
    try {
      const userId = req.user._id;
      const notifications = await Notification.find({ recipient: userId })
        .sort({ createdAt: -1 })
        .populate("sender", "name avatar")
        .populate("post", "caption media")
        .populate("comment", "content");

      res.json({
        code: 1,
        notifications,
      });
    } catch (error) {
      console.error("Get notifications error:", error);
      res.status(500).json({
        code: 0,
        message: "Lỗi server",
      });
    }
  },

  markAsRead: async (req, res) => {
    try {
      const { notificationId } = req.params;
      const userId = req.user._id;

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
    } catch (error) {
      console.error("Mark notification as read error:", error);
      res.status(500).json({
        code: 0,
        message: "Lỗi server",
      });
    }
  },

  markAllAsRead: async (req, res) => {
    try {
      const userId = req.user._id;

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
    } catch (error) {
      console.error("Mark all notifications as read error:", error);
      res.status(500).json({
        code: 0,
        message: "Lỗi server",
      });
    }
  },

  deleteNotification: async (req, res) => {
    try {
      const { notificationId } = req.params;
      const userId = req.user._id;

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
    } catch (error) {
      console.error("Delete notification error:", error);
      res.status(500).json({
        code: 0,
        message: "Lỗi server",
      });
    }
  },
};

export default notificationController;
