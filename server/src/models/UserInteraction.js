import { Schema, Types, model } from "mongoose";


const UserInteractionSchema = new Schema(
  {
    user: {
      type: Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    // Target of interaction
    targetType: {
      type: String,
      enum: ["post", "user", "hashtag", "comment"],
      required: true,
      index: true,
    },

    targetId: {
      type: Types.ObjectId,
      required: true,
      index: true,
    },

    // Type of interaction
    interactionType: {
      type: String,
      enum: [
        // Post interactions
        "view", // Viewed the post
        "like", // Liked the post
        "unlike", // Unliked (for tracking preference changes)
        "comment", // Commented on post
        "save", // Saved the post
        "unsave", // Unsaved
        "share", // Shared the post
        "report", // Reported the post
        "hide", // Hide this post
        "not_interested", // Not interested in similar content

        // User interactions
        "follow", // Followed a user
        "unfollow", // Unfollowed
        "profile_view", // Viewed someone's profile
        "block", // Blocked a user
        "mute", // Muted a user

        // Hashtag interactions
        "hashtag_click", // Clicked on a hashtag
        "hashtag_follow", // Followed a hashtag

        // Engagement depth
        "scroll_past", // Scrolled past without engagement
        "dwell", // Spent significant time on content
      ],
      required: true,
      index: true,
    },

    // Interaction weight/strength (for ML models)
    // Calculated based on interaction type and context
    weight: {
      type: Number,
      default: 1,
      index: true,
    },

    // Context data for the interaction
    context: {
      // Where the interaction happened
      source: {
        type: String,
        enum: [
          "feed",
          "explore",
          "profile",
          "search",
          "hashtag",
          "notification",
          "direct",
        ],
        default: "feed",
      },

      // Position in feed when interacted (for position bias)
      feedPosition: { type: Number },

      // Time spent (for dwell time analysis)
      dwellTime: { type: Number }, // in seconds

      // Session info
      sessionId: { type: String },

      // Device type
      deviceType: { type: String, enum: ["mobile", "tablet", "desktop"] },
    },

    // Associated content metadata (denormalized for fast access)
    metadata: {
      // For post interactions
      postAuthor: { type: Types.ObjectId, ref: "User" },
      postHashtags: [{ type: String }],

      // For user interactions
      targetUserInterests: [{ type: String }],
    },

    // Is this a positive or negative signal?
    sentiment: {
      type: String,
      enum: ["positive", "negative", "neutral"],
      default: "neutral",
      index: true,
    },

    // Expiration for GDPR compliance and data freshness
    expiresAt: {
      type: Date,
      default: () => new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // 90 days
      index: true,
    },
  },
  {
    collection: "UserInteractions",
    timestamps: true,
  }
);

// ============ INDEXES ============
// Primary lookup patterns
UserInteractionSchema.index({ user: 1, createdAt: -1 });
UserInteractionSchema.index({ user: 1, targetType: 1, interactionType: 1 });
UserInteractionSchema.index({ user: 1, targetId: 1, interactionType: 1 });

// For finding interactions on a target
UserInteractionSchema.index({ targetId: 1, targetType: 1, createdAt: -1 });
UserInteractionSchema.index({ targetId: 1, interactionType: 1 });

// For recommendation engine
UserInteractionSchema.index({ user: 1, sentiment: 1, createdAt: -1 });
UserInteractionSchema.index({ user: 1, "metadata.postHashtags": 1 });
UserInteractionSchema.index({ user: 1, "metadata.postAuthor": 1 });

// For collaborative filtering
UserInteractionSchema.index({ targetId: 1, interactionType: 1, user: 1 });

// TTL index for automatic cleanup
UserInteractionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Time-based queries
UserInteractionSchema.index({ createdAt: -1 });

// ============ STATICS ============

// Get interaction weights by type
UserInteractionSchema.statics.INTERACTION_WEIGHTS = {
  // Positive signals
  like: 3,
  save: 5,
  share: 6,
  comment: 4,
  follow: 8,
  dwell: 2,
  profile_view: 1,
  hashtag_click: 1,
  hashtag_follow: 4,

  // Negative signals
  unlike: -2,
  unsave: -3,
  unfollow: -6,
  hide: -5,
  not_interested: -7,
  report: -10,
  block: -15,
  mute: -8,
  scroll_past: -0.5,

  // Neutral
  view: 0.5,
};

// Record an interaction
UserInteractionSchema.statics.record = async function (data) {
  const {
    user,
    targetType,
    targetId,
    interactionType,
    context = {},
    metadata = {},
  } = data;

  const weight = this.INTERACTION_WEIGHTS[interactionType] || 1;

  let sentiment = "neutral";
  if (weight > 0) sentiment = "positive";
  if (weight < 0) sentiment = "negative";

  // For certain interactions, update instead of create new
  const replaceableTypes = [
    "like",
    "unlike",
    "save",
    "unsave",
    "follow",
    "unfollow",
  ];

  if (replaceableTypes.includes(interactionType)) {
    // Check if opposite interaction exists and remove it
    const opposites = {
      like: "unlike",
      unlike: "like",
      save: "unsave",
      unsave: "save",
      follow: "unfollow",
      unfollow: "follow",
    };

    await this.deleteOne({
      user,
      targetId,
      targetType,
      interactionType: opposites[interactionType],
    });
  }

  return this.create({
    user,
    targetType,
    targetId,
    interactionType,
    weight,
    sentiment,
    context,
    metadata,
  });
};

// Get user's interaction profile
UserInteractionSchema.statics.getUserProfile = async function (userId) {
  const pipeline = [
    {
      $match: {
        user: new Types.ObjectId(userId),
        sentiment: "positive",
        createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }, // Last 30 days
      },
    },
    {
      $facet: {
        // Favorite authors
        topAuthors: [
          {
            $match: {
              targetType: "post",
              "metadata.postAuthor": { $exists: true },
            },
          },
          {
            $group: { _id: "$metadata.postAuthor", score: { $sum: "$weight" } },
          },
          { $sort: { score: -1 } },
          { $limit: 20 },
        ],
        // Favorite hashtags
        topHashtags: [
          { $match: { "metadata.postHashtags": { $exists: true, $ne: [] } } },
          { $unwind: "$metadata.postHashtags" },
          {
            $group: {
              _id: "$metadata.postHashtags",
              score: { $sum: "$weight" },
            },
          },
          { $sort: { score: -1 } },
          { $limit: 30 },
        ],
        // Interaction patterns
        interactionCounts: [
          { $group: { _id: "$interactionType", count: { $sum: 1 } } },
        ],
        // Recent engaged posts
        recentEngaged: [
          { $match: { targetType: "post" } },
          { $sort: { createdAt: -1 } },
          { $limit: 50 },
          { $group: { _id: null, postIds: { $push: "$targetId" } } },
        ],
      },
    },
  ];

  const [result] = await this.aggregate(pipeline);

  return {
    favoriteAuthors: result.topAuthors.map((a) => ({
      userId: a._id,
      score: a.score,
    })),
    favoriteHashtags: result.topHashtags.map((h) => ({
      name: h._id,
      score: h.score,
    })),
    interactionCounts: result.interactionCounts.reduce((acc, i) => {
      acc[i._id] = i.count;
      return acc;
    }, {}),
    recentEngagedPosts: result.recentEngaged[0]?.postIds || [],
  };
};

// Find similar users (for collaborative filtering)
UserInteractionSchema.statics.findSimilarUsers = async function (
  userId,
  limit = 20
) {
  // Find users who interacted with similar content
  const pipeline = [
    // Get posts this user engaged with
    {
      $match: {
        user: new Types.ObjectId(userId),
        targetType: "post",
        sentiment: "positive",
        createdAt: { $gte: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000) },
      },
    },
    { $project: { targetId: 1 } },

    // Find other users who engaged with same posts
    {
      $lookup: {
        from: "UserInteractions",
        let: { postId: "$targetId" },
        pipeline: [
          {
            $match: {
              $expr: {
                $and: [
                  { $eq: ["$targetId", "$$postId"] },
                  { $eq: ["$targetType", "post"] },
                  { $eq: ["$sentiment", "positive"] },
                ],
              },
              user: { $ne: new Types.ObjectId(userId) },
            },
          },
          { $project: { user: 1, weight: 1 } },
        ],
        as: "similarInteractions",
      },
    },
    { $unwind: "$similarInteractions" },

    // Aggregate by user
    {
      $group: {
        _id: "$similarInteractions.user",
        commonPosts: { $sum: 1 },
        totalWeight: { $sum: "$similarInteractions.weight" },
      },
    },

    // Calculate similarity score
    {
      $addFields: {
        similarityScore: {
          $multiply: [
            "$commonPosts",
            { $add: [1, { $divide: ["$totalWeight", 10] }] },
          ],
        },
      },
    },

    { $sort: { similarityScore: -1 } },
    { $limit: limit },
  ];

  return this.aggregate(pipeline);
};

// Get content recommendations based on interactions
UserInteractionSchema.statics.getRecommendedContent = async function (
  userId,
  options = {}
) {
  const { limit = 20, excludeIds = [] } = options;

  const profile = await this.getUserProfile(userId);

  const Post = model("Post");

  const pipeline = [
    {
      $match: {
        _id: { $nin: [...profile.recentEngagedPosts, ...excludeIds] },
        isDeleted: false,
        visibility: "public",
        "moderation.status": "approved",
        createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
      },
    },
    {
      $addFields: {
        // Score based on author preference
        authorScore: {
          $cond: {
            if: {
              $in: ["$user", profile.favoriteAuthors.map((a) => a.userId)],
            },
            then: 50,
            else: 0,
          },
        },
        // Score based on hashtag preference
        hashtagScore: {
          $multiply: [
            {
              $size: {
                $setIntersection: [
                  "$hashtags",
                  profile.favoriteHashtags.map((h) => h.name),
                ],
              },
            },
            10,
          ],
        },
        // Combined recommendation score
        recScore: {
          $add: [
            "$engagementScore",
            { $multiply: ["$trendingScore", 0.5] },
            "$authorScore",
            "$hashtagScore",
          ],
        },
      },
    },
    { $sort: { recScore: -1 } },
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

  return Post.aggregate(pipeline);
};

const UserInteraction = model("UserInteraction", UserInteractionSchema);
export default UserInteraction;
