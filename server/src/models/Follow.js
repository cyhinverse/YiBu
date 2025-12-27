import { Schema, Types, model } from 'mongoose';
import { retryOperation } from '../helpers/retryOperation.js';

/**
 * Follow Model - Separated from User for scalability
 *
 * Why separate?
 * 1. Avoids unbounded array growth in User document
 * 2. Enables efficient following/follower queries
 * 3. Supports follow analytics and suggestions
 * 4. Can track follow history and interactions
 */
const FollowSchema = new Schema(
  {
    // User who is following
    follower: {
      type: Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },

    // User being followed
    following: {
      type: Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },

    // Follow status (for follow requests in private accounts)
    status: {
      type: String,
      enum: ['active', 'pending', 'rejected'],
      default: 'active',
      index: true,
    },

    // Notification preference for this follow
    notifications: {
      posts: { type: Boolean, default: true },
      stories: { type: Boolean, default: true },
    },

    // Is this a close friend?
    isCloseFriend: {
      type: Boolean,
      default: false,
    },

    // Interaction score (for feed ranking)
    interactionScore: {
      type: Number,
      default: 0,
    },

    // Last interaction timestamp
    lastInteractionAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    collection: 'Follows',
    timestamps: true,
  }
);

// ============ INDEXES ============
// Unique constraint
FollowSchema.index({ follower: 1, following: 1 }, { unique: true });

// Get followers of a user
FollowSchema.index({ following: 1, status: 1, createdAt: -1 });

// Get who a user follows
FollowSchema.index({ follower: 1, status: 1, createdAt: -1 });

// For feed ranking (get follows sorted by interaction)
FollowSchema.index({ follower: 1, status: 1, interactionScore: -1 });

// Pending follow requests
FollowSchema.index({ following: 1, status: 1 });

// Close friends
FollowSchema.index({ follower: 1, isCloseFriend: 1 });

// ============ STATICS ============
FollowSchema.statics.follow = async function (followerId, followingId) {
  const User = model('User');
  const UserInteraction = model('UserInteraction');

  // Can't follow yourself
  if (followerId.toString() === followingId.toString()) {
    return { success: false, error: 'Cannot follow yourself' };
  }

  // Check if already following
  const existing = await this.findOne({
    follower: followerId,
    following: followingId,
  });
  if (existing) {
    if (existing.status === 'active') {
      return { success: false, error: 'Already following' };
    }
    if (existing.status === 'pending') {
      return { success: false, error: 'Follow request pending' };
    }
  }

  // Check target user's privacy
  const targetUser = await User.findById(followingId).select('privacy').lean();
  const status =
    targetUser?.privacy?.profileVisibility === 'private' ? 'pending' : 'active';

  // Create or update follow
  const follow = existing
    ? await this.findByIdAndUpdate(existing._id, { status }, { new: true })
    : await this.create({
        follower: followerId,
        following: followingId,
        status,
      });

  // Update counters if active
  if (status === 'active') {
    await Promise.all([
      User.updateOne({ _id: followerId }, { $inc: { followingCount: 1 } }),
      User.updateOne({ _id: followingId }, { $inc: { followersCount: 1 } }),
    ]);

    // Record interaction
    await UserInteraction.record({
      user: followerId,
      targetType: 'user',
      targetId: followingId,
      interactionType: 'follow',
    });
  }

  return { success: true, follow, status };
};

FollowSchema.statics.unfollow = async function (followerId, followingId) {
  const User = model('User');
  const UserInteraction = model('UserInteraction');

  const follow = await this.findOneAndDelete({
    follower: followerId,
    following: followingId,
  });

  if (!follow) {
    return { success: false, error: 'Not following' };
  }

  // Update counters if was active
  if (follow.status === 'active') {
    await Promise.all([
      User.updateOne({ _id: followerId }, { $inc: { followingCount: -1 } }),
      User.updateOne({ _id: followingId }, { $inc: { followersCount: -1 } }),
    ]);

    // Record interaction
    await UserInteraction.record({
      user: followerId,
      targetType: 'user',
      targetId: followingId,
      interactionType: 'unfollow',
    });
  }

  return { success: true };
};

FollowSchema.statics.acceptFollowRequest = async function (userId, followerId) {
  const User = model('User');
  const self = this;

  const follow = await retryOperation(() =>
    self.findOneAndUpdate(
      { follower: followerId, following: userId, status: 'pending' },
      { status: 'active' },
      { new: true }
    )
  );

  if (!follow) {
    return { success: false, error: 'Follow request not found' };
  }

  // Update counters
  await Promise.all([
    User.updateOne({ _id: followerId }, { $inc: { followingCount: 1 } }),
    User.updateOne({ _id: userId }, { $inc: { followersCount: 1 } }),
  ]);

  return { success: true, follow };
};

FollowSchema.statics.rejectFollowRequest = async function (userId, followerId) {
  const self = this;

  const follow = await retryOperation(() =>
    self.findOneAndUpdate(
      { follower: followerId, following: userId, status: 'pending' },
      { status: 'rejected' },
      { new: true }
    )
  );

  if (!follow) {
    return { success: false, error: 'Follow request not found' };
  }

  return { success: true };
};

FollowSchema.statics.getFollowingIds = async function (userId) {
  const follows = await this.find({ follower: userId, status: 'active' })
    .select('following')
    .lean();
  return follows.map(f => f.following.toString());
};

FollowSchema.statics.getFollowerIds = async function (userId) {
  const follows = await this.find({ following: userId, status: 'active' })
    .select('follower')
    .lean();
  return follows.map(f => f.follower.toString());
};

FollowSchema.statics.getFollowers = async function (userId, options = {}) {
  const { page = 1, limit = 20, status = 'active' } = options;

  return this.find({ following: userId, status })
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(limit)
    .populate('follower', 'username name avatar verified followersCount')
    .lean()
    .then(follows => follows.map(f => f.follower).filter(user => user));
};

FollowSchema.statics.getFollowing = async function (userId, options = {}) {
  const { page = 1, limit = 20, status = 'active' } = options;

  return this.find({ follower: userId, status })
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(limit)
    .populate('following', 'username name avatar verified followersCount')
    .lean()
    .then(follows => follows.map(f => f.following).filter(user => user));
};

FollowSchema.statics.getFollowingForFeed = async function (
  userId,
  limit = 100
) {
  // Get following sorted by interaction score for feed ranking
  return this.find({ follower: userId, status: 'active' })
    .sort({ interactionScore: -1, lastInteractionAt: -1 })
    .limit(limit)
    .select('following interactionScore')
    .lean()
    .then(follows =>
      follows.map(f => ({
        userId: f.following,
        score: f.interactionScore,
      }))
    );
};

FollowSchema.statics.isFollowing = async function (followerId, followingId) {
  const follow = await this.findOne({
    follower: followerId,
    following: followingId,
    status: 'active',
  }).lean();
  return !!follow;
};

FollowSchema.statics.getFollowStatus = async function (
  followerId,
  followingId
) {
  const follow = await this.findOne({
    follower: followerId,
    following: followingId,
  }).lean();

  if (!follow) return 'none';
  return follow.status;
};

FollowSchema.statics.getMutualFollowers = async function (
  userId1,
  userId2,
  limit = 10
) {
  // Find users that both users follow
  const pipeline = [
    {
      $match: {
        follower: new Types.ObjectId(userId1),
        status: 'active',
      },
    },
    {
      $lookup: {
        from: 'Follows',
        let: { followingId: '$following' },
        pipeline: [
          {
            $match: {
              $expr: {
                $and: [
                  { $eq: ['$follower', new Types.ObjectId(userId2)] },
                  { $eq: ['$following', '$$followingId'] },
                  { $eq: ['$status', 'active'] },
                ],
              },
            },
          },
        ],
        as: 'mutual',
      },
    },
    { $match: { 'mutual.0': { $exists: true } } },
    { $limit: limit },
    {
      $lookup: {
        from: 'Users',
        localField: 'following',
        foreignField: '_id',
        as: 'user',
        pipeline: [
          { $project: { username: 1, name: 1, avatar: 1, verified: 1 } },
        ],
      },
    },
    { $unwind: '$user' },
    { $replaceRoot: { newRoot: '$user' } },
  ];

  return this.aggregate(pipeline);
};

FollowSchema.statics.updateInteractionScore = async function (
  followerId,
  followingId,
  increment = 1
) {
  return this.updateOne(
    { follower: followerId, following: followingId, status: 'active' },
    {
      $inc: { interactionScore: increment },
      $set: { lastInteractionAt: new Date() },
    }
  );
};

FollowSchema.statics.getPendingRequests = async function (
  userId,
  options = {}
) {
  const { page = 1, limit = 20 } = options;

  return this.find({ following: userId, status: 'pending' })
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(limit)
    .populate('follower', 'username name avatar verified')
    .lean();
};

FollowSchema.statics.getCloseFriends = async function (userId) {
  return this.find({ follower: userId, isCloseFriend: true, status: 'active' })
    .populate('following', 'username name avatar')
    .lean()
    .then(follows => follows.map(f => f.following));
};

FollowSchema.statics.setCloseFriend = async function (
  followerId,
  followingId,
  isCloseFriend
) {
  return this.updateOne(
    { follower: followerId, following: followingId, status: 'active' },
    { $set: { isCloseFriend } }
  );
};

const Follow = model('Follow', FollowSchema);
export default Follow;
