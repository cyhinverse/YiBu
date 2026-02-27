import messageRepository from './message.repository.js';
import mongoose from 'mongoose';
import logger from '../../configs/logger.js';
import { retryOperation } from '../../utils/retryOperation.js';
import { escapeRegExp } from '../../utils/escapeRegExp.js';
import socketService from '../shared/socket/socket.service.js';
import ApiError from '../../helpers/ApiError.js';

const LEGACY_MEDIA_MESSAGE_TYPES = new Set(['image', 'video', 'audio', 'file']);


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
  static normalizeMessageType(rawType, hasMedia = false) {
    if (!rawType) {
      return hasMedia ? 'media' : 'text';
    }

    if (LEGACY_MEDIA_MESSAGE_TYPES.has(rawType)) {
      return 'media';
    }

    if (rawType === 'media' || rawType === 'system' || rawType === 'reply') {
      return rawType;
    }

    return hasMedia ? 'media' : 'text';
  }

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

    const settings = await messageRepository.userSettingsFindOne({ user: userId })
      .select('blockedUsers mutedUsers')
      .lean();

    const blockedUsers = settings?.blockedUsers?.map(id => id.toString()) || [];

    const conversations = await messageRepository.conversationFind({
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

    // Prepare batch unread count query
    const conversationIds = conversations.map(c => c._id.toString());
    const unreadCounts = await messageRepository.messageAggregate([
      {
        $match: {
          conversationId: { $in: conversationIds },
          isDeleted: false,
          $or: [
            { receiver: userId, status: { $ne: 'read' } }, // Direct
            { 
              'seenBy.user': { $ne: userId }, 
              sender: { $ne: userId },
              receiver: { $ne: userId } // Ensure we don't count direct messages here if logic overlaps, though receiver check above handles it
            } 
          ]
        }
      },
      {
        $group: {
          _id: '$conversationId',
          count: { $sum: 1 }
        }
      }
    ]);

    const unreadMap = new Map(unreadCounts.map(c => [c._id.toString(), c.count]));

    const formattedConversations = await Promise.all(
      conversations.map(async conv => {
        if (!conv.isGroup) {
          const otherUser = conv.members?.find(
            m => m._id.toString() !== userId.toString()
          );

          if (!otherUser || blockedUsers.includes(otherUser._id.toString())) {
            return null;
          }

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
            unreadCount: unreadMap.get(conv._id.toString()) || 0,
          };
        } else {
          return {
            ...conv,
            conversationId: conv._id.toString(),
            unreadCount: unreadMap.get(conv._id.toString()) || 0,
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
      throw ApiError.forbidden(canSend.reason);

    }

    const directId = this.generateConversationId(userId, participantId);

    let conversation = await messageRepository.conversationFindOne({ directId })
      .populate('members', 'username name avatar lastActiveAt')
      .lean();

    if (!conversation) {
      conversation = await messageRepository.conversationCreate({
        directId,
        members: [userId, participantId],
        isGroup: false,
      });
      conversation = await messageRepository.conversationFindById(conversation._id)
        .populate('members', 'username name avatar lastActiveAt')
        .lean();
    }

    const otherUser = conversation.members?.find(
      m => m._id.toString() !== userId.toString()
    );

    const unreadCount = await messageRepository.messageCountDocuments({
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
    const { participantIds, groupName, groupAvatar, name, avatar } = data;
    const finalGroupName = groupName || name;
    const finalGroupAvatar = groupAvatar || avatar;

    const members = [...new Set([userId, ...participantIds])];

    const conversation = await messageRepository.conversationCreate({
      name: finalGroupName,
      avatar: finalGroupAvatar,
      isGroup: true,
      members: members,
      admin: userId,
    });

    return messageRepository.conversationFindById(conversation._id)
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
    const conversation = await messageRepository.conversationFindOne({
      _id: conversationId,
      members: userId,
    });

    if (!conversation) {
      throw ApiError.forbidden('Hội thoại không tồn tại hoặc bạn không có quyền');

    }

    const finalGroupName = data.groupName || data.name;
    const finalGroupAvatar = data.groupAvatar || data.avatar;

    if (finalGroupName) conversation.name = finalGroupName;
    if (finalGroupAvatar) conversation.avatar = finalGroupAvatar;

    await conversation.save();
    return messageRepository.conversationFindById(conversationId)
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
    const conversation = await messageRepository.conversationFindOne({
      _id: conversationId,
      members: userId,
    });

    if (!conversation) {
      throw ApiError.forbidden('Hội thoại không tồn tại hoặc bạn không có quyền');

    }

    if (!conversation.isGroup) {
      throw ApiError.badRequest('Đây không phải là nhóm');

    }

    const currentMembers = conversation.members.map(m => m.toString());
    const newMembers = memberIds.filter(
      id => !currentMembers.includes(id.toString())
    );

    if (newMembers.length > 0) {
      conversation.members.push(...newMembers);
      await conversation.save();
    }

    return messageRepository.conversationFindById(conversationId)
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
    const conversation = await messageRepository.conversationFindOne({
      _id: conversationId,
      members: userId,
    });

    if (!conversation) {
      throw ApiError.forbidden('Hội thoại không tồn tại hoặc bạn không có quyền');

    }

    if (
      conversation.admin.toString() !== userId.toString() &&
      userId.toString() !== memberId.toString()
    ) {
      throw ApiError.forbidden('Chỉ admin mới có quyền xóa thành viên');

    }

    conversation.members = conversation.members.filter(
      m => m.toString() !== memberId.toString()
    );

    if (conversation.members.length === 0) {
    } else if (conversation.admin.toString() === memberId.toString()) {
      conversation.admin = conversation.members[0];
    }

    await conversation.save();
    return messageRepository.conversationFindById(conversationId)
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

    let conversation = await messageRepository.conversationFindOne(query);

    if (!conversation && isCompound && autoCreate) {
      const [u1, u2] = conversationId.split('_');
      const targetId = u1 === userId.toString() ? u2 : u1;
      const result = await this.getOrCreateDirectConversation(userId, targetId);
      conversation = await messageRepository.conversationFindById(result._id);
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
      throw ApiError.notFound('Hội thoại không tồn tại');

    }

    const populated = await messageRepository.conversationFindById(conversation._id)
      .populate('members', 'username name avatar lastActiveAt')
      .populate('lastMessage')
      .lean();

    const otherUser = populated.isGroup
      ? null
      : populated.members?.find(
          m => m._id.toString() !== currentUserId.toString()
        );

    const unreadCount = await messageRepository.messageCountDocuments({
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
      throw ApiError.forbidden('Hội thoại không tồn tại hoặc bạn không tham gia');

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
      messageRepository.messageFind(query)
        .populate('sender', 'username name avatar')
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      messageRepository.messageCountDocuments(query),
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

    const receiver = await messageRepository.userFindById(receiverId).select('privacy').lean();
    if (!receiver) {
      return { allowed: false, reason: 'Người dùng không tồn tại' };
    }

    const [senderSettings, receiverSettings] = await Promise.all([
      messageRepository.userSettingsFindOne({ user: senderId }).select('blockedUsers').lean(),
      messageRepository.userSettingsFindOne({ user: receiverId }).select('blockedUsers').lean(),
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

    if (
      receiver.privacy?.allowMessages === 'no-one' ||
      receiver.privacy?.allowMessages === 'none'
    ) {
      return { allowed: false, reason: 'Người dùng không nhận tin nhắn' };
    }

    if (receiver.privacy?.allowMessages === 'following') {
      const isFollowing = await messageRepository.followIsFollowing(receiverId, senderId);
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
      throw ApiError.forbidden('Hội thoại không tồn tại hoặc bạn không tham gia');

    }

    const { content, type, messageType, media = [], replyTo } = messageData;
    const normalizedMessageType = this.normalizeMessageType(
      type || messageType,
      media.length > 0
    );
    const normalizedContent = typeof content === 'string' ? content.trim() : '';

    if (normalizedMessageType === 'text' && normalizedContent.length === 0) {
      throw ApiError.badRequest('Nội dung tin nhắn không được để trống');

    }

    let replyToMessage = null;
    if (replyTo) {
      replyToMessage = await messageRepository.messageFindOne({
        _id: replyTo,
        conversationId: conversation._id.toString(),
        isDeleted: false,
      })
        .select('_id')
        .lean();
    }

    const receiver = conversation.isGroup
      ? senderId
      : conversation.members.find(m => m.toString() !== senderId.toString());

    const message = await messageRepository.messageCreate({
      sender: senderId,
      receiver: receiver || senderId,
      conversationId: conversation._id.toString(),
      content: normalizedContent || undefined,
      messageType: normalizedMessageType,
      media,
      replyTo: replyToMessage ? replyToMessage._id : undefined,
      status: 'sent',
    });

    conversation.lastMessage = message._id;
    await conversation.save();

    const populatedMessage = await messageRepository.messageFindById(message._id)
      .populate('sender', 'username name avatar')
      .populate('replyTo', 'content sender messageType')
      .lean();

    await messageRepository.messageFindByIdAndUpdate(message._id, {
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
    const { uploadToCloudinary } =
      await import('../../middlewares/multerUpload.js');
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
      messageRepository.messageUpdateMany(
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
          $set: { status: 'read', readAt: new Date() },
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
      messageRepository.messageFindOneAndUpdate(
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
    const message = await messageRepository.messageFindOne({ _id: messageId, sender: userId });

    if (!message) {
      throw ApiError.forbidden('Tin nhắn không tồn tại hoặc bạn không có quyền xóa');

    }

    if (forEveryone) {
      const timeDiff = Date.now() - message.createdAt.getTime();
      const maxDeleteTime = 15 * 60 * 1000;

      if (timeDiff > maxDeleteTime) {
        throw ApiError.forbidden('Chỉ có thể xóa tin nhắn trong vòng 15 phút');

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
    if (!conversation) {
      throw ApiError.notFound('Hội thoại không tồn tại');
    }


    const convId = conversation._id.toString();

    await messageRepository.messageUpdateMany(
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
    const settings = await messageRepository.userSettingsFindOne({ user: userId })
      .select('blockedUsers')
      .lean();

    const blockedUsers = settings?.blockedUsers || [];
    const excludedSenders = [userId, ...blockedUsers];
    const groupConversationIds = await messageRepository.conversationFind({
      members: userId,
      isGroup: true,
    })
      .select('_id')
      .lean();

    const unreadFilters = [
      {
        receiver: userId,
        status: { $ne: 'read' },
      },
    ];

    if (groupConversationIds.length > 0) {
      unreadFilters.push({
        conversationId: {
          $in: groupConversationIds.map(item => item._id.toString()),
        },
        'seenBy.user': { $ne: userId },
      });
    }

    const count = await messageRepository.messageCountDocuments({
      $or: unreadFilters,
      sender: { $nin: excludedSenders },
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
    const { page = 1, limit = 20, conversationId } = options;

    if (!query || query.trim().length < 2) {
      return { messages: [], total: 0 };
    }

    const normalizedQuery = query.trim();
    const safePattern = escapeRegExp(normalizedQuery);
    const messageQuery = {
      content: { $regex: safePattern, $options: 'i' },
      isDeleted: false,
      deletedFor: { $ne: userId },
    };

    if (conversationId) {
      const conversation = await this.findConversation(conversationId, userId);
      if (!conversation) {
        return { messages: [], total: 0, hasMore: false };
      }
      messageQuery.conversationId = conversation._id.toString();
    } else {
      const conversations = await messageRepository.conversationFind({ members: userId })
        .select('_id')
        .lean();
      const conversationIds = conversations.map(item => item._id.toString());
      if (conversationIds.length === 0) {
        return { messages: [], total: 0, hasMore: false };
      }
      messageQuery.conversationId = { $in: conversationIds };
    }

    const messages = await messageRepository.messageFind(messageQuery)
      .populate('sender', 'username name avatar')
      .populate('receiver', 'username name avatar')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean();

    const total = await messageRepository.messageCountDocuments(messageQuery);

    return {
      messages: messages.map(msg => ({
        ...msg,
        isMine:
          (msg.sender?._id || msg.sender)?.toString() === userId.toString(),
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
    const message = await messageRepository.messageFindOne({
      _id: messageId,
      isDeleted: false,
    });

    if (!message) {
      throw ApiError.notFound('Tin nhắn không tồn tại');

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
    const message = await messageRepository.messageFindOne({
      _id: messageId,
      isDeleted: false,
    });

    if (!message) {
      throw ApiError.notFound('Tin nhắn không tồn tại');

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
  static async getUsersForChat(userId, options = {}) {
    const { page = 1, limit = 20, search } = options;
    const currentUserId = new mongoose.Types.ObjectId(userId);
    const safeSearch = search && search.trim() ? escapeRegExp(search.trim()) : null;

    const pipeline = [
      { $match: { members: currentUserId } },
      { $project: { members: 1 } },
      { $unwind: '$members' },
      { $match: { members: { $ne: currentUserId } } },
      { $group: { _id: '$members' } },
      {
        $lookup: {
          from: 'Users',
          localField: '_id',
          foreignField: '_id',
          as: 'user',
        },
      },
      { $unwind: '$user' },
      ...(safeSearch
        ? [
            {
              $match: {
                $or: [
                  { 'user.username': { $regex: safeSearch, $options: 'i' } },
                  { 'user.name': { $regex: safeSearch, $options: 'i' } },
                ],
              },
            },
          ]
        : []),
      {
        $project: {
          _id: '$user._id',
          username: '$user.username',
          name: '$user.name',
          avatar: '$user.avatar',
          verified: '$user.verified',
        },
      },
      { $sort: { username: 1, _id: 1 } },
      {
        $facet: {
          metadata: [{ $count: 'total' }],
          users: [{ $skip: (page - 1) * limit }, { $limit: limit }],
        },
      },
    ];

    const [result] = await messageRepository.conversationAggregate(pipeline).collation({
      locale: 'en',
      strength: 2,
    });
    const users = result?.users || [];
    const total = result?.metadata?.[0]?.total || 0;

    return {
      users,
      total,
      hasMore: page * limit < total,
    };
  }
}

export default MessageService;



