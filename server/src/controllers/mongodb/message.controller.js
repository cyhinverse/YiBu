import Message from "../../models/mongodb/Messages.js";
import User from "../../models/mongodb/Users.js";
import mongoose from "mongoose";
import { io } from "../../socket.js";
import MessageService from "../../services/Message.service.js";

// Get all conversations for a user
export const getConversations = async (req, res) => {
  try {
    const userId = req.user.id;
    console.log("Finding conversations for user ID:", userId);

    const conversationsWithUnreadCount = await MessageService.getConversations(
      userId
    );

    return res.status(200).json({
      code: 1,
      message: "Conversations retrieved successfully",
      data: conversationsWithUnreadCount,
    });
  } catch (error) {
    console.error("Error retrieving conversations:", error);
    return res.status(500).json({
      code: 0,
      message: "Error retrieving conversations",
      error: error.message,
    });
  }
};

// Get all messages between two users
export const getMessages = async (req, res) => {
  try {
    const { userId } = req.params;
    const currentUserId = req.user.id;

    const { messages, updatedMessageIds } = await MessageService.getMessages(
      currentUserId,
      userId
    );

    // Notify about read messages via socket
    if (updatedMessageIds.length > 0 && io) {
      io.to(userId).emit("message_read", {
        messageIds: updatedMessageIds,
        readerId: currentUserId,
        senderId: userId,
      });
    }

    return res.status(200).json({
      code: 1,
      message: "Messages retrieved successfully",
      data: messages,
    });
  } catch (error) {
    console.error("Error retrieving messages:", error);
    return res.status(500).json({
      code: 0,
      message: "Error retrieving messages",
      error: error.message,
    });
  }
};

// Send a message
export const sendMessage = async (req, res) => {
  try {
    const { receiverId, content, media } = req.body;
    const senderId = req.user.id;

    try {
      // Create the message
      const message = await MessageService.createMessage(
        senderId,
        receiverId,
        content,
        media
      );

      // Emit socket event for real-time messaging
      if (io) {
        io.to(receiverId).emit("new_message", message);
      }

      return res.status(201).json({
        code: 1,
        message: "Message sent successfully",
        data: message,
      });
    } catch (error) {
      if (
        error.message === "Receiver ID is required" ||
        error.message === "Message content or media is required" ||
        error.message === "Receiver not found"
      ) {
        return res.status(400).json({
          code: 0,
          message: error.message,
        });
      }
      throw error;
    }
  } catch (error) {
    console.error("Error sending message:", error);
    return res.status(500).json({
      code: 0,
      message: "Error sending message",
      error: error.message,
    });
  }
};

// Mark messages as read
export const markAsRead = async (req, res) => {
  try {
    const { messageIds } = req.body;
    const readerId = req.user.id;

    try {
      const result = await MessageService.markAsRead(messageIds, readerId);

      // Emit socket event to notify sender that messages are read
      if (io && result.updatedCount > 0) {
        // Get the first message to determine the sender
        const firstMessage = await MessageService.getMessage(messageIds[0]);
        if (firstMessage) {
          io.to(firstMessage.sender.toString()).emit("message_read", {
            messageIds: result.messageIds,
            readerId,
            senderId: firstMessage.sender.toString(),
          });
        }
      }

      return res.status(200).json({
        code: 1,
        message: "Messages marked as read",
        data: result,
      });
    } catch (error) {
      if (error.message === "Message IDs array is required") {
        return res.status(400).json({
          code: 0,
          message: error.message,
        });
      }
      throw error;
    }
  } catch (error) {
    console.error("Error marking messages as read:", error);
    return res.status(500).json({
      code: 0,
      message: "Error marking messages as read",
      error: error.message,
    });
  }
};

// Delete a message
export const deleteMessage = async (req, res) => {
  try {
    const { messageId } = req.params;
    const userId = req.user.id;

    try {
      const message = await MessageService.deleteMessage(messageId, userId);

      // Notify the other user about message deletion
      if (io) {
        const recipientId =
          message.sender.toString() === userId
            ? message.receiver.toString()
            : message.sender.toString();

        io.to(recipientId).emit("message_deleted", {
          messageId,
          deletedBy: userId,
        });
      }

      return res.status(200).json({
        code: 1,
        message: "Message deleted successfully",
      });
    } catch (error) {
      if (
        error.message === "Message ID is required" ||
        error.message === "Message not found" ||
        error.message === "Unauthorized to delete this message"
      ) {
        return res
          .status(error.message === "Message not found" ? 404 : 400)
          .json({
            code: 0,
            message: error.message,
          });
      }
      throw error;
    }
  } catch (error) {
    console.error("Error deleting message:", error);
    return res.status(500).json({
      code: 0,
      message: "Error deleting message",
      error: error.message,
    });
  }
};

// Delete a conversation
export const deleteConversation = async (req, res) => {
  try {
    // Tham số trong route thực sự là "userId" không phải "partnerId"
    // Do đó, cần lấy giá trị từ req.params.userId thay vì req.params.partnerId
    const partnerId = req.params.userId;
    const userId = req.user.id;

    console.log(
      `Attempting to delete conversation between ${userId} and ${partnerId}`
    );

    if (!partnerId) {
      return res.status(400).json({
        code: 0,
        message: "Partner ID is required",
      });
    }

    try {
      const result = await MessageService.deleteConversation(partnerId, userId);

      // Notify partner about conversation deletion (optional)
      if (io) {
        io.to(partnerId).emit("conversation_deleted", {
          conversationPartner: userId,
          deletedBy: userId,
        });
      }

      return res.status(200).json({
        code: 1,
        message: "Conversation deleted successfully",
        data: result,
      });
    } catch (error) {
      if (error.message === "Partner ID is required") {
        return res.status(400).json({
          code: 0,
          message: error.message,
        });
      }
      throw error;
    }
  } catch (error) {
    console.error("Error deleting conversation:", error);
    return res.status(500).json({
      code: 0,
      message: "Error deleting conversation",
      error: error.message,
    });
  }
};
