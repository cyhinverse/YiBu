import Message from "../models/mongodb/Messages.js";
import User from "../models/mongodb/Users.js";
import mongoose from "mongoose";

class MessageService {
  static async getConversations(userId) {
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
      { $unwind: { path: "$user", preserveNullAndEmptyArrays: true } },
      // Project only the fields we need
      {
        $project: {
          _id: 1,
          user: {
            _id: 1,
            name: 1,
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

    // Get unread message count for each conversation AND fetch complete user data
    const conversationsWithUnreadCount = await Promise.all(
      messages.map(async (conversation) => {
        const unreadCount = await Message.countDocuments({
          sender: conversation._id,
          receiver: userId,
          isRead: false,
        });

        // Lấy thông tin đầy đủ về người dùng từ DB
        try {
          const userData = await User.findById(conversation._id);
          if (userData) {
            conversation.user = {
              ...conversation.user,
              _id: userData._id,
              username: userData.username || "User",
              name: userData.name || "Unknown",
              avatar:
                userData.avatar ||
                conversation.user?.avatar ||
                "https://via.placeholder.com/40",
            };
          } else {
            // Nếu không tìm thấy user, đặt giá trị mặc định
            if (
              !conversation.user ||
              Object.keys(conversation.user).length === 0
            ) {
              conversation.user = {
                _id: conversation._id,
                username: "User",
                name: "Unknown",
                avatar: "https://via.placeholder.com/40",
              };
            } else if (conversation.user) {
              conversation.user.username = conversation.user.username || "User";
              conversation.user.name = conversation.user.name || "Unknown";
            }
          }
        } catch (err) {
          console.error("Error fetching complete user data:", err);
          // Đảm bảo có giá trị mặc định khi có lỗi
          if (
            !conversation.user ||
            Object.keys(conversation.user).length === 0
          ) {
            conversation.user = {
              _id: conversation._id,
              username: "User",
              name: "Unknown",
              avatar: "https://via.placeholder.com/40",
            };
          }
        }

        return {
          ...conversation,
          unreadCount,
        };
      })
    );

    return conversationsWithUnreadCount;
  }

  static async getMessages(currentUserId, userId) {
    if (!userId) {
      throw new Error("User ID is required");
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
      .populate("sender", "username name avatar")
      .populate("receiver", "username name avatar");

    // Mark unread messages as read
    await Message.updateMany(
      {
        sender: userId,
        receiver: currentUserId,
        isRead: false,
      },
      { isRead: true }
    );

    // Find message IDs that have been marked as read
    const updatedMessageIds = messages
      .filter(
        (msg) =>
          msg.sender.toString() === userId &&
          msg.receiver.toString() === currentUserId &&
          !msg.isRead
      )
      .map((msg) => msg._id);

    return { messages, updatedMessageIds };
  }

  static async createMessage(senderId, receiverId, content, media = null) {
    if (!receiverId) {
      throw new Error("Receiver ID is required");
    }

    if (!content && !media) {
      throw new Error("Message content or media is required");
    }

    // Check if receiver exists
    const receiver = await User.findById(receiverId);
    if (!receiver) {
      throw new Error("Receiver not found");
    }

    // Xử lý media đúng cách
    // Nếu media là mảng, chỉ lấy phần tử đầu tiên hoặc null
    let mediaValue = null;
    if (media) {
      if (Array.isArray(media)) {
        mediaValue = media.length > 0 ? media[0] : null;
      } else {
        mediaValue = media;
      }
    }

    // Create and save the message
    const message = new Message({
      sender: senderId,
      receiver: receiverId,
      content: content || "",
      media: mediaValue,
      isRead: false,
    });

    await message.save();

    // Populate sender and receiver information
    await message.populate("sender", "username name avatar");
    await message.populate("receiver", "username name avatar");

    return message;
  }

  static async markAsRead(messageIds, readerId) {
    if (!messageIds || !Array.isArray(messageIds) || messageIds.length === 0) {
      throw new Error("Message IDs array is required");
    }

    // Update messages as read
    const result = await Message.updateMany(
      {
        _id: { $in: messageIds },
        receiver: readerId,
      },
      { isRead: true }
    );

    return {
      updatedCount: result.modifiedCount,
      messageIds,
    };
  }

  static async deleteMessage(messageId, userId) {
    if (!messageId) {
      throw new Error("Message ID is required");
    }

    // Find the message and check if user is authorized to delete it
    const message = await Message.findById(messageId);
    if (!message) {
      throw new Error("Message not found");
    }

    // Check if user is either sender or receiver
    if (
      message.sender.toString() !== userId &&
      message.receiver.toString() !== userId
    ) {
      throw new Error("Unauthorized to delete this message");
    }

    // Delete the message
    await Message.findByIdAndDelete(messageId);

    return message;
  }

  static async deleteConversation(partnerId, userId) {
    if (!partnerId) {
      throw new Error("Partner ID is required");
    }

    // Find and delete all messages between the two users
    const deleteResult = await Message.deleteMany({
      $or: [
        {
          sender: userId,
          receiver: partnerId,
        },
        {
          sender: partnerId,
          receiver: userId,
        },
      ],
    });

    return { deletedCount: deleteResult.deletedCount };
  }

  static async getMessage(messageId) {
    if (!messageId) {
      throw new Error("Message ID is required");
    }

    const message = await Message.findById(messageId)
      .populate("sender", "username name avatar")
      .populate("receiver", "username name avatar");

    if (!message) {
      throw new Error("Message not found");
    }

    return message;
  }
}

export default MessageService;
