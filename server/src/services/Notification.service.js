import mongoose from 'mongoose';
import Notification from '../models/Notification.js';
import UserSettings from '../models/UserSettings.js';
import User from '../models/User.js';
import logger from '../configs/logger.js';
import { retryOperation } from '../helpers/retryOperation.js';
import socketService from './Socket.Service.js';

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

  /**
   * Create new notification (with grouping support)
   * @param {Object} data - Notification data {recipient, sender, type, content, relatedPost, relatedComment, groupKey, metadata}
   * @returns {Promise<Object|null>} Notification object or null if blocked/disabled
   */
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
      .select('notifications blockedUsers mutedUsers')
      .lean();

    if (
      settings?.blockedUsers?.some(id => id.toString() === sender?.toString())
    ) {
      return null;
    }

    if (
      settings?.mutedUsers?.some(id => id.toString() === sender?.toString())
    ) {
      return null;
    }

    const notificationTypeMap = {
      like: 'likes',
      comment: 'comments',
      reply: 'comments',
      follow: 'follows',
      mention: 'mentions',
      share: 'shares',
      message: 'messages',
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
          s => s.user?.toString() === sender?.toString()
        );

        if (!senderExists && sender) {
          const senderUser = await User.findById(sender)
            .select('username avatar')
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
    // Optimize: reuse sender info if available or fetch once
    if (sender) {
        // If sender info was fetched in group check (but not used because no group found), we might need to fetch it here.
        // Or if we didn't check group.
        // Let's just do a clean fetch if not available, but usually caller might pass populated data? No, data is raw.
        const senderUser = await User.findById(sender)
            .select('username avatar')
            .lean();
        
        if (senderUser) {
            senderData = {
                user: sender,
                username: senderUser.username,
                avatar: senderUser.avatar,
            };
        }
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
      .populate('sender', 'username name avatar verified')
      .populate('post', 'caption media')
      .populate('relatedPost', 'caption media')
      .lean();

    const postData =
      populatedNotification.post || populatedNotification.relatedPost;

    try {
      await socketService.sendNotification(recipient.toString(), {
        ...populatedNotification,
        _id: populatedNotification._id.toString(),
        post: postData,
      });
      logger.debug(`Socket notification sent to user ${recipient}`);
    } catch (socketError) {
      logger.error('Failed to send socket notification:', socketError);
    }

    return populatedNotification;
  }

  /**
   * Get list of notifications for user
   * @param {string} userId - User ID
   * @param {Object} options - Options {page, limit, type, unreadOnly}
   * @returns {Promise<{notifications: Array, total: number, unreadCount: number, hasMore: boolean}>}
   */
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
        .populate('sender', 'username name avatar verified')
        .populate('post', '_id caption media')
        .populate('relatedPost', '_id caption media')
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      Notification.countDocuments(query),
      Notification.countDocuments({ recipient: userId, isRead: false }),
    ]);

    const formattedNotifications = notifications.map(notif =>
      this._formatNotification(notif)
    );

    return {
      notifications: formattedNotifications,
      total,
      unreadCount,
      hasMore: page * limit < total,
    };
  }

  /**
   * Format notification for display (handle grouped notifications)
   * @param {Object} notification - Notification object
   * @returns {Object} Formatted notification with displayContent
   * @private
   */
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

    const postData = notification.post || notification.relatedPost;

    return {
      ...notification,
      post: postData,
      displayContent,
      isGrouped: notification.groupCount > 1,
    };
  }

  /**
   * Get notification by ID
   * @param {string} notificationId - Notification ID
   * @param {string} userId - User ID (to verify ownership)
   * @returns {Promise<Object|null>} Formatted notification or null
   */
  static async getNotificationById(notificationId, userId) {
    const notification = await Notification.findOne({
      _id: notificationId,
      recipient: userId,
    })
      .populate('sender', 'username name avatar verified')
      .populate('relatedPost', '_id caption media')
      .lean();

    return notification ? this._formatNotification(notification) : null;
  }

  /**
   * Mark notification as read
   * @param {string} notificationId - Notification ID
   * @param {string} userId - User ID
   * @returns {Promise<Object|null>} Updated notification object
   */
  static async markAsRead(notificationId, userId) {
    const notification = await retryOperation(() =>
      Notification.findOneAndUpdate(
        { _id: notificationId, recipient: userId },
        { isRead: true, readAt: new Date() },
        { new: true }
      )
    );

    return notification;
  }

  /**
   * Mark all notifications as read
   * @param {string} userId - User ID
   * @param {string|null} type - Notification type (optional)
   * @returns {Promise<{updatedCount: number}>} Number of notifications updated
   */
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

  /**
   * Delete notification
   * @param {string} notificationId - Notification ID
   * @param {string} userId - User ID
   * @returns {Promise<{success: boolean, error?: string}>} Delete result
   */
  static async deleteNotification(notificationId, userId) {
    const result = await Notification.findOneAndDelete({
      _id: notificationId,
      recipient: userId,
    });

    return result
      ? { success: true }
      : { success: false, error: 'Notification not found' };
  }

  /**
   * Delete all notifications for user
   * @param {string} userId - User ID
   * @param {string|null} type - Notification type (optional)
   * @returns {Promise<{deletedCount: number}>} Number of notifications deleted
   */
  static async deleteAllNotifications(userId, type = null) {
    const query = { recipient: userId };

    if (type) {
      query.type = type;
    }

    const result = await Notification.deleteMany(query);

    return { deletedCount: result.deletedCount };
  }

  /**
   * Get unread notification count
   * @param {string} userId - User ID
   * @returns {Promise<number>} Number of unread notifications
   */
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

  /**
   * Get unread notification count by type
   * @param {string} userId - User ID
   * @returns {Promise<Object>} Object with type as key and count as value
   */
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
          _id: '$type',
          count: { $sum: 1 },
        },
      },
    ]);

    const result = {};
    counts.forEach(item => {
      result[item._id] = item.count;
    });

    return result;
  }

  /**
   * Send notification to all followers of user (Optimized with Batch Processing)
   * @param {string} userId - User ID
   * @param {string} type - Notification type
   * @param {string} content - Content (can contain {username} placeholder)
   * @param {string|null} relatedPost - Related post ID
   * @returns {Promise<{sentCount: number}>} Number of notifications sent
   */
  static async notifyFollowers(userId, type, content, relatedPost = null) {
    const Follow = (await import('../models/Follow.js')).default;
    
    // Get sender info once
    const sender = await User.findById(userId).select('username avatar').lean();
    if (!sender) return { sentCount: 0 };

    const notificationContent = content.replace('{username}', sender.username);
    const notificationTypeMap = {
      like: 'likes',
      comment: 'comments',
      reply: 'comments', // usually maps to comments setting
      follow: 'follows',
      mention: 'mentions',
      share: 'shares',
      message: 'messages',
    };
    const settingKey = notificationTypeMap[type] || type;

    // Process in batches using cursor to avoid OOM
    const BATCH_SIZE = 500;
    let sentCount = 0;
    
    // Use cursor to stream follower IDs
    const cursor = Follow.find({ following: userId, status: 'active' })
      .select('follower')
      .cursor();

    let batchFollowerIds = [];

    for (let doc = await cursor.next(); doc != null; doc = await cursor.next()) {
      batchFollowerIds.push(doc.follower);

      if (batchFollowerIds.length >= BATCH_SIZE) {
        sentCount += await this._processNotificationBatch(
            batchFollowerIds, 
            userId, 
            sender, 
            type, 
            settingKey, 
            notificationContent, 
            relatedPost
        );
        batchFollowerIds = []; // Reset batch
      }
    }

    // Process remaining
    if (batchFollowerIds.length > 0) {
      sentCount += await this._processNotificationBatch(
        batchFollowerIds, 
        userId, 
        sender, 
        type, 
        settingKey, 
        notificationContent, 
        relatedPost
      );
    }

    return { sentCount };
  }

  /**
   * Process a batch of followers for notification (Private helper)
   */
  static async _processNotificationBatch(followerIds, senderId, senderUser, type, settingKey, content, relatedPost) {
    // 1. Bulk fetch UserSettings for this batch
    const settingsList = await UserSettings.find({ user: { $in: followerIds } })
        .select('user notifications blockedUsers mutedUsers')
        .lean();

    const settingsMap = new Map();
    settingsList.forEach(s => settingsMap.set(s.user.toString(), s));

    // 2. Filter valid recipients
    const validNotifications = [];
    const senderIdStr = senderId.toString();

    for (const recipientId of followerIds) {
        const recipientIdStr = recipientId.toString();
        const settings = settingsMap.get(recipientIdStr);

        // Check 1: Blocked Users
        if (settings?.blockedUsers?.some(id => id.toString() === senderIdStr)) {
            continue;
        }

        // Check 2: Muted Users
        if (settings?.mutedUsers?.some(id => id.toString() === senderIdStr)) {
            continue;
        }

        // Check 3: Notification Preferences
        if (settings?.notifications?.[settingKey] === false) {
            continue;
        }

        // Prepare Notification Object
        validNotifications.push({
            recipient: recipientId,
            sender: senderId,
            type,
            content,
            relatedPost,
            groupKey: relatedPost ? `${type}_${relatedPost}` : null,
            groupedSenders: [{
                user: senderId,
                username: senderUser.username,
                avatar: senderUser.avatar,
            }],
            expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        });
    }

    // 3. Bulk Insert
    if (validNotifications.length > 0) {
        await Notification.insertMany(validNotifications, { ordered: false }).catch(err => 
            logger.warn('Batch notification insert error:', err.message)
        );
        
        // Optional: Fire socket events for this batch? 
        // For mass notifications, we might skip real-time socket to avoid flooding server,
        // or just send to online users. For now, we skip socket loop to save CPU in mass broadcast.
    }

    return validNotifications.length;
  }

  /**
   * Update notification preferences settings
   * @param {string} userId - User ID
   * @param {Object} preferences - New settings
   * @returns {Promise<Object>} Updated notification settings
   */
  static async updateNotificationPreferences(userId, preferences) {
    const settings = await UserSettings.findOneAndUpdate(
      { user: userId },
      { $set: { notifications: preferences } },
      { new: true, upsert: true }
    );

    return settings.notifications;
  }

  /**
   * Get notification preferences settings
   * @param {string} userId - User ID
   * @returns {Promise<Object>} Notification preferences
   */
  static async getNotificationPreferences(userId) {
    const settings = await UserSettings.findOne({ user: userId })
      .select('notifications')
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

  /**
   * Send push notification (TODO: integrate with FCM/APNs)
   * @param {string} userId - User ID
   * @param {Object} notification - Notification object
   * @returns {Promise<{sent: boolean, reason?: string, notification?: Object}>}
   */
  static async sendPushNotification(userId, notification) {
    const settings = await UserSettings.findOne({ user: userId })
      .select('notifications')
      .lean();

    if (!settings?.notifications?.push) {
      return { sent: false, reason: 'Push notifications disabled' };
    }

    logger.info(
      `Push notification queued for user ${userId}: ${notification.content}`
    );

    return { sent: true, notification };
  }

  /**
   * Clean up old read notifications
   * @param {number} days - Number of days to keep (default 30)
   * @returns {Promise<{deletedCount: number}>} Number of notifications deleted
   */
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
