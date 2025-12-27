import { Schema, Types, model } from 'mongoose';

/**
 * Comment Model - Optimized for nested comments and fast retrieval
 *
 * Features:
 * 1. Nested comments support with depth tracking
 * 2. Denormalized counts for performance
 * 3. Proper indexes for threaded views
 * 4. Soft delete support
 */
const CommentSchema = new Schema(
  {
    // Author
    user: {
      type: Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },

    // Content
    content: {
      type: String,
      required: true,
      maxlength: 2000,
    },

    // Parent post
    post: {
      type: Types.ObjectId,
      ref: 'Post',
      required: true,
      index: true,
    },

    // For nested comments (replies)
    parentComment: {
      type: Types.ObjectId,
      ref: 'Comment',
      default: null,
      index: true,
    },

    // Root comment (for deep nesting - easier to get full thread)
    rootComment: {
      type: Types.ObjectId,
      ref: 'Comment',
      default: null,
      index: true,
    },
    depth: {
      type: Number,
      default: 0,
      max: 3, // Limit nesting depth
    },

    // Mentioned users
    mentions: [
      {
        type: Types.ObjectId,
        ref: 'User',
      },
    ],

    // Denormalized counters
    likesCount: {
      type: Number,
      default: 0,
      min: 0,
    },

    repliesCount: {
      type: Number,
      default: 0,
      min: 0,
    },

    // Soft delete
    isDeleted: {
      type: Boolean,
      default: false,
      index: true,
    },

    // Moderation
    moderation: {
      status: {
        type: String,
        enum: ['approved', 'pending', 'flagged', 'removed'],
        default: 'approved',
      },
      reason: { type: String },
    },

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
    timestamps: true,
    collection: 'Comments',
  }
);

// ============ INDEXES ============
// Get comments for a post (sorted by time or likes)
CommentSchema.index({ post: 1, isDeleted: 1, createdAt: -1 });
CommentSchema.index({ post: 1, isDeleted: 1, likesCount: -1 });

// Get top-level comments only
CommentSchema.index({ post: 1, parentComment: 1, isDeleted: 1, createdAt: -1 });

// Get replies to a comment
CommentSchema.index({ parentComment: 1, isDeleted: 1, createdAt: 1 });

// Get all comments in a thread
CommentSchema.index({ rootComment: 1, isDeleted: 1, createdAt: 1 });

// User's comments
CommentSchema.index({ user: 1, createdAt: -1 });

// Moderation
CommentSchema.index({ 'moderation.status': 1 });

// ============ VIRTUAL ============
CommentSchema.virtual('likes', {
  ref: 'CommentLike',
  localField: '_id',
  foreignField: 'comment',
});

CommentSchema.virtual('replies', {
  ref: 'Comment',
  localField: '_id',
  foreignField: 'parentComment',
});

// ============ METHODS ============
CommentSchema.methods.softDelete = async function () {
  this.isDeleted = true;
  this.content = '[Deleted]';

  // Update parent's reply count
  if (this.parentComment) {
    await model('Comment').updateOne(
      { _id: this.parentComment },
      { $inc: { repliesCount: -1 } }
    );
  }

  // Update post's comment count
  await model('Post').updateOne(
    { _id: this.post },
    { $inc: { commentsCount: -1 } }
  );

  return this.save();
};

// ============ STATICS ============
CommentSchema.statics.getCommentsForPost = async function (
  postId,
  options = {}
) {
  const {
    page = 1,
    limit = 20,
    sortBy = 'createdAt', // "createdAt" or "likesCount"
    includeReplies = true,
    replyLimit = 3,
  } = options;

  const sort =
    sortBy === 'likesCount'
      ? { likesCount: -1, createdAt: -1 }
      : { createdAt: -1 };

  // Get top-level comments
  const comments = await this.find({
    post: postId,
    parentComment: null,
    isDeleted: false,
    'moderation.status': 'approved',
  })
    .sort(sort)
    .skip((page - 1) * limit)
    .limit(limit)
    .populate('user', 'username name avatar verified')
    .lean();

  if (!includeReplies) {
    return comments;
  }

  // Fetch replies for each comment
  const commentIds = comments.map(c => c._id);
  const replies = await this.find({
    parentComment: { $in: commentIds },
    isDeleted: false,
    'moderation.status': 'approved',
  })
    .sort({ createdAt: 1 })
    .populate('user', 'username name avatar verified')
    .lean();

  // Group replies by parent
  const repliesByParent = {};
  replies.forEach(reply => {
    const parentId = reply.parentComment.toString();
    if (!repliesByParent[parentId]) {
      repliesByParent[parentId] = [];
    }
    repliesByParent[parentId].push(reply);
  });

  // Attach replies to comments (limited)
  return comments.map(comment => ({
    ...comment,
    replies: (repliesByParent[comment._id.toString()] || []).slice(
      0,
      replyLimit
    ),
    hasMoreReplies:
      (repliesByParent[comment._id.toString()] || []).length > replyLimit,
  }));
};

CommentSchema.statics.getReplies = async function (commentId, options = {}) {
  const { page = 1, limit = 20 } = options;

  return this.find({
    parentComment: commentId,
    isDeleted: false,
    'moderation.status': 'approved',
  })
    .sort({ createdAt: 1 })
    .skip((page - 1) * limit)
    .limit(limit)
    .populate('user', 'username name avatar verified')
    .lean();
};

// Pre-save hook to set rootComment and depth
CommentSchema.pre('save', async function (next) {
  this.wasNew = this.isNew; // Capture isNew state for post-save hook

  if (this.isNew && this.parentComment) {
    const parent = await model('Comment').findById(this.parentComment);
    if (parent) {
      this.depth = Math.min(parent.depth + 1, 3);
      this.rootComment = parent.rootComment || parent._id;
    }
  }
  next();
});

// Post-save hook to update counts
CommentSchema.post('save', async function (doc) {
  if (doc.wasNew) {
    // Update parent comment's reply count
    if (doc.parentComment) {
      await model('Comment').updateOne(
        { _id: doc.parentComment },
        { $inc: { repliesCount: 1 } }
      );
    }

    // Update post's comment count
    await model('Post').updateOne(
      { _id: doc.post },
      { $inc: { commentsCount: 1 } }
    );
  }
});

const Comment = model('Comment', CommentSchema);
export default Comment;
