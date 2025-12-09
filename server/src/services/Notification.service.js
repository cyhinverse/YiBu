import mongoose from "mongoose";
import Notification from "../models/Notification.js";
import UserSettings from "../models/UserSettings.js";
import User from "../models/User.js";
import logger from "../configs/logger.js";

/**
 * Notification Service - Refactored for new model structure
 *
 * Key Changes:
 * 1. Uses groupKey for notification grouping
 * 2. Integrates with UserSettings for notification preferences
 * 3. Better aggregation for grouped notifications
 * 4. TTL support for automatic cleanup
 */
class NotificationService {
  // ======================================
  // Notification Creation
  // ======================================

  static async createNotification(data) {
    const {
      recipient,
      sender,
      type,
      content,
      relatedPost,
      relatedComment,
      groupKey,
      metadata,
    } = data;

    if (recipient.toString() === sender?.toString()) {
      return null;
    }

    const settings = await UserSettings.findOne({ user: recipient })
      .select("notifications blockedUsers mutedUsers")
      .lean();

    if (
      settings?.blockedUsers?.some((id) => id.toString() === sender?.toString())
    ) {
      return null;
    }

    if (
      settings?.mutedUsers?.some((id) => id.toString() === sender?.toString())
    ) {
      return null;
    }

    const notificationTypeMap = {
      like: "likes",
      comment: "comments",
      reply: "comments",
      follow: "follows",
      mention: "mentions",
      share: "shares",
      message: "messages",
    };

    const settingKey = notificationTypeMap[type] || type;
    if (settings?.notifications?.[settingKey] === false) {
      return null;
    }

    if (groupKey) {
      const existingGroup = await Notification.findOne({
        recipient,
        groupKey,
        isRead: false,
        createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
      });

      if (existingGroup) {
        const senderExists = existingGroup.groupedSenders?.some(
          (s) => s.user?.toString() === sender?.toString()
        );

        if (!senderExists && sender) {
          const senderUser = await User.findById(sender)
            .select("username avatar")
            .lean();

          await Notification.findByIdAndUpdate(existingGroup._id, {
            $push: {
              groupedSenders: {
                user: sender,
                username: senderUser?.username,
                avatar: senderUser?.avatar,
              },
            },
            $inc: { groupCount: 1 },
            $set: { updatedAt: new Date() },
          });
        }

        return existingGroup;
      }
    }

    let senderData;
    if (sender) {
      const senderUser = await User.findById(sender)
        .select("username avatar")
        .lean();
      senderData = {
        user: sender,
        username: senderUser?.username,
        avatar: senderUser?.avatar,
      };
    }

    const notification = await Notification.create({
      recipient,
      sender,
      type,
      content,
      relatedPost,
      relatedComment,
      groupKey,
      groupedSenders: senderData ? [senderData] : [],
      groupCount: 1,
      metadata,
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    });

    const populatedNotification = await Notification.findById(notification._id)
      .populate("sender", "username name avatar verified")
      .populate("relatedPost", "caption media")
      .lean();

    return populatedNotification;
  }

  // ======================================
  // Notification Retrieval
  // ======================================

  static async getNotifications(userId, options = {}) {
    const { page = 1, limit = 20, type, unreadOnly = false } = options;

    const query = {
      recipient: userId,
      $or: [
        { expiresAt: { $exists: false } },
        { expiresAt: { $gt: new Date() } },
      ],
    };

    if (type) {
      query.type = type;
    }

    if (unreadOnly) {
      query.isRead = false;
    }

    const [notifications, total, unreadCount] = await Promise.all([
      Notification.find(query)
        .populate("sender", "username name avatar verified")
        .populate("relatedPost", "_id caption media")
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      Notification.countDocuments(query),
      Notification.countDocuments({ recipient: userId, isRead: false }),
    ]);

    const formattedNotifications = notifications.map((notif) =>
      this._formatNotification(notif)
    );

    return {
      notifications: formattedNotifications,
      total,
      unreadCount,
      hasMore: page * limit < total,
    };
  }

  static _formatNotification(notification) {
    let displayContent = notification.content;

    if (
      notification.groupCount > 1 &&
      notification.groupedSenders?.length > 0
    ) {
      const senders = notification.groupedSenders;
      const firstSender = senders[0]?.username || notification.sender?.username;
      const othersCount = notification.groupCount - 1;

      const typeMessages = {
        like: `${firstSender} và ${othersCount} người khác đã thích bài viết của bạn`,
        comment: `${firstSender} và ${othersCount} người khác đã bình luận bài viết của bạn`,
        follow: `${firstSender} và ${othersCount} người khác đã theo dõi bạn`,
      };

      displayContent = typeMessages[notification.type] || displayContent;
    }

    return {
      ...notification,
      displayContent,
      isGrouped: notification.groupCount > 1,
    };
  }

  static async getNotificationById(notificationId, userId) {
    const notification = await Notification.findOne({
      _id: notificationId,
      recipient: userId,
    })
      .populate("sender", "username name avatar verified")
      .populate("relatedPost", "_id caption media")
      .lean();

    return notification ? this._formatNotification(notification) : null;
  }

  // ======================================
  // Notification Actions
  // ======================================

  static async markAsRead(notificationId, userId) {
    const notification = await Notification.findOneAndUpdate(
      { _id: notificationId, recipient: userId },
      { isRead: true, readAt: new Date() },
      { new: true }
    );

    return notification;
  }

  static async markAllAsRead(userId, type = null) {
    const query = { recipient: userId, isRead: false };

    if (type) {
      query.type = type;
    }

    const result = await Notification.updateMany(query, {
      isRead: true,
      readAt: new Date(),
    });

    return { updatedCount: result.modifiedCount };
  }

  static async deleteNotification(notificationId, userId) {
    const result = await Notification.findOneAndDelete({
      _id: notificationId,
      recipient: userId,
    });

    return result
      ? { success: true }
      : { success: false, error: "Notification not found" };
  }

  static async deleteAllNotifications(userId, type = null) {
    const query = { recipient: userId };

    if (type) {
      query.type = type;
    }

    const result = await Notification.deleteMany(query);

    return { deletedCount: result.deletedCount };
  }

  // ======================================
  // Notification Stats
  // ======================================

  static async getUnreadCount(userId) {
    const count = await Notification.countDocuments({
      recipient: userId,
      isRead: false,
      $or: [
        { expiresAt: { $exists: false } },
        { expiresAt: { $gt: new Date() } },
      ],
    });

    return count;
  }

  static async getUnreadCountByType(userId) {
    const counts = await Notification.aggregate([
      {
        $match: {
          recipient: new mongoose.Types.ObjectId(userId),
          isRead: false,
          $or: [
            { expiresAt: { $exists: false } },
            { expiresAt: { $gt: new Date() } },
          ],
        },
      },
      {
        $group: {
          _id: "$type",
          count: { $sum: 1 },
        },
      },
    ]);

    const result = {};
    counts.forEach((item) => {
      result[item._id] = item.count;
    });

    return result;
  }

  // ======================================
  // Bulk Notifications
  // ======================================

  static async notifyFollowers(userId, type, content, relatedPost = null) {
    const Follow = (await import("../models/Follow.js")).default;

    const followers = await Follow.getFollowerIds(userId);

    const user = await User.findById(userId).select("username avatar").lean();

    const notifications = followers.map((followerId) => ({
      recipient: followerId,
      sender: userId,
      type,
      content: content.replace("{username}", user.username),
      relatedPost,
      groupKey: relatedPost ? `${type}_${relatedPost}` : null,
      groupedSenders: [
        {
          user: userId,
          username: user.username,
          avatar: user.avatar,
        },
      ],
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    }));

    if (notifications.length > 0) {
      await Notification.insertMany(notifications, { ordered: false }).catch(
        (err) => {
          logger.warn("Some notifications failed to insert:", err.message);
        }
      );
    }

    return { sentCount: notifications.length };
  }

  // ======================================
  // Notification Settings
  // ======================================

  static async updateNotificationPreferences(userId, preferences) {
    const settings = await UserSettings.findOneAndUpdate(
      { user: userId },
      { $set: { notifications: preferences } },
      { new: true, upsert: true }
    );

    return settings.notifications;
  }

  static async getNotificationPreferences(userId) {
    const settings = await UserSettings.findOne({ user: userId })
      .select("notifications")
      .lean();

    return (
      settings?.notifications || {
        likes: true,
        comments: true,
        follows: true,
        mentions: true,
        messages: true,
        shares: true,
      }
    );
  }

  // ======================================
  // Push Notifications
  // ======================================

  static async sendPushNotification(userId, notification) {
    const settings = await UserSettings.findOne({ user: userId })
      .select("notifications")
      .lean();

    if (!settings?.notifications?.push) {
      return { sent: false, reason: "Push notifications disabled" };
    }

    // TODO: Integrate with push notification service (FCM, APNs, etc.)
    logger.info(
      `Push notification queued for user ${userId}: ${notification.content}`
    );

    return { sent: true, notification };
  }

  // ======================================
  // Cleanup
  // ======================================

  static async cleanupOldNotifications(days = 30) {
    const cutoffDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const result = await Notification.deleteMany({
      isRead: true,
      createdAt: { $lt: cutoffDate },
    });

    logger.info(`Cleaned up ${result.deletedCount} old notifications`);

    return { deletedCount: result.deletedCount };
  }
}

export default NotificationService;
