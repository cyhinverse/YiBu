import mongoose from "mongoose";
import Message from "../models/Message.js";
import User from "../models/User.js";
import UserSettings from "../models/UserSettings.js";
import Follow from "../models/Follow.js";
import logger from "../configs/logger.js";

/**
 * Message Service - Refactored for new model structure
 *
 * Key Changes:
 * 1. Uses conversationId for grouping messages
 * 2. Integrates with UserSettings for blocked/muted users
 * 3. Better message status tracking (sent, delivered, read)
 * 4. Pagination with cursor-based loading
 */
class MessageService {
  // ======================================
  // Conversation Management
  // ======================================

  static generateConversationId(userId1, userId2) {
    const ids = [userId1.toString(), userId2.toString()].sort();
    return `${ids[0]}_${ids[1]}`;
  }

  static async getConversations(userId, options = {}) {
    const { page = 1, limit = 20 } = options;

    const settings = await UserSettings.findOne({ user: userId })
      .select("blockedUsers mutedUsers")
      .lean();

    const blockedUsers =
      settings?.blockedUsers?.map((id) => id.toString()) || [];

    const conversations = await Message.aggregate([
      {
        $match: {
          $or: [
            { sender: new mongoose.Types.ObjectId(userId) },
            { receiver: new mongoose.Types.ObjectId(userId) },
          ],
          isDeleted: false,
        },
      },
      { $sort: { createdAt: -1 } },
      {
        $group: {
          _id: "$conversationId",
          lastMessage: { $first: "$$ROOT" },
          unreadCount: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $eq: ["$receiver", new mongoose.Types.ObjectId(userId)] },
                    { $ne: ["$status", "read"] },
                  ],
                },
                1,
                0,
              ],
            },
          },
        },
      },
      { $sort: { "lastMessage.createdAt": -1 } },
      { $skip: (page - 1) * limit },
      { $limit: limit },
    ]);

    const populatedConversations = await Promise.all(
      conversations.map(async (conv) => {
        const otherUserId =
          conv.lastMessage.sender.toString() === userId.toString()
            ? conv.lastMessage.receiver
            : conv.lastMessage.sender;

        if (blockedUsers.includes(otherUserId.toString())) {
          return null;
        }

        const otherUser = await User.findById(otherUserId)
          .select("username name avatar verified lastActiveAt")
          .lean();

        if (!otherUser) return null;

        return {
          conversationId: conv._id,
          otherUser: {
            ...otherUser,
            isOnline:
              otherUser.lastActiveAt &&
              Date.now() - new Date(otherUser.lastActiveAt).getTime() <
                5 * 60 * 1000,
          },
          lastMessage: {
            _id: conv.lastMessage._id,
            content: conv.lastMessage.content,
            type: conv.lastMessage.type,
            status: conv.lastMessage.status,
            createdAt: conv.lastMessage.createdAt,
            isMine: conv.lastMessage.sender.toString() === userId.toString(),
          },
          unreadCount: conv.unreadCount,
        };
      })
    );

    return {
      conversations: populatedConversations.filter(Boolean),
      hasMore: conversations.length === limit,
    };
  }

  static async getConversation(userId, otherUserId, options = {}) {
    const { page = 1, limit = 50, before } = options;

    const canMessage = await this.canSendMessage(userId, otherUserId);
    if (!canMessage.allowed) {
      throw new Error(canMessage.reason);
    }

    const conversationId = this.generateConversationId(userId, otherUserId);

    const query = {
      conversationId,
      isDeleted: false,
    };

    if (before) {
      query.createdAt = { $lt: new Date(before) };
    }

    const [messages, total] = await Promise.all([
      Message.find(query).sort({ createdAt: -1 }).limit(limit).lean(),
      Message.countDocuments({ conversationId, isDeleted: false }),
    ]);

    const formattedMessages = messages.reverse().map((msg) => ({
      ...msg,
      isMine: msg.sender.toString() === userId.toString(),
    }));

    await this.markAsRead(userId, otherUserId);

    return {
      messages: formattedMessages,
      total,
      hasMore: messages.length === limit,
    };
  }

  // ======================================
  // Message Sending
  // ======================================

  static async canSendMessage(senderId, receiverId) {
    if (senderId.toString() === receiverId.toString()) {
      return {
        allowed: false,
        reason: "Không thể gửi tin nhắn cho chính mình",
      };
    }

    const receiver = await User.findById(receiverId).select("privacy").lean();
    if (!receiver) {
      return { allowed: false, reason: "Người dùng không tồn tại" };
    }

    const [senderSettings, receiverSettings] = await Promise.all([
      UserSettings.findOne({ user: senderId }).select("blockedUsers").lean(),
      UserSettings.findOne({ user: receiverId }).select("blockedUsers").lean(),
    ]);

    if (
      senderSettings?.blockedUsers?.some(
        (id) => id.toString() === receiverId.toString()
      )
    ) {
      return { allowed: false, reason: "Bạn đã chặn người dùng này" };
    }

    if (
      receiverSettings?.blockedUsers?.some(
        (id) => id.toString() === senderId.toString()
      )
    ) {
      return {
        allowed: false,
        reason: "Bạn không thể gửi tin nhắn cho người này",
      };
    }

    if (receiver.privacy?.allowMessages === "no-one") {
      return { allowed: false, reason: "Người dùng không nhận tin nhắn" };
    }

    if (receiver.privacy?.allowMessages === "following") {
      const isFollowing = await Follow.isFollowing(receiverId, senderId);
      if (!isFollowing) {
        return {
          allowed: false,
          reason: "Chỉ người được follow mới có thể gửi tin nhắn",
        };
      }
    }

    return { allowed: true };
  }

  static async sendMessage(senderId, receiverId, messageData) {
    const canSend = await this.canSendMessage(senderId, receiverId);
    if (!canSend.allowed) {
      throw new Error(canSend.reason);
    }

    const { content, type = "text", media = [], replyTo } = messageData;

    if (type === "text" && (!content || content.trim().length === 0)) {
      throw new Error("Nội dung tin nhắn không được để trống");
    }

    const conversationId = this.generateConversationId(senderId, receiverId);

    let replyToMessage = null;
    if (replyTo) {
      replyToMessage = await Message.findOne({
        _id: replyTo,
        conversationId,
        isDeleted: false,
      })
        .select("content sender type")
        .lean();
    }

    const message = await Message.create({
      sender: senderId,
      receiver: receiverId,
      conversationId,
      content: content?.trim(),
      type,
      media,
      replyTo: replyToMessage
        ? {
            messageId: replyToMessage._id,
            content: replyToMessage.content?.substring(0, 100),
            sender: replyToMessage.sender,
          }
        : undefined,
      status: "sent",
    });

    const populatedMessage = await Message.findById(message._id)
      .populate("sender", "username name avatar")
      .lean();

    return {
      ...populatedMessage,
      isMine: true,
    };
  }

  static async sendMediaMessage(senderId, receiverId, files) {
    const cloudinary = (await import("../configs/cloudinaryConfig.js")).default;
    const uploadedMedia = [];

    const fileArray = Array.isArray(files) ? files : [files];

    for (const file of fileArray) {
      const resourceType = file.mimetype?.startsWith("video/")
        ? "video"
        : "image";

      const result = await cloudinary.uploader.upload(file.tempFilePath, {
        folder: "messages",
        resource_type: resourceType,
        transformation:
          resourceType === "image"
            ? [{ quality: "auto" }, { width: 1200, crop: "limit" }]
            : [{ quality: "auto" }],
      });

      uploadedMedia.push({
        url: result.secure_url,
        type: resourceType,
        publicId: result.public_id,
      });
    }

    return this.sendMessage(senderId, receiverId, {
      type: uploadedMedia.length === 1 ? uploadedMedia[0].type : "media",
      media: uploadedMedia,
    });
  }

  // ======================================
  // Message Status
  // ======================================

  static async markAsDelivered(messageId, userId) {
    const message = await Message.findOneAndUpdate(
      {
        _id: messageId,
        receiver: userId,
        status: "sent",
      },
      {
        status: "delivered",
        deliveredAt: new Date(),
      },
      { new: true }
    );

    return message;
  }

  static async markAsRead(userId, otherUserId) {
    const conversationId = this.generateConversationId(userId, otherUserId);

    const result = await Message.updateMany(
      {
        conversationId,
        receiver: userId,
        status: { $ne: "read" },
      },
      {
        status: "read",
        readAt: new Date(),
      }
    );

    return { updatedCount: result.modifiedCount };
  }

  static async markMessageAsRead(messageId, userId) {
    const message = await Message.findOneAndUpdate(
      {
        _id: messageId,
        receiver: userId,
        status: { $ne: "read" },
      },
      {
        status: "read",
        readAt: new Date(),
      },
      { new: true }
    );

    return message;
  }

  // ======================================
  // Message Management
  // ======================================

  static async deleteMessage(messageId, userId, forEveryone = false) {
    const message = await Message.findOne({ _id: messageId, sender: userId });

    if (!message) {
      throw new Error("Tin nhắn không tồn tại hoặc bạn không có quyền xóa");
    }

    if (forEveryone) {
      const timeDiff = Date.now() - message.createdAt.getTime();
      const maxDeleteTime = 15 * 60 * 1000;

      if (timeDiff > maxDeleteTime) {
        throw new Error("Chỉ có thể xóa tin nhắn trong vòng 15 phút");
      }

      message.isDeleted = true;
      message.deletedAt = new Date();
      message.content = "";
      message.media = [];
      await message.save();
    } else {
      if (!message.deletedFor) {
        message.deletedFor = [];
      }
      message.deletedFor.push(userId);
      await message.save();
    }

    return { success: true, forEveryone };
  }

  static async editMessage(messageId, userId, newContent) {
    const message = await Message.findOne({
      _id: messageId,
      sender: userId,
      type: "text",
      isDeleted: false,
    });

    if (!message) {
      throw new Error(
        "Tin nhắn không tồn tại hoặc bạn không có quyền chỉnh sửa"
      );
    }

    const timeDiff = Date.now() - message.createdAt.getTime();
    const maxEditTime = 15 * 60 * 1000;

    if (timeDiff > maxEditTime) {
      throw new Error("Chỉ có thể chỉnh sửa tin nhắn trong vòng 15 phút");
    }

    message.content = newContent.trim();
    message.isEdited = true;
    message.editedAt = new Date();
    await message.save();

    return message;
  }

  // ======================================
  // Conversation Actions
  // ======================================

  static async deleteConversation(userId, otherUserId) {
    const conversationId = this.generateConversationId(userId, otherUserId);

    await Message.updateMany(
      { conversationId },
      { $addToSet: { deletedFor: userId } }
    );

    return { success: true };
  }

  static async getUnreadCount(userId) {
    const settings = await UserSettings.findOne({ user: userId })
      .select("blockedUsers")
      .lean();

    const blockedUsers = settings?.blockedUsers || [];

    const count = await Message.countDocuments({
      receiver: userId,
      sender: { $nin: blockedUsers },
      status: { $ne: "read" },
      isDeleted: false,
      deletedFor: { $ne: userId },
    });

    return count;
  }

  static async getUnreadCountByConversation(userId) {
    const settings = await UserSettings.findOne({ user: userId })
      .select("blockedUsers")
      .lean();

    const blockedUsers = settings?.blockedUsers || [];

    const unreadByConversation = await Message.aggregate([
      {
        $match: {
          receiver: new mongoose.Types.ObjectId(userId),
          sender: {
            $nin: blockedUsers.map((id) => new mongoose.Types.ObjectId(id)),
          },
          status: { $ne: "read" },
          isDeleted: false,
          deletedFor: { $ne: new mongoose.Types.ObjectId(userId) },
        },
      },
      {
        $group: {
          _id: "$conversationId",
          count: { $sum: 1 },
          lastMessage: { $last: "$createdAt" },
        },
      },
    ]);

    return unreadByConversation;
  }

  // ======================================
  // Search
  // ======================================

  static async searchMessages(userId, query, options = {}) {
    const { page = 1, limit = 20 } = options;

    if (!query || query.trim().length < 2) {
      return { messages: [], total: 0 };
    }

    const messages = await Message.find({
      $or: [{ sender: userId }, { receiver: userId }],
      content: { $regex: query, $options: "i" },
      isDeleted: false,
      deletedFor: { $ne: userId },
    })
      .populate("sender", "username name avatar")
      .populate("receiver", "username name avatar")
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean();

    const total = await Message.countDocuments({
      $or: [{ sender: userId }, { receiver: userId }],
      content: { $regex: query, $options: "i" },
      isDeleted: false,
      deletedFor: { $ne: userId },
    });

    return {
      messages: messages.map((msg) => ({
        ...msg,
        isMine: msg.sender._id.toString() === userId.toString(),
      })),
      total,
      hasMore: page * limit < total,
    };
  }

  // ======================================
  // Typing Indicator
  // ======================================

  static async setTypingStatus(userId, otherUserId, isTyping) {
    return {
      conversationId: this.generateConversationId(userId, otherUserId),
      userId,
      isTyping,
    };
  }

  // ======================================
  // Utility
  // ======================================

  static async getMessageById(messageId) {
    return Message.findById(messageId)
      .populate("sender", "username name avatar")
      .lean();
  }

  static async getUsersForChat(userId) {
    const { conversations } = await this.getConversations(userId, {
      limit: 100,
    });
    return conversations.map((conv) => conv.otherUser);
  }
}

export default MessageService;
