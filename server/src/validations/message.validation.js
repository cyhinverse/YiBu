import Joi from 'joi';
import { objectId } from './common.validation.js';

/**
 * Message Validation Schemas
 * Validation for all endpoints in message.router.js
 */

// ======================================
// GET /conversations
// Query: { page?, limit? }
// ======================================
export const getConversationsQuery = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(50).default(20),
});

// ======================================
// POST /conversations (GetOrCreateConversation)
// Body: { participantId } - can be ObjectId or username
// ======================================
const usernamePattern = Joi.string()
  .pattern(/^[a-zA-Z0-9_]{3,30}$/)
  .messages({
    'string.pattern.base': 'Username không hợp lệ',
  });

export const createConversationBody = Joi.object({
  participantId: Joi.alternatives()
    .try(objectId, usernamePattern)
    .required()
    .messages({
      'any.required': 'ID người tham gia là bắt buộc',
      'alternatives.match': 'ID hoặc username không hợp lệ',
    }),
});

const conversationIdFormat = Joi.string()
  .pattern(/^[0-9a-fA-F]{24}_[0-9a-fA-F]{24}$/)
  .messages({
    'string.pattern.base': 'ConversationId không hợp lệ',
  });

// Shared flexible ID
const flexibleConversationId = Joi.alternatives()
  .try(objectId, conversationIdFormat)
  .required();

// ======================================
// GET /conversations/:conversationId
// Params: { conversationId } - can be ObjectId or format "userId1_userId2"
// ======================================
export const conversationIdParam = Joi.object({
  conversationId: flexibleConversationId.messages({
    'any.required': 'ConversationId là bắt buộc',
    'alternatives.match': 'ConversationId không hợp lệ',
  }),
});

// ======================================
// DELETE /conversations/:conversationId
// Params: { conversationId }
// ======================================
export const deleteConversationParam = Joi.object({
  conversationId: flexibleConversationId.messages({
    'any.required': 'ConversationId là bắt buộc',
  }),
});

// ======================================
// POST /groups (CreateGroupConversation)
// Body: { name, participantIds, avatar? }
// ======================================
export const createGroupBody = Joi.object({
  name: Joi.string().trim().min(1).max(100).required().messages({
    'string.empty': 'Tên nhóm không được để trống',
    'string.max': 'Tên nhóm không được quá 100 ký tự',
    'any.required': 'Tên nhóm là bắt buộc',
  }),
  participantIds: Joi.array()
    .items(objectId)
    .min(2)
    .max(50)
    .required()
    .messages({
      'array.min': 'Nhóm phải có ít nhất 2 thành viên',
      'array.max': 'Nhóm tối đa 50 thành viên',
      'any.required': 'Danh sách thành viên là bắt buộc',
    }),
  avatar: Joi.string().uri().allow(''),
});

// ======================================
// PUT /groups/:conversationId (UpdateGroupConversation)
// Params: { conversationId }
// Body: { name?, avatar? }
// ======================================
export const updateGroupParam = Joi.object({
  conversationId: flexibleConversationId,
});

export const updateGroupBody = Joi.object({
  name: Joi.string().trim().min(1).max(100).messages({
    'string.max': 'Tên nhóm không được quá 100 ký tự',
  }),
  avatar: Joi.string().uri().allow(''),
});

// ======================================
// POST /groups/:conversationId/members (AddGroupMembers)
// Params: { conversationId }
// Body: { memberIds }
// ======================================
export const addMembersParam = Joi.object({
  conversationId: flexibleConversationId,
});

export const addMembersBody = Joi.object({
  memberIds: Joi.array().items(objectId).min(1).max(20).required().messages({
    'array.min': 'Phải thêm ít nhất 1 thành viên',
    'array.max': 'Chỉ có thể thêm tối đa 20 thành viên cùng lúc',
    'any.required': 'Danh sách thành viên là bắt buộc',
  }),
});

// ======================================
// DELETE /groups/:conversationId/members/:memberId (RemoveGroupMember)
// Params: { conversationId, memberId }
// ======================================
export const removeMemberParam = Joi.object({
  conversationId: flexibleConversationId,
  memberId: objectId.required(),
});

// ======================================
// POST /groups/:conversationId/leave (LeaveGroup)
// Params: { conversationId }
// ======================================
export const leaveGroupParam = Joi.object({
  conversationId: flexibleConversationId,
});

// ======================================
// GET /conversations/:conversationId/messages (GetMessages)
// Params: { conversationId }
// Query: { page?, limit?, before? }
// ======================================
export const getMessagesParam = Joi.object({
  conversationId: flexibleConversationId,
});

export const getMessagesQuery = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(50).default(30),
  before: Joi.date().iso(), // Load messages before this timestamp
});

// ======================================
// POST /send (SendMessage)
// Body: { conversationId, content, type? }
// Note: files được xử lý bởi multer
// ======================================
export const sendMessageBody = Joi.object({
  conversationId: flexibleConversationId.messages({
    'any.required': 'Conversation ID là bắt buộc',
    'alternatives.match': 'ID cuộc hội thoại không hợp lệ',
  }),
  content: Joi.string().trim().min(1).max(2000).required().messages({
    'string.empty': 'Nội dung tin nhắn không được để trống',
    'string.max': 'Nội dung không được quá 2000 ký tự',
    'any.required': 'Nội dung là bắt buộc',
  }),
  type: Joi.string()
    .valid('text', 'image', 'file', 'video', 'audio')
    .default('text'),
  replyTo: objectId.allow(null), // Reply to another message
});

// ======================================
// DELETE /messages/:messageId (DeleteMessage)
// Params: { messageId }
// ======================================
export const deleteMessageParam = Joi.object({
  messageId: objectId.required(),
});

// ======================================
// POST /conversations/:conversationId/read (MarkAsRead)
// Params: { conversationId }
// ======================================
export const markAsReadParam = Joi.object({
  conversationId: flexibleConversationId,
});

// ======================================
// POST /messages/:messageId/read (MarkMessageAsRead)
// Params: { messageId }
// ======================================
export const markMessageAsReadParam = Joi.object({
  messageId: objectId.required(),
});

// ======================================
// POST /messages/:messageId/reactions (AddReaction)
// Params: { messageId }
// Body: { emoji }
// ======================================
export const addReactionParam = Joi.object({
  messageId: objectId.required(),
});

export const addReactionBody = Joi.object({
  emoji: Joi.string().trim().min(1).max(10).required().messages({
    'string.empty': 'Emoji không được để trống',
    'any.required': 'Emoji là bắt buộc',
  }),
});

// ======================================
// DELETE /messages/:messageId/reactions (RemoveReaction)
// Params: { messageId }
// ======================================
export const removeReactionParam = Joi.object({
  messageId: objectId.required(),
});

// ======================================
// POST /conversations/:conversationId/typing (SendTypingIndicator)
// Params: { conversationId }
// Body: { isTyping }
// ======================================
export const typingParam = Joi.object({
  conversationId: flexibleConversationId,
});

export const typingBody = Joi.object({
  isTyping: Joi.boolean().required(),
});

// ======================================
// GET /search (SearchMessages)
// Query: { q, conversationId?, page?, limit? }
// ======================================
export const searchMessagesQuery = Joi.object({
  q: Joi.string().trim().min(1).max(100).required().messages({
    'string.empty': 'Từ khóa tìm kiếm không được để trống',
    'any.required': 'Từ khóa tìm kiếm là bắt buộc',
  }),
  conversationId: Joi.alternatives().try(objectId, conversationIdFormat).allow(null),
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(50).default(20),
});

// ======================================
// GET /users (GetUsersForChat)
// Query: { q?, page?, limit? }
// ======================================
export const getUsersForChatQuery = Joi.object({
  q: Joi.string().trim().max(100),
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(30).default(20),
});

export default {
  getConversationsQuery,
  createConversationBody,
  conversationIdParam,
  deleteConversationParam,
  createGroupBody,
  updateGroupParam,
  updateGroupBody,
  addMembersParam,
  addMembersBody,
  removeMemberParam,
  leaveGroupParam,
  getMessagesParam,
  getMessagesQuery,
  sendMessageBody,
  deleteMessageParam,
  markAsReadParam,
  markMessageAsReadParam,
  addReactionParam,
  addReactionBody,
  removeReactionParam,
  typingParam,
  typingBody,
  searchMessagesQuery,
  getUsersForChatQuery,
};
