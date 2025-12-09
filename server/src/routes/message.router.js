import express from "express";
import MessageController from "../controllers/message.controller.js";
import { verifyToken } from "../middlewares/auth.middleware.js";
import upload from "../middlewares/multerUpload.js";

const router = express.Router();

router.use(verifyToken);

// ======================================
// Conversations
// ======================================
router.get("/conversations", MessageController.GetAllConversations);
router.post("/conversations", MessageController.GetOrCreateConversation);
router.get("/conversations/:conversationId", MessageController.GetConversation);
router.delete(
  "/conversations/:conversationId",
  MessageController.DeleteConversation
);

// Group Conversations
router.post("/groups", MessageController.CreateGroupConversation);
router.put(
  "/groups/:conversationId",
  MessageController.UpdateGroupConversation
);
router.post(
  "/groups/:conversationId/members",
  MessageController.AddGroupMembers
);
router.delete(
  "/groups/:conversationId/members/:memberId",
  MessageController.RemoveGroupMember
);
router.post("/groups/:conversationId/leave", MessageController.LeaveGroup);

// ======================================
// Messages
// ======================================
router.get(
  "/conversations/:conversationId/messages",
  MessageController.GetMessages
);
router.post("/send", upload.array("files", 5), MessageController.SendMessage);
router.delete("/messages/:messageId", MessageController.DeleteMessage);

// ======================================
// Message Status
// ======================================
router.post(
  "/conversations/:conversationId/read",
  MessageController.MarkAsRead
);
router.post("/messages/:messageId/read", MessageController.MarkMessageAsRead);
router.get("/unread-count", MessageController.GetUnreadCount);

// ======================================
// Reactions
// ======================================
router.post("/messages/:messageId/reactions", MessageController.AddReaction);
router.delete(
  "/messages/:messageId/reactions",
  MessageController.RemoveReaction
);

// ======================================
// Typing & Search
// ======================================
router.post(
  "/conversations/:conversationId/typing",
  MessageController.SendTypingIndicator
);
router.get("/search", MessageController.SearchMessages);

// ======================================
// Users for Chat
// ======================================
router.get("/users", MessageController.GetUsersForChat);

// ======================================
// Mute
// ======================================
router.post(
  "/conversations/:conversationId/mute",
  MessageController.MuteConversation
);
router.delete(
  "/conversations/:conversationId/mute",
  MessageController.UnmuteConversation
);

// ======================================
// Media
// ======================================
router.get(
  "/conversations/:conversationId/media",
  MessageController.GetConversationMedia
);

export default router;
