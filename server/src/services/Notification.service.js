import Notifications from "../models/Notifications.js";

class NotificationService {
  static async createNotification(notificationData) {
    try {
      const notification = await Notifications.create(notificationData);
      return notification;
    } catch (error) {
      console.error("Error creating notification:", error);
      throw new Error("Failed to create notification");
    }
  }

  static async getNotificationsByUserId(userId) {
    try {
      const notifications = await Notifications.find({ userId });
      return notifications;
    } catch (error) {
      console.error("Error getting notifications:", error);
      throw new Error("Failed to get notifications");
    }
  }

  static async deleteNotification(notificationId) {
    try {
      const notification = await Notifications.findByIdAndDelete(
        notificationId
      );
      return notification;
    } catch (error) {
      console.error("Error deleting notification:", error);
      throw new Error("Failed to delete notification");
    }
  }

  static async updateNotification(notificationId, updateData) {
    try {
      const notification = await Notifications.findByIdAndUpdate(
        notificationId,
        updateData,
        { new: true }
      );
      return notification;
    } catch (error) {
      console.error("Error updating notification:", error);
      throw new Error("Failed to update notification");
    }
  }
}

export default NotificationService;
