import { Schema, Types, model } from "mongoose";

/**
 * Like Model - Optimized for fast lookups and counting
 *
 * Features:
 * 1. Supports both post and comment likes
 * 2. Compound indexes for efficient queries
 * 3. Automatic counter updates via hooks
 */
const LikeSchema = new Schema(
  {
    user: {
      type: Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    // Type of target (post or comment)
    targetType: {
      type: String,
      enum: ["post", "comment"],
      required: true,
      index: true,
    },

    // Reference to post (if liking a post)
    post: {
      type: Types.ObjectId,
      ref: "Post",
      index: true,
    },

    // Reference to comment (if liking a comment)
    comment: {
      type: Types.ObjectId,
      ref: "Comment",
      index: true,
    },
  },
  {
    timestamps: true,
    collection: "Likes",
  }
);

// ============ INDEXES ============
// Unique constraint: user can only like a target once
LikeSchema.index(
  { user: 1, post: 1 },
  { unique: true, partialFilterExpression: { post: { $exists: true } } }
);
LikeSchema.index(
  { user: 1, comment: 1 },
  { unique: true, partialFilterExpression: { comment: { $exists: true } } }
);

// Check if user liked (fast lookup)
LikeSchema.index({ user: 1, targetType: 1, post: 1 });
LikeSchema.index({ user: 1, targetType: 1, comment: 1 });

// Get all likes for a post/comment
LikeSchema.index({ post: 1, createdAt: -1 });
LikeSchema.index({ comment: 1, createdAt: -1 });

// Get user's likes
LikeSchema.index({ user: 1, createdAt: -1 });
LikeSchema.index({ user: 1, targetType: 1, createdAt: -1 });

// ============ STATICS ============
LikeSchema.statics.likePost = async function (userId, postId) {
  const Post = model("Post");
  const UserInteraction = model("UserInteraction");

  // Check if already liked
  const existing = await this.findOne({ user: userId, post: postId });
  if (existing) {
    return { success: false, message: "Already liked" };
  }

  // Create like
  const like = await this.create({
    user: userId,
    post: postId,
    targetType: "post",
  });

  // Update post counter
  const post = await Post.findByIdAndUpdate(
    postId,
    {
      $inc: { likesCount: 1 },
      $set: { lastEngagedAt: new Date() },
    },
    { new: true }
  );

  // Record interaction for recommendations
  if (post) {
    await UserInteraction.record({
      user: userId,
      targetType: "post",
      targetId: postId,
      interactionType: "like",
      metadata: {
        postAuthor: post.user,
        postHashtags: post.hashtags,
      },
    });
  }

  return { success: true, like };
};

LikeSchema.statics.unlikePost = async function (userId, postId) {
  const Post = model("Post");
  const UserInteraction = model("UserInteraction");

  const like = await this.findOneAndDelete({ user: userId, post: postId });

  if (!like) {
    return { success: false, message: "Like not found" };
  }

  // Update post counter
  await Post.findByIdAndUpdate(postId, { $inc: { likesCount: -1 } });

  // Record unlike interaction
  await UserInteraction.record({
    user: userId,
    targetType: "post",
    targetId: postId,
    interactionType: "unlike",
  });

  return { success: true };
};

LikeSchema.statics.likeComment = async function (userId, commentId) {
  const Comment = model("Comment");

  const existing = await this.findOne({ user: userId, comment: commentId });
  if (existing) {
    return { success: false, message: "Already liked" };
  }

  const like = await this.create({
    user: userId,
    comment: commentId,
    targetType: "comment",
  });

  await Comment.findByIdAndUpdate(commentId, { $inc: { likesCount: 1 } });

  return { success: true, like };
};

LikeSchema.statics.unlikeComment = async function (userId, commentId) {
  const Comment = model("Comment");

  const like = await this.findOneAndDelete({
    user: userId,
    comment: commentId,
  });

  if (!like) {
    return { success: false, message: "Like not found" };
  }

  await Comment.findByIdAndUpdate(commentId, { $inc: { likesCount: -1 } });

  return { success: true };
};

LikeSchema.statics.hasLiked = async function (
  userId,
  targetId,
  targetType = "post"
) {
  const query = { user: userId, targetType };

  if (targetType === "post") {
    query.post = targetId;
  } else {
    query.comment = targetId;
  }

  const like = await this.findOne(query).lean();
  return !!like;
};

LikeSchema.statics.getLikers = async function (
  targetId,
  targetType = "post",
  options = {}
) {
  const { page = 1, limit = 20 } = options;

  const query = { targetType };
  if (targetType === "post") {
    query.post = targetId;
  } else {
    query.comment = targetId;
  }

  return this.find(query)
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(limit)
    .populate("user", "username name avatar verified")
    .lean();
};

// Check multiple posts if user liked them (for feed)
LikeSchema.statics.hasLikedMany = async function (userId, postIds) {
  const likes = await this.find({
    user: userId,
    post: { $in: postIds },
    targetType: "post",
  })
    .select("post")
    .lean();

  const likedSet = new Set(likes.map((l) => l.post.toString()));

  return postIds.reduce((acc, postId) => {
    acc[postId.toString()] = likedSet.has(postId.toString());
    return acc;
  }, {});
};

const Like = model("Like", LikeSchema);
export default Like;
