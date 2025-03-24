import Message from "../models/mongodb/Messages.js";

class MessageService {
  static async createMessage(messageData) {
    try {
      const message = await Message.create(messageData);
      return message;
    } catch (error) {
      console.error("Error creating message:", error);
      throw new Error("Failed to create message");
    }
  }

  static async getMessagesByUserId(userId) {
    try {
      const messages = await Message.find({ userId }).sort({ createdAt: -1 });
      return messages;
    } catch (error) {
      console.error("Error getting messages:", error);
      throw new Error("Failed to get messages");
    }
  }

  static async deleteMessage(messageId) {
    try {
      const message = await Message.findByIdAndDelete(messageId);
      if (!message) {
        throw new Error("Message not found");
      }
      return message;
    } catch (error) {
      console.error("Error deleting message:", error);
      throw new Error("Failed to delete message");
    }
  }

  static async updateMessage(messageId, updateData) {
    try {
      const message = await Message.findByIdAndUpdate(messageId, updateData, {
        new: true,
      });
      if (!message) {
        throw new Error("Message not found");
      }
      return message;
    } catch (error) {
      console.error("Error updating message:", error);
      throw new Error("Failed to update message");
    }
  }
}

export default MessageService;
