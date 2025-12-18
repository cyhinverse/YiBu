import { Schema, Types, model } from "mongoose";

/**
 * Post Model - Optimized for Ranking & Recommendation
 *
 * Key Features:
 * 1. Denormalized counters for instant stats (no aggregation needed)
 * 2. Engagement score pre-calculated for ranking
 * 3. Hashtags stored inline for fast filtering
 * 4. Time-decay ranking support
 * 5. Proper indexes for feed queries
 */
const PostSchema = new Schema(
  {
    // Author
    user: {
      type: Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    // Content
    caption: {
      type: String,
      default: "",
      maxlength: 2200, // Instagram-like limit
    },

    media: [
      {
        url: { type: String, required: true },
        type: { type: String, enum: ["image", "video"], required: true },
        width: { type: Number },
        height: { type: Number },
        duration: { type: Number }, // For videos (seconds)
        thumbnail: { type: String }, // For videos
      },
    ],

    // Hashtags (denormalized for fast filtering)
    hashtags: [
      {
        type: String,
        lowercase: true,
        trim: true,
        index: true,
      },
    ],

    // Mentions
    mentions: [
      {
        type: Types.ObjectId,
        ref: "User",
      },
    ],

    // Location (for geo-based recommendations)
    location: {
      name: { type: String },
      coordinates: {
        type: { type: String, enum: ["Point"] },
        coordinates: [Number], // [longitude, latitude]
      },
    },

    // ============ DENORMALIZED COUNTERS ============
    // These are updated via atomic operations when likes/comments/saves change
    likesCount: { type: Number, default: 0, min: 0 },
    commentsCount: { type: Number, default: 0, min: 0 },
    savesCount: { type: Number, default: 0, min: 0 },
    sharesCount: { type: Number, default: 0, min: 0 },
    viewsCount: { type: Number, default: 0, min: 0 },

    // ============ RANKING METRICS ============
    // Pre-calculated engagement score for fast ranking
    engagementScore: {
      type: Number,
      default: 0,
      index: true,
    },

    // Trending score (engagement velocity)
    trendingScore: {
      type: Number,
      default: 0,
      index: true,
    },

    // Quality score (based on media quality, caption length, etc.)
    qualityScore: {
      type: Number,
      default: 0,
    },

    // Last engagement timestamp (for time-decay calculations)
    lastEngagedAt: {
      type: Date,
      default: Date.now,
    },

    // ============ VISIBILITY & STATUS ============
    visibility: {
      type: String,
      enum: ["public", "followers", "private"],
      default: "public",
      index: true,
    },

    isDeleted: {
      type: Boolean,
      default: false,
      index: true,
    },

    isPinned: {
      type: Boolean,
      default: false,
    },

    // Content moderation
    moderation: {
      status: {
        type: String,
        enum: ["approved", "pending", "flagged", "removed", "rejected"],
        default: "approved",
      },
      reason: { type: String },
      reviewedBy: { type: Types.ObjectId, ref: "User" },
      reviewedAt: { type: Date },
    },

    // For content sensitivity
    isSensitive: {
      type: Boolean,
      default: false,
    },

    // Comments control
    commentsDisabled: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
    collection: "Posts",
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// ============ INDEXES ============
// Primary feed queries
PostSchema.index({ user: 1, createdAt: -1 });
PostSchema.index({ user: 1, isDeleted: 1, createdAt: -1 });

// Ranking indexes
PostSchema.index({ engagementScore: -1, createdAt: -1 });
PostSchema.index({ trendingScore: -1 });
PostSchema.index({ createdAt: -1, engagementScore: -1 });

// Visibility-based queries
PostSchema.index({ visibility: 1, isDeleted: 1, createdAt: -1 });
PostSchema.index({ visibility: 1, isDeleted: 1, engagementScore: -1 });

// Hashtag-based discovery
PostSchema.index({ hashtags: 1, createdAt: -1 });
PostSchema.index({ hashtags: 1, engagementScore: -1 });

// Geo-based queries
PostSchema.index({ "location.coordinates": "2dsphere" });

// Moderation
PostSchema.index({ "moderation.status": 1 });

// Compound index for home feed
PostSchema.index({
  isDeleted: 1,
  visibility: 1,
  "moderation.status": 1,
  createdAt: -1,
});

// Text search
PostSchema.index({
  caption: "text",
  hashtags: "text",
});

// ============ VIRTUAL FIELDS ============
PostSchema.virtual("likes", {
  ref: "Like",
  localField: "_id",
  foreignField: "post",
});

PostSchema.virtual("comments", {
  ref: "Comment",
  localField: "_id",
  foreignField: "post",
});

// ============ METHODS ============
PostSchema.methods.calculateEngagementScore = function () {
  // Weighted engagement score
  // Likes: 1 point, Comments: 3 points, Saves: 5 points, Shares: 4 points
  const rawScore =
    this.likesCount * 1 +
    this.commentsCount * 3 +
    this.savesCount * 5 +
    this.sharesCount * 4;

  // Apply time decay (half-life of 24 hours)
  const ageInHours = (Date.now() - this.createdAt) / (1000 * 60 * 60);
  const decayFactor = Math.pow(0.5, ageInHours / 24);

  this.engagementScore = Math.round(rawScore * decayFactor * 100) / 100;
  return this.engagementScore;
};

PostSchema.methods.calculateTrendingScore = function () {
  // Trending = recent engagement velocity
  const hoursSinceCreation = Math.max(
    1,
    (Date.now() - this.createdAt) / (1000 * 60 * 60)
  );
  const totalEngagement =
    this.likesCount + this.commentsCount + this.savesCount + this.sharesCount;

  // Engagement per hour, boosted for newer posts
  const velocity = totalEngagement / hoursSinceCreation;
  const recencyBoost = Math.exp(-hoursSinceCreation / 48); // 48-hour half-life

  this.trendingScore = Math.round(velocity * (1 + recencyBoost) * 100) / 100;
  return this.trendingScore;
};

PostSchema.methods.calculateQualityScore = function () {
  let score = 0;

  // Has media
  if (this.media && this.media.length > 0) score += 20;

  // Caption quality
  const captionLength = (this.caption || "").length;
  if (captionLength > 50) score += 10;
  if (captionLength > 150) score += 10;
  if (captionLength > 300) score += 5;

  // Has hashtags (but not too many)
  const hashtagCount = (this.hashtags || []).length;
  if (hashtagCount > 0 && hashtagCount <= 10) score += 15;
  if (hashtagCount > 10) score -= 5; // Penalty for hashtag spam

  // Has location
  if (this.location && this.location.name) score += 10;

  this.qualityScore = score;
  return this.qualityScore;
};

PostSchema.methods.updateAllScores = function () {
  this.calculateEngagementScore();
  this.calculateTrendingScore();
  this.calculateQualityScore();
  this.lastEngagedAt = new Date();
  return this;
};

// ============ STATICS ============
PostSchema.statics.getFeedForUser = async function (userId, options = {}) {
  const {
    page = 1,
    limit = 20,
    algorithm = "chronological", // "chronological", "engagement", "trending"
  } = options;

  const Follow = model("Follow");
  const UserSettings = model("UserSettings");

  // Get following list
  const following = await Follow.find({ follower: userId })
    .select("following")
    .lean();
  const followingIds = following.map((f) => f.following);
  followingIds.push(userId); // Include own posts

  // Get blocked/muted users
  const settings = await UserSettings.findOne({ user: userId })
    .select("blockedUsers mutedUsers")
    .lean();

  const excludeUsers = [
    ...(settings?.blockedUsers || []),
    ...(settings?.mutedUsers || []),
  ];

  // Build sort based on algorithm
  let sort = {};
  switch (algorithm) {
    case "engagement":
      sort = { engagementScore: -1, createdAt: -1 };
      break;
    case "trending":
      sort = { trendingScore: -1, createdAt: -1 };
      break;
    default:
      sort = { createdAt: -1 };
  }

  return this.find({
    user: { $in: followingIds, $nin: excludeUsers },
    isDeleted: false,
    visibility: { $in: ["public", "followers"] },
    "moderation.status": "approved",
  })
    .sort(sort)
    .skip((page - 1) * limit)
    .limit(limit)
    .populate("user", "username name avatar verified")
    .lean();
};

PostSchema.statics.getExplorePost = async function (userId, options = {}) {
  const { page = 1, limit = 20 } = options;

  const UserSettings = model("UserSettings");
  const User = model("User");

  // Get user interests
  const user = await User.findById(userId).select("interests").lean();

  // Get blocked users
  const settings = await UserSettings.findOne({ user: userId })
    .select("blockedUsers mutedUsers")
    .lean();

  const excludeUsers = [
    userId,
    ...(settings?.blockedUsers || []),
    ...(settings?.mutedUsers || []),
  ];

  // Build aggregation pipeline for explore
  const pipeline = [
    {
      $match: {
        user: { $nin: excludeUsers },
        isDeleted: false,
        visibility: "public",
        "moderation.status": "approved",
        // Only posts from last 7 days for explore
        createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
      },
    },
    {
      $addFields: {
        // Boost posts with matching hashtags to user interests
        interestMatch: {
          $size: {
            $setIntersection: ["$hashtags", user?.interests || []],
          },
        },
        // Combined ranking score
        rankScore: {
          $add: [
            { $multiply: ["$engagementScore", 0.4] },
            { $multiply: ["$trendingScore", 0.3] },
            { $multiply: ["$qualityScore", 0.1] },
            { $multiply: ["$interestMatch", 20] }, // Interest boost
          ],
        },
      },
    },
    { $sort: { rankScore: -1 } },
    { $skip: (page - 1) * limit },
    { $limit: limit },
    {
      $lookup: {
        from: "Users",
        localField: "user",
        foreignField: "_id",
        as: "user",
        pipeline: [
          { $project: { username: 1, name: 1, avatar: 1, verified: 1 } },
        ],
      },
    },
    { $unwind: "$user" },
  ];

  return this.aggregate(pipeline);
};

// Pre-save hook to extract hashtags and calculate scores
PostSchema.pre("save", function (next) {
  // Extract hashtags from caption
  if (this.isModified("caption") && this.caption) {
    const hashtagRegex = /#(\w+)/g;
    const matches = this.caption.match(hashtagRegex);
    if (matches) {
      this.hashtags = [
        ...new Set(matches.map((tag) => tag.slice(1).toLowerCase())),
      ];
    }
  }

  // Calculate scores on new posts
  if (this.isNew) {
    this.calculateQualityScore();
  }

  next();
});

const Post = model("Post", PostSchema);
export default Post;
