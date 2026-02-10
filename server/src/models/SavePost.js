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
    },

    post: {
      type: Types.ObjectId,
      ref: "Post",
      required: true,
    },

    // Optional folder/collection for organizing saves
    // NOTE: Avoid using reserved Mongoose pathname `collection` as a schema field.
    folder: {
      type: String,
      default: "default",
      trim: true,
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

// Backward-compat: older data used `collection` field name. On read, map it to `folder`.
SavePostSchema.pre('init', function (next, data) {
  if (data && data.folder == null && data.collection != null) {
    data.folder = data.collection;
  }
  next();
});

// ============ INDEXES ============
// Unique constraint
SavePostSchema.index({ user: 1, post: 1 }, { unique: true });

// Get user's saved posts (by collection)
SavePostSchema.index({ user: 1, folder: 1, createdAt: -1 });
SavePostSchema.index({ user: 1, createdAt: -1 });

// Check if post is saved
SavePostSchema.index({ post: 1, user: 1 });

// Get saves for a post
SavePostSchema.index({ post: 1, createdAt: -1 });

// ============ STATICS ============
SavePostSchema.statics.savePost = async function (
  userId,
  postId,
  collection = "default",
  options = {}
) {
  const Post = model("Post");
  const UserInteraction = model("UserInteraction");
  const { session } = options;

  const now = new Date();
  const result = await this.updateOne(
    { user: userId, post: postId },
    {
      $set: { folder: collection },
      $setOnInsert: {
        user: userId,
        post: postId,
        folder: collection,
        createdAt: now,
        updatedAt: now,
      },
    },
    { upsert: true, session, timestamps: false }
  );

  const created = !!(result?.upsertedId || result?.upsertedCount);
  const updated = !created && result?.modifiedCount > 0;

  if (!created && !updated) {
    return { success: false, message: "Already saved" };
  }

  const save = await this.findOne({ user: userId, post: postId }).session(
    session
  );
  if (!save) {
    return { success: false, message: "Save not found" };
  }

  // Update post counter
  let post = null;
  if (created) {
    post = await Post.findByIdAndUpdate(
      postId,
      {
        $inc: { savesCount: 1 },
        $set: { lastEngagedAt: new Date() },
      },
      { new: true, session }
    );
    if (!post) {
      await this.deleteOne({ _id: save._id }, { session });
      return { success: false, message: "Post not found" };
    }
  }

  // Record interaction
  if (created && post) {
    await UserInteraction.record({
      user: userId,
      targetType: "post",
      targetId: postId,
      interactionType: "save",
      metadata: {
        postAuthor: post.user,
        postHashtags: post.hashtags,
      },
    }, { session });
  }

  return { success: true, save, updated };
};

SavePostSchema.statics.unsavePost = async function (userId, postId, options = {}) {
  const Post = model("Post");
  const UserInteraction = model("UserInteraction");
  const { session } = options;

  const save = await this.findOneAndDelete({ user: userId, post: postId }).session(session);

  if (!save) {
    return { success: false, message: "Save not found" };
  }

  await Post.updateOne(
    { _id: postId },
    [
      {
        $set: {
          savesCount: { $max: [0, { $add: ["$savesCount", -1] }] },
        },
      },
    ],
    { session }
  );

  await UserInteraction.record({
    user: userId,
    targetType: "post",
    targetId: postId,
    interactionType: "unsave",
  }, { session });

  return { success: true };
};

SavePostSchema.statics.getSavedPosts = async function (userId, options = {}) {
  const { page = 1, limit = 20, collection = null } = options;

  const query = { user: userId };
  if (collection) {
    query.$or = [{ folder: collection }, { collection }];
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
        _id: { $ifNull: ["$folder", "$collection"] },
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
