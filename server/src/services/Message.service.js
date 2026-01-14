import mongoose from 'mongoose';
import Message from '../models/Message.js';
import User from '../models/User.js';
import UserSettings from '../models/UserSettings.js';
import Follow from '../models/Follow.js';
import logger from '../configs/logger.js';
import { retryOperation } from '../helpers/retryOperation.js';
import socketService from './Socket.Service.js';
import Conversation from '../models/Conversation.js';

/**
 * Message Service - Refactored for new model structure
 *
 * Key Changes:
 * 1. Uses Conversation model for group threads and direct chat metadata
 * 2. Integrates with UserSettings for blocked/muted users
 * 3. Better message status tracking (sent, delivered, read)
 * 4. Pagination with cursor-based loading
 */
class MessageService {
  /**
   * Generate conversation ID from 2 user IDs
   * @param {string} userId1 - First user ID
   * @param {string} userId2 - Second user ID
   * @returns {string} Conversation ID in format "userId1_userId2" (sorted)
   */
  static generateConversationId(userId1, userId2) {
    const ids = [userId1.toString(), userId2.toString()].sort();
    return `${ids[0]}_${ids[1]}`;
  }

  /**
   * Get list of conversations for user
   * @param {string} userId - User ID
   * @param {Object} options - Pagination options {page, limit}
   * @returns {Promise<{conversations: Array, hasMore: boolean}>} List of conversations
   */
  static async getConversations(userId, options = {}) {
    const { page = 1, limit = 20 } = options;

    const settings = await UserSettings.findOne({ user: userId })
      .select('blockedUsers mutedUsers')
      .lean();

    const blockedUsers = settings?.blockedUsers?.map(id => id.toString()) || [];

    const conversations = await Conversation.find({
      members: userId,
      $or: [
        { isGroup: true },
        { lastMessage: { $ne: null } },
        { createdAt: { $gt: new Date(Date.now() - 60000) } },
      ],
    })
      .populate('members', 'username name avatar lastActiveAt')
      .populate({
        path: 'lastMessage',
        populate: { path: 'sender', select: 'username name avatar' },
      })
      .sort({ updatedAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean();

    const formattedConversations = await Promise.all(
      conversations.map(async conv => {
        if (!conv.isGroup) {
          const otherUser = conv.members?.find(
            m => m._id.toString() !== userId.toString()
          );

          if (!otherUser || blockedUsers.includes(otherUser._id.toString())) {
            return null;
          }

          const unreadCount = await Message.countDocuments({
            conversationId: conv._id.toString(),
            receiver: userId,
            status: { $ne: 'read' },
            isDeleted: false,
          });

          return {
            ...conv,
            conversationId: conv._id.toString(),
            otherUser: {
              ...otherUser,
              isOnline:
                otherUser.lastActiveAt &&
                Date.now() - new Date(otherUser.lastActiveAt).getTime() <
                  5 * 60 * 1000,
            },
            unreadCount,
          };
        } else {
          const unreadCount = await Message.countDocuments({
            conversationId: conv._id.toString(),
            'seenBy.user': { $ne: userId },
            sender: { $ne: userId },
            isDeleted: false,
          });

          return {
            ...conv,
            conversationId: conv._id.toString(),
            unreadCount,
          };
        }
      })
    );

    return {
      conversations: formattedConversations.filter(Boolean),
      hasMore: conversations.length === limit,
    };
  }

  /**
   * Get or create direct conversation between 2 users
   * @param {string} userId - Current user ID
   * @param {string} participantId - Other user ID
   * @returns {Promise<Object>} Conversation object with participant information
   * @throws {Error} If not allowed to send message
   */
  static async getOrCreateDirectConversation(userId, participantId) {
    const canSend = await this.canSendMessage(userId, participantId);
    if (!canSend.allowed) {
      throw new Error(canSend.reason);
    }

    const directId = this.generateConversationId(userId, participantId);

    let conversation = await Conversation.findOne({ directId })
      .populate('members', 'username name avatar lastActiveAt')
      .lean();

    if (!conversation) {
      conversation = await Conversation.create({
        directId,
        members: [userId, participantId],
        isGroup: false,
      });
      conversation = await Conversation.findById(conversation._id)
        .populate('members', 'username name avatar lastActiveAt')
        .lean();
    }

    const otherUser = conversation.members?.find(
      m => m._id.toString() !== userId.toString()
    );

    const unreadCount = await Message.countDocuments({
      conversationId: conversation._id.toString(),
      receiver: userId,
      status: { $ne: 'read' },
      isDeleted: false,
    });

    return {
      ...conversation,
      conversationId: conversation._id.toString(),
      participant: otherUser,
      otherUser,
      unreadCount,
    };
  }

  /**
   * Create new group conversation
   * @param {string} userId - User ID creating the group
   * @param {Object} data - Group data {participantIds, groupName, groupAvatar}
   * @returns {Promise<Object>} Created conversation object
   */
  static async createGroupConversation(userId, data) {
    const { participantIds, groupName, groupAvatar } = data;

    const members = [...new Set([userId, ...participantIds])];

    const conversation = await Conversation.create({
      name: groupName,
      avatar: groupAvatar,
      isGroup: true,
      members: members,
      admin: userId,
    });

    return Conversation.findById(conversation._id)
      .populate('members', 'username name avatar lastActiveAt')
      .lean();
  }

  /**
   * Update group information
   * @param {string} conversationId - Conversation ID
   * @param {string} userId - User ID performing the action
   * @param {Object} data - Update data {groupName, groupAvatar}
   * @returns {Promise<Object>} Updated conversation object
   * @throws {Error} If conversation not found or unauthorized
   */
  static async updateGroup(conversationId, userId, data) {
    const conversation = await Conversation.findOne({
      _id: conversationId,
      members: userId,
    });

    if (!conversation) {
      throw new Error('Hội thoại không tồn tại hoặc bạn không có quyền');
    }

    if (data.groupName) conversation.name = data.groupName;
    if (data.groupAvatar) conversation.avatar = data.groupAvatar;

    await conversation.save();
    return Conversation.findById(conversationId)
      .populate('members', 'username name avatar lastActiveAt')
      .lean();
  }

  /**
   * Add members to group
   * @param {string} conversationId - Conversation ID
   * @param {string} userId - User ID performing the action
   * @param {Array} memberIds - List of new member IDs
   * @returns {Promise<Object>} Updated conversation object
   * @throws {Error} If not a group or unauthorized
   */
  static async addGroupMembers(conversationId, userId, memberIds) {
    const conversation = await Conversation.findOne({
      _id: conversationId,
      members: userId,
    });

    if (!conversation) {
      throw new Error('Hội thoại không tồn tại hoặc bạn không có quyền');
    }

    if (!conversation.isGroup) {
      throw new Error('Đây không phải là nhóm');
    }

    const currentMembers = conversation.members.map(m => m.toString());
    const newMembers = memberIds.filter(
      id => !currentMembers.includes(id.toString())
    );

    if (newMembers.length > 0) {
      conversation.members.push(...newMembers);
      await conversation.save();
    }

    return Conversation.findById(conversationId)
      .populate('members', 'username name avatar lastActiveAt')
      .lean();
  }

  /**
   * Remove member from group
   * @param {string} conversationId - Conversation ID
   * @param {string} userId - User ID performing the action (must be admin or self-leaving)
   * @param {string} memberId - Member ID to remove
   * @returns {Promise<Object>} Updated conversation object
   * @throws {Error} If unauthorized to remove
   */
  static async removeGroupMember(conversationId, userId, memberId) {
    const conversation = await Conversation.findOne({
      _id: conversationId,
      members: userId,
    });

    if (!conversation) {
      throw new Error('Hội thoại không tồn tại hoặc bạn không có quyền');
    }

    if (
      conversation.admin.toString() !== userId.toString() &&
      userId.toString() !== memberId.toString()
    ) {
      throw new Error('Chỉ admin mới có quyền xóa thành viên');
    }

    conversation.members = conversation.members.filter(
      m => m.toString() !== memberId.toString()
    );

    if (conversation.members.length === 0) {
    } else if (conversation.admin.toString() === memberId.toString()) {
      conversation.admin = conversation.members[0];
    }

    await conversation.save();
    return Conversation.findById(conversationId)
      .populate('members', 'username name avatar lastActiveAt')
      .lean();
  }

  /**
   * Find conversation by ID
   * @param {string} conversationId - Conversation ID (ObjectId or directId)
   * @param {string} userId - User ID
   * @param {Object} options - Options {autoCreate: boolean}
   * @returns {Promise<Object|null>} Conversation object or null
   */
  static async findConversation(conversationId, userId, options = {}) {
    const { autoCreate = false } = options;
    const isCompound =
      typeof conversationId === 'string' && conversationId.includes('_');
    const query = isCompound
      ? { directId: conversationId, members: userId }
      : { _id: conversationId, members: userId };

    let conversation = await Conversation.findOne(query);

    if (!conversation && isCompound && autoCreate) {
      const [u1, u2] = conversationId.split('_');
      const targetId = u1 === userId.toString() ? u2 : u1;
      const result = await this.getOrCreateDirectConversation(userId, targetId);
      conversation = await Conversation.findById(result._id);
    }

    return conversation;
  }

  /**
   * Get conversation information by ID
   * @param {string} conversationId - Conversation ID
   * @param {string} currentUserId - Current user ID
   * @returns {Promise<Object>} Conversation object with full information
   * @throws {Error} If conversation not found
   */
  static async getConversationById(conversationId, currentUserId) {
    const conversation = await this.findConversation(
      conversationId,
      currentUserId
    );

    if (!conversation) {
      throw new Error('Hội thoại không tồn tại');
    }

    const populated = await Conversation.findById(conversation._id)
      .populate('members', 'username name avatar lastActiveAt')
      .populate('lastMessage')
      .lean();

    const otherUser = populated.isGroup
      ? null
      : populated.members?.find(
          m => m._id.toString() !== currentUserId.toString()
        );

    const unreadCount = await Message.countDocuments({
      conversationId: populated._id.toString(),
      receiver: currentUserId,
      status: { $ne: 'read' },
      isDeleted: false,
    });

    return {
      ...populated,
      conversationId: populated._id.toString(),
      otherUser,
      unreadCount,
    };
  }

  /**
   * Get list of messages in conversation
   * @param {string} conversationId - Conversation ID
   * @param {string} userId - User ID
   * @param {Object} options - Options {page, limit, before}
   * @returns {Promise<{messages: Array, total: number, hasMore: boolean}>} List of messages
   * @throws {Error} If conversation not found or not a participant
   */
  static async getMessages(conversationId, userId, options = {}) {
    const { page = 1, limit = 50, before } = options;

    const conversation = await this.findConversation(conversationId, userId);

    if (!conversation) {
      throw new Error('Hội thoại không tồn tại hoặc bạn không tham gia');
    }

    let query = {
      isDeleted: { $ne: true },
    };

    if (conversation.isGroup) {
      query.conversationId = conversation._id.toString();
    } else {
      const members = conversation.members.map(m => m._id || m);
      query.$or = [
        { conversationId: conversation._id.toString() },
        { conversationId: conversation._id },
        { conversationId: conversation.directId },
        {
          sender: { $in: members },
          receiver: { $in: members },
        },
      ].filter(item => item.conversationId || (item.sender && item.receiver));
    }

    if (before) {
      query.createdAt = { $lt: new Date(before) };
    }

    const [messages, total] = await Promise.all([
      Message.find(query)
        .populate('sender', 'username name avatar')
        .sort({ createdAt: -1 })
        .limit(limit)
        .lean(),
      Message.countDocuments(query),
    ]);

    const formattedMessages = messages.reverse().map(msg => ({
      ...msg,
      isMine: msg.sender._id.toString() === userId.toString(),
    }));

    this.markConversationAsRead(conversationId, userId).catch(err =>
      logger.error('Mark read failed:', err)
    );

    return {
      messages: formattedMessages,
      total,
      hasMore: messages.length === limit,
    };
  }

  /**
   * Check if can send message to user
   * @param {string} senderId - Sender ID
   * @param {string} receiverId - Receiver ID
   * @returns {Promise<{allowed: boolean, reason?: string}>} Check result
   */
  static async canSendMessage(senderId, receiverId) {
    if (senderId.toString() === receiverId.toString()) {
      return {
        allowed: false,
        reason: 'Không thể gửi tin nhắn cho chính mình',
      };
    }

    const receiver = await User.findById(receiverId).select('privacy').lean();
    if (!receiver) {
      return { allowed: false, reason: 'Người dùng không tồn tại' };
    }

    const [senderSettings, receiverSettings] = await Promise.all([
      UserSettings.findOne({ user: senderId }).select('blockedUsers').lean(),
      UserSettings.findOne({ user: receiverId }).select('blockedUsers').lean(),
    ]);

    if (
      senderSettings?.blockedUsers?.some(
        id => id.toString() === receiverId.toString()
      )
    ) {
      return { allowed: false, reason: 'Bạn đã chặn người dùng này' };
    }

    if (
      receiverSettings?.blockedUsers?.some(
        id => id.toString() === senderId.toString()
      )
    ) {
      return {
        allowed: false,
        reason: 'Bạn không thể gửi tin nhắn cho người này',
      };
    }

    if (receiver.privacy?.allowMessages === 'no-one') {
      return { allowed: false, reason: 'Người dùng không nhận tin nhắn' };
    }

    if (receiver.privacy?.allowMessages === 'following') {
      const isFollowing = await Follow.isFollowing(receiverId, senderId);
      if (!isFollowing) {
        return {
          allowed: false,
          reason: 'Chỉ người được follow mới có thể gửi tin nhắn',
        };
      }
    }

    return { allowed: true };
  }

  /**
   * Leave group
   * @param {string} conversationId - Conversation ID
   * @param {string} userId - User ID leaving the group
   * @returns {Promise<Object>} Updated conversation object
   */
  static async leaveGroup(conversationId, userId) {
    return this.removeGroupMember(conversationId, userId, userId);
  }

  /**
   * Send message in conversation
   * @param {string} conversationId - Conversation ID
   * @param {string} senderId - Sender ID
   * @param {Object} messageData - Message data {content, type, media, replyTo}
   * @returns {Promise<Object>} Created message object
   * @throws {Error} If conversation not found or content is empty
   */
  static async sendMessage(conversationId, senderId, messageData) {
    const conversation = await this.findConversation(conversationId, senderId, {
      autoCreate: true,
    });

    if (!conversation) {
      throw new Error('Hội thoại không tồn tại hoặc bạn không tham gia');
    }

    const { content, type = 'text', media = [], replyTo } = messageData;

    if (type === 'text' && (!content || content.trim().length === 0)) {
      throw new Error('Nội dung tin nhắn không được để trống');
    }

    let receiverId = null;
    if (!conversation.isGroup) {
      receiverId = conversation.members.find(
        m => m.toString() !== senderId.toString()
      );
    }

    let replyToMessage = null;
    if (replyTo) {
      replyToMessage = await Message.findOne({
        _id: replyTo,
        conversationId: conversation._id,
        isDeleted: false,
      })
        .select('content sender type')
        .lean();
    }

    const message = await Message.create({
      sender: senderId,
      receiver: receiverId || conversation._id,
      conversationId: conversation._id,
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
      status: 'sent',
    });

    conversation.lastMessage = message._id;
    await conversation.save();

    const populatedMessage = await Message.findById(message._id)
      .populate('sender', 'username name avatar')
      .lean();

    await Message.findByIdAndUpdate(message._id, {
      $push: { seenBy: { user: senderId, at: new Date() } },
    });

    try {
      conversation.members.forEach(memberId => {
        if (memberId.toString() !== senderId.toString()) {
          socketService.sendMessage(senderId, memberId, {
            ...populatedMessage,
            conversationId,
          });
        }
      });
      logger.debug(`Socket messages sent for conversation ${conversationId}`);
    } catch (socketError) {
      logger.error('Failed to send socket message:', socketError);
    }

    return {
      ...populatedMessage,
      conversationId,
      isMine: true,
    };
  }

  /**
   * Upload attachments for message
   * @param {Array|Object} files - File(s) from multer memory storage
   * @param {string} userId - User ID
   * @returns {Promise<Array>} List of media objects {url, type, publicId}
   */
  static async uploadAttachments(files, userId) {
    const { uploadToCloudinary } = await import(
      '../middlewares/multerUpload.js'
    );
    const uploadedMedia = [];
    const fileArray = Array.isArray(files) ? files : [files];

    for (const file of fileArray) {
      const resourceType = file.mimetype?.startsWith('video/')
        ? 'video'
        : 'image';
      const publicId = `msg_${userId}_${Date.now()}_${
        file.originalname.split('.')[0]
      }`;

      const result = await uploadToCloudinary(file.buffer, {
        folder: 'messages',
        resourceType: resourceType,
        publicId: publicId,
        transformation:
          resourceType === 'image'
            ? [{ quality: 'auto' }, { width: 1200, crop: 'limit' }]
            : [{ quality: 'auto' }],
      });

      uploadedMedia.push({
        url: result.secure_url,
        type: resourceType,
        publicId: result.public_id,
      });
    }
    return uploadedMedia;
  }

  /**
   * Mark all messages in conversation as read
   * @param {string} conversationId - Conversation ID
   * @param {string} userId - User ID
   * @returns {Promise<{updatedCount: number}>} Number of messages updated
   */
  static async markConversationAsRead(conversationId, userId) {
    const conversation = await this.findConversation(conversationId, userId);
    if (!conversation) return { updatedCount: 0 };

    const convId = conversation._id.toString();
    const result = await retryOperation(() =>
      Message.updateMany(
        {
          conversationId: {
            $in: [convId, conversation.directId].filter(Boolean),
          },
          'seenBy.user': { $ne: userId },
          sender: { $ne: userId },
          isDeleted: false,
        },
        {
          $push: { seenBy: { user: userId, at: new Date() } },
          status: 'read',
        }
      )
    );

    if (!conversation.isGroup) {
      const otherUser = conversation.members.find(
        m => m.toString() !== userId.toString()
      );
      if (otherUser) {
        socketService.sendConversationRead(
          otherUser.toString(),
          userId,
          convId
        );
      }
    }

    return { updatedCount: result.modifiedCount };
  }

  /**
   * Mark a message as read
   * @param {string} messageId - Message ID
   * @param {string} userId - User ID
   * @returns {Promise<Object|null>} Updated message object or null
   */
  static async markMessageAsRead(messageId, userId) {
    const message = await retryOperation(() =>
      Message.findOneAndUpdate(
        {
          _id: messageId,
          receiver: userId,
          status: { $ne: 'read' },
        },
        {
          status: 'read',
          readAt: new Date(),
        },
        { new: true }
      )
    );

    if (message) {
      socketService.sendMessageStatus(
        message.sender,
        userId,
        message._id,
        'read'
      );
    }

    return message;
  }

  /**
   * Delete message
   * @param {string} messageId - Message ID
   * @param {string} userId - User ID (must be sender)
   * @param {boolean} forEveryone - Delete for everyone or just for self
   * @returns {Promise<{success: boolean, forEveryone: boolean}>} Delete result
   * @throws {Error} If message not found, unauthorized, or past 15 minutes
   */
  static async deleteMessage(messageId, userId, forEveryone = false) {
    const message = await Message.findOne({ _id: messageId, sender: userId });

    if (!message) {
      throw new Error('Tin nhắn không tồn tại hoặc bạn không có quyền xóa');
    }

    if (forEveryone) {
      const timeDiff = Date.now() - message.createdAt.getTime();
      const maxDeleteTime = 15 * 60 * 1000;

      if (timeDiff > maxDeleteTime) {
        throw new Error('Chỉ có thể xóa tin nhắn trong vòng 15 phút');
      }

      message.isDeleted = true;
      message.deletedAt = new Date();
      message.content = '';
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

  /**
   * Delete conversation (hide all messages for user)
   * @param {string} conversationId - Conversation ID
   * @param {string} userId - User ID
   * @returns {Promise<{success: boolean}>} Delete result
   * @throws {Error} If conversation not found
   */
  static async deleteConversation(conversationId, userId) {
    const conversation = await this.findConversation(conversationId, userId);
    if (!conversation) throw new Error('Hội thoại không tồn tại');

    const convId = conversation._id.toString();

    await Message.updateMany(
      {
        conversationId: {
          $in: [convId, conversation.directId].filter(Boolean),
        },
        deletedFor: { $ne: userId },
      },
      { $addToSet: { deletedFor: userId } }
    );

    return { success: true };
  }

  /**
   * Get unread message count for user
   * @param {string} userId - User ID
   * @returns {Promise<number>} Number of unread messages
   */
  static async getUnreadCount(userId) {
    const settings = await UserSettings.findOne({ user: userId })
      .select('blockedUsers')
      .lean();

    const blockedUsers = settings?.blockedUsers || [];

    const count = await Message.countDocuments({
      'seenBy.user': { $ne: userId },
      sender: { $nin: [userId, ...blockedUsers] },
      isDeleted: false,
      deletedFor: { $ne: userId },
    });

    return count;
  }

  /**
   * Search messages by content
   * @param {string} userId - User ID
   * @param {string} query - Search keyword
   * @param {Object} options - Pagination options {page, limit}
   * @returns {Promise<{messages: Array, total: number, hasMore: boolean}>} Search results
   */
  static async searchMessages(userId, query, options = {}) {
    const { page = 1, limit = 20 } = options;

    if (!query || query.trim().length < 2) {
      return { messages: [], total: 0 };
    }

    const messages = await Message.find({
      $or: [{ sender: userId }, { receiver: userId }],
      content: { $regex: query, $options: 'i' },
      isDeleted: false,
      deletedFor: { $ne: userId },
    })
      .populate('sender', 'username name avatar')
      .populate('receiver', 'username name avatar')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean();

    const total = await Message.countDocuments({
      $or: [{ sender: userId }, { receiver: userId }],
      content: { $regex: query, $options: 'i' },
      isDeleted: false,
      deletedFor: { $ne: userId },
    });

    return {
      messages: messages.map(msg => ({
        ...msg,
        isMine: msg.sender._id.toString() === userId.toString(),
      })),
      total,
      hasMore: page * limit < total,
    };
  }

  /**
   * Add reaction to message
   * @param {string} messageId - Message ID
   * @param {string} userId - User ID
   * @param {string} emoji - Emoji reaction
   * @returns {Promise<{success: boolean, reactions: Array}>} Result and list of reactions
   * @throws {Error} If message not found
   */
  static async addReaction(messageId, userId, emoji) {
    const message = await Message.findOne({
      _id: messageId,
      isDeleted: false,
    });

    if (!message) {
      throw new Error('Tin nhắn không tồn tại');
    }

    if (!message.reactions) {
      message.reactions = [];
    }

    const existingReactionIndex = message.reactions.findIndex(
      r => r.user.toString() === userId.toString() && r.emoji === emoji
    );

    if (existingReactionIndex > -1) {
      message.reactions.splice(existingReactionIndex, 1);
    } else {
      message.reactions = message.reactions.filter(
        r => r.user.toString() !== userId.toString()
      );
      message.reactions.push({
        user: userId,
        emoji,
        createdAt: new Date(),
      });
    }

    await message.save();

    socketService.emitToRoom(
      `conversation:${message.conversationId}`,
      'message_reaction',
      {
        messageId,
        reactions: message.reactions,
      }
    );

    return { success: true, reactions: message.reactions };
  }

  /**
   * Remove reaction from message
   * @param {string} messageId - Message ID
   * @param {string} userId - User ID
   * @returns {Promise<{success: boolean, reactions: Array}>} Result and list of reactions
   * @throws {Error} If message not found
   */
  static async removeReaction(messageId, userId) {
    const message = await Message.findOne({
      _id: messageId,
      isDeleted: false,
    });

    if (!message) {
      throw new Error('Tin nhắn không tồn tại');
    }

    if (!message.reactions) {
      return { success: true, reactions: [] };
    }

    message.reactions = message.reactions.filter(
      r => r.user.toString() !== userId.toString()
    );

    await message.save();

    socketService.emitToRoom(
      `conversation:${message.conversationId}`,
      'message_reaction',
      {
        messageId,
        reactions: message.reactions,
      }
    );

    return { success: true, reactions: message.reactions };
  }

  /**
   * Get list of users for chat (from conversations)
   * @param {string} userId - User ID
   * @returns {Promise<Array>} List of users
   */
  static async getUsersForChat(userId) {
    const { conversations } = await this.getConversations(userId, {
      limit: 100,
    });
    return conversations.map(conv => conv.otherUser);
  }
}

export default MessageService;
