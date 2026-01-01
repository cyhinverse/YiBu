import User from '../models/User.js';
import UserSettings from '../models/UserSettings.js';
import Message from '../models/Message.js';
import Notification from '../models/Notification.js';
import logger from '../configs/logger.js';

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
  constructor() {
    this.io = null;
    this.onlineUsers = new Map();
    this.userSockets = new Map();
  }

  /**
   * Initialize Socket Service with Socket.IO instance
   * @param {Object} io - Socket.IO server instance
   */
  init(io) {
    this.io = io;
    logger.info('SocketService initialized');
  }

  initialize(io) {
    this.init(io);
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
   * Get list of all online users
   * @returns {Array} List of user IDs
   */
  getOnlineUsers() {
    return Array.from(this.userSockets.keys());
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
   * Send typing status
   * @param {string} senderId - Sender ID
   * @param {string} receiverId - Receiver ID
   * @param {boolean} isTyping - Is typing or not
   */
  sendTypingStatus(senderId, receiverId, isTyping) {
    const receiverSockets = this.getUserSockets(receiverId);

    receiverSockets.forEach(socketId => {
      this.io.to(socketId).emit('typing_status', {
        userId: senderId,
        isTyping,
        timestamp: new Date(),
      });
    });
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

  emitNotification(userId, notification) {
    return this.sendNotification(userId, notification);
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

    const typeMap = {
      like: 'likes',
      comment: 'comments',
      follow: 'follows',
      mention: 'mentions',
      message: 'messages',
    };

    const settingKey = typeMap[notification.type];
    if (settingKey && settings?.notifications?.[settingKey] === false) {
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

    for (const userId of userIds) {
      const result = await this.sendNotification(userId, notification);
      if (result.sent) {
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
   * Emit new post event to followers
   * @param {Array} followerIds - List of follower IDs
   * @param {Object} post - Post object
   */
  emitNewPost(followerIds, post) {
    followerIds.forEach(followerId => {
      const followerSockets = this.getUserSockets(followerId);

      followerSockets.forEach(socketId => {
        this.io.to(socketId).emit('new_post', {
          postId: post._id,
          userId: post.user._id || post.user,
          preview: {
            caption: post.caption?.substring(0, 100),
            media: post.media?.[0],
          },
          createdAt: post.createdAt,
        });
      });
    });
  }

  /**
   * Emit new follow event
   * @param {string} targetUserId - Followed user ID
   * @param {Object} data - Follow data
   */
  emitFollowEvent(targetUserId, data) {
    const targetSockets = this.getUserSockets(targetUserId);

    targetSockets.forEach(socketId => {
      this.io.to(socketId).emit('new_follower', data);
    });
  }

  /**
   * Emit follow request event
   * @param {string} targetUserId - User ID receiving the request
   * @param {Object} data - Follow request data
   */
  emitFollowRequestEvent(targetUserId, data) {
    const targetSockets = this.getUserSockets(targetUserId);

    targetSockets.forEach(socketId => {
      this.io.to(socketId).emit('follow_request', data);
    });
  }

  /**
   * Join socket to room
   * @param {string} socketId - Socket ID
   * @param {string} roomId - Room ID
   */
  joinRoom(socketId, roomId) {
    if (this.io) {
      const socket = this.io.sockets.sockets.get(socketId);
      if (socket) {
        socket.join(roomId);
      }
    }
  }

  /**
   * Leave socket from room
   * @param {string} socketId - Socket ID
   * @param {string} roomId - Room ID
   */
  leaveRoom(socketId, roomId) {
    if (this.io) {
      const socket = this.io.sockets.sockets.get(socketId);
      if (socket) {
        socket.leave(roomId);
      }
    }
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
    const presenceList = await Promise.all(
      userIds.map(userId => this.getUserPresence(userId))
    );

    return presenceList;
  }

  /**
   * Broadcast system message to all users
   * @param {string} message - Message content
   */
  broadcastSystemMessage(message) {
    if (this.io) {
      this.io.emit('system_message', {
        message,
        timestamp: new Date(),
      });
    }
  }

  /**
   * Disconnect user from all sockets
   * @param {string} userId - User ID
   * @param {string} reason - Disconnect reason
   */
  disconnectUser(userId, reason = 'forced_disconnect') {
    const userSockets = this.getUserSockets(userId);

    userSockets.forEach(socketId => {
      const socket = this.io?.sockets.sockets.get(socketId);
      if (socket) {
        socket.emit('forced_disconnect', { reason });
        socket.disconnect(true);
      }
    });

    logger.info(`User ${userId} forcefully disconnected: ${reason}`);
  }

  /**
   * Get socket connection statistics
   * @returns {{totalConnections: number, uniqueUsers: number, timestamp: Date}} Stats object
   */
  getStats() {
    return {
      totalConnections: this.onlineUsers.size,
      uniqueUsers: this.userSockets.size,
      timestamp: new Date(),
    };
  }
}

const socketService = new SocketService();

export default socketService;
