import express from "express";
import {
  getConversations,
  getMessages,
  sendMessage,
  markAsRead,
  deleteMessage,
  deleteConversation,
} from "../../controllers/mongodb/message.controller.js";
import { verifyToken } from "../../middleware/auth.middleware.js";

const router = express.Router();

// Get all conversations for the current user
router.get("/conversations", verifyToken, getConversations);

// Get messages between current user and another user
router.get("/:userId", verifyToken, getMessages);

// Send a message to another user
router.post("/send", verifyToken, sendMessage);

// Mark a message as read
router.put("/read/:messageId", verifyToken, markAsRead);

// Delete a message
router.delete("/:messageId", verifyToken, deleteMessage);

// Delete entire conversation with a user
router.delete("/conversation/:userId", verifyToken, deleteConversation);

export default router;
