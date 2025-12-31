import express from 'express';
import MessageController from '../controllers/message.controller.js';
import { verifyToken } from '../middlewares/auth.middleware.js';
import upload from '../middlewares/multerUpload.js';
import {
  validateBody,
  validateParams,
  validateQuery,
} from '../middlewares/validation.middleware.js';
import {
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
} from '../validations/message.validation.js';

const router = express.Router();

router.use(verifyToken);

// ======================================
// Conversations
// ======================================
router.get(
  '/conversations',
  validateQuery(getConversationsQuery),
  MessageController.GetAllConversations
);
router.post(
  '/conversations',
  validateBody(createConversationBody),
  MessageController.GetOrCreateConversation
);
router.get(
  '/conversations/:conversationId',
  validateParams(conversationIdParam),
  MessageController.GetConversation
);
router.delete(
  '/conversations/:conversationId',
  validateParams(deleteConversationParam),
  MessageController.DeleteConversation
);

// Group Conversations
router.post(
  '/groups',
  validateBody(createGroupBody),
  MessageController.CreateGroupConversation
);
router.put(
  '/groups/:conversationId',
  validateParams(updateGroupParam),
  validateBody(updateGroupBody),
  MessageController.UpdateGroupConversation
);
router.post(
  '/groups/:conversationId/members',
  validateParams(addMembersParam),
  validateBody(addMembersBody),
  MessageController.AddGroupMembers
);
router.delete(
  '/groups/:conversationId/members/:memberId',
  validateParams(removeMemberParam),
  MessageController.RemoveGroupMember
);
router.post(
  '/groups/:conversationId/leave',
  validateParams(leaveGroupParam),
  MessageController.LeaveGroup
);

// ======================================
// Messages
// ======================================
router.get(
  '/conversations/:conversationId/messages',
  validateParams(getMessagesParam),
  validateQuery(getMessagesQuery),
  MessageController.GetMessages
);
router.post(
  '/send',
  upload.array('files', 5),
  validateBody(sendMessageBody),
  MessageController.SendMessage
);
router.delete(
  '/messages/:messageId',
  validateParams(deleteMessageParam),
  MessageController.DeleteMessage
);

// ======================================
// Message Status
// ======================================
router.post(
  '/conversations/:conversationId/read',
  validateParams(markAsReadParam),
  MessageController.MarkAsRead
);
router.post(
  '/messages/:messageId/read',
  validateParams(markMessageAsReadParam),
  MessageController.MarkMessageAsRead
);
router.get('/unread-count', MessageController.GetUnreadCount);

// ======================================
// Reactions
// ======================================
router.post(
  '/messages/:messageId/reactions',
  validateParams(addReactionParam),
  validateBody(addReactionBody),
  MessageController.AddReaction
);
router.delete(
  '/messages/:messageId/reactions',
  validateParams(removeReactionParam),
  MessageController.RemoveReaction
);

// ======================================
// Typing & Search
// ======================================
router.post(
  '/conversations/:conversationId/typing',
  validateParams(typingParam),
  validateBody(typingBody),
  MessageController.SendTypingIndicator
);
router.get(
  '/search',
  validateQuery(searchMessagesQuery),
  MessageController.SearchMessages
);

// ======================================
// Users for Chat
// ======================================
router.get(
  '/users',
  validateQuery(getUsersForChatQuery),
  MessageController.GetUsersForChat
);



export default router;
