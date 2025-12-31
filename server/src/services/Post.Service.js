import mongoose from 'mongoose';
import Post from '../models/Post.js';
import User from '../models/User.js';
import UserSettings from '../models/UserSettings.js';
import Comment from '../models/Comment.js';
import Like from '../models/Like.js';
import SavePost from '../models/SavePost.js';
import Hashtag from '../models/Hashtag.js';
import UserInteraction from '../models/UserInteraction.js';
import Follow from '../models/Follow.js';
import Notification from '../models/Notification.js';
import logger from '../configs/logger.js';
import { retryOperation } from '../helpers/retryOperation.js';

/**
 * Post Service - Refactored for new model structure
 *
 * Key Changes:
 * 1. Integrates with UserInteraction for recommendation engine
 * 2. Uses denormalized counters
 * 3. Updates hashtag analytics
 * 4. Uses Post model's ranking methods
 */
class PostService {
  // ======================================
  // Post Creation & Update
  // ======================================

  static async createPost(postData, userId) {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const {
        caption = '',
        media = [],
        visibility = 'public',
        location,
      } = postData;

      const processedHashtags = await this._processHashtags(caption, session);

      const post = await Post.create(
        [
          {
            user: userId,
            caption,
            media,
            visibility,
            location,
            hashtags: processedHashtags,
          },
        ],
        { session }
      );

      await User.findByIdAndUpdate(userId, { $inc: { postsCount: 1 } }).session(
        session
      );

      await session.commitTransaction();

      const populatedPost = await Post.findById(post[0]._id)
        .populate('user', 'username name avatar verified')
        .lean();

      return populatedPost;
    } catch (error) {
      await session.abortTransaction();
      logger.error('Error creating post:', error);
      throw error;
    } finally {
      session.endSession();
    }
  }

  static async _processHashtags(caption, session) {
    const hashtagRegex = /#(\w+)/g;
    const matches = caption.match(hashtagRegex);

    if (!matches) return [];

    const tags = [...new Set(matches.map(tag => tag.slice(1).toLowerCase()))];
    const processedTags = [];

    for (const tag of tags.slice(0, 30)) {
      const hashtag = await retryOperation(() =>
        Hashtag.findOneAndUpdate(
          { name: tag },
          {
            $inc: { postsCount: 1 },
            $set: { lastUsedAt: new Date() },
          },
          { upsert: true, new: true, session }
        )
      );

      processedTags.push({ tag, hashtagId: hashtag._id });
    }

    return processedTags;
  }

  static async getLikedPosts(userId, options = {}) {
    const { page = 1, limit = 20 } = options;

    const likes = await Like.find({ user: userId, targetType: 'post' })
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate({
        path: 'post',
        match: { isDeleted: false },
        populate: { path: 'user', select: 'username name avatar verified' },
      })
      .lean();

    const posts = likes
      .filter(like => like.post) // Filter out null posts (deleted)
      .map(like => like.post);

    const postsWithStatus = await this._addUserStatus(posts, userId);

    const total = await Like.countDocuments({
      user: userId,
      targetType: 'post',
    });

    return {
      posts: postsWithStatus,
      total,
      hasMore: page * limit < total,
    };
  }

  static async getSharedPosts(userId, options = {}) {
    const { page = 1, limit = 20 } = options;

    const shares = await UserInteraction.find({
      user: userId,
      targetType: 'post',
      interactionType: 'share',
    })
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean();

    const postIds = shares.map(share => share.targetId);

    const posts = await Post.find({
      _id: { $in: postIds },
      isDeleted: false,
    })
      .populate('user', 'username name avatar verified')
      .lean();

    // Preserve order of shares
    const postsMap = new Map(posts.map(p => [p._id.toString(), p]));
    const orderedPosts = postIds
      .map(id => postsMap.get(id.toString()))
      .filter(Boolean);

    const postsWithStatus = await this._addUserStatus(orderedPosts, userId);

    const total = await UserInteraction.countDocuments({
      user: userId,
      targetType: 'post',
      interactionType: 'share',
    });

    return {
      posts: postsWithStatus,
      total,
      hasMore: page * limit < total,
    };
  }

  static async updatePost(postId, userId, updateData) {
    const post = await Post.findOne({
      _id: postId,
      user: userId,
      isDeleted: false,
    });

    if (!post) {
      throw new Error('Post not found or unauthorized');
    }

    const { caption, visibility, location, mentions, media, existingMedia } =
      updateData;
    const allowedUpdates = {};

    let currentMedia = post.media;
    if (existingMedia) {
      try {
        currentMedia =
          typeof existingMedia === 'string'
            ? JSON.parse(existingMedia)
            : existingMedia;
      } catch (e) {
        currentMedia = [];
      }
    }

    if (media && media.length > 0) {
      allowedUpdates.media = [...currentMedia, ...media];
    } else if (existingMedia !== undefined) {
      allowedUpdates.media = currentMedia;
    }

    if (caption !== undefined) {
      allowedUpdates.caption = caption;

      const oldTags = post.hashtags.map(h => h.tag);
      const newTags = await this._processHashtags(caption, null);

      const removedTags = oldTags.filter(
        t => !newTags.map(n => n.tag).includes(t)
      );
      const addedTags = newTags.filter(n => !oldTags.includes(n.tag));

      if (removedTags.length > 0) {
        await Hashtag.updateMany(
          { name: { $in: removedTags } },
          { $inc: { postsCount: -1 } }
        );
      }

      allowedUpdates.hashtags = newTags.map(t => t.tag);
    }

    if (visibility !== undefined) allowedUpdates.visibility = visibility;
    if (location !== undefined) allowedUpdates.location = location;
    if (mentions !== undefined) allowedUpdates.mentions = mentions;

    const updatedPost = await Post.findByIdAndUpdate(
      postId,
      { $set: allowedUpdates },
      { new: true }
    ).populate('user', 'username name avatar verified');

    return updatedPost;
  }

  static async deletePost(postId, userId, isAdmin = false) {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const query = isAdmin ? { _id: postId } : { _id: postId, user: userId };
      const post = await Post.findOne(query).session(session);

      if (!post) {
        throw new Error('Post not found or unauthorized');
      }

      post.isDeleted = true;
      await post.save({ session });

      await User.findByIdAndUpdate(post.user, {
        $inc: { postsCount: -1 },
      }).session(session);

      if (post.hashtags && post.hashtags.length > 0) {
        const tags = post.hashtags.map(h => h.tag);
        await Hashtag.updateMany(
          { name: { $in: tags } },
          { $inc: { postsCount: -1 } }
        ).session(session);
      }

      await session.commitTransaction();
      return post;
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }

  // ======================================
  // Post Retrieval
  // ======================================

  static async getPostById(postId, userId = null) {
    const post = await Post.findOne({ _id: postId, isDeleted: false })
      .populate('user', 'username name avatar verified')
      .lean();

    if (!post) {
      throw new Error('Post not found');
    }

    const result = { ...post };

    if (userId) {
      const [isLiked, isSaved] = await Promise.all([
        Like.exists({ user: userId, post: postId }),
        SavePost.exists({ user: userId, post: postId }),
      ]);

      result.isLiked = !!isLiked;
      result.isSaved = !!isSaved;

      await UserInteraction.record({
        user: userId,
        targetType: 'post',
        targetId: postId,
        interactionType: 'view',
        metadata: { viewDuration: 0 },
      });
    }

    return result;
  }

  static async getUserPosts(targetUserId, requesterId = null, options = {}) {
    const { page = 1, limit = 20 } = options;

    let visibilityFilter = ['public'];

    if (requesterId) {
      if (requesterId === targetUserId.toString()) {
        visibilityFilter = ['public', 'followers', 'private'];
      } else {
        const isFollowing = await Follow.isFollowing(requesterId, targetUserId);
        if (isFollowing) {
          visibilityFilter = ['public', 'followers'];
        }
      }
    }

    const query = {
      user: targetUserId,
      isDeleted: false,
      visibility: { $in: visibilityFilter },
    };

    const [posts, total] = await Promise.all([
      Post.find(query)
        .populate('user', 'username name avatar verified')
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      Post.countDocuments(query),
    ]);

    let postsWithStatus = posts;
    if (requesterId) {
      postsWithStatus = await this._addUserStatus(posts, requesterId);
    }

    return {
      posts: postsWithStatus,
      total,
      hasMore: page * limit < total,
    };
  }

  static async _addUserStatus(posts, userId) {
    const postIds = posts.map(p => p._id);

    const [likes, saves] = await Promise.all([
      Like.find({ user: userId, post: { $in: postIds } })
        .select('post')
        .lean(),
      SavePost.find({ user: userId, post: { $in: postIds } })
        .select('post')
        .lean(),
    ]);

    const likedSet = new Set(likes.map(l => l.post.toString()));
    const savedSet = new Set(saves.map(s => s.post.toString()));

    return posts.map(post => ({
      ...post,
      isLiked: likedSet.has(post._id.toString()),
      isSaved: savedSet.has(post._id.toString()),
    }));
  }

  // ======================================
  // Feed & Discovery
  // ======================================

  static async getHomeFeed(userId, options = {}) {
    const { page = 1, limit = 20 } = options;

    const settings = await UserSettings.findOne({ user: userId })
      .select('blockedUsers mutedUsers content')
      .lean();

    const [following, blockedUsers, mutedUsers] = await Promise.all([
      Follow.getFollowingIds(userId),
      settings?.blockedUsers || [],
      settings?.mutedUsers || [],
    ]);

    const excludeUsers = [...blockedUsers, ...mutedUsers].map(id =>
      id.toString()
    );
    const feedUsers = [...following, userId].filter(
      id => !excludeUsers.includes(id.toString())
    );

    const query = {
      user: { $in: feedUsers },
      isDeleted: false,
      $or: [
        { user: userId },
        { visibility: 'public' },
        { visibility: 'followers' },
      ],
    };

    const posts = await Post.find(query)
      .populate('user', 'username name avatar verified')
      .sort({ createdAt: -1, engagementScore: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean();

    const postsWithStatus = await this._addUserStatus(posts, userId);

    return {
      posts: postsWithStatus,
      hasMore: posts.length === limit,
    };
  }

  static async getExploreFeed(userId, options = {}) {
    const { page = 1, limit = 20 } = options;

    const settings = await UserSettings.findOne({ user: userId })
      .select('blockedUsers mutedUsers')
      .lean();

    const excludeUsers = [
      userId,
      ...(settings?.blockedUsers || []),
      ...(settings?.mutedUsers || []),
    ];

    const query = {
      user: { $nin: excludeUsers },
      isDeleted: false,
      visibility: 'public',
      'moderation.status': 'approved',
    };

    const posts = await Post.find(query)
      .populate('user', 'username name avatar verified')
      .sort({ trendingScore: -1, engagementScore: -1, createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean();

    const postsWithStatus = await this._addUserStatus(posts, userId);

    return {
      posts: postsWithStatus,
      hasMore: posts.length === limit,
    };
  }

  static async getPersonalizedFeed(userId, options = {}) {
    const { page = 1, limit = 20 } = options;

    const user = await User.findById(userId).select('interests').lean();

    const recentInteractions = await UserInteraction.find({
      user: userId,
      interactionType: { $in: ['like', 'comment', 'share', 'save'] },
      createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
    })
      .sort({ weight: -1 })
      .limit(50)
      .lean();

    const interactedPostIds = recentInteractions
      .filter(i => i.targetType === 'post')
      .map(i => i.targetId);

    const interactedPosts = await Post.find({ _id: { $in: interactedPostIds } })
      .select('hashtags')
      .lean();

    const interestTags = new Set();
    interactedPosts.forEach(post => {
      post.hashtags?.forEach(h => interestTags.add(h.tag));
    });
    user?.interests?.forEach(interest =>
      interestTags.add(interest.toLowerCase())
    );

    const settings = await UserSettings.findOne({ user: userId })
      .select('blockedUsers mutedUsers')
      .lean();

    const excludeUsers = [
      userId,
      ...(settings?.blockedUsers || []),
      ...(settings?.mutedUsers || []),
    ];

    const query = {
      user: { $nin: excludeUsers },
      isDeleted: false,
      visibility: 'public',
      'moderation.status': 'approved',
    };

    if (interestTags.size > 0) {
      query['hashtags.tag'] = { $in: [...interestTags] };
    }

    const posts = await Post.find(query)
      .populate('user', 'username name avatar verified')
      .sort({ qualityScore: -1, engagementScore: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean();

    const postsWithStatus = await this._addUserStatus(posts, userId);

    return {
      posts: postsWithStatus,
      hasMore: posts.length === limit,
    };
  }

  static async getTrendingPosts(options = {}) {
    const { page = 1, limit = 20, timeframe = 'day' } = options;

    const timeframeDays = { day: 1, week: 7, month: 30 };
    const days = timeframeDays[timeframe] || 1;
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const posts = await Post.find({
      isDeleted: false,
      visibility: 'public',
      'moderation.status': 'approved',
      createdAt: { $gte: startDate },
    })
      .populate('user', 'username name avatar verified')
      .sort({ trendingScore: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean();

    return {
      posts,
      hasMore: posts.length === limit,
    };
  }

  // ======================================
  // Search
  // ======================================

  static async searchPosts(query, userId = null, options = {}) {
    const { page = 1, limit = 20 } = options;

    if (!query || query.trim().length < 2) {
      return { posts: [], total: 0 };
    }

    let excludeUsers = [];
    if (userId) {
      const settings = await UserSettings.findOne({ user: userId })
        .select('blockedUsers mutedUsers')
        .lean();
      excludeUsers = [
        ...(settings?.blockedUsers || []),
        ...(settings?.mutedUsers || []),
      ];
    }

    const searchQuery = {
      isDeleted: false,
      visibility: 'public',
      'moderation.status': 'approved',
      user: { $nin: excludeUsers },
      $or: [
        { caption: { $regex: query, $options: 'i' } },
        { 'hashtags.tag': { $regex: query.replace('#', ''), $options: 'i' } },
      ],
    };

    const [posts, total] = await Promise.all([
      Post.find(searchQuery)
        .populate('user', 'username name avatar verified')
        .sort({ engagementScore: -1, createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      Post.countDocuments(searchQuery),
    ]);

    let postsWithStatus = posts;
    if (userId) {
      postsWithStatus = await this._addUserStatus(posts, userId);
    }

    return { posts: postsWithStatus, total, hasMore: page * limit < total };
  }

  static async getPostsByHashtag(hashtag, userId = null, options = {}) {
    const { page = 1, limit = 20 } = options;

    const tag = hashtag.replace('#', '').toLowerCase();

    await retryOperation(() =>
      Hashtag.findOneAndUpdate({ name: tag }, { $inc: { searchCount: 1 } })
    );

    let excludeUsers = [];
    if (userId) {
      const settings = await UserSettings.findOne({ user: userId })
        .select('blockedUsers mutedUsers')
        .lean();
      excludeUsers = [
        ...(settings?.blockedUsers || []),
        ...(settings?.mutedUsers || []),
      ];
    }

    const query = {
      'hashtags.tag': tag,
      isDeleted: false,
      visibility: 'public',
      'moderation.status': 'approved',
      user: { $nin: excludeUsers },
    };

    const [posts, total] = await Promise.all([
      Post.find(query)
        .populate('user', 'username name avatar verified')
        .sort({ engagementScore: -1, createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      Post.countDocuments(query),
    ]);

    let postsWithStatus = posts;
    if (userId) {
      postsWithStatus = await this._addUserStatus(posts, userId);
    }

    return { posts: postsWithStatus, total, hasMore: page * limit < total };
  }

  static async getTrendingHashtags(limit = 10) {
    return Hashtag.getTrending(limit);
  }

  // ======================================
  // Like System
  // ======================================

  static async likePost(postId, userId) {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const post = await Post.findOne({
        _id: postId,
        isDeleted: false,
      }).session(session);
      if (!post) {
        throw new Error('Post not found');
      }

      const existingLike = await Like.findOne({
        user: userId,
        post: postId,
      }).session(session);
      if (existingLike) {
        await session.commitTransaction();
        return { success: true, alreadyLiked: true };
      }

      await Like.create([{ user: userId, post: postId, targetType: 'post' }], {
        session,
      });

      await Post.findByIdAndUpdate(postId, { $inc: { likesCount: 1 } }).session(
        session
      );

      await UserInteraction.record({
        user: userId,
        targetType: 'post',
        targetId: postId,
        interactionType: 'like',
      });

      if (post.user.toString() !== userId) {
        const sender = await User.findById(userId).select('username').lean();
        await Notification.createNotification({
          recipient: post.user,
          sender: userId,
          type: 'like',
          relatedPost: postId,
          content: `${sender.username} đã thích bài viết của bạn`,
          groupKey: `like_${postId}`,
        });
      }

      await session.commitTransaction();
      return { success: true };
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }

  static async unlikePost(postId, userId) {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const like = await Like.findOneAndDelete({
        user: userId,
        post: postId,
      }).session(session);

      if (!like) {
        await session.commitTransaction();
        return { success: true, wasNotLiked: true };
      }

      await Post.findByIdAndUpdate(postId, {
        $inc: { likesCount: -1 },
      }).session(session);

      await session.commitTransaction();
      return { success: true };
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }

  static async getPostLikes(postId, options = {}) {
    const { page = 1, limit = 50 } = options;

    const likes = await Like.find({ post: postId, targetType: 'post' })
      .populate('user', 'username name avatar verified')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean();

    return likes.map(l => l.user);
  }

  // ======================================
  // Save System
  // ======================================

  static async savePost(postId, userId, collection = 'default') {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const post = await Post.findOne({
        _id: postId,
        isDeleted: false,
      }).session(session);
      if (!post) {
        throw new Error('Post not found');
      }

      const existingSave = await SavePost.findOne({
        user: userId,
        post: postId,
      }).session(session);
      if (existingSave) {
        if (existingSave.collection !== collection) {
          existingSave.collection = collection;
          await existingSave.save({ session });
        }
        await session.commitTransaction();
        return { success: true, alreadySaved: true };
      }

      await SavePost.create([{ user: userId, post: postId, collection }], {
        session,
      });

      await Post.findByIdAndUpdate(postId, { $inc: { savesCount: 1 } }).session(
        session
      );

      await UserInteraction.record({
        user: userId,
        targetType: 'post',
        targetId: postId,
        interactionType: 'save',
      });

      await session.commitTransaction();
      return { success: true };
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }

  static async unsavePost(postId, userId) {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const save = await SavePost.findOneAndDelete({
        user: userId,
        post: postId,
      }).session(session);

      if (!save) {
        await session.commitTransaction();
        return { success: true, wasNotSaved: true };
      }

      await Post.findByIdAndUpdate(postId, {
        $inc: { savesCount: -1 },
      }).session(session);

      await session.commitTransaction();
      return { success: true };
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }

  static async getSavedPosts(userId, options = {}) {
    const { page = 1, limit = 20, collection } = options;

    const query = { user: userId };
    if (collection) {
      query.collection = collection;
    }

    const saved = await SavePost.find(query)
      .populate({
        path: 'post',
        match: { isDeleted: false },
        populate: { path: 'user', select: 'username name avatar verified' },
      })
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean();

    const posts = saved
      .filter(s => s.post)
      .map(s => ({
        ...s.post,
        savedAt: s.createdAt,
        collection: s.collection,
      }));

    return {
      posts,
      hasMore: posts.length === limit,
    };
  }

  static async getSavedCollections(userId) {
    return SavePost.getCollections(userId);
  }

  // ======================================
  // Comment System
  // ======================================

  static async addComment(postId, userId, content, parentCommentId = null) {
    // Verify post exists first
    const post = await Post.findOne({
      _id: postId,
      isDeleted: false,
    }).lean();

    if (!post) {
      throw new Error('Post not found');
    }

    let depth = 0;
    let rootComment = null;

    if (parentCommentId) {
      const parentComment = await Comment.findById(parentCommentId).lean();
      if (!parentComment || parentComment.isDeleted) {
        throw new Error('Parent comment not found');
      }
      depth = Math.min(parentComment.depth + 1, 3);
      rootComment = parentComment.rootComment || parentComment._id;
    }

    // Create comment - atomic operation
    const comment = await Comment.create({
      post: postId,
      user: userId,
      content,
      parentComment: parentCommentId,
      rootComment,
      depth,
    });

    // Update counters using atomic operations with retry
    // Note: Post commentsCount is updated via Comment model post-save hook
    // We only need to update parent reply count if this hook doesn't handle it well for parents
    // But wait, the hook DOES handle parent repliesCount too.
    // However, keeping the retry logic for parent might be safer if we want to ensure it?
    // Actually, the hook does: if (doc.parentComment) { increment repliesCount }
    // So both are doubled if we don't be careful.

    // Let's remove BOTH manual updates as the Hook handles both.

    /* 
    The Hook in Comment.js:
    if (doc.parentComment) { updateOne(parent, $inc repliesCount) }
    updateOne(post, $inc commentsCount)
    */

    // Record interaction (non-critical, fire and forget with retry)
    retryOperation(() =>
      UserInteraction.record({
        user: userId,
        targetType: 'post',
        targetId: postId,
        interactionType: 'comment',
      })
    ).catch(err => logger.warn(`Failed to record interaction: ${err.message}`));

    // Send notification (non-critical)
    const notifyUserId = parentCommentId
      ? (await Comment.findById(parentCommentId).select('user').lean())?.user
      : post.user;

    if (notifyUserId && notifyUserId.toString() !== userId) {
      const sender = await User.findById(userId).select('username').lean();
      Notification.createNotification({
        recipient: notifyUserId,
        sender: userId,
        type: parentCommentId ? 'reply' : 'comment',
        relatedPost: postId,
        relatedComment: comment._id,
        content: parentCommentId
          ? `${sender.username} đã trả lời bình luận của bạn`
          : `${sender.username} đã bình luận bài viết của bạn`,
        groupKey: `comment_${postId}`,
      }).catch(err =>
        logger.warn(`Failed to create notification: ${err.message}`)
      );
    }

    // Return populated comment
    const populatedComment = await Comment.findById(comment._id)
      .populate('user', 'username name avatar verified')
      .lean();

    return populatedComment;
  }

  static async getComments(postId, options = {}) {
    const { page = 1, limit = 20, sort = 'best' } = options;

    // Use Comment Model's specialized method for fetching nested comments
    // This supports fetching top-level comments and their replies
    const comments = await Comment.getCommentsForPost(postId, {
      page,
      limit,
      sortBy: sort === 'best' ? 'likesCount' : 'createdAt',
      includeReplies: true,
      replyLimit: 3,
    });

    // Count top-level comments for pagination check
    const totalTopLevel = await Comment.countDocuments({
      post: postId,
      parentComment: null,
      isDeleted: false,
      'moderation.status': 'approved',
    });

    return {
      comments,
      hasMore: page * limit < totalTopLevel,
    };
  }

  static async getCommentReplies(commentId, options = {}) {
    const { page = 1, limit = 10 } = options;

    const replies = await Comment.find({
      parentComment: commentId,
      isDeleted: false,
    })
      .populate('user', 'username name avatar verified')
      .sort({ createdAt: 1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean();

    return {
      replies,
      hasMore: replies.length === limit,
    };
  }

  static async deleteComment(commentId, userId, isAdmin = false) {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const query = isAdmin
        ? { _id: commentId }
        : { _id: commentId, user: userId };
      const comment = await Comment.findOne(query).session(session);

      if (!comment) {
        throw new Error('Comment not found or unauthorized');
      }

      comment.isDeleted = true;
      await comment.save({ session });

      await Post.findByIdAndUpdate(comment.post, {
        $inc: { commentsCount: -1 },
      }).session(session);

      if (comment.parentComment) {
        await Comment.findByIdAndUpdate(comment.parentComment, {
          $inc: { repliesCount: -1 },
        }).session(session);
      }

      await session.commitTransaction();
      return comment;
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }

  static async updateComment(commentId, userId, content) {
    const comment = await Comment.findOne({
      _id: commentId,
      user: userId,
      isDeleted: false,
    });

    if (!comment) {
      throw new Error('Comment not found or unauthorized');
    }

    comment.content = content.trim();
    comment.isEdited = true;
    comment.editedAt = new Date();
    await comment.save();

    const populatedComment = await Comment.findById(comment._id)
      .populate('user', 'username name avatar verified')
      .lean();

    return populatedComment;
  }

  static async likeComment(commentId, userId) {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const comment = await Comment.findOne({
        _id: commentId,
        isDeleted: false,
      }).session(session);
      if (!comment) {
        throw new Error('Comment not found');
      }

      const existingLike = await Like.findOne({
        user: userId,
        comment: commentId,
        targetType: 'comment',
      }).session(session);

      if (existingLike) {
        await session.commitTransaction();
        return { success: true, alreadyLiked: true };
      }

      await Like.create(
        [
          {
            user: userId,
            comment: commentId,
            targetType: 'comment',
          },
        ],
        { session }
      );

      await Comment.findByIdAndUpdate(commentId, {
        $inc: { likesCount: 1 },
      }).session(session);

      await session.commitTransaction();
      return { success: true };
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }

  static async unlikeComment(commentId, userId) {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const like = await Like.findOneAndDelete({
        user: userId,
        comment: commentId,
        targetType: 'comment',
      }).session(session);

      if (!like) {
        await session.commitTransaction();
        return { success: true, wasNotLiked: true };
      }

      await Comment.findByIdAndUpdate(commentId, {
        $inc: { likesCount: -1 },
      }).session(session);

      await session.commitTransaction();
      return { success: true };
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }

  // ======================================
  // Share System
  // ======================================

  static async sharePost(postId, userId, platform = 'internal') {
    const post = await Post.findOne({ _id: postId, isDeleted: false });
    if (!post) {
      throw new Error('Post not found');
    }

    await Post.findByIdAndUpdate(postId, { $inc: { sharesCount: 1 } });

    await UserInteraction.record({
      user: userId,
      targetType: 'post',
      targetId: postId,
      interactionType: 'share',
      metadata: { platform },
    });

    if (post.user.toString() !== userId) {
      const sender = await User.findById(userId).select('username').lean();
      await Notification.createNotification({
        recipient: post.user,
        sender: userId,
        type: 'share',
        relatedPost: postId,
        content: `${sender.username} đã chia sẻ bài viết của bạn`,
      });
    }

    return { success: true };
  }

  // ======================================
  // Ranking & Scoring Methods
  // ======================================

  static async updatePostScores(postId) {
    const post = await Post.findById(postId);
    if (post) {
      post.calculateEngagementScore();
      post.calculateTrendingScore();
      await post.save();
    }
  }

  static async batchUpdateScores() {
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const posts = await Post.find({
      isDeleted: false,
      $or: [
        { createdAt: { $gte: twentyFourHoursAgo } },
        { lastActivityAt: { $gte: twentyFourHoursAgo } },
      ],
    });

    for (const post of posts) {
      post.calculateEngagementScore();
      post.calculateTrendingScore();
      await post.save();
    }

    logger.info(`Updated scores for ${posts.length} posts`);
  }

  // ======================================
  // Report System (Basic)
  // ======================================

  static async reportPost(postId, userId, reason, description = '') {
    const Report = (await import('../models/Report.js')).default;

    const post = await Post.findOne({ _id: postId, isDeleted: false });
    if (!post) {
      throw new Error('Post not found');
    }

    const existingReport = await Report.findOne({
      reporter: userId,
      targetType: 'post',
      targetId: postId,
      status: { $in: ['pending', 'reviewing'] },
    });

    if (existingReport) {
      throw new Error('You have already reported this post');
    }

    const report = await Report.create({
      reporter: userId,
      targetType: 'post',
      targetId: postId,
      targetUser: post.user,
      category: reason,
      reason,
      description,
      contentSnapshot: {
        caption: post.caption,
        media: post.media,
      },
    });

    return report;
  }

  // ======================================
  // Media Upload
  // ======================================

  static async uploadMedia(files, userId) {
    // Files are already uploaded by multer-storage-cloudinary middleware
    // We just need to map them to our schema structure
    const fileArray = Array.isArray(files) ? files : [files];
    const uploadedMedia = fileArray.map(file => {
      const resourceType = file.mimetype?.startsWith('video/')
        ? 'video'
        : 'image';

      return {
        url: file.path, // Cloudinary URL from multer
        type: resourceType,
        publicId: file.filename, // Cloudinary Public ID from multer
      };
    });

    return uploadedMedia;
  }

  // ======================================
  // Backward Compatibility Aliases
  // ======================================

  static async getFollowingPosts(userId, page = 1, limit = 10) {
    return this.getHomeFeed(userId, { page, limit });
  }

  static async getFeedPosts(userId, page = 1, limit = 20) {
    return this.getHomeFeed(userId, { page, limit });
  }

  static async getPostsByUser(userId, options = {}) {
    return this.getUserPosts(userId, null, options);
  }

  static async toggleLike(postId, userId) {
    const existingLike = await Like.findOne({ user: userId, post: postId });
    if (existingLike) {
      await this.unlikePost(postId, userId);
      return { liked: false };
    } else {
      await this.likePost(postId, userId);
      return { liked: true };
    }
  }
}

export default PostService;
