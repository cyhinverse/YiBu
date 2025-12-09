import { Schema, Types, model } from "mongoose";

/**
 * SavePost Model - Optimized for bookmarks/collections
 *
 * Features:
 * 1. Support for collections/folders
 * 2. Efficient queries for saved posts
 * 3. Integration with recommendation system
 */
const SavePostSchema = new Schema(
  {
    user: {
      type: Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    post: {
      type: Types.ObjectId,
      ref: "Post",
      required: true,
      index: true,
    },

    // Optional collection for organizing saves
    collection: {
      type: String,
      default: "default",
      trim: true,
      index: true,
    },

    // Optional note about why saved
    note: {
      type: String,
      maxlength: 500,
    },
  },
  {
    collection: "SavePosts",
    timestamps: true,
  }
);

// ============ INDEXES ============
// Unique constraint
SavePostSchema.index({ user: 1, post: 1 }, { unique: true });

// Get user's saved posts (by collection)
SavePostSchema.index({ user: 1, collection: 1, createdAt: -1 });
SavePostSchema.index({ user: 1, createdAt: -1 });

// Check if post is saved
SavePostSchema.index({ post: 1, user: 1 });

// Get saves for a post
SavePostSchema.index({ post: 1, createdAt: -1 });

// ============ STATICS ============
SavePostSchema.statics.savePost = async function (
  userId,
  postId,
  collection = "default"
) {
  const Post = model("Post");
  const UserInteraction = model("UserInteraction");

  // Check if already saved
  const existing = await this.findOne({ user: userId, post: postId });
  if (existing) {
    // Update collection if different
    if (existing.collection !== collection) {
      existing.collection = collection;
      await existing.save();
      return { success: true, save: existing, updated: true };
    }
    return { success: false, message: "Already saved" };
  }

  // Create save
  const save = await this.create({
    user: userId,
    post: postId,
    collection,
  });

  // Update post counter
  const post = await Post.findByIdAndUpdate(
    postId,
    {
      $inc: { savesCount: 1 },
      $set: { lastEngagedAt: new Date() },
    },
    { new: true }
  );

  // Record interaction
  if (post) {
    await UserInteraction.record({
      user: userId,
      targetType: "post",
      targetId: postId,
      interactionType: "save",
      metadata: {
        postAuthor: post.user,
        postHashtags: post.hashtags,
      },
    });
  }

  return { success: true, save };
};

SavePostSchema.statics.unsavePost = async function (userId, postId) {
  const Post = model("Post");
  const UserInteraction = model("UserInteraction");

  const save = await this.findOneAndDelete({ user: userId, post: postId });

  if (!save) {
    return { success: false, message: "Save not found" };
  }

  await Post.findByIdAndUpdate(postId, { $inc: { savesCount: -1 } });

  await UserInteraction.record({
    user: userId,
    targetType: "post",
    targetId: postId,
    interactionType: "unsave",
  });

  return { success: true };
};

SavePostSchema.statics.getSavedPosts = async function (userId, options = {}) {
  const { page = 1, limit = 20, collection = null } = options;

  const query = { user: userId };
  if (collection) {
    query.collection = collection;
  }

  return this.find(query)
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(limit)
    .populate({
      path: "post",
      match: { isDeleted: false },
      populate: {
        path: "user",
        select: "username name avatar verified",
      },
    })
    .lean()
    .then((saves) => saves.filter((s) => s.post)); // Filter out deleted posts
};

SavePostSchema.statics.getCollections = async function (userId) {
  return this.aggregate([
    { $match: { user: new Types.ObjectId(userId) } },
    {
      $group: {
        _id: "$collection",
        count: { $sum: 1 },
        latestSave: { $max: "$createdAt" },
      },
    },
    { $sort: { latestSave: -1 } },
    {
      $project: {
        name: "$_id",
        count: 1,
        latestSave: 1,
        _id: 0,
      },
    },
  ]);
};

SavePostSchema.statics.hasSaved = async function (userId, postId) {
  const save = await this.findOne({ user: userId, post: postId }).lean();
  return !!save;
};

SavePostSchema.statics.hasSavedMany = async function (userId, postIds) {
  const saves = await this.find({
    user: userId,
    post: { $in: postIds },
  })
    .select("post")
    .lean();

  const savedSet = new Set(saves.map((s) => s.post.toString()));

  return postIds.reduce((acc, postId) => {
    acc[postId.toString()] = savedSet.has(postId.toString());
    return acc;
  }, {});
};

const SavePost = model("SavePost", SavePostSchema);
export default SavePost;
