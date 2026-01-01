import { CatchError } from '../configs/CatchError.js';
import MessageService from '../services/Message.Service.js';
import UserService from '../services/User.Service.js';
import { formatResponse } from '../helpers/formatResponse.js';
import { getPaginationParams } from '../helpers/pagination.js';
import socketService from '../services/Socket.Service.js';

/**
 * Message Controller
 * Handle all requests related to messages and conversations
 *
 * Main features:
 * - Conversation management
 * - Group chat management
 * - Send/receive messages
 * - Message status (read/unread)
 * - Reactions and typing indicators
 */
const MessageController = {

  /**
   * Get all conversations for current user
   * @param {Object} req - Express request object
   * @param {Object} req.user - Authenticated user object
   * @param {string} req.user.id - Current user's ID
   * @param {Object} req.query - Query parameters
   * @param {number} [req.query.page=1] - Page number for pagination
   * @param {number} [req.query.limit=20] - Number of conversations per page
   * @param {Object} res - Express response object
   * @returns {Object} Response with paginated conversations list
   */
  GetAllConversations: CatchError(async (req, res) => {
    const userId = req.user.id;
    const { page = 1, limit = 20 } = getPaginationParams(req.query);

    const result = await MessageService.getConversations(userId, {
      page,
      limit,
    });
    return formatResponse(res, 200, 1, 'Success', result);
  }),

  /**
   * Get single conversation by ID
   * @param {Object} req - Express request object
   * @param {Object} req.params - Route parameters
   * @param {string} req.params.conversationId - Conversation ID to retrieve
   * @param {Object} req.user - Authenticated user object
   * @param {string} req.user.id - Current user's ID
   * @param {Object} res - Express response object
   * @returns {Object} Response with conversation data
   */
  GetConversation: CatchError(async (req, res) => {
    const { conversationId } = req.params;
    const userId = req.user.id;

    const conversation = await MessageService.getConversationById(
      conversationId,
      userId
    );
    return formatResponse(res, 200, 1, 'Success', conversation);
  }),

  /**
   * Get or create a direct/group conversation
   * @param {Object} req - Express request object
   * @param {Object} req.body - Request body
   * @param {string} [req.body.participantId] - Single participant ID for direct conversation
   * @param {Array<string>} [req.body.participantIds] - Array of participant IDs
   * @param {boolean} [req.body.isGroup=false] - Whether to create a group conversation
   * @param {string} [req.body.groupName] - Group name (required for groups)
   * @param {string} [req.body.groupAvatar] - Group avatar URL
   * @param {Object} req.user - Authenticated user object
   * @param {string} req.user.id - Current user's ID
   * @param {Object} res - Express response object
   * @returns {Object} Response with conversation data
   */
  GetOrCreateConversation: CatchError(async (req, res) => {
    const userId = req.user.id;
    const {
      participantId,
      participantIds,
      isGroup = false,
      groupName,
      groupAvatar,
    } = req.body;

    if (participantId && !isGroup) {
      const resolvedParticipantId = await UserService.resolveUserIdOrUsername(
        participantId
      );
      const conversation = await MessageService.getOrCreateDirectConversation(
        userId,
        resolvedParticipantId
      );
      return formatResponse(res, 200, 1, 'Success', conversation);
    }

    if (
      participantIds &&
      Array.isArray(participantIds) &&
      participantIds.length > 0
    ) {
      const resolvedIds = await Promise.all(
        participantIds.map(id => UserService.resolveUserIdOrUsername(id))
      );

      if (!isGroup && resolvedIds.length === 1) {
        const conversation = await MessageService.getOrCreateDirectConversation(
          userId,
          resolvedIds[0]
        );
        return formatResponse(res, 200, 1, 'Success', conversation);
      }

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

  /**
   * Create a new group conversation
   * @param {Object} req - Express request object
   * @param {Object} req.body - Request body
   * @param {Array<string>} req.body.participantIds - Array of participant IDs (min 2)
   * @param {string} req.body.groupName - Group name (required)
   * @param {string} [req.body.groupAvatar] - Group avatar URL
   * @param {Object} req.user - Authenticated user object
   * @param {string} req.user.id - Current user's ID
   * @param {Object} res - Express response object
   * @returns {Object} Response with created group conversation data
   */
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

  /**
   * Update group conversation details
   * @param {Object} req - Express request object
   * @param {Object} req.params - Route parameters
   * @param {string} req.params.conversationId - Conversation ID to update
   * @param {Object} req.body - Request body
   * @param {string} [req.body.groupName] - New group name
   * @param {string} [req.body.groupAvatar] - New group avatar URL
   * @param {Object} req.user - Authenticated user object
   * @param {string} req.user.id - Current user's ID
   * @param {Object} res - Express response object
   * @returns {Object} Response with updated conversation data
   */
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

  /**
   * Delete a conversation
   * @param {Object} req - Express request object
   * @param {Object} req.params - Route parameters
   * @param {string} req.params.conversationId - Conversation ID to delete
   * @param {Object} req.user - Authenticated user object
   * @param {string} req.user.id - Current user's ID
   * @param {Object} res - Express response object
   * @returns {Object} Response with delete success message
   */
  DeleteConversation: CatchError(async (req, res) => {
    const { conversationId } = req.params;
    const userId = req.user.id;

    await MessageService.deleteConversation(conversationId, userId);
    return formatResponse(res, 200, 1, 'Conversation deleted successfully');
  }),

  /**
   * Add members to a group conversation
   * @param {Object} req - Express request object
   * @param {Object} req.params - Route parameters
   * @param {string} req.params.conversationId - Conversation ID
   * @param {Object} req.body - Request body
   * @param {Array<string>} req.body.memberIds - Array of member IDs to add
   * @param {Object} req.user - Authenticated user object
   * @param {string} req.user.id - Current user's ID
   * @param {Object} res - Express response object
   * @returns {Object} Response with updated conversation data
   */
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

  /**
   * Remove a member from group conversation
   * @param {Object} req - Express request object
   * @param {Object} req.params - Route parameters
   * @param {string} req.params.conversationId - Conversation ID
   * @param {string} req.params.memberId - Member ID to remove
   * @param {Object} req.user - Authenticated user object
   * @param {string} req.user.id - Current user's ID
   * @param {Object} res - Express response object
   * @returns {Object} Response with updated conversation data
   */
  RemoveGroupMember: CatchError(async (req, res) => {
    const { conversationId, memberId } = req.params;
    const userId = req.user.id;

    const conversation = await MessageService.removeGroupMember(
      conversationId,
      userId,
      memberId
    );

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

  /**
   * Leave a group conversation
   * @param {Object} req - Express request object
   * @param {Object} req.params - Route parameters
   * @param {string} req.params.conversationId - Conversation ID to leave
   * @param {Object} req.user - Authenticated user object
   * @param {string} req.user.id - Current user's ID
   * @param {Object} res - Express response object
   * @returns {Object} Response with leave success message
   */
  LeaveGroup: CatchError(async (req, res) => {
    const { conversationId } = req.params;
    const userId = req.user.id;

    await MessageService.leaveGroup(conversationId, userId);
    return formatResponse(res, 200, 1, 'Left group successfully');
  }),

  /**
   * Get messages in a conversation
   * @param {Object} req - Express request object
   * @param {Object} req.params - Route parameters
   * @param {string} req.params.conversationId - Conversation ID
   * @param {Object} req.query - Query parameters
   * @param {number} [req.query.page=1] - Page number for pagination
   * @param {number} [req.query.limit=50] - Number of messages per page
   * @param {string} [req.query.before] - Get messages before this message ID
   * @param {Object} req.user - Authenticated user object
   * @param {string} req.user.id - Current user's ID
   * @param {Object} res - Express response object
   * @returns {Object} Response with paginated messages
   */
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

  /**
   * Send a message in a conversation
   * @param {Object} req - Express request object
   * @param {Object} req.body - Request body
   * @param {string} req.body.conversationId - Conversation ID to send message to
   * @param {string} [req.body.content] - Message text content
   * @param {string} [req.body.messageType='text'] - Message type (text/image/file/audio)
   * @param {string} [req.body.replyTo] - Message ID to reply to
   * @param {Array} [req.files] - Uploaded attachment files
   * @param {Object} req.user - Authenticated user object
   * @param {string} req.user.id - Current user's ID
   * @param {Object} res - Express response object
   * @returns {Object} Response with sent message data
   */
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

    return formatResponse(res, 201, 1, 'Message sent', message);
  }),

  /**
   * Delete a message
   * @param {Object} req - Express request object
   * @param {Object} req.params - Route parameters
   * @param {string} req.params.messageId - Message ID to delete
   * @param {Object} req.body - Request body
   * @param {boolean} [req.body.forEveryone=false] - Delete for all participants
   * @param {Object} req.user - Authenticated user object
   * @param {string} req.user.id - Current user's ID
   * @param {Object} res - Express response object
   * @returns {Object} Response with deleted message data
   */
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

  /**
   * Mark all messages in conversation as read
   * @param {Object} req - Express request object
   * @param {Object} req.params - Route parameters
   * @param {string} req.params.conversationId - Conversation ID
   * @param {Object} req.user - Authenticated user object
   * @param {string} req.user.id - Current user's ID
   * @param {Object} res - Express response object
   * @returns {Object} Response with mark as read success message
   */
  MarkAsRead: CatchError(async (req, res) => {
    const { conversationId } = req.params;
    const userId = req.user.id;

    await MessageService.markConversationAsRead(conversationId, userId);
    return formatResponse(res, 200, 1, 'Marked as read');
  }),

  /**
   * Mark a specific message as read
   * @param {Object} req - Express request object
   * @param {Object} req.params - Route parameters
   * @param {string} req.params.messageId - Message ID to mark as read
   * @param {Object} req.user - Authenticated user object
   * @param {string} req.user.id - Current user's ID
   * @param {Object} res - Express response object
   * @returns {Object} Response with mark as read success message
   */
  MarkMessageAsRead: CatchError(async (req, res) => {
    const { messageId } = req.params;
    const userId = req.user.id;

    await MessageService.markMessageAsRead(messageId, userId);
    return formatResponse(res, 200, 1, 'Message marked as read');
  }),

  /* Get total unread message count */
  GetUnreadCount: CatchError(async (req, res) => {
    const userId = req.user.id;

    const count = await MessageService.getUnreadCount(userId);
    return formatResponse(res, 200, 1, 'Success', { unreadCount: count });
  }),

  /**
   * Add reaction to a message
   * @param {Object} req - Express request object
   * @param {Object} req.params - Route parameters
   * @param {string} req.params.messageId - Message ID to react to
   * @param {Object} req.body - Request body
   * @param {string} req.body.emoji - Emoji reaction to add
   * @param {Object} req.user - Authenticated user object
   * @param {string} req.user.id - Current user's ID
   * @param {Object} res - Express response object
   * @returns {Object} Response with reaction result
   */
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

  /**
   * Remove reaction from a message
   * @param {Object} req - Express request object
   * @param {Object} req.params - Route parameters
   * @param {string} req.params.messageId - Message ID to remove reaction from
   * @param {Object} req.user - Authenticated user object
   * @param {string} req.user.id - Current user's ID
   * @param {Object} res - Express response object
   * @returns {Object} Response with reaction removal result
   */
  RemoveReaction: CatchError(async (req, res) => {
    const { messageId } = req.params;
    const userId = req.user.id;

    const result = await MessageService.removeReaction(messageId, userId);
    return formatResponse(res, 200, 1, 'Reaction removed', result);
  }),

  /**
   * Send typing indicator to conversation
   * @param {Object} req - Express request object
   * @param {Object} req.params - Route parameters
   * @param {string} req.params.conversationId - Conversation ID
   * @param {Object} req.body - Request body
   * @param {boolean} [req.body.isTyping=true] - Whether user is typing
   * @param {Object} req.user - Authenticated user object
   * @param {string} req.user.id - Current user's ID
   * @param {Object} res - Express response object
   * @returns {Object} Response with OK status
   */
  SendTypingIndicator: CatchError(async (req, res) => {
    const { conversationId } = req.params;
    const userId = req.user.id;
    const { isTyping = true } = req.body;

    socketService.emitTyping(conversationId, userId, isTyping);
    return formatResponse(res, 200, 1, 'OK');
  }),

  /**
   * Search messages by query string
   * @param {Object} req - Express request object
   * @param {Object} req.user - Authenticated user object
   * @param {string} req.user.id - Current user's ID
   * @param {Object} req.query - Query parameters
   * @param {string} req.query.query - Search query string (min 2 characters)
   * @param {string} [req.query.conversationId] - Filter by conversation ID
   * @param {number} [req.query.page=1] - Page number for pagination
   * @param {number} [req.query.limit=20] - Number of results per page
   * @param {Object} res - Express response object
   * @returns {Object} Response with paginated search results
   */
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

  /**
   * Get users available for chat
   * @param {Object} req - Express request object
   * @param {Object} req.user - Authenticated user object
   * @param {string} req.user.id - Current user's ID
   * @param {Object} req.query - Query parameters
   * @param {number} [req.query.page=1] - Page number for pagination
   * @param {number} [req.query.limit=20] - Number of users per page
   * @param {string} [req.query.search] - Search query to filter users
   * @param {Object} res - Express response object
   * @returns {Object} Response with paginated users list
   */
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
