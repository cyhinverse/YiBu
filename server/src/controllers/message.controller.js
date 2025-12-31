import { CatchError } from '../configs/CatchError.js';
import MessageService from '../services/Message.Service.js';
import UserService from '../services/User.Service.js';
import { formatResponse } from '../helpers/formatResponse.js';
import { getPaginationParams } from '../helpers/pagination.js';
import socketService from '../services/Socket.Service.js';

/**
 * Message Controller
 * Xử lý tất cả các request liên quan đến tin nhắn và hội thoại
 *
 * Các chức năng chính:
 * - Quản lý hội thoại (conversations)
 * - Quản lý nhóm chat (groups)
 * - Gửi/nhận tin nhắn (messages)
 * - Trạng thái tin nhắn (read/unread)
 * - Reactions và typing indicators
 */
const MessageController = {
  // ======================================
  // Conversations
  // ======================================

  GetAllConversations: CatchError(async (req, res) => {
    const userId = req.user.id;
    const { page = 1, limit = 20 } = getPaginationParams(req.query);

    const result = await MessageService.getConversations(userId, {
      page,
      limit,
    });
    return formatResponse(res, 200, 1, 'Success', result);
  }),

  GetConversation: CatchError(async (req, res) => {
    const { conversationId } = req.params;
    const userId = req.user.id;

    const conversation = await MessageService.getConversationById(
      conversationId,
      userId
    );
    return formatResponse(res, 200, 1, 'Success', conversation);
  }),

  GetOrCreateConversation: CatchError(async (req, res) => {
    const userId = req.user.id;
    const {
      participantId, // single participant (from client)
      participantIds, // array of participants (for groups)
      isGroup = false,
      groupName,
      groupAvatar,
    } = req.body;

    // Handle single participantId (direct message)
    if (participantId && !isGroup) {
      // Resolve username to userId if needed
      const resolvedParticipantId = await UserService.resolveUserIdOrUsername(
        participantId
      );
      const conversation = await MessageService.getOrCreateDirectConversation(
        userId,
        resolvedParticipantId
      );
      return formatResponse(res, 200, 1, 'Success', conversation);
    }

    // Handle participantIds array
    if (
      participantIds &&
      Array.isArray(participantIds) &&
      participantIds.length > 0
    ) {
      // Resolve all usernames to userIds
      const resolvedIds = await Promise.all(
        participantIds.map(id => UserService.resolveUserIdOrUsername(id))
      );

      // For direct messages with single participant
      if (!isGroup && resolvedIds.length === 1) {
        const conversation = await MessageService.getOrCreateDirectConversation(
          userId,
          resolvedIds[0]
        );
        return formatResponse(res, 200, 1, 'Success', conversation);
      }

      // For groups
      if (isGroup) {
        const conversation = await MessageService.createGroupConversation(
          userId,
          {
            participantIds: resolvedIds,
            groupName,
            groupAvatar,
          }
        );
        return formatResponse(
          res,
          201,
          1,
          'Group created successfully',
          conversation
        );
      }
    }

    return formatResponse(res, 400, 0, 'Participant ID is required');
  }),

  CreateGroupConversation: CatchError(async (req, res) => {
    const userId = req.user.id;
    const { participantIds, groupName, groupAvatar } = req.body;

    if (!participantIds || participantIds.length < 2) {
      return formatResponse(
        res,
        400,
        0,
        'At least 2 participants required for group'
      );
    }

    if (!groupName) {
      return formatResponse(res, 400, 0, 'Group name is required');
    }

    const conversation = await MessageService.createGroupConversation(userId, {
      participantIds,
      groupName,
      groupAvatar,
    });

    // Notify participants via socket
    participantIds.forEach(participantId => {
      if (participantId !== userId) {
        socketService.emitGroupCreated(participantId, {
          conversationId: conversation._id,
          groupName,
          createdBy: userId,
        });
      }
    });

    return formatResponse(
      res,
      201,
      1,
      'Group created successfully',
      conversation
    );
  }),

  UpdateGroupConversation: CatchError(async (req, res) => {
    const { conversationId } = req.params;
    const userId = req.user.id;
    const { groupName, groupAvatar } = req.body;

    const conversation = await MessageService.updateGroup(
      conversationId,
      userId,
      {
        groupName,
        groupAvatar,
      }
    );

    return formatResponse(
      res,
      200,
      1,
      'Group updated successfully',
      conversation
    );
  }),

  DeleteConversation: CatchError(async (req, res) => {
    const { conversationId } = req.params;
    const userId = req.user.id;

    await MessageService.deleteConversation(conversationId, userId);
    return formatResponse(res, 200, 1, 'Conversation deleted successfully');
  }),

  // ======================================
  // Group Members
  // ======================================

  AddGroupMembers: CatchError(async (req, res) => {
    const { conversationId } = req.params;
    const userId = req.user.id;
    const { memberIds } = req.body;

    if (!memberIds || !Array.isArray(memberIds) || memberIds.length === 0) {
      return formatResponse(res, 400, 0, 'Member IDs are required');
    }

    const conversation = await MessageService.addGroupMembers(
      conversationId,
      userId,
      memberIds
    );

    // Notify new members
    memberIds.forEach(memberId => {
      socketService.emitAddedToGroup(memberId, {
        conversationId,
        addedBy: userId,
      });
    });

    return formatResponse(
      res,
      200,
      1,
      'Members added successfully',
      conversation
    );
  }),

  RemoveGroupMember: CatchError(async (req, res) => {
    const { conversationId, memberId } = req.params;
    const userId = req.user.id;

    const conversation = await MessageService.removeGroupMember(
      conversationId,
      userId,
      memberId
    );

    // Notify removed member
    socketService.emitRemovedFromGroup(memberId, {
      conversationId,
      removedBy: userId,
    });

    return formatResponse(
      res,
      200,
      1,
      'Member removed successfully',
      conversation
    );
  }),

  LeaveGroup: CatchError(async (req, res) => {
    const { conversationId } = req.params;
    const userId = req.user.id;

    await MessageService.leaveGroup(conversationId, userId);
    return formatResponse(res, 200, 1, 'Left group successfully');
  }),

  // ======================================
  // Messages
  // ======================================

  GetMessages: CatchError(async (req, res) => {
    const { conversationId } = req.params;
    const userId = req.user.id;
    const { page = 1, limit = 50, before } = req.query;

    const result = await MessageService.getMessages(conversationId, userId, {
      page: parseInt(page),
      limit: parseInt(limit),
      before,
    });
    return formatResponse(res, 200, 1, 'Success', result);
  }),

  SendMessage: CatchError(async (req, res) => {
    const userId = req.user.id;
    const { conversationId, content, messageType = 'text', replyTo } = req.body;

    let attachments = [];
    if (req.files && req.files.length > 0) {
      attachments = await MessageService.uploadAttachments(req.files, userId);
    }

    if (!content && attachments.length === 0) {
      return formatResponse(
        res,
        400,
        0,
        'Message content or attachment is required'
      );
    }

    const message = await MessageService.sendMessage(conversationId, userId, {
      content,
      messageType,
      attachments,
      replyTo,
    });

    // Socket notification handled in service
    return formatResponse(res, 201, 1, 'Message sent', message);
  }),

  DeleteMessage: CatchError(async (req, res) => {
    const { messageId } = req.params;
    const userId = req.user.id;
    const { forEveryone = false } = req.body;

    const message = await MessageService.deleteMessage(
      messageId,
      userId,
      forEveryone
    );
    return formatResponse(res, 200, 1, 'Message deleted', message);
  }),

  // ======================================
  // Message Status
  // ======================================

  MarkAsRead: CatchError(async (req, res) => {
    const { conversationId } = req.params;
    const userId = req.user.id;

    await MessageService.markConversationAsRead(conversationId, userId);
    return formatResponse(res, 200, 1, 'Marked as read');
  }),

  MarkMessageAsRead: CatchError(async (req, res) => {
    const { messageId } = req.params;
    const userId = req.user.id;

    await MessageService.markMessageAsRead(messageId, userId);
    return formatResponse(res, 200, 1, 'Message marked as read');
  }),

  GetUnreadCount: CatchError(async (req, res) => {
    const userId = req.user.id;

    const count = await MessageService.getUnreadCount(userId);
    return formatResponse(res, 200, 1, 'Success', { unreadCount: count });
  }),


  // ======================================
  // Reactions
  // ======================================

  AddReaction: CatchError(async (req, res) => {
    const { messageId } = req.params;
    const userId = req.user.id;
    const { emoji } = req.body;

    if (!emoji) {
      return formatResponse(res, 400, 0, 'Emoji is required');
    }

    const result = await MessageService.addReaction(messageId, userId, emoji);
    return formatResponse(res, 200, 1, 'Reaction added', result);
  }),

  RemoveReaction: CatchError(async (req, res) => {
    const { messageId } = req.params;
    const userId = req.user.id;

    const result = await MessageService.removeReaction(messageId, userId);
    return formatResponse(res, 200, 1, 'Reaction removed', result);
  }),

  // ======================================
  // Typing Indicators
  // ======================================

  SendTypingIndicator: CatchError(async (req, res) => {
    const { conversationId } = req.params;
    const userId = req.user.id;
    const { isTyping = true } = req.body;

    // This is typically handled via socket, but can also be an API endpoint
    socketService.emitTyping(conversationId, userId, isTyping);
    return formatResponse(res, 200, 1, 'OK');
  }),

  // ======================================
  // Search
  // ======================================

  SearchMessages: CatchError(async (req, res) => {
    const userId = req.user.id;
    const { query, conversationId, page = 1, limit = 20 } = req.query;

    if (!query || query.trim().length < 2) {
      return formatResponse(res, 400, 0, 'Query must be at least 2 characters');
    }

    const result = await MessageService.searchMessages(userId, query, {
      conversationId,
      page: parseInt(page),
      limit: parseInt(limit),
    });
    return formatResponse(res, 200, 1, 'Success', result);
  }),

  // ======================================
  // Users for chat
  // ======================================

  GetUsersForChat: CatchError(async (req, res) => {
    const userId = req.user.id;
    const { page = 1, limit = 20, search } = req.query;

    const result = await MessageService.getUsersForChat(userId, {
      page: parseInt(page),
      limit: parseInt(limit),
      search,
    });
    return formatResponse(res, 200, 1, 'Success', result);
  }),


};

export default MessageController;
