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

/* GET /conversations - Get all conversations for current user */
router.get(
  '/conversations',
  validateQuery(getConversationsQuery),
  MessageController.GetAllConversations
);
/* POST /conversations - Get or create a conversation */
router.post(
  '/conversations',
  validateBody(createConversationBody),
  MessageController.GetOrCreateConversation
);
/* GET /conversations/:conversationId - Get single conversation by ID */
router.get(
  '/conversations/:conversationId',
  validateParams(conversationIdParam),
  MessageController.GetConversation
);
/* DELETE /conversations/:conversationId - Delete a conversation */
router.delete(
  '/conversations/:conversationId',
  validateParams(deleteConversationParam),
  MessageController.DeleteConversation
);

/* POST /groups - Create a new group conversation */
router.post(
  '/groups',
  validateBody(createGroupBody),
  MessageController.CreateGroupConversation
);
/* PUT /groups/:conversationId - Update group conversation details */
router.put(
  '/groups/:conversationId',
  validateParams(updateGroupParam),
  validateBody(updateGroupBody),
  MessageController.UpdateGroupConversation
);
/* POST /groups/:conversationId/members - Add members to a group */
router.post(
  '/groups/:conversationId/members',
  validateParams(addMembersParam),
  validateBody(addMembersBody),
  MessageController.AddGroupMembers
);
/* DELETE /groups/:conversationId/members/:memberId - Remove a member from group */
router.delete(
  '/groups/:conversationId/members/:memberId',
  validateParams(removeMemberParam),
  MessageController.RemoveGroupMember
);
/* POST /groups/:conversationId/leave - Leave a group conversation */
router.post(
  '/groups/:conversationId/leave',
  validateParams(leaveGroupParam),
  MessageController.LeaveGroup
);

/* GET /conversations/:conversationId/messages - Get messages in a conversation */
router.get(
  '/conversations/:conversationId/messages',
  validateParams(getMessagesParam),
  validateQuery(getMessagesQuery),
  MessageController.GetMessages
);
/* POST /send - Send a message */
router.post(
  '/send',
  upload.array('files', 5),
  validateBody(sendMessageBody),
  MessageController.SendMessage
);
/* DELETE /messages/:messageId - Delete a message */
router.delete(
  '/messages/:messageId',
  validateParams(deleteMessageParam),
  MessageController.DeleteMessage
);

/* POST /conversations/:conversationId/read - Mark conversation as read */
router.post(
  '/conversations/:conversationId/read',
  validateParams(markAsReadParam),
  MessageController.MarkAsRead
);
/* POST /messages/:messageId/read - Mark a specific message as read */
router.post(
  '/messages/:messageId/read',
  validateParams(markMessageAsReadParam),
  MessageController.MarkMessageAsRead
);
/* GET /unread-count - Get total unread message count */
router.get('/unread-count', MessageController.GetUnreadCount);

/* POST /messages/:messageId/reactions - Add reaction to a message */
router.post(
  '/messages/:messageId/reactions',
  validateParams(addReactionParam),
  validateBody(addReactionBody),
  MessageController.AddReaction
);
/* DELETE /messages/:messageId/reactions - Remove reaction from a message */
router.delete(
  '/messages/:messageId/reactions',
  validateParams(removeReactionParam),
  MessageController.RemoveReaction
);

/* POST /conversations/:conversationId/typing - Send typing indicator */
router.post(
  '/conversations/:conversationId/typing',
  validateParams(typingParam),
  validateBody(typingBody),
  MessageController.SendTypingIndicator
);
/* GET /search - Search messages */
router.get(
  '/search',
  validateQuery(searchMessagesQuery),
  MessageController.SearchMessages
);

/* GET /users - Get users available for chat */
router.get(
  '/users',
  validateQuery(getUsersForChatQuery),
  MessageController.GetUsersForChat
);

export default router;
