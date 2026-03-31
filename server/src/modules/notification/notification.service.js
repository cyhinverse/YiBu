import { randomUUID } from 'crypto';
import mongoose from 'mongoose';
import UserSettings from '../../models/UserSettings.js';
import User from '../../models/User.js';
import logger from '../../configs/logger.js';
import { retryOperation } from '../../utils/retryOperation.js';
import { getChannel, rabbit } from '../../configs/rabbitmq.config.js';
import notificationRepository from './notification.repository.js';
import socketService from '../shared/socket/socket.service.js';

const GROUP_TIME = 24 * 60 * 60 * 1000;
const EXPIRE_TIME = 30 * 24 * 60 * 60 * 1000;
const JOB = 'notification';
const EVENT = 'notification.create';
const RETRY_LIMIT = 3;
const SOCKET_POPULATE = [
  { path: 'sender', select: 'username name avatar verified' },
  { path: 'post', select: '_id caption media' },
  { path: 'relatedPost', select: '_id caption media' },
];
const typeMap = {
  like: 'likes',
  comment: 'comments',
  reply: 'comments',
  follow: 'follows',
  mention: 'mentions',
  share: 'shares',
  message: 'messages',
};

/**
 * Notification Service
 *
 * Responsibilities:
 * 1. Synchronous facade for controller flows
 * 2. Read/update/delete notification operations
 * 3. Preference management and batch follower notifications
 */
class NotificationService {
  static getRetryLimit() {
    return RETRY_LIMIT;
  }

  static async publishCreate(data, meta = {}) {
    if (!data?.recipient || !data?.type) {
      throw new Error('recipient and type are required');
    }

    const id = randomUUID();
    const queue = rabbit.notification;
    const channel = await getChannel(JOB);
    const message = {
      type: EVENT,
      data,
      meta: {
        source: meta.source || 'notification.service',
        traceId: meta.traceId || id,
        time: meta.time || new Date().toISOString(),
      },
      tries: 0,
    };

    await channel.publish(queue.exchange, queue.key, message, {
      persistent: true,
      messageId: id,
      timestamp: Date.now(),
      contentType: 'application/json',
      type: message.type,
      headers: {
        traceId: message.meta.traceId,
        source: message.meta.source,
        tries: message.tries,
      },
    });

    return { queued: true, id };
  }

  static async handleMessage(msg, options = {}) {
    const { emitRealtime = false, logModule = 'notification-worker' } = options;
    const data = this._readMessage(msg, logModule);

    if (!data) {
      return { shouldAck: true };
    }

    if (data.type !== EVENT) {
      logger.warn('Unsupported notification event skipped', {
        module: logModule,
        type: data.type,
        traceId: data.meta?.traceId,
        source: data.meta?.source,
      });

      return { shouldAck: true };
    }

    if (!data.data?.recipient || !data.data?.type) {
      await this._publishDead(data, null, 'recipient_or_type_missing');

      logger.warn('Notification moved to DLQ due to malformed payload', {
        module: logModule,
        reason: 'recipient_or_type_missing',
        traceId: data.meta?.traceId,
        source: data.meta?.source,
      });

      return { shouldAck: true };
    }

    try {
      await this.processCreate(data.data, {
        emitRealtime,
      });

      logger.info('Notification processed successfully', {
        module: logModule,
        traceId: data.meta?.traceId,
        source: data.meta?.source,
        tries: data.tries ?? 0,
      });

      return { shouldAck: true };
    } catch (error) {
      await this._retryOrDead(data, error, logModule);
      return { shouldAck: true };
    }
  }

  static async processCreate(data, options = {}) {
    const { emitRealtime = true } = options;
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

    if (!recipient || !type) {
      throw new Error('recipient and type are required');
    }

    if (sender && recipient.toString() === sender.toString()) {
      return null;
    }

    const settings = await UserSettings.findOne({ user: recipient })
      .select('notifications blockedUsers mutedUsers')
      .lean();

    if (
      sender &&
      settings?.blockedUsers?.some(id => id.toString() === sender.toString())
    ) {
      return null;
    }

    if (
      sender &&
      settings?.mutedUsers?.some(id => id.toString() === sender.toString())
    ) {
      return null;
    }

    const settingKey = typeMap[type] || type;
    if (settings?.notifications?.[settingKey] === false) {
      return null;
    }

    let notificationId = null;

    if (groupKey) {
      const existingGroup = await notificationRepository.findOne({
        recipient,
        groupKey,
        isRead: false,
        createdAt: { $gte: new Date(Date.now() - GROUP_TIME) },
      });

      if (existingGroup) {
        notificationId = await this._addSenderToGroup(existingGroup, sender);
      }
    }

    if (!notificationId) {
      const senderData = await this._loadSenderData(sender);
      const notification = await notificationRepository.createNotification({
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
        expiresAt: new Date(Date.now() + EXPIRE_TIME),
      });

      notificationId = notification._id;
    }

    const populatedNotification = await this._getFull(notificationId);

    if (!populatedNotification) {
      return null;
    }

    if (emitRealtime) {
      await this._emitRealtime(populatedNotification);
    }

    return populatedNotification;
  }

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
      notificationRepository.findNotifications(query, {
        populate: [
          { path: 'sender', select: 'username name avatar verified' },
          { path: 'post', select: '_id caption media' },
          { path: 'relatedPost', select: '_id caption media' },
        ],
        sort: { createdAt: -1 },
        skip: (page - 1) * limit,
        limit,
        lean: true,
      }),
      notificationRepository.countNotifications(query),
      notificationRepository.countNotifications({
        recipient: userId,
        isRead: false,
      }),
    ]);

    const formattedNotifications = notifications.map(notification =>
      this._formatNotification(notification)
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
      const firstSender =
        notification.groupedSenders[0]?.username ||
        notification.sender?.username;
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
      post: notification.post || notification.relatedPost,
      displayContent,
      isGrouped: notification.groupCount > 1,
    };
  }

  static async _addSenderToGroup(existingGroup, sender) {
    if (!sender) {
      return existingGroup._id;
    }

    const senderExists = existingGroup.groupedSenders?.some(
      groupedSender => groupedSender.user?.toString() === sender.toString()
    );

    if (senderExists) {
      return existingGroup._id;
    }

    const senderUser = await User.findById(sender)
      .select('username avatar')
      .lean();

    await notificationRepository.updateNotificationById(existingGroup._id, {
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

    return existingGroup._id;
  }

  static async _loadSenderData(sender) {
    if (!sender) {
      return null;
    }

    const senderUser = await User.findById(sender)
      .select('username avatar')
      .lean();

    if (!senderUser) {
      return null;
    }

    return {
      user: sender,
      username: senderUser.username,
      avatar: senderUser.avatar,
    };
  }

  static async _getFull(notificationId) {
    return notificationRepository.findById(notificationId, {
      populate: SOCKET_POPULATE,
      lean: true,
    });
  }

  static async _emitRealtime(notification) {
    const postData = notification.post || notification.relatedPost;

    try {
      await socketService.sendNotification(notification.recipient.toString(), {
        ...notification,
        _id: notification._id.toString(),
        post: postData,
      });

      logger.debug(
        `Socket notification sent to user ${notification.recipient}`
      );
    } catch (socketError) {
      logger.error('Failed to send socket notification', {
        module: 'notification',
        notificationId: notification._id?.toString(),
        recipient: notification.recipient?.toString(),
        message: socketError?.message,
        stack: socketError?.stack,
      });
    }
  }

  static _readMessage(message, logModule) {
    try {
      return JSON.parse(message.content.toString('utf8'));
    } catch (error) {
      logger.error('Failed to parse notification message', {
        module: logModule,
        messageId: message.properties?.messageId,
        content: message.content?.toString('utf8'),
        parseError: error.message,
      });

      return null;
    }
  }

  static _buildOptions(message) {
    return {
      persistent: true,
      contentType: 'application/json',
      type: message.type,
      messageId: randomUUID(),
      timestamp: Date.now(),
      headers: {
        traceId: message.meta?.traceId,
        source: message.meta?.source,
        tries: message.tries ?? 0,
      },
    };
  }

  static async _publish(exchange, key, message) {
    const channel = await getChannel(JOB);

    await channel.publish(exchange, key, message, this._buildOptions(message));
  }

  static async _publishDead(message, error, reason) {
    const queue = rabbit.notification;
    const deadMessage = {
      ...message,
      meta: {
        ...message.meta,
        failedAt: new Date().toISOString(),
        failureReason: reason,
        lastError: error?.message,
      },
    };

    await this._publish(queue.deadExchange, queue.deadKey, deadMessage);
  }

  static async _publishRetry(message, error) {
    const queue = rabbit.notification;
    const retryMessage = {
      ...message,
      tries: (Number(message.tries) || 0) + 1,
      meta: {
        ...message.meta,
        lastRetryAt: new Date().toISOString(),
        lastError: error?.message,
      },
    };

    await this._publish(queue.retryExchange, queue.retryKey, retryMessage);
  }

  static async _retryOrDead(message, error, logModule) {
    const tries = Number(message.tries) || 0;

    if (tries >= RETRY_LIMIT) {
      await this._publishDead(message, error, 'max_retries_exceeded');

      logger.error('Notification moved to DLQ after max retries', {
        module: logModule,
        tries,
        traceId: message.meta?.traceId,
        source: message.meta?.source,
        message: error?.message,
        stack: error?.stack,
      });

      return;
    }

    try {
      await this._publishRetry(message, error);

      logger.warn('Notification republished to retry exchange', {
        module: logModule,
        nextTry: tries + 1,
        traceId: message.meta?.traceId,
        source: message.meta?.source,
        message: error?.message,
      });
    } catch (retryError) {
      logger.error('Retry republish failed, sending notification to DLQ', {
        module: logModule,
        traceId: message.meta?.traceId,
        source: message.meta?.source,
        message: retryError?.message,
        stack: retryError?.stack,
      });

      await this._publishDead(message, retryError, 'retry_publish_failed');
    }
  }

  static async getNotificationById(notificationId, userId) {
    const notification = await notificationRepository.findOne(
      {
        _id: notificationId,
        recipient: userId,
      },
      {
        populate: [
          { path: 'sender', select: 'username name avatar verified' },
          { path: 'relatedPost', select: '_id caption media' },
        ],
        lean: true,
      }
    );

    return notification ? this._formatNotification(notification) : null;
  }

  static async markAsRead(notificationId, userId) {
    return retryOperation(() =>
      notificationRepository.findOneAndUpdate(
        { _id: notificationId, recipient: userId },
        { isRead: true, readAt: new Date() }
      )
    );
  }

  static async markAllAsRead(userId, type = null) {
    const query = { recipient: userId, isRead: false };

    if (type) {
      query.type = type;
    }

    const result = await notificationRepository.updateNotifications(query, {
      isRead: true,
      readAt: new Date(),
    });

    return { updatedCount: result.modifiedCount };
  }

  static async deleteNotification(notificationId, userId) {
    const result = await notificationRepository.findOneAndDelete({
      _id: notificationId,
      recipient: userId,
    });

    return result
      ? { success: true }
      : { success: false, error: 'Notification not found' };
  }

  static async deleteAllNotifications(userId, type = null) {
    const query = { recipient: userId };

    if (type) {
      query.type = type;
    }

    const result = await notificationRepository.deleteNotifications(query);

    return { deletedCount: result.deletedCount };
  }

  static async getUnreadCount(userId) {
    return notificationRepository.countNotifications({
      recipient: userId,
      isRead: false,
      $or: [
        { expiresAt: { $exists: false } },
        { expiresAt: { $gt: new Date() } },
      ],
    });
  }

  static async getUnreadCountByType(userId) {
    const counts = await notificationRepository.aggregateNotifications([
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

  static async notifyFollowers(userId, type, content, relatedPost = null) {
    const Follow = (await import('../../models/Follow.js')).default;
    const sender = await User.findById(userId).select('username avatar').lean();

    if (!sender) {
      return { sentCount: 0 };
    }

    const notificationContent = content.replace('{username}', sender.username);
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

    const batchSize = 500;
    let sentCount = 0;
    const cursor = Follow.find({ following: userId, status: 'active' })
      .select('follower')
      .cursor();

    let batchFollowerIds = [];

    for (
      let doc = await cursor.next();
      doc != null;
      doc = await cursor.next()
    ) {
      batchFollowerIds.push(doc.follower);

      if (batchFollowerIds.length >= batchSize) {
        sentCount += await this._processNotificationBatch(
          batchFollowerIds,
          userId,
          sender,
          type,
          settingKey,
          notificationContent,
          relatedPost
        );
        batchFollowerIds = [];
      }
    }

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

  static async _processNotificationBatch(
    followerIds,
    senderId,
    senderUser,
    type,
    settingKey,
    content,
    relatedPost
  ) {
    const settingsList = await UserSettings.find({ user: { $in: followerIds } })
      .select('user notifications blockedUsers mutedUsers')
      .lean();

    const settingsMap = new Map();
    settingsList.forEach(settings => {
      settingsMap.set(settings.user.toString(), settings);
    });

    const validNotifications = [];
    const senderIdStr = senderId.toString();

    for (const recipientId of followerIds) {
      const recipientIdStr = recipientId.toString();
      const settings = settingsMap.get(recipientIdStr);

      if (settings?.blockedUsers?.some(id => id.toString() === senderIdStr)) {
        continue;
      }

      if (settings?.mutedUsers?.some(id => id.toString() === senderIdStr)) {
        continue;
      }

      if (settings?.notifications?.[settingKey] === false) {
        continue;
      }

      validNotifications.push({
        recipient: recipientId,
        sender: senderId,
        type,
        content,
        post: relatedPost,
        relatedPost,
        groupKey: relatedPost ? `${type}_${relatedPost}` : null,
        groupedSenders: [
          {
            user: senderId,
            username: senderUser.username,
            avatar: senderUser.avatar,
          },
        ],
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      });
    }

    if (validNotifications.length > 0) {
      await notificationRepository
        .insertManyNotifications(validNotifications, { ordered: false })
        .catch(err =>
          logger.warn('Batch notification insert error', {
            message: err.message,
          })
        );
    }

    return validNotifications.length;
  }

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

  static async cleanupOldNotifications(days = 30) {
    const cutoffDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    const result = await notificationRepository.deleteNotifications({
      isRead: true,
      createdAt: { $lt: cutoffDate },
    });

    logger.info(`Cleaned up ${result.deletedCount} old notifications`);

    return { deletedCount: result.deletedCount };
  }
}

export default NotificationService;
