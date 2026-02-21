import User from '../../../models/User.js';
import UserSettings from '../../../models/UserSettings.js';
import Message from '../../../models/Message.js';
import logger from '../../../configs/logger.js';

/**
 * Socket Service - Refactored for new model structure
 *
 * Key Changes:
 * 1. Centralized socket user management
 * 2. Integrates with UserSettings for blocked users
 * 3. Better message status tracking
 * 4. Room-based conversation management
 */
class SocketService {
  static NOTIFICATION_SETTING_MAP = {
    like: 'likes',
    comment: 'comments',
    reply: 'comments',
    follow: 'follows',
    mention: 'mentions',
    share: 'shares',
    save: 'saves',
    tag: 'tags',
    message: 'messages',
    system: 'systemUpdates',
    announcement: 'systemUpdates',
  };

  static CLEANUP_INTERVAL = 5 * 60 * 1000;
  static MAX_SOCKET_AGE = 30 * 60 * 1000;

  constructor() {
    this.io = null;
    this.onlineUsers = new Map();
    this.userSockets = new Map();
    this._cleanupInterval = null;
  }

  _getPushSettings(notifications) {
    if (!notifications || typeof notifications !== 'object') {
      return {};
    }

    if (notifications.push && typeof notifications.push === 'object') {
      return notifications.push;
    }

    return notifications;
  }

  _isNotificationEnabled(notifications, type) {
    const pushSettings = this._getPushSettings(notifications);
    const settingKey = SocketService.NOTIFICATION_SETTING_MAP[type] || type;

    if (pushSettings.enabled === false) {
      return false;
    }

    if (pushSettings[settingKey] === false) {
      return false;
    }

    return true;
  }

  /**
   * Initialize Socket Service with Socket.IO instance
   * @param {Object} io - Socket.IO server instance
   */
  init(io) {
    this.io = io;
    this._startCleanupInterval();
    logger.info('SocketService initialized');
  }

  /**
   * Start periodic cleanup of stale socket connections
   * @private
   */
  _startCleanupInterval() {
    if (this._cleanupInterval) {
      clearInterval(this._cleanupInterval);
    }

    this._cleanupInterval = setInterval(() => {
      this._cleanupStaleConnections();
    }, SocketService.CLEANUP_INTERVAL);
  }

  /**
   * Cleanup stale socket connections that no longer exist in Socket.IO
   * @private
   */
  _cleanupStaleConnections() {
    if (!this.io) return;

    const connectedSockets = new Set(this.io.sockets.sockets.keys());
    let cleanedCount = 0;

    for (const [socketId, userId] of this.onlineUsers) {
      if (!connectedSockets.has(socketId)) {
        this.onlineUsers.delete(socketId);
        
        const userSockets = this.userSockets.get(userId);
        if (userSockets) {
          userSockets.delete(socketId);
          if (userSockets.size === 0) {
            this.userSockets.delete(userId);
          }
        }
        cleanedCount++;
      }
    }

    if (cleanedCount > 0) {
      logger.debug(`Cleaned up ${cleanedCount} stale socket connections`);
    }
  }

  /**
   * Stop cleanup interval (for graceful shutdown)
   */
  shutdown() {
    if (this._cleanupInterval) {
      clearInterval(this._cleanupInterval);
      this._cleanupInterval = null;
    }
    this.onlineUsers.clear();
    this.userSockets.clear();
    this.io = null;
    logger.info('SocketService shut down');
  }

  /**
   * Add user to online list
   * @param {string} userId - User ID
   * @param {string} socketId - Socket ID
   */
  addUser(userId, socketId) {
    const userIdStr = userId.toString();

    if (!this.userSockets.has(userIdStr)) {
      this.userSockets.set(userIdStr, new Set());
    }
    this.userSockets.get(userIdStr).add(socketId);

    this.onlineUsers.set(socketId, userIdStr);

    User.findByIdAndUpdate(userId, { lastActiveAt: new Date() }).exec();

    logger.debug(`User ${userIdStr} connected with socket ${socketId}`);
  }

  /**
   * Remove user from online list when disconnected
   * @param {string} socketId - Socket ID
   */
  removeUser(socketId) {
    const userId = this.onlineUsers.get(socketId);

    if (userId) {
      const userSockets = this.userSockets.get(userId);

      if (userSockets) {
        userSockets.delete(socketId);

        if (userSockets.size === 0) {
          this.userSockets.delete(userId);
          User.findByIdAndUpdate(userId, { lastActiveAt: new Date() }).exec();
        }
      }

      this.onlineUsers.delete(socketId);
      logger.debug(`Socket ${socketId} disconnected (user: ${userId})`);
    }
  }

  /**
   * Get all socket IDs of a user
   * @param {string} userId - User ID
   * @returns {Set} Set containing socket IDs
   */
  getUserSockets(userId) {
    const userIdStr = userId.toString();
    return this.userSockets.get(userIdStr) || new Set();
  }

  /**
   * Check if user is online
   * @param {string} userId - User ID
   * @returns {boolean} True if user is online
   */
  isUserOnline(userId) {
    const userIdStr = userId.toString();
    const sockets = this.userSockets.get(userIdStr);
    return sockets && sockets.size > 0;
  }

  /**
   * Get list of all online users with optional pagination
   * @param {Object} options - Pagination options
   * @param {number} [options.limit] - Max users to return
   * @param {number} [options.offset] - Offset for pagination
   * @returns {Array} List of user IDs
   */
  getOnlineUsers(options = {}) {
    const { limit, offset = 0 } = options;
    const userIds = Array.from(this.userSockets.keys());
    
    if (limit !== undefined) {
      return userIds.slice(offset, offset + limit);
    }
    return userIds;
  }

  /**
   * Send realtime message to user
   * @param {string} senderId - Sender ID
   * @param {string} receiverId - Receiver ID
   * @param {Object} message - Message object
   * @returns {Promise<{delivered: boolean, reason?: string, socketCount?: number}>} Send result
   */
  async sendMessage(senderId, receiverId, message) {
    const settings = await UserSettings.findOne({ user: receiverId })
      .select('blockedUsers')
      .lean();

    if (
      settings?.blockedUsers?.some(id => id.toString() === senderId.toString())
    ) {
      return { delivered: false, reason: 'blocked' };
    }

    const receiverSockets = this.getUserSockets(receiverId);

    if (receiverSockets.size > 0) {
      receiverSockets.forEach(socketId => {
        this.io.to(socketId).emit('new_message', {
          ...message,
          receivedAt: new Date(),
        });
      });

      await Message.findByIdAndUpdate(message._id, {
        status: 'delivered',
        deliveredAt: new Date(),
      });

      return { delivered: true, socketCount: receiverSockets.size };
    }

    return { delivered: false, reason: 'offline' };
  }

  /**
   * Send message status (sent, delivered, read)
   * @param {string} senderId - Sender ID
   * @param {string} receiverId - Receiver ID
   * @param {string} messageId - Message ID
   * @param {string} status - New status
   */
  sendMessageStatus(senderId, receiverId, messageId, status) {
    const senderSockets = this.getUserSockets(senderId);

    senderSockets.forEach(socketId => {
      this.io.to(socketId).emit('message_status', {
        messageId,
        status,
        updatedAt: new Date(),
      });
    });
  }

  /**
   * Send conversation read notification
   * @param {string} senderId - Original message sender ID
   * @param {string} readerId - Reader ID
   * @param {string} conversationId - Conversation ID
   */
  sendConversationRead(senderId, readerId, conversationId) {
    const senderSockets = this.getUserSockets(senderId);

    senderSockets.forEach(socketId => {
      this.io.to(socketId).emit('conversation_read', {
        conversationId,
        readerId,
        readAt: new Date(),
      });
    });
  }

  emitTyping(conversationId, userId, isTyping) {
    if (this.io) {
      this.io
        .to(conversationId)
        .emit(isTyping ? 'user_typing' : 'user_stop_typing', {
          userId,
          conversationId,
          timestamp: new Date(),
        });
    }
  }

  emitGroupCreated(userId, data) {
    const userSockets = this.getUserSockets(userId);
    userSockets.forEach(socketId => {
      this.io.to(socketId).emit('group_created', data);
    });
  }

  emitAddedToGroup(userId, data) {
    const userSockets = this.getUserSockets(userId);
    userSockets.forEach(socketId => {
      this.io.to(socketId).emit('added_to_group', data);
    });
  }

  emitRemovedFromGroup(userId, data) {
    const userSockets = this.getUserSockets(userId);
    userSockets.forEach(socketId => {
      this.io.to(socketId).emit('removed_from_group', data);
    });
  }

  /**
   * Send realtime notification to user
   * @param {string} userId - Recipient user ID
   * @param {Object} notification - Notification object
   * @returns {Promise<{sent: boolean, reason?: string, socketCount?: number}>} Send result
   */
  async sendNotification(userId, notification) {
    const settings = await UserSettings.findOne({ user: userId })
      .select('notifications')
      .lean();

    if (!this._isNotificationEnabled(settings?.notifications, notification.type)) {
      return { sent: false, reason: 'disabled' };
    }

    const userSockets = this.getUserSockets(userId);

    if (userSockets.size > 0) {
      userSockets.forEach(socketId => {
        this.io.to(socketId).emit('new_notification', notification);
      });

      return { sent: true, socketCount: userSockets.size };
    }

    return { sent: false, reason: 'offline' };
  }

  /**
   * Send notification to multiple users
   * @param {Array} userIds - List of user IDs
   * @param {Object} notification - Notification object
   * @returns {Promise<{sent: number, failed: number}>} Send result
   */
  async broadcastNotification(userIds, notification) {
    const results = { sent: 0, failed: 0 };

    // Batch fetch user settings to avoid N+1 query
    const settings = await UserSettings.find({ user: { $in: userIds } })
      .select('user notifications')
      .lean();

    const settingsMap = new Map();
    settings.forEach(s => settingsMap.set(s.user.toString(), s.notifications));

    for (const userId of userIds) {
      const userSettings = settingsMap.get(userId.toString()) || {};

      if (!this._isNotificationEnabled(userSettings, notification.type)) {
        results.failed++;
        continue;
      }

      const userSockets = this.getUserSockets(userId);

      if (userSockets.size > 0) {
        userSockets.forEach(socketId => {
          this.io.to(socketId).emit('new_notification', notification);
        });
        results.sent++;
      } else {
        results.failed++;
      }
    }

    return results;
  }

  /**
   * Emit post like event
   * @param {string} postOwnerId - Post owner ID
   * @param {Object} data - Like data
   */
  emitPostLike(postOwnerId, data) {
    const ownerSockets = this.getUserSockets(postOwnerId);

    ownerSockets.forEach(socketId => {
      this.io.to(socketId).emit('post_liked', data);
    });
  }

  /**
   * Emit post comment event
   * @param {string} postOwnerId - Post owner ID
   * @param {Object} data - Comment data
   */
  emitPostComment(postOwnerId, data) {
    const ownerSockets = this.getUserSockets(postOwnerId);

    ownerSockets.forEach(socketId => {
      this.io.to(socketId).emit('post_commented', data);
    });
  }

  /**
   * Emit event to all sockets in room
   * @param {string} roomId - Room ID
   * @param {string} event - Event name
   * @param {Object} data - Data to send
   */
  emitToRoom(roomId, event, data) {
    if (this.io) {
      this.io.to(roomId).emit(event, data);
    }
  }

  /**
   * Get user presence status
   * @param {string} userId - User ID
   * @returns {Promise<{userId: string, status: string, lastActiveAt: Date}>} Presence info
   */
  async getUserPresence(userId) {
    const isOnline = this.isUserOnline(userId);

    if (isOnline) {
      return {
        userId,
        status: 'online',
        lastActiveAt: new Date(),
      };
    }

    const user = await User.findById(userId).select('lastActiveAt').lean();

    return {
      userId,
      status: 'offline',
      lastActiveAt: user?.lastActiveAt,
    };
  }

  /**
   * Get presence status of multiple users
   * @param {Array} userIds - List of user IDs
   * @returns {Promise<Array>} List of presence info
   */
  async getMultiplePresence(userIds) {
    const onlineResults = [];
    const offlineUserIds = [];

    for (const userId of userIds) {
      if (this.isUserOnline(userId)) {
        onlineResults.push({ userId, status: 'online', lastActiveAt: new Date() });
      } else {
        offlineUserIds.push(userId);
      }
    }

    if (offlineUserIds.length > 0) {
      const users = await User.find({ _id: { $in: offlineUserIds } })
        .select('lastActiveAt')
        .lean();
      const userMap = new Map(users.map(u => [u._id.toString(), u.lastActiveAt]));
      for (const userId of offlineUserIds) {
        onlineResults.push({
          userId,
          status: 'offline',
          lastActiveAt: userMap.get(userId.toString()) || null,
        });
      }
    }

    return onlineResults;
  }

}

const socketService = new SocketService();

export default socketService;
