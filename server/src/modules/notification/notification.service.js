import notificationRepository from './notification.repository.js';
import mongoose from 'mongoose';
import logger from '../../configs/logger.js';
import { retryOperation } from '../../utils/retryOperation.js';
import socketService from '../shared/socket/socket.service.js';

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
  static NOTIFICATION_SETTING_MAP = {
    like: 'likes',
    comment: 'comments',
    reply: 'comments',
    follow: 'follows',
    mention: 'mentions',
    share: 'shares',
    message: 'messages',
    save: 'saves',
    tag: 'tags',
    system: 'systemUpdates',
    announcement: 'systemUpdates',
  };

  static _getPushSettings(settings) {
    const notifications = settings?.notifications || {};
    const pushSettings =
      notifications?.push && typeof notifications.push === 'object'
        ? notifications.push
        : notifications;
    return pushSettings || {};
  }

  static _isNotificationEnabled(settings, type) {
    const pushSettings = this._getPushSettings(settings);
    const settingKey = this.NOTIFICATION_SETTING_MAP[type] || type;

    if (pushSettings.enabled === false) {
      return false;
    }

    if (pushSettings[settingKey] === false) {
      return false;
    }

    return true;
  }

  static _isSenderBlockedOrMuted(settings, senderId) {
    const senderIdString = senderId?.toString();
    if (!senderIdString) return false;

    if (settings?.blockedUsers?.some(id => id.toString() === senderIdString)) {
      return true;
    }

    return settings?.mutedUsers?.some(id => id.toString() === senderIdString);
  }

  static _canReceiveNotification(settings, senderId, type) {
    if (this._isSenderBlockedOrMuted(settings, senderId)) {
      return false;
    }

    return this._isNotificationEnabled(settings, type);
  }

  static _buildDefaultExpiryDate(days = 30) {
    return new Date(Date.now() + days * 24 * 60 * 60 * 1000);
  }

  static _formatPreferences(settings) {
    const notifications = settings?.notifications || {};
    const push = this._getPushSettings(settings);
    const email =
      notifications?.email && typeof notifications.email === 'object'
        ? notifications.email
        : {};

    return {
      likes: push.likes ?? true,
      comments: push.comments ?? true,
      follows: push.follows ?? true,
      messages: push.messages ?? true,
      mentions: push.mentions ?? true,
      replies: push.comments ?? true,
      shares: push.shares ?? true,
      saves: push.saves ?? true,
      tags: push.tags ?? true,
      systemUpdates: push.systemUpdates ?? true,
      sound: push.sound ?? true,
      vibration: push.vibration ?? true,
      push: push.enabled ?? true,
      email: email.enabled ?? true,
    };
  }

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

    const settings = await notificationRepository.userSettingsFindOne({ user: recipient })
      .select('notifications blockedUsers mutedUsers')
      .lean();

    if (!this._canReceiveNotification(settings, sender, type)) {
      return null;
    }

    if (groupKey) {
      const existingGroup = await notificationRepository.notificationFindOne({
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
          const senderUser = await notificationRepository.userFindById(sender)
            .select('username avatar')
            .lean();

          const updatedGroup = await notificationRepository.notificationFindByIdAndUpdate(existingGroup._id, {
            $push: {
              groupedSenders: {
                user: sender,
                username: senderUser?.username,
                avatar: senderUser?.avatar,
              },
            },
              $inc: { groupCount: 1 },
              $set: { updatedAt: new Date() },
            },
            { new: true }
          )
            .populate('sender', 'username name avatar verified')
            .populate('post', '_id caption media')
            .populate('relatedPost', '_id caption media')
            .lean();

          return updatedGroup || existingGroup;
        }

        const hydratedGroup = await notificationRepository.notificationFindById(existingGroup._id)
          .populate('sender', 'username name avatar verified')
          .populate('post', '_id caption media')
          .populate('relatedPost', '_id caption media')
          .lean();

        return hydratedGroup || existingGroup;
      }
    }

    let senderData;
    // Optimize: reuse sender info if available or fetch once
    if (sender) {
        // If sender info was fetched in group check (but not used because no group found), we might need to fetch it here.
        // Or if we didn't check group.
        // Let's just do a clean fetch if not available, but usually caller might pass populated data? No, data is raw.
        const senderUser = await notificationRepository.userFindById(sender)
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

    const notification = await notificationRepository.notificationCreate({
      recipient,
      sender,
      type,
      content,
      post: relatedPost,
      comment: relatedComment,
      relatedPost,
      relatedComment,
      groupKey,
      groupedSenders: senderData ? [senderData] : [],
      groupCount: 1,
      metadata,
      expiresAt: this._buildDefaultExpiryDate(),
    });

    const populatedNotification = await notificationRepository.notificationFindById(notification._id)
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
      notificationRepository.notificationFind(query)
        .populate('sender', 'username name avatar verified')
        .populate('post', '_id caption media')
        .populate('relatedPost', '_id caption media')
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      notificationRepository.notificationCountDocuments(query),
      notificationRepository.notificationCountDocuments({ recipient: userId, isRead: false }),
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
    const notification = await notificationRepository.notificationFindOne({
      _id: notificationId,
      recipient: userId,
    })
      .populate('sender', 'username name avatar verified')
      .populate('post', '_id caption media')
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
      notificationRepository.notificationFindOneAndUpdate(
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

    const result = await notificationRepository.notificationUpdateMany(query, {
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
    const result = await notificationRepository.notificationFindOneAndDelete({
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

    const result = await notificationRepository.notificationDeleteMany(query);

    return { deletedCount: result.deletedCount };
  }

  /**
   * Get unread notification count
   * @param {string} userId - User ID
   * @returns {Promise<number>} Number of unread notifications
   */
  static async getUnreadCount(userId) {
    const count = await notificationRepository.notificationCountDocuments({
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
    const counts = await notificationRepository.notificationAggregate([
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
   * Update notification preferences settings
   * @param {string} userId - User ID
   * @param {Object} preferences - New settings
   * @returns {Promise<Object>} Updated notification settings
   */
  static async updateNotificationPreferences(userId, preferences) {
    const keyMapping = {
      likes: 'notifications.push.likes',
      comments: 'notifications.push.comments',
      follows: 'notifications.push.follows',
      messages: 'notifications.push.messages',
      mentions: 'notifications.push.mentions',
      replies: 'notifications.push.comments',
      shares: 'notifications.push.shares',
      saves: 'notifications.push.saves',
      tags: 'notifications.push.tags',
      systemUpdates: 'notifications.push.systemUpdates',
      sound: 'notifications.push.sound',
      vibration: 'notifications.push.vibration',
    };

    const updateOps = {};
    for (const [key, value] of Object.entries(preferences || {})) {
      if (value === undefined) continue;

      if (key === 'email') {
        if (typeof value === 'boolean') {
          updateOps['notifications.email.enabled'] = value;
        } else if (value && typeof value === 'object') {
          for (const [subKey, subValue] of Object.entries(value)) {
            if (subValue === undefined) continue;
            updateOps[`notifications.email.${subKey}`] = subValue;
          }
        }
      } else if (key === 'push') {
        if (typeof value === 'boolean') {
          updateOps['notifications.push.enabled'] = value;
        } else if (value && typeof value === 'object') {
          for (const [subKey, subValue] of Object.entries(value)) {
            if (subValue === undefined) continue;
            updateOps[`notifications.push.${subKey}`] = subValue;
          }
        }
      } else if (keyMapping[key]) {
        updateOps[keyMapping[key]] = value;
      }
    }

    if (Object.keys(updateOps).length === 0) {
      const settings = await notificationRepository.userSettingsFindOne({ user: userId }).lean();
      return this._formatPreferences(settings);
    }

    const settings = await notificationRepository.userSettingsFindOneAndUpdate(
      { user: userId },
      { $set: updateOps },
      { new: true, upsert: true }
    );

    return this._formatPreferences(settings?.toObject?.() || settings);
  }

  /**
   * Get notification preferences settings
   * @param {string} userId - User ID
   * @returns {Promise<Object>} Notification preferences
   */
  static async getNotificationPreferences(userId) {
    const settings = await notificationRepository.userSettingsFindOne({ user: userId })
      .select('notifications')
      .lean();

    return this._formatPreferences(settings);
  }

}

export default NotificationService;



