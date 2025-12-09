import { Schema, model, Types } from "mongoose";

/**
 * Report Model - Optimized for moderation workflow
 *
 * Features:
 * 1. Clear categorization with predefined reasons
 * 2. Priority scoring for triage
 * 3. Deduplication support
 * 4. Audit trail
 */
const ReportSchema = new Schema(
  {
    reporter: {
      type: Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    // Type of reported content
    targetType: {
      type: String,
      enum: ["post", "comment", "user", "message"],
      required: true,
      index: true,
    },

    targetId: {
      type: Types.ObjectId,
      required: true,
      index: true,
    },

    // Reported user (for easier querying)
    targetUser: {
      type: Types.ObjectId,
      ref: "User",
      index: true,
    },

    // Predefined reason categories
    category: {
      type: String,
      enum: [
        "spam",
        "harassment",
        "hate_speech",
        "violence",
        "nudity",
        "misinformation",
        "copyright",
        "impersonation",
        "self_harm",
        "illegal",
        "other",
      ],
      required: true,
      index: true,
    },

    // Additional details from reporter
    description: {
      type: String,
      maxlength: 1000,
    },

    // Snapshot of reported content (in case it's deleted)
    contentSnapshot: {
      text: { type: String },
      media: [{ type: String }],
      capturedAt: { type: Date, default: Date.now },
    },

    // For comment reports, link to parent post
    parentPost: {
      type: Types.ObjectId,
      ref: "Post",
    },

    // Report status
    status: {
      type: String,
      enum: ["pending", "under_review", "resolved", "dismissed", "escalated"],
      default: "pending",
      index: true,
    },

    // Priority for triage (higher = more urgent)
    priority: {
      type: Number,
      default: 0,
      index: true,
    },

    // Resolution details
    resolution: {
      action: {
        type: String,
        enum: [
          "no_violation",
          "warning",
          "content_removed",
          "user_suspended",
          "user_banned",
        ],
      },
      note: { type: String },
      resolvedBy: { type: Types.ObjectId, ref: "User" },
      resolvedAt: { type: Date },
    },

    // Audit trail
    actions: [
      {
        action: {
          type: String,
          enum: [
            "created",
            "assigned",
            "reviewed",
            "resolved",
            "dismissed",
            "escalated",
            "reopened",
            "note_added",
          ],
          required: true,
        },
        performedBy: {
          type: Types.ObjectId,
          ref: "User",
        },
        note: { type: String },
        performedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],

    // Assigned moderator
    assignedTo: {
      type: Types.ObjectId,
      ref: "User",
      index: true,
    },

    // For deduplication - group key
    groupKey: {
      type: String,
      index: true,
    },

    // Count of similar reports (for the same content)
    similarReportsCount: {
      type: Number,
      default: 1,
    },
  },
  {
    timestamps: true,
    collection: "Reports",
  }
);

// ============ INDEXES ============
// Primary queries for moderation dashboard
ReportSchema.index({ status: 1, priority: -1, createdAt: -1 });
ReportSchema.index({ status: 1, category: 1, createdAt: -1 });
ReportSchema.index({ assignedTo: 1, status: 1 });

// Deduplication
ReportSchema.index({ targetType: 1, targetId: 1, status: 1 });
ReportSchema.index({ groupKey: 1, status: 1 });

// User history
ReportSchema.index({ targetUser: 1, status: 1 });
ReportSchema.index({ reporter: 1, createdAt: -1 });

// ============ STATICS ============
// Priority scores by category
ReportSchema.statics.PRIORITY_SCORES = {
  self_harm: 100,
  illegal: 90,
  violence: 80,
  hate_speech: 70,
  harassment: 60,
  nudity: 50,
  impersonation: 40,
  misinformation: 30,
  copyright: 20,
  spam: 10,
  other: 5,
};

ReportSchema.statics.createReport = async function (data) {
  const { reporter, targetType, targetId, category, description, parentPost } =
    data;

  // Check for duplicate report from same user
  const existing = await this.findOne({
    reporter,
    targetType,
    targetId,
    status: { $in: ["pending", "under_review"] },
  });

  if (existing) {
    return { success: false, error: "You have already reported this content" };
  }

  // Get target user and content snapshot
  let targetUser = null;
  let contentSnapshot = {};

  if (targetType === "post") {
    const Post = model("Post");
    const post = await Post.findById(targetId).lean();
    if (post) {
      targetUser = post.user;
      contentSnapshot = {
        text: post.caption,
        media: post.media?.map((m) => m.url) || [],
        capturedAt: new Date(),
      };
    }
  } else if (targetType === "comment") {
    const Comment = model("Comment");
    const comment = await Comment.findById(targetId).lean();
    if (comment) {
      targetUser = comment.user;
      contentSnapshot = {
        text: comment.content,
        capturedAt: new Date(),
      };
    }
  } else if (targetType === "user") {
    targetUser = targetId;
  }

  // Calculate priority
  const basePriority = this.PRIORITY_SCORES[category] || 5;

  // Check for existing reports on same target (boost priority)
  const existingReports = await this.countDocuments({
    targetType,
    targetId,
    status: { $in: ["pending", "under_review"] },
  });

  const priority = basePriority + existingReports * 10;

  // Group key for deduplication
  const groupKey = `${targetType}_${targetId}`;

  const report = await this.create({
    reporter,
    targetType,
    targetId,
    targetUser,
    category,
    description,
    contentSnapshot,
    parentPost,
    priority,
    groupKey,
    actions: [
      {
        action: "created",
        performedBy: reporter,
        performedAt: new Date(),
      },
    ],
  });

  // Update similar reports count
  await this.updateMany(
    { groupKey, _id: { $ne: report._id } },
    { $inc: { similarReportsCount: 1 } }
  );

  return { success: true, report };
};

ReportSchema.statics.getReportsForModeration = async function (options = {}) {
  const {
    page = 1,
    limit = 20,
    status = "pending",
    category = null,
    assignedTo = null,
  } = options;

  const query = {};

  if (status) query.status = status;
  if (category) query.category = category;
  if (assignedTo) query.assignedTo = assignedTo;

  return this.find(query)
    .sort({ priority: -1, createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(limit)
    .populate("reporter", "username name avatar")
    .populate("targetUser", "username name avatar")
    .populate("assignedTo", "username name")
    .lean();
};

ReportSchema.statics.resolveReport = async function (
  reportId,
  resolution,
  adminId
) {
  const report = await this.findById(reportId);
  if (!report) return null;

  report.status = "resolved";
  report.resolution = {
    ...resolution,
    resolvedBy: adminId,
    resolvedAt: new Date(),
  };
  report.actions.push({
    action: "resolved",
    performedBy: adminId,
    note: resolution.note,
    performedAt: new Date(),
  });

  return report.save();
};

ReportSchema.statics.getReportStats = async function () {
  return this.aggregate([
    {
      $facet: {
        byStatus: [{ $group: { _id: "$status", count: { $sum: 1 } } }],
        byCategory: [
          { $match: { status: "pending" } },
          { $group: { _id: "$category", count: { $sum: 1 } } },
        ],
        recentTrend: [
          {
            $match: {
              createdAt: {
                $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
              },
            },
          },
          {
            $group: {
              _id: {
                $dateToString: { format: "%Y-%m-%d", date: "$createdAt" },
              },
              count: { $sum: 1 },
            },
          },
          { $sort: { _id: 1 } },
        ],
      },
    },
  ]);
};

const Report = model("Report", ReportSchema);
export default Report;
