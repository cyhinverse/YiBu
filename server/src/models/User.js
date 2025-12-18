import { Schema, model } from "mongoose";

/**
 * User Model - Optimized for Ranking & Recommendation
 *
 * Design Principles:
 * 1. Denormalized counters for fast queries
 * 2. Engagement metrics for ranking algorithms
 * 3. Indexed fields for efficient lookups
 * 4. Separated settings into UserSettings model
 */
const UserSchema = new Schema(
  {
    // Core Identity
    username: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: { type: String, required: true, select: false },
    name: { type: String, default: "", trim: true },

    // Profile (lightweight, frequently accessed)
    avatar: {
      type: String,
      default:
        "https://i0.wp.com/sbcf.fr/wp-content/uploads/2018/03/sbcf-default-avatar.png?ssl=1",
    },
    bio: { type: String, default: "", maxlength: 500 },
    birthday: { type: Date, default: null },
    gender: {
      type: String,
      enum: ["male", "female", "other"],
      default: "other",
    },
    website: { type: String, default: "" },
    cover: { type: String, default: "" },

    // Interests for recommendation (stored as array for efficient matching)
    interests: [{ type: String, lowercase: true, trim: true }],

    // Denormalized Counters (avoid expensive $lookup aggregations)
    followersCount: { type: Number, default: 0, min: 0 },
    followingCount: { type: Number, default: 0, min: 0 },
    postsCount: { type: Number, default: 0, min: 0 },

    // Engagement Metrics for Ranking
    metrics: {
      // Total engagement received
      totalLikesReceived: { type: Number, default: 0 },
      totalCommentsReceived: { type: Number, default: 0 },
      totalSavesReceived: { type: Number, default: 0 },

      // Engagement rate = (likes + comments + saves) / posts
      engagementRate: { type: Number, default: 0 },

      // Activity score (recalculated periodically)
      activityScore: { type: Number, default: 0 },

      // Average post performance
      avgPostEngagement: { type: Number, default: 0 },

      // Last calculated timestamp
      lastCalculated: { type: Date, default: Date.now },
    },

    // Account Status
    verified: { type: Boolean, default: false },
    isAdmin: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },

    // Moderation (simplified)
    moderation: {
      status: {
        type: String,
        enum: ["active", "warned", "suspended", "banned"],
        default: "active",
      },
      reason: { type: String, default: "" },
      expiresAt: { type: Date, default: null },
      moderatedBy: { type: Schema.Types.ObjectId, ref: "User" },
      moderatedAt: { type: Date },
    },

    // Activity tracking
    lastActiveAt: { type: Date, default: Date.now },
    lastLoginAt: { type: Date },
    loginAttempts: {
      count: { type: Number, default: 0 },
      lastAttempt: { type: Date },
      lockUntil: { type: Date },
    },

    // Privacy (inline for fast access)
    privacy: {
      profileVisibility: {
        type: String,
        enum: ["public", "followers", "private"],
        default: "public",
      },
      allowMessages: {
        type: String,
        enum: ["everyone", "followers", "none"],
        default: "everyone",
      },
      showActivity: { type: Boolean, default: true },
    },
  },
  {
    collection: "Users",
    timestamps: true,
  }
);

// ============ INDEXES ============
// Primary lookups - Already defined in schema with unique: true
// UserSchema.index({ username: 1 });
// UserSchema.index({ email: 1 });

// Recommendation & Search
UserSchema.index({ interests: 1 });
UserSchema.index({ "metrics.engagementRate": -1 });
UserSchema.index({ "metrics.activityScore": -1 });
UserSchema.index({ verified: 1, "metrics.engagementRate": -1 });

// Admin & Moderation
UserSchema.index({ "moderation.status": 1 });
UserSchema.index({ isAdmin: 1 });

// Activity-based queries
UserSchema.index({ lastActiveAt: -1 });
UserSchema.index({ createdAt: -1 });

// Compound index for user discovery
UserSchema.index({
  isActive: 1,
  "moderation.status": 1,
  "metrics.engagementRate": -1,
});

// Text search index
UserSchema.index(
  {
    username: "text",
    name: "text",
    bio: "text",
  },
  {
    weights: { username: 10, name: 5, bio: 1 },
  }
);

// ============ METHODS ============
UserSchema.methods.updateEngagementMetrics = async function () {
  const Post = model("Post");

  const stats = await Post.aggregate([
    { $match: { user: this._id, isDeleted: false } },
    {
      $group: {
        _id: null,
        totalLikes: { $sum: "$likesCount" },
        totalComments: { $sum: "$commentsCount" },
        totalSaves: { $sum: "$savesCount" },
        postCount: { $sum: 1 },
        avgEngagement: { $avg: "$engagementScore" },
      },
    },
  ]);

  if (stats.length > 0) {
    const { totalLikes, totalComments, totalSaves, postCount, avgEngagement } =
      stats[0];
    const engagementRate =
      postCount > 0 ? (totalLikes + totalComments + totalSaves) / postCount : 0;

    this.metrics = {
      totalLikesReceived: totalLikes,
      totalCommentsReceived: totalComments,
      totalSavesReceived: totalSaves,
      engagementRate: Math.round(engagementRate * 100) / 100,
      avgPostEngagement: Math.round(avgEngagement * 100) / 100,
      activityScore: this.calculateActivityScore(),
      lastCalculated: new Date(),
    };
    this.postsCount = postCount;
  }

  return this.save();
};

UserSchema.methods.calculateActivityScore = function () {
  const now = new Date();
  const daysSinceActive = (now - this.lastActiveAt) / (1000 * 60 * 60 * 24);
  const recencyFactor = Math.exp(-daysSinceActive / 7); // Decay over 7 days

  const engagementFactor = this.metrics.engagementRate || 0;
  const followersFactor = Math.log10(this.followersCount + 1);

  return (
    Math.round(
      (recencyFactor * 40 + engagementFactor * 40 + followersFactor * 20) * 100
    ) / 100
  );
};

// ============ STATICS ============
UserSchema.statics.getRecommendedUsers = async function (userId, limit = 10) {
  const user = await this.findById(userId).select("interests");
  const Follow = model("Follow");

  if (!user) return [];

  // Get users that current user is following
  const following = await Follow.find({ follower: userId })
    .select("following")
    .lean();
  const followingIds = following.map((f) => f.following);

  // Find users with similar interests who are not followed
  return this.aggregate([
    {
      $match: {
        _id: { $ne: userId, $nin: followingIds },
        isActive: true,
        "moderation.status": "active",
        interests: { $in: user.interests || [] },
      },
    },
    {
      $addFields: {
        commonInterests: {
          $size: { $setIntersection: ["$interests", user.interests || []] },
        },
        score: {
          $add: [
            { $multiply: ["$metrics.engagementRate", 0.3] },
            { $multiply: ["$metrics.activityScore", 0.3] },
            { $multiply: [{ $log10: { $add: ["$followersCount", 1] } }, 0.2] },
            { $multiply: ["$commonInterests", 10] }, // Boost for common interests
          ],
        },
      },
    },
    { $sort: { score: -1 } },
    { $limit: limit },
    {
      $project: {
        password: 0,
        email: 0,
        moderation: 0,
        loginAttempts: 0,
      },
    },
  ]);
};

export const User = model("User", UserSchema);
export default User;
