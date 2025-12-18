import { Schema, Types, model } from "mongoose";

const MessageSchema = new Schema(
  {
    conversationId: {
      type: String,
      required: true,
      index: true,
    },

    sender: {
      type: Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    receiver: {
      type: Types.ObjectId,
      required: true,
      index: true,
    },

    // Individual tracking for group messages
    seenBy: [
      {
        user: { type: Types.ObjectId, ref: "User" },
        at: { type: Date, default: Date.now },
      },
    ],

    // Message content
    content: {
      type: String,
      maxlength: 5000,
    },

    // Media attachments
    media: [
      {
        url: { type: String, required: true },
        type: {
          type: String,
          enum: ["image", "video", "audio", "file"],
          required: true,
        },
        filename: { type: String },
        size: { type: Number }, // in bytes
        mimeType: { type: String },
        thumbnail: { type: String },
      },
    ],

    // Message type
    messageType: {
      type: String,
      enum: ["text", "media", "system", "reply"],
      default: "text",
    },

    // Reply to another message
    replyTo: {
      type: Types.ObjectId,
      ref: "Message",
    },

    // Message status
    status: {
      type: String,
      enum: ["sent", "delivered", "read"],
      default: "sent",
      index: true,
    },

    readAt: {
      type: Date,
    },

    deliveredAt: {
      type: Date,
    },

    // Soft delete (per user)
    deletedFor: [
      {
        type: Types.ObjectId,
        ref: "User",
      },
    ],

    // Edit tracking
    isEdited: {
      type: Boolean,
      default: false,
    },
    editedAt: {
      type: Date,
    },
  },
  {
    collection: "Messages",
    timestamps: true,
  }
);

// ============ INDEXES ============
// Primary query: get conversation messages
MessageSchema.index({ conversationId: 1, createdAt: -1 });

// Get unread messages
MessageSchema.index({ receiver: 1, status: 1 });
MessageSchema.index({ conversationId: 1, receiver: 1, status: 1 });

// User's conversations
MessageSchema.index({ sender: 1, createdAt: -1 });
MessageSchema.index({ receiver: 1, createdAt: -1 });

// For real-time sync
MessageSchema.index({ conversationId: 1, _id: 1 });

// ============ STATICS ============
// Generate conversation ID from two user IDs
MessageSchema.statics.getConversationId = function (userId1, userId2) {
  return [userId1.toString(), userId2.toString()].sort().join("_");
};

MessageSchema.statics.sendMessage = async function (data) {
  const { sender, receiver, content, media, replyTo } = data;

  // Check if sender can message receiver
  const UserSettings = model("UserSettings");
  const receiverSettings = await UserSettings.findOne({
    user: receiver,
  }).lean();

  // Check blocked
  if (
    receiverSettings?.blockedUsers?.some(
      (b) => b.toString() === sender.toString()
    )
  ) {
    return { success: false, error: "Cannot send message to this user" };
  }

  // Check message permissions
  const User = model("User");
  const receiverUser = await User.findById(receiver).select("privacy").lean();

  if (receiverUser?.privacy?.allowMessages === "none") {
    return { success: false, error: "User has disabled messages" };
  }

  if (receiverUser?.privacy?.allowMessages === "followers") {
    const Follow = model("Follow");
    const isFollowing = await Follow.findOne({
      follower: receiver,
      following: sender,
    });
    if (!isFollowing) {
      return {
        success: false,
        error: "User only accepts messages from people they follow",
      };
    }
  }

  const conversationId = this.getConversationId(sender, receiver);
  const messageType = media && media.length > 0 ? "media" : "text";

  const message = await this.create({
    conversationId,
    sender,
    receiver,
    content,
    media,
    messageType,
    replyTo,
  });

  return {
    success: true,
    message: await message.populate("sender", "username name avatar"),
  };
};

MessageSchema.statics.getConversation = async function (
  userId1,
  userId2,
  options = {}
) {
  const { page = 1, limit = 50, before = null } = options;

  const conversationId = this.getConversationId(userId1, userId2);

  const query = {
    conversationId,
    deletedFor: { $ne: userId1 }, // Don't show messages deleted by this user
  };

  if (before) {
    query.createdAt = { $lt: before };
  }

  return this.find(query)
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(limit)
    .populate("sender", "username name avatar")
    .populate("replyTo", "content sender")
    .lean();
};

MessageSchema.statics.getConversations = async function (userId, options = {}) {
  const { page = 1, limit = 20 } = options;

  // Get last message from each conversation
  const pipeline = [
    {
      $match: {
        $or: [
          { sender: new Types.ObjectId(userId) },
          { receiver: new Types.ObjectId(userId) },
        ],
        deletedFor: { $ne: new Types.ObjectId(userId) },
      },
    },
    { $sort: { createdAt: -1 } },
    {
      $group: {
        _id: "$conversationId",
        lastMessage: { $first: "$$ROOT" },
        unreadCount: {
          $sum: {
            $cond: [
              {
                $and: [
                  { $eq: ["$receiver", new Types.ObjectId(userId)] },
                  { $ne: ["$status", "read"] },
                ],
              },
              1,
              0,
            ],
          },
        },
      },
    },
    { $sort: { "lastMessage.createdAt": -1 } },
    { $skip: (page - 1) * limit },
    { $limit: limit },
    {
      $lookup: {
        from: "Users",
        let: {
          senderId: "$lastMessage.sender",
          receiverId: "$lastMessage.receiver",
          currentUser: new Types.ObjectId(userId),
        },
        pipeline: [
          {
            $match: {
              $expr: {
                $eq: [
                  "$_id",
                  {
                    $cond: [
                      { $eq: ["$$senderId", "$$currentUser"] },
                      "$$receiverId",
                      "$$senderId",
                    ],
                  },
                ],
              },
            },
          },
          { $project: { username: 1, name: 1, avatar: 1, lastActiveAt: 1 } },
        ],
        as: "otherUser",
      },
    },
    { $unwind: "$otherUser" },
  ];

  return this.aggregate(pipeline);
};

MessageSchema.statics.markAsRead = async function (conversationId, userId) {
  return this.updateMany(
    {
      conversationId,
      receiver: userId,
      status: { $ne: "read" },
    },
    {
      $set: {
        status: "read",
        readAt: new Date(),
      },
    }
  );
};

MessageSchema.statics.getUnreadCount = async function (userId) {
  return this.countDocuments({
    receiver: userId,
    status: { $ne: "read" },
    deletedFor: { $ne: userId },
  });
};

const Message = model("Message", MessageSchema);
export default Message;
