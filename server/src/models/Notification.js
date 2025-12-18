import { Schema, Types, model } from "mongoose";

/**
 * Notification Model - Optimized for real-time delivery and batch operations
 *
 * Features:
 * 1. Grouped notifications support (e.g., "5 people liked your post")
 * 2. TTL for automatic cleanup
 * 3. Efficient batch marking as read
 */
const NotificationSchema = new Schema(
  {
    recipient: {
      type: Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    sender: {
      type: Types.ObjectId,
      ref: "User",
      required: true,
    },

    // Additional senders for grouped notifications
    additionalSenders: [
      {
        type: Types.ObjectId,
        ref: "User",
      },
    ],

    type: {
      type: String,
      enum: [
        "like",
        "comment",
        "follow",
        "save",
        "mention",
        "reply",
        "tag",
        "system",
        "announcement",
      ],
      required: true,
      index: true,
    },

    // Pre-rendered content for fast display
    content: {
      type: String,
      required: true,
      maxlength: 500,
    },

    // Reference to related content
    post: {
      type: Types.ObjectId,
      ref: "Post",
      index: true,
    },

    comment: {
      type: Types.ObjectId,
      ref: "Comment",
    },

    relatedPost: {
      type: Types.ObjectId,
      ref: "Post",
      index: true,
    },

    relatedComment: {
      type: Types.ObjectId,
      ref: "Comment",
    },

    // Grouped senders for better performance
    groupedSenders: [
      {
        user: { type: Types.ObjectId, ref: "User" },
        username: String,
        avatar: String,
      },
    ],

    metadata: {
      type: Schema.Types.Mixed,
    },


    // Preview data (denormalized for fast rendering)
    preview: {
      thumbnail: { type: String }, // Post thumbnail
      text: { type: String, maxlength: 100 }, // Comment preview
    },

    isRead: {
      type: Boolean,
      default: false,
      index: true,
    },

    readAt: {
      type: Date,
    },


    // For grouping similar notifications
    groupKey: {
      type: String,
      index: true,
    },

    // Count of grouped notifications
    groupCount: {
      type: Number,
      default: 1,
    },

    // Action URL
    actionUrl: {
      type: String,
    },

    // Auto-delete after 90 days
    expiresAt: {
      type: Date,
      default: () => new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
      index: true,
    },
  },
  {
    collection: "Notifications",
    timestamps: true,
  }
);

// ============ INDEXES ============
// Primary queries
NotificationSchema.index({ recipient: 1, createdAt: -1 });
NotificationSchema.index({ recipient: 1, isRead: 1, createdAt: -1 });

// For grouping
NotificationSchema.index({ recipient: 1, groupKey: 1 });

// TTL index
NotificationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// For deduplication
NotificationSchema.index({ recipient: 1, sender: 1, type: 1, post: 1 });

// ============ STATICS ============
NotificationSchema.statics.createNotification = async function (data) {
  const { recipient, sender, type, content, preview, groupKey, metadata } =
    data;

  const post = data.post || data.relatedPost;
  const comment = data.comment || data.relatedComment;


  // Don't notify yourself
  if (recipient.toString() === sender.toString()) {
    return null;
  }

  // Check user settings
  const UserSettings = model("UserSettings");
  const settings = await UserSettings.findOne({ user: recipient }).lean();

  // Check if this notification type is enabled
  const notifSettings = settings?.notifications?.push || {};
  const typeMapping = {
    like: "likes",
    comment: "comments",
    follow: "follows",
    mention: "mentions",
    reply: "comments",
  };

  if (notifSettings[typeMapping[type]] === false) {
    return null;
  }

  // Check if should group with existing notification
  if (groupKey) {
    const existing = await this.findOne({
      recipient,
      groupKey,
      isRead: false,
      createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }, // Within 24 hours
    });

    if (existing) {
      // Update existing notification
      existing.additionalSenders = existing.additionalSenders || [];
      if (
        !existing.additionalSenders.includes(sender) &&
        existing.sender.toString() !== sender.toString()
      ) {
        existing.additionalSenders.push(sender);
      }
      existing.groupCount = 1 + existing.additionalSenders.length;
      existing.content = content; // Update content with new count
      existing.createdAt = new Date(); // Bump to top
      return existing.save();
    }
  }

  return this.create({
    recipient,
    sender,
    type,
    content,
    post,
    comment,
    relatedPost: post,
    relatedComment: comment,
    preview,
    groupKey,
    metadata,
    actionUrl: post ? `/post/${post}` : sender ? `/profile/${sender}` : null,
  });
};

NotificationSchema.statics.getNotifications = async function (
  userId,
  options = {}
) {
  const { page = 1, limit = 20, unreadOnly = false } = options;

  const query = { recipient: userId };
  if (unreadOnly) {
    query.isRead = false;
  }

  return this.find(query)
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(limit)
    .populate("sender", "username name avatar verified")
    .populate("additionalSenders", "username name avatar")
    .populate("post", "_id media")
    .lean();
};

NotificationSchema.statics.markAsRead = async function (
  userId,
  notificationIds = null
) {
  const query = { recipient: userId, isRead: false };

  if (notificationIds && notificationIds.length > 0) {
    query._id = { $in: notificationIds };
  }

  return this.updateMany(query, { $set: { isRead: true } });
};

NotificationSchema.statics.getUnreadCount = async function (userId) {
  return this.countDocuments({ recipient: userId, isRead: false });
};

NotificationSchema.statics.deleteOld = async function (userId, daysOld = 30) {
  const cutoff = new Date(Date.now() - daysOld * 24 * 60 * 60 * 1000);
  return this.deleteMany({
    recipient: userId,
    isRead: true,
    createdAt: { $lt: cutoff },
  });
};

const Notification = model("Notification", NotificationSchema);
export default Notification;
