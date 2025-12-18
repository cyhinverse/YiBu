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

  static generateConversationId(userId1, userId2) {
    const ids = [userId1.toString(), userId2.toString()].sort();
    return `${ids[0]}_${ids[1]}`;
  }

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
        { createdAt: { $gt: new Date(Date.now() - 60000) } } // Only show empty chats if created in last 60s
      ]
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
          // Group chat
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
   * Get or create a direct conversation between two users
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

    // Add unique members
    const currentMembers = conversation.members.map(m => m.toString());
    const newMembers = memberIds.filter(id => !currentMembers.includes(id.toString()));
    
    if (newMembers.length > 0) {
      conversation.members.push(...newMembers);
      await conversation.save();
    }

    return Conversation.findById(conversationId)
      .populate('members', 'username name avatar lastActiveAt')
      .lean();
  }

  static async removeGroupMember(conversationId, userId, memberId) {
    const conversation = await Conversation.findOne({
      _id: conversationId,
      members: userId,
    });

    if (!conversation) {
      throw new Error('Hội thoại không tồn tại hoặc bạn không có quyền');
    }

    if (conversation.admin.toString() !== userId.toString() && userId.toString() !== memberId.toString()) {
      throw new Error('Chỉ admin mới có quyền xóa thành viên');
    }

    conversation.members = conversation.members.filter(
      m => m.toString() !== memberId.toString()
    );

    if (conversation.members.length === 0) {
      // In reality, might want to delete the group or something
    } else if (conversation.admin.toString() === memberId.toString()) {
      // Assign new admin if old admin left
      conversation.admin = conversation.members[0];
    }

    await conversation.save();
    return Conversation.findById(conversationId)
      .populate('members', 'username name avatar lastActiveAt')
      .lean();
  }

  static async findConversation(conversationId, userId, options = {}) {
    const { autoCreate = false } = options;
    const isCompound = typeof conversationId === 'string' && conversationId.includes('_');
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

  static async getConversationById(conversationId, currentUserId) {
    const conversation = await this.findConversation(conversationId, currentUserId);

    if (!conversation) {
      throw new Error('Hội thoại không tồn tại');
    }

    // Populate members if not already populated (lean/find returns raw doc)
    const populated = await Conversation.findById(conversation._id)
      .populate('members', 'username name avatar lastActiveAt')
      .populate('lastMessage')
      .lean();

    const otherUser = populated.isGroup ? null : populated.members?.find(
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

  static async getMessages(conversationId, userId, options = {}) {
    const { page = 1, limit = 50, before } = options;

    const conversation = await this.findConversation(conversationId, userId);

    if (!conversation) {
      throw new Error('Hội thoại không tồn tại hoặc bạn không tham gia');
    }

    let query = {
      isDeleted: { $ne: true }
    };

    if (conversation.isGroup) {
      query.conversationId = conversation._id.toString();
    } else {
      // Direct Message: Be extremely flexible. Search by:
      // 1. The new ObjectId
      // 2. The compound directId string
      // 3. Fallback: Any message exchanged between these specific two people
      const members = conversation.members.map(m => m._id || m);
      query.$or = [
        { conversationId: conversation._id.toString() },
        { conversationId: conversation._id },
        { conversationId: conversation.directId },
        { 
          sender: { $in: members }, 
          receiver: { $in: members } 
        }
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

    // Async mark as read
    this.markConversationAsRead(conversationId, userId).catch(err =>
      logger.error('Mark read failed:', err)
    );

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

  static async leaveGroup(conversationId, userId) {
    return this.removeGroupMember(conversationId, userId, userId);
  }

  static async sendMessage(conversationId, senderId, messageData) {
    const conversation = await this.findConversation(conversationId, senderId, { autoCreate: true });

    if (!conversation) {
      throw new Error('Hội thoại không tồn tại hoặc bạn không tham gia');
    }

    const { content, type = 'text', media = [], replyTo } = messageData;

    if (type === 'text' && (!content || content.trim().length === 0)) {
      throw new Error('Nội dung tin nhắn không được để trống');
    }

    // For direct message backward compatibility
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
      receiver: receiverId || conversation._id, // If group, receiver points to conversation
      conversationId: conversation._id, // Always use the real ObjectId in DB
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

    // Update conversation metadata
    conversation.lastMessage = message._id;
    await conversation.save();

    const populatedMessage = await Message.findById(message._id)
      .populate('sender', 'username name avatar')
      .lean();

    // Mark as delivered/seen for sender
    await Message.findByIdAndUpdate(message._id, {
        $push: { seenBy: { user: senderId, at: new Date() } }
    });

    // Emit realtime message via socket to all members
    try {
      conversation.members.forEach(memberId => {
        if (memberId.toString() !== senderId.toString()) {
           socketService.sendMessage(senderId, memberId, {
             ...populatedMessage,
             conversationId // Ensure client gets the ID
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

  static async uploadAttachments(files, userId) {
    const cloudinary = (await import('../configs/cloudinaryConfig.js')).default;
    const uploadedMedia = [];
    const fileArray = Array.isArray(files) ? files : [files];

    for (const file of fileArray) {
      const resourceType = file.mimetype?.startsWith('video/') ? 'video' : 'image';
      const result = await cloudinary.uploader.upload(file.tempFilePath, {
        folder: 'messages',
        resource_type: resourceType,
        transformation: resourceType === 'image' 
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



  static async markConversationAsRead(conversationId, userId) {
    const conversation = await this.findConversation(conversationId, userId);
    if (!conversation) return { updatedCount: 0 };

    const convId = conversation._id.toString();
    const result = await retryOperation(() =>
      Message.updateMany(
        {
          conversationId: { $in: [convId, conversation.directId].filter(Boolean) },
          'seenBy.user': { $ne: userId },
          sender: { $ne: userId },
          isDeleted: false
        },
        {
          $push: { seenBy: { user: userId, at: new Date() } },
          status: 'read'
        }
      )
    );

    // Socket notification
    if (!conversation.isGroup) {
        const otherUser = conversation.members.find(m => m.toString() !== userId.toString());
        if (otherUser) {
           socketService.sendConversationRead(otherUser.toString(), userId, convId);
        }
    }

    return { updatedCount: result.modifiedCount };
  }



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

  // ======================================
  // Message Management
  // ======================================

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


  // ======================================
  // Conversation Actions
  // ======================================

  static async deleteConversation(conversationId, userId) {
    const conversation = await this.findConversation(conversationId, userId);
    if (!conversation) throw new Error('Hội thoại không tồn tại');

    const convId = conversation._id.toString();

    // Mark all messages in this conversation as deleted for this user
    await Message.updateMany(
      { 
        conversationId: { $in: [convId, conversation.directId].filter(Boolean) },
        deletedFor: { $ne: userId }
      },
      { $addToSet: { deletedFor: userId } }
    );

    return { success: true };
  }

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



  static async getUsersForChat(userId) {
    const { conversations } = await this.getConversations(userId, {
      limit: 100,
    });
    return conversations.map(conv => conv.otherUser);
  }
}

export default MessageService;
