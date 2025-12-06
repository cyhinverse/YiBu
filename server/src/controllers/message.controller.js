import SocketService from "../services/Socket.Service.js";
import MessageService from "../services/Message.service.js";
import { CatchError } from "../configs/CatchError.js";
import { formatResponse } from "../helpers/formatResponse.js";

// Get all conversations for a user
export const getConversations = CatchError(async (req, res) => {
  const userId = req.user.id;
  const conversationsWithUnreadCount = await MessageService.getConversations(
    userId
  );

  return formatResponse(res, 200, 1, "Conversations retrieved successfully", conversationsWithUnreadCount);
});

// Get all messages between two users
export const getMessages = CatchError(async (req, res) => {
  const { userId } = req.params;
  const currentUserId = req.user.id;

  const { messages, updatedMessageIds } = await MessageService.getMessages(
    currentUserId,
    userId
  );

  // Notify about read messages via socket
  if (updatedMessageIds.length > 0) {
    SocketService.emitMessageRead(updatedMessageIds, currentUserId, userId);
  }

  return formatResponse(res, 200, 1, "Messages retrieved successfully", messages);
});

// Send a message
export const sendMessage = CatchError(async (req, res) => {
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
    // Emit socket event for real-time messaging
    SocketService.emitNewMessage(receiverId, message);

    return formatResponse(res, 201, 1, "Message sent successfully", message);
  } catch (error) {
    if (
      error.message === "Receiver ID is required" ||
      error.message === "Message content or media is required" ||
      error.message === "Receiver not found"
    ) {
      error.statusCode = 400;
    }
    throw error;
  }
});

// Mark messages as read
export const markAsRead = CatchError(async (req, res) => {
  const { messageIds } = req.body;
  const readerId = req.user.id;

  try {
    const result = await MessageService.markAsRead(messageIds, readerId);

    // Emit socket event to notify sender that messages are read
    if (result.updatedCount > 0) {
      // Get the first message to determine the sender
      const firstMessage = await MessageService.getMessage(messageIds[0]);
      if (firstMessage) {
         SocketService.emitMessageRead(result.messageIds, readerId, firstMessage.sender.toString());
      }
    }

    return formatResponse(res, 200, 1, "Messages marked as read", result);
  } catch (error) {
    if (error.message === "Message IDs array is required") {
      error.statusCode = 400;
    }
    throw error;
  }
});

// Delete a message
export const deleteMessage = CatchError(async (req, res) => {
  const { messageId } = req.params;
  const userId = req.user.id;

  try {
    const message = await MessageService.deleteMessage(messageId, userId);

    // Notify the other user about message deletion
    const recipientId =
      message.sender.toString() === userId
        ? message.receiver.toString()
        : message.sender.toString();

    SocketService.emitMessageDeleted(recipientId, messageId, userId);

    return formatResponse(res, 200, 1, "Message deleted successfully");
  } catch (error) {
    if (
      error.message === "Message ID is required" ||
      error.message === "Unauthorized to delete this message"
    ) {
      error.statusCode = 400;
    } else if (error.message === "Message not found") {
      error.statusCode = 404;
    }
    throw error;
  }
});

// Delete a conversation
export const deleteConversation = CatchError(async (req, res) => {
  const partnerId = req.params.userId;
  const userId = req.user.id;

  if (!partnerId) {
    const error = new Error("Partner ID is required");
    error.statusCode = 400;
    throw error;
  }

  try {
    const result = await MessageService.deleteConversation(partnerId, userId);
    SocketService.emitConversationDeleted(partnerId, userId);

    return formatResponse(res, 200, 1, "Conversation deleted successfully", result);
  } catch (error) {
    if (error.message === "Partner ID is required") {
      error.statusCode = 400;
    }
    throw error;
  }
});
