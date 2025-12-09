import User from "../models/User.js";
import UserSettings from "../models/UserSettings.js";
import Message from "../models/Message.js";
import Notification from "../models/Notification.js";
import logger from "../configs/logger.js";

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

  // ======================================
  // Initialization
  // ======================================

  init(io) {
    this.io = io;
    logger.info("SocketService initialized");
  }

  // Alias for backward compatibility
  initialize(io) {
    this.init(io);
  }

  // ======================================
  // User Management
  // ======================================

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

  getUserSockets(userId) {
    const userIdStr = userId.toString();
    return this.userSockets.get(userIdStr) || new Set();
  }

  isUserOnline(userId) {
    const userIdStr = userId.toString();
    const sockets = this.userSockets.get(userIdStr);
    return sockets && sockets.size > 0;
  }

  getOnlineUsers() {
    return Array.from(this.userSockets.keys());
  }

  // ======================================
  // Messaging
  // ======================================

  async sendMessage(senderId, receiverId, message) {
    const settings = await UserSettings.findOne({ user: receiverId })
      .select("blockedUsers")
      .lean();

    if (
      settings?.blockedUsers?.some(
        (id) => id.toString() === senderId.toString()
      )
    ) {
      return { delivered: false, reason: "blocked" };
    }

    const receiverSockets = this.getUserSockets(receiverId);

    if (receiverSockets.size > 0) {
      receiverSockets.forEach((socketId) => {
        this.io.to(socketId).emit("new_message", {
          ...message,
          receivedAt: new Date(),
        });
      });

      await Message.findByIdAndUpdate(message._id, {
        status: "delivered",
        deliveredAt: new Date(),
      });

      return { delivered: true, socketCount: receiverSockets.size };
    }

    return { delivered: false, reason: "offline" };
  }

  sendTypingStatus(senderId, receiverId, isTyping) {
    const receiverSockets = this.getUserSockets(receiverId);

    receiverSockets.forEach((socketId) => {
      this.io.to(socketId).emit("typing_status", {
        userId: senderId,
        isTyping,
        timestamp: new Date(),
      });
    });
  }

  sendMessageStatus(senderId, receiverId, messageId, status) {
    const senderSockets = this.getUserSockets(senderId);

    senderSockets.forEach((socketId) => {
      this.io.to(socketId).emit("message_status", {
        messageId,
        status,
        updatedAt: new Date(),
      });
    });
  }

  // ======================================
  // Notifications
  // ======================================

  async sendNotification(userId, notification) {
    const settings = await UserSettings.findOne({ user: userId })
      .select("notifications")
      .lean();

    const typeMap = {
      like: "likes",
      comment: "comments",
      follow: "follows",
      mention: "mentions",
      message: "messages",
    };

    const settingKey = typeMap[notification.type];
    if (settingKey && settings?.notifications?.[settingKey] === false) {
      return { sent: false, reason: "disabled" };
    }

    const userSockets = this.getUserSockets(userId);

    if (userSockets.size > 0) {
      userSockets.forEach((socketId) => {
        this.io.to(socketId).emit("new_notification", notification);
      });

      return { sent: true, socketCount: userSockets.size };
    }

    return { sent: false, reason: "offline" };
  }

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

  // ======================================
  // Post Events
  // ======================================

  emitPostLike(postOwnerId, data) {
    const ownerSockets = this.getUserSockets(postOwnerId);

    ownerSockets.forEach((socketId) => {
      this.io.to(socketId).emit("post_liked", data);
    });
  }

  emitPostComment(postOwnerId, data) {
    const ownerSockets = this.getUserSockets(postOwnerId);

    ownerSockets.forEach((socketId) => {
      this.io.to(socketId).emit("post_commented", data);
    });
  }

  emitNewPost(followerIds, post) {
    followerIds.forEach((followerId) => {
      const followerSockets = this.getUserSockets(followerId);

      followerSockets.forEach((socketId) => {
        this.io.to(socketId).emit("new_post", {
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

  // ======================================
  // Follow Events
  // ======================================

  emitFollowEvent(targetUserId, data) {
    const targetSockets = this.getUserSockets(targetUserId);

    targetSockets.forEach((socketId) => {
      this.io.to(socketId).emit("new_follower", data);
    });
  }

  emitFollowRequestEvent(targetUserId, data) {
    const targetSockets = this.getUserSockets(targetUserId);

    targetSockets.forEach((socketId) => {
      this.io.to(socketId).emit("follow_request", data);
    });
  }

  // ======================================
  // Room Management
  // ======================================

  joinRoom(socketId, roomId) {
    if (this.io) {
      const socket = this.io.sockets.sockets.get(socketId);
      if (socket) {
        socket.join(roomId);
      }
    }
  }

  leaveRoom(socketId, roomId) {
    if (this.io) {
      const socket = this.io.sockets.sockets.get(socketId);
      if (socket) {
        socket.leave(roomId);
      }
    }
  }

  emitToRoom(roomId, event, data) {
    if (this.io) {
      this.io.to(roomId).emit(event, data);
    }
  }

  // ======================================
  // Presence
  // ======================================

  async getUserPresence(userId) {
    const isOnline = this.isUserOnline(userId);

    if (isOnline) {
      return {
        userId,
        status: "online",
        lastActiveAt: new Date(),
      };
    }

    const user = await User.findById(userId).select("lastActiveAt").lean();

    return {
      userId,
      status: "offline",
      lastActiveAt: user?.lastActiveAt,
    };
  }

  async getMultiplePresence(userIds) {
    const presenceList = await Promise.all(
      userIds.map((userId) => this.getUserPresence(userId))
    );

    return presenceList;
  }

  // ======================================
  // System Events
  // ======================================

  broadcastSystemMessage(message) {
    if (this.io) {
      this.io.emit("system_message", {
        message,
        timestamp: new Date(),
      });
    }
  }

  disconnectUser(userId, reason = "forced_disconnect") {
    const userSockets = this.getUserSockets(userId);

    userSockets.forEach((socketId) => {
      const socket = this.io?.sockets.sockets.get(socketId);
      if (socket) {
        socket.emit("forced_disconnect", { reason });
        socket.disconnect(true);
      }
    });

    logger.info(`User ${userId} forcefully disconnected: ${reason}`);
  }

  // ======================================
  // Stats
  // ======================================

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
