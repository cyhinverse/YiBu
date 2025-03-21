import { Message } from "../../models/mongodb/Messages.js";
import { User } from "../../models/mongodb/Users.js";
import mongoose from "mongoose";
import { io } from "../../socket.js";

// Get all conversations for a user
export const getConversations = async (req, res) => {
  try {
    const userId = req.user.id;

    // Find all messages where the user is either sender or receiver
    const messages = await Message.aggregate([
      {
        $match: {
          $or: [
            { sender: new mongoose.Types.ObjectId(userId) },
            { receiver: new mongoose.Types.ObjectId(userId) },
          ],
        },
      },
      // Sort by createdAt in descending order to get the latest message first
      { $sort: { createdAt: -1 } },
      // Group by conversation partners to get the latest message for each conversation
      {
        $group: {
          _id: {
            $cond: [
              { $eq: ["$sender", new mongoose.Types.ObjectId(userId)] },
              "$receiver",
              "$sender",
            ],
          },
          latestMessage: { $first: "$$ROOT" },
        },
      },
      // Lookup user details for the conversation partner
      {
        $lookup: {
          from: "Users",
          localField: "_id",
          foreignField: "_id",
          as: "user",
        },
      },
      // Unwind the user array
      { $unwind: "$user" },
      // Project only the fields we need
      {
        $project: {
          _id: 1,
          user: {
            _id: 1,
            fullname: 1,
            username: 1,
            avatar: 1,
          },
          latestMessage: {
            _id: 1,
            content: 1,
            media: 1,
            isRead: 1,
            createdAt: 1,
            sender: 1,
            receiver: 1,
          },
          unreadCount: {
            $cond: [
              {
                $and: [
                  {
                    $eq: [
                      "$latestMessage.receiver",
                      new mongoose.Types.ObjectId(userId),
                    ],
                  },
                  { $eq: ["$latestMessage.isRead", false] },
                ],
              },
              1,
              0,
            ],
          },
        },
      },
      // Sort conversations by latest message timestamp
      { $sort: { "latestMessage.createdAt": -1 } },
    ]);

    // Get unread message count for each conversation
    const conversationsWithUnreadCount = await Promise.all(
      messages.map(async (conversation) => {
        const unreadCount = await Message.countDocuments({
          sender: conversation._id,
          receiver: userId,
          isRead: false,
        });

        return {
          ...conversation,
          unreadCount,
        };
      })
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

    if (!userId) {
      return res.status(400).json({
        code: 0,
        message: "User ID is required",
      });
    }

    // Find all messages between the two users
    const messages = await Message.find({
      $or: [
        {
          sender: currentUserId,
          receiver: userId,
        },
        {
          sender: userId,
          receiver: currentUserId,
        },
      ],
    })
      .sort({ createdAt: 1 })
      .populate("sender", "fullname username avatar")
      .populate("receiver", "fullname username avatar");

    // Mark unread messages as read
    await Message.updateMany(
      {
        sender: userId,
        receiver: currentUserId,
        isRead: false,
      },
      { isRead: true }
    );

    // Notify about read messages via socket
    const updatedMessageIds = messages
      .filter(
        (msg) =>
          msg.sender.toString() === userId &&
          msg.receiver.toString() === currentUserId &&
          !msg.isRead
      )
      .map((msg) => msg._id);

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

    if (!receiverId) {
      return res.status(400).json({
        code: 0,
        message: "Receiver ID is required",
      });
    }

    if (!content && !media) {
      return res.status(400).json({
        code: 0,
        message: "Message content or media is required",
      });
    }

    // Check if receiver exists
    const receiver = await User.findById(receiverId);
    if (!receiver) {
      return res.status(404).json({
        code: 0,
        message: "Receiver not found",
      });
    }

    // Create the message
    const newMessage = new Message({
      sender: senderId,
      receiver: receiverId,
      content,
      media,
      isRead: false,
    });

    await newMessage.save();

    // Populate sender and receiver details
    const populatedMessage = await Message.findById(newMessage._id)
      .populate("sender", "fullname username avatar")
      .populate("receiver", "fullname username avatar");

    // Send the message via socket
    if (io) {
      // Create a unique room ID for this conversation
      const room = [senderId, receiverId].sort().join("-");

      // Emit to the room and to individual user's room
      io.to(room).emit("new_message", {
        message: populatedMessage,
      });

      io.to(receiverId).emit("new_message", {
        message: populatedMessage,
      });
    }

    return res.status(201).json({
      code: 1,
      message: "Message sent successfully",
      data: populatedMessage,
    });
  } catch (error) {
    console.error("Error sending message:", error);
    return res.status(500).json({
      code: 0,
      message: "Error sending message",
      error: error.message,
    });
  }
};

// Mark a message as read
export const markAsRead = async (req, res) => {
  try {
    const { messageId } = req.params;
    const userId = req.user.id;

    if (!messageId) {
      return res.status(400).json({
        code: 0,
        message: "Message ID is required",
      });
    }

    // Find the message
    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json({
        code: 0,
        message: "Message not found",
      });
    }

    // Ensure the user is the receiver of the message
    if (message.receiver.toString() !== userId) {
      return res.status(403).json({
        code: 0,
        message: "You are not authorized to mark this message as read",
      });
    }

    // Update the message
    message.isRead = true;
    await message.save();

    // Notify via socket
    if (io) {
      io.to(message.sender.toString()).emit("message_read", {
        messageId,
        readerId: userId,
        senderId: message.sender.toString(),
      });

      // Also emit to the conversation room
      const room = [message.sender.toString(), userId].sort().join("-");
      io.to(room).emit("message_read", {
        messageId,
        readerId: userId,
        senderId: message.sender.toString(),
      });
    }

    return res.status(200).json({
      code: 1,
      message: "Message marked as read",
      data: message,
    });
  } catch (error) {
    console.error("Error marking message as read:", error);
    return res.status(500).json({
      code: 0,
      message: "Error marking message as read",
      error: error.message,
    });
  }
};

// Delete a message
export const deleteMessage = async (req, res) => {
  try {
    const { messageId } = req.params;
    const userId = req.user.id;

    if (!messageId) {
      return res.status(400).json({
        code: 0,
        message: "Message ID is required",
      });
    }

    // Find the message
    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json({
        code: 0,
        message: "Message not found",
      });
    }

    // Ensure the user is either the sender or receiver of the message
    if (
      message.sender.toString() !== userId &&
      message.receiver.toString() !== userId
    ) {
      return res.status(403).json({
        code: 0,
        message: "You are not authorized to delete this message",
      });
    }

    // Delete the message
    await Message.findByIdAndDelete(messageId);

    // Notify via socket
    if (io) {
      const recipientId =
        message.sender.toString() === userId
          ? message.receiver.toString()
          : message.sender.toString();

      io.to(recipientId).emit("message_deleted", {
        messageId,
        deletedBy: userId,
      });

      // Also emit to the conversation room
      const room = [message.sender.toString(), message.receiver.toString()]
        .sort()
        .join("-");
      io.to(room).emit("message_deleted", {
        messageId,
        deletedBy: userId,
      });
    }

    return res.status(200).json({
      code: 1,
      message: "Message deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting message:", error);
    return res.status(500).json({
      code: 0,
      message: "Error deleting message",
      error: error.message,
    });
  }
};
