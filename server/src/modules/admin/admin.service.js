import mongoose from 'mongoose';
import User from '../../models/User.js';
import Post from '../../models/Post.js';
import Comment from '../../models/Comment.js';
import Report from '../../models/Report.js';
import RefreshToken from '../../models/RefreshToken.js';
import UserSettings from '../../models/UserSettings.js';
import Notification from '../../models/Notification.js';
import logger from '../../configs/logger.js';
import ApiError from '../../helpers/ApiError.js';
import { escapeRegExp } from '../../utils/escapeRegExp.js';

import Like from '../../models/Like.js';
import Follow from '../../models/Follow.js';
import SavePost from '../../models/SavePost.js';
import UserInteraction from '../../models/UserInteraction.js';

const POST_ACTION_ALIASES = {
  delete: 'remove',
  unhide: 'approve',
  unflag: 'approve',
};

const COMMENT_ACTION_ALIASES = {
  hide: 'remove',
  delete: 'remove',
  unhide: 'approve',
};

const REVIEW_ACTION_TO_RESOLUTION = {
  dismiss: { decision: 'rejected', actionTaken: null },
  warn: { decision: 'resolved', actionTaken: 'warn_user' },
  hide_content: { decision: 'resolved', actionTaken: 'remove_content' },
  remove_content: { decision: 'resolved', actionTaken: 'remove_content' },
  suspend_user: { decision: 'resolved', actionTaken: 'suspend_user' },
  ban_user: { decision: 'resolved', actionTaken: 'ban_user' },
};

const LEGACY_RESOLUTION_TO_REVIEW = {
  dismissed: { decision: 'rejected', actionTaken: null },
  content_removed: { decision: 'resolved', actionTaken: 'remove_content' },
  user_warned: { decision: 'resolved', actionTaken: 'warn_user' },
  user_suspended: { decision: 'resolved', actionTaken: 'suspend_user' },
  user_banned: { decision: 'resolved', actionTaken: 'ban_user' },
};

const INTERACTION_TYPE_TO_STATS_KEY = {
  like: 'likes',
  comment: 'comments',
  follow: 'follows',
  save: 'saves',
  share: 'shares',
  report: 'reports',
};

/**
 * Admin Service - Refactored for new model structure
 *
 * Key Changes:
 * 1. Uses moderation.status instead of moderation.isBanned
 * 2. Integrates with Report model for content moderation
 * 3. Better analytics with denormalized counters
 * 4. Audit logging for admin actions
 */
class AdminService {
  /**
   * Get list of all users with pagination and filters
   * @param {Object} options - Options {page, limit, search, status, sortBy, sortOrder}
   * @returns {Promise<{users: Array, total: number, page: number, totalPages: number, hasMore: boolean}>}
   */
  static async getAllUsers(options = {}) {
    const {
      page = 1,
      limit = 20,
      search,
      status,
      role,
      sortBy = 'createdAt',
      sortOrder = -1,
    } = options;

    const query = {};

    if (search) {
      const safePattern = escapeRegExp(search.trim());
      query.$or = [
        { username: { $regex: safePattern, $options: 'i' } },
        { name: { $regex: safePattern, $options: 'i' } },
        { email: { $regex: safePattern, $options: 'i' } },
      ];
    }

    if (status) {
      query['moderation.status'] = status;
    }

    if (role) {
      if (role === 'admin' || role === 'moderator') {
        query.isAdmin = true;
      } else if (role === 'user') {
        query.isAdmin = false;
      }
    }

    const sortOptions = {};
    const userSortFieldMap = {
      lastLogin: 'lastLoginAt',
    };
    sortOptions[userSortFieldMap[sortBy] || sortBy] = sortOrder;

    const [users, total] = await Promise.all([
      User.find(query)
        .select('-loginAttempts -security')
        .sort(sortOptions)
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      User.countDocuments(query),
    ]);

    return {
      users,
      total,
      page,
      totalPages: Math.ceil(total / limit),
      hasMore: page * limit < total,
    };
  }

  /**
   * Get detailed user information by ID (including settings and reports)
   * @param {string} userId - User ID
   * @returns {Promise<Object>} User object with settings and recent reports
   * @throws {Error} If user not found
   */
  static async getUserById(userId) {
    const user = await User.findById(userId).select('-loginAttempts').lean();

    if (!user) {
      throw ApiError.notFound('User not found');
    }

    const settings = await UserSettings.findOne({ user: userId }).lean();

    const recentReports = await Report.find({
      targetUser: userId,
      status: { $in: ['pending', 'reviewing'] },
    })
      .sort({ createdAt: -1 })
      .limit(5)
      .lean();

    return {
      ...user,
      settings,
      recentReports,
      reportsCount: recentReports.length,
    };
  }

  /**
   * Get list of posts by user
   * @param {string} userId - User ID
   * @param {Object} options - Pagination options {page, limit}
   * @returns {Promise<{posts: Array, total: number, page: number, totalPages: number, hasMore: boolean}>}
   */
  static async getUserPosts(userId, options = {}) {
    const { page = 1, limit = 20 } = options;

    const [posts, total] = await Promise.all([
      Post.find({ user: userId })
        .populate('user', 'username name avatar verified')
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      Post.countDocuments({ user: userId }),
    ]);

    return {
      posts,
      total,
      page,
      totalPages: Math.ceil(total / limit),
      hasMore: page * limit < total,
    };
  }

  /**
   * Get list of reports about user
   * @param {string} userId - User ID
   * @param {Object} options - Pagination options {page, limit}
   * @returns {Promise<{reports: Array, total: number, page: number, totalPages: number, hasMore: boolean}>}
   */
  static async getUserReports(userId, options = {}) {
    const { page = 1, limit = 20 } = options;

    const [reports, total] = await Promise.all([
      Report.find({ targetUser: userId })
        .populate('reporter', 'username name avatar')
        .populate('targetUser', 'username name avatar')
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      Report.countDocuments({ targetUser: userId }),
    ]);

    return {
      reports,
      total,
      page,
      totalPages: Math.ceil(total / limit),
      hasMore: page * limit < total,
    };
  }

  /**
   * Get list of reports about post
   * @param {string} postId - Post ID
   * @param {Object} options - Pagination options {page, limit}
   * @returns {Promise<{reports: Array, total: number, page: number, totalPages: number, hasMore: boolean}>}
   */
  static async getPostReports(postId, options = {}) {
    const { page = 1, limit = 20 } = options;

    const [reports, total] = await Promise.all([
      Report.find({ targetId: postId, targetType: 'post' })
        .populate('reporter', 'username name avatar')
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      Report.countDocuments({ targetId: postId, targetType: 'post' }),
    ]);

    return {
      reports,
      total,
      page,
      totalPages: Math.ceil(total / limit),
      hasMore: page * limit < total,
    };
  }

  /**
   * Update user information (admin action)
   * @param {string} userId - User ID
   * @param {Object} updateData - Update data
   * @param {string} adminId - Admin ID performing the action
   * @returns {Promise<Object>} Updated user object
   * @throws {Error} If user not found
   */
  static async updateUser(userId, updateData, adminId) {
    const { password, email, ...safeData } = updateData;
    const normalizedData = { ...safeData };

    if (typeof normalizedData.isVerified === 'boolean') {
      normalizedData.verified = normalizedData.isVerified;
      delete normalizedData.isVerified;
    }

    if (typeof normalizedData.role === 'string') {
      if (normalizedData.role === 'admin' || normalizedData.role === 'moderator') {
        normalizedData.isAdmin = true;
      } else if (normalizedData.role === 'user') {
        normalizedData.isAdmin = false;
      }
      delete normalizedData.role;
    }

    if (normalizedData.status) {
      normalizedData['moderation.status'] = normalizedData.status;
      delete normalizedData.status;
    }

    const user = await User.findByIdAndUpdate(
      userId,
      { $set: normalizedData },
      { new: true }
    ).select('-loginAttempts -security');

    if (!user) {
      throw ApiError.notFound('User not found');
    }

    await this._logAdminAction(adminId, 'update_user', 'user', userId, {
      updateData: normalizedData,
    });

    return user;
  }

  /**
   * Permanently ban user
   * @param {string} userId - User ID
   * @param {string} adminId - Admin ID performing the action
   * @param {string} reason - Ban reason
   * @returns {Promise<Object>} Updated user object
   * @throws {Error} If user not found
   */
  static async banUser(userId, adminId, reason = 'Violation of terms') {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const user = await User.findByIdAndUpdate(
        userId,
        {
          $set: {
            'moderation.status': 'banned',
            'moderation.reason': reason,
            'moderation.moderatedBy': adminId,
            'moderation.moderatedAt': new Date(),
          },
        },
        { new: true, session }
      );

      if (!user) {
        throw ApiError.notFound('User not found');
      }

      await RefreshToken.updateMany(
        { user: userId },
        { isRevoked: true, revokedReason: 'user_banned' }
      ).session(session);

      await this._logAdminAction(adminId, 'ban_user', 'user', userId, {
        reason,
      });

      await session.commitTransaction();

      logger.info(`User ${userId} banned by admin ${adminId}`);

      return user;
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }

  /**
   * Unban user
   * @param {string} userId - User ID
   * @param {string} adminId - Admin ID performing the action
   * @returns {Promise<Object>} Updated user object
   * @throws {Error} If user not found
   */
  static async unbanUser(userId, adminId) {
      const user = await User.findByIdAndUpdate(
        userId,
        {
          $set: {
            'moderation.status': 'active',
            'moderation.reason': null,
            'moderation.suspendedUntil': null,
            'moderation.expiresAt': null,
            'moderation.moderatedBy': adminId,
            'moderation.moderatedAt': new Date(),
          },
        },
      { new: true }
    );

    if (!user) {
      throw ApiError.notFound('User not found');
    }

    await this._logAdminAction(adminId, 'unban_user', 'user', userId);

    logger.info(`User ${userId} unbanned by admin ${adminId}`);

    return user;
  }

  /**
   * Temporarily suspend user for a period of time
   * @param {string} userId - User ID
   * @param {string} adminId - Admin ID performing the action
   * @param {number} days - Number of days to suspend
   * @param {string} reason - Suspension reason
   * @returns {Promise<Object>} Updated user object
   * @throws {Error} If user not found
   */
  static async suspendUser(
    userId,
    adminId,
    days = 7,
    reason = 'Temporary suspension'
  ) {
    const suspendedUntil = new Date(Date.now() + days * 24 * 60 * 60 * 1000);

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const user = await User.findByIdAndUpdate(
        userId,
        {
          $set: {
            'moderation.status': 'suspended',
            'moderation.reason': reason,
            'moderation.suspendedUntil': suspendedUntil,
            'moderation.expiresAt': suspendedUntil,
            'moderation.moderatedBy': adminId,
            'moderation.moderatedAt': new Date(),
          },
        },
        { new: true, session }
      );

      if (!user) {
        throw ApiError.notFound('User not found');
      }

      await RefreshToken.updateMany(
        { user: userId },
        { isRevoked: true, revokedReason: 'user_suspended' }
      ).session(session);

      await Notification.create(
        [
          {
            recipient: userId,
            sender: adminId,
            type: 'system',
            content: `Tài khoản của bạn đã bị tạm khóa ${days} ngày. Lý do: ${reason}`,
          },
        ],
        { session }
      );

      await this._logAdminAction(adminId, 'suspend_user', 'user', userId, {
        days,
        reason,
      });

      await session.commitTransaction();

      return user;
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }

  /**
   * Send warning to user
   * @param {string} userId - User ID
   * @param {string} adminId - Admin ID performing the action
   * @param {string} reason - Warning reason
   * @returns {Promise<Object>} Updated user object
   * @throws {Error} If user not found
   */
  static async warnUser(userId, adminId, reason) {
    const user = await User.findByIdAndUpdate(
      userId,
      {
        $inc: { 'moderation.warnings': 1 },
        $set: {
          'moderation.status': 'warned',
          'moderation.lastWarningAt': new Date(),
          'moderation.moderatedBy': adminId,
        },
      },
      { new: true }
    );

    if (!user) {
      throw ApiError.notFound('User not found');
    }

    await Notification.create({
      recipient: userId,
      sender: adminId,
      type: 'system',
      content: `Bạn đã nhận được cảnh báo từ quản trị viên. Lý do: ${reason}`,
    });

    await this._logAdminAction(adminId, 'warn_user', 'user', userId, {
      reason,
    });

    if (user.moderation.warnings >= 3) {
      await this.suspendUser(userId, adminId, 3, 'Nhận quá nhiều cảnh báo');
    }

    return user;
  }
  /**
   * Get list of all posts with pagination and filters
   * @param {Object} options - Options {page, limit, status, sortBy, sortOrder}
   * @returns {Promise<{posts: Array, total: number, page: number, totalPages: number, hasMore: boolean}>}
   */
  static async getAllPosts(options = {}) {
    const {
      page = 1,
      limit = 20,
      status,
      type,
      sortBy = 'createdAt',
      sortOrder = -1,
    } = options;

    const query = {};

    if (status) {
      switch (status) {
        case 'active':
        case 'approved':
          query.isDeleted = false;
          query['moderation.status'] = 'approved';
          break;
        case 'flagged':
          query.isDeleted = false;
          query['moderation.status'] = 'flagged';
          break;
        case 'pending':
        case 'rejected':
          query.isDeleted = false;
          query['moderation.status'] = status;
          break;
        case 'hidden':
        case 'removed':
        case 'deleted':
          query.isDeleted = true;
          break;
        default:
          query['moderation.status'] = status;
      }
    } else {
      query.isDeleted = false;
    }

    if (type === 'text') {
      query.$or = [{ media: { $exists: false } }, { media: { $size: 0 } }];
    } else if (type === 'image') {
      query.$and = [
        { media: { $elemMatch: { type: 'image' } } },
        { media: { $not: { $elemMatch: { type: 'video' } } } },
      ];
    } else if (type === 'video') {
      query.$and = [
        { media: { $elemMatch: { type: 'video' } } },
        { media: { $not: { $elemMatch: { type: 'image' } } } },
      ];
    } else if (type === 'mixed') {
      query.$and = [
        { media: { $elemMatch: { type: 'image' } } },
        { media: { $elemMatch: { type: 'video' } } },
      ];
    }

    const sortOptions = {};
    const postSortFieldMap = {
      likes: 'likesCount',
      comments: 'commentsCount',
    };
    sortOptions[postSortFieldMap[sortBy] || sortBy] = sortOrder;

    const [posts, total] = await Promise.all([
      Post.find(query)
        .populate('user', 'username name avatar verified')
        .sort(sortOptions)
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      Post.countDocuments(query),
    ]);

    return {
      posts,
      total,
      page,
      totalPages: Math.ceil(total / limit),
      hasMore: page * limit < total,
    };
  }

  /**
   * Moderate post
   * @param {string} postId - Post ID
   * @param {string} adminId - Admin ID performing the action
   * @param {string} action - Action (approve, reject, flag, remove, hide)
   * @param {string} reason - Reason
   * @returns {Promise<Object>} Updated post object
   * @throws {Error} If action is invalid or post not found
   */
  static async moderatePost(postId, adminId, action, reason = '') {
    const normalizedAction = POST_ACTION_ALIASES[action] || action;
    const validActions = ['approve', 'reject', 'flag', 'remove', 'hide'];

    if (!validActions.includes(normalizedAction)) {
      throw ApiError.badRequest('Invalid moderation action');

    }

    const statusMap = {
      approve: 'approved',
      reject: 'rejected',
      flag: 'flagged',
      remove: 'removed',
      hide: 'removed',
    };

    const existingPost = await Post.findById(postId).select('isDeleted user').lean();
    if (!existingPost) {
      throw ApiError.notFound('Post not found');
    }

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const updateData = {
        'moderation.status': statusMap[normalizedAction],
        'moderation.reviewedBy': adminId,
        'moderation.reviewedAt': new Date(),
      };

      if (reason) {
        updateData['moderation.reason'] = reason;
      }

      if (normalizedAction === 'remove' || normalizedAction === 'hide') {
        updateData.isDeleted = true;
      } else if (normalizedAction === 'approve') {
        updateData.isDeleted = false;
      }

      const post = await Post.findByIdAndUpdate(
        postId,
        { $set: updateData },
        { new: true, session }
      ).populate('user', 'username name avatar');

      if (!post) {
        throw ApiError.notFound('Post not found');

      }

      const wasDeleted = Boolean(existingPost.isDeleted);
      const isNowRemoved =
        normalizedAction === 'remove' || normalizedAction === 'hide';
      const isNowRestored = normalizedAction === 'approve' && wasDeleted;

      if (isNowRemoved && !wasDeleted) {
        await User.findByIdAndUpdate(post.user._id, {
          $inc: { postsCount: -1 },
        }).session(session);

        await Notification.create(
          [
            {
              recipient: post.user._id,
              sender: adminId,
              type: 'system',
              content: `Bài viết của bạn đã bị ${
                normalizedAction === 'remove' || normalizedAction === 'hide'
                  ? 'gỡ bỏ'
                  : 'từ chối'
              }. Lý do: ${reason || 'Vi phạm quy định cộng đồng'}`,
            },
          ],
          { session }
        );
      } else if (isNowRestored) {
        await User.findByIdAndUpdate(post.user._id, {
          $inc: { postsCount: 1 },
        }).session(session);
      }

      await this._logAdminAction(
        adminId,
        `${normalizedAction}_post`,
        'post',
        postId,
        {
        reason,
        }
      );

      await session.commitTransaction();

      return post;
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }

  /**
   * Delete post (admin action)
   * @param {string} postId - Post ID
   * @param {string} adminId - Admin ID performing the action
   * @param {string} reason - Delete reason
   * @returns {Promise<Object>} Deleted post object
   */
  static async deletePost(postId, adminId, reason = 'Admin action') {
    return this.moderatePost(postId, adminId, 'remove', reason);
  }

  /**
   * Get list of all comments with pagination and filters
   * @param {Object} options - Options {page, limit, search, status, sortBy, sortOrder}
   * @returns {Promise<{comments: Array, total: number, page: number, totalPages: number, hasMore: boolean}>}
   */
  static async getAllComments(options = {}) {
    const {
      page = 1,
      limit = 20,
      search,
      status,
      sortBy = 'createdAt',
      sortOrder = -1,
    } = options;

    const query = {};

    if (search) {
      query.content = {
        $regex: escapeRegExp(search.trim()),
        $options: 'i',
      };
    }

    if (status) {
      switch (status) {
        case 'active':
        case 'approved':
          query.isDeleted = false;
          query['moderation.status'] = 'approved';
          break;
        case 'flagged':
        case 'pending':
          query.isDeleted = false;
          query['moderation.status'] = status;
          break;
        case 'hidden':
        case 'removed':
        case 'deleted':
          query.isDeleted = true;
          break;
        default:
          query.isDeleted = false;
      }
    } else {
      query.isDeleted = false;
    }

    const sortOptions = {};
    const commentSortFieldMap = {
      likes: 'likesCount',
      replies: 'repliesCount',
    };
    sortOptions[commentSortFieldMap[sortBy] || sortBy] = sortOrder;

    const [comments, total] = await Promise.all([
      Comment.find(query)
        .populate('user', 'username name avatar')
        .populate('post', 'caption')
        .sort(sortOptions)
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      Comment.countDocuments(query),
    ]);

    return {
      comments,
      total,
      page,
      totalPages: Math.ceil(total / limit),
      hasMore: page * limit < total,
    };
  }

  /**
   * Moderate comment
   * @param {string} commentId - Comment ID
   * @param {string} adminId - Admin ID performing the action
   * @param {string} action - Action (approve, remove)
   * @param {string} reason - Reason
   * @returns {Promise<Object>} Updated comment object
   * @throws {Error} If action is invalid or comment not found
   */
  static async moderateComment(commentId, adminId, action, reason = '') {
    const normalizedAction = COMMENT_ACTION_ALIASES[action] || action;
    const shouldRedactContent =
      normalizedAction === 'remove' && action !== 'hide' && action !== 'unhide';
    const validActions = ['approve', 'remove'];

    if (!validActions.includes(normalizedAction)) {
      throw ApiError.badRequest('Invalid moderation action');

    }

    const comment = await Comment.findById(commentId);

    if (!comment) {
      throw ApiError.notFound('Comment not found');

    }

    const wasDeleted = Boolean(comment.isDeleted);

    if (normalizedAction === 'remove') {
      comment.isDeleted = true;
      comment.moderation = {
        ...comment.moderation,
        status: 'removed',
        reason: reason || comment.moderation?.reason,
      };
      if (shouldRedactContent) {
        comment.content = '[Nội dung đã bị xóa bởi quản trị viên]';
      }
      await comment.save();

      if (!wasDeleted) {
        await Post.findByIdAndUpdate(comment.post, {
          $inc: { commentsCount: -1 },
        });
      }

      if (!wasDeleted) {
        await Notification.create({
          recipient: comment.user,
          sender: adminId,
          type: 'system',
          content: `Bình luận của bạn đã bị ${
            shouldRedactContent ? 'xóa' : 'ẩn'
          }. Lý do: ${
            reason || 'Vi phạm quy định cộng đồng'
          }`,
        });
      }
    } else if (normalizedAction === 'approve' && comment.isDeleted) {
      comment.isDeleted = false;
      comment.moderation = {
        ...comment.moderation,
        status: 'approved',
      };
      await comment.save();

      await Post.findByIdAndUpdate(comment.post, {
        $inc: { commentsCount: 1 },
      });
    }

    await this._logAdminAction(
      adminId,
      `${normalizedAction}_comment`,
      'comment',
      commentId,
      { reason }
    );

    return comment;
  }

  /**
   * Get list of reports with pagination and filters
   * @param {Object} options - Options {page, limit, status, category, priority}
   * @returns {Promise<{reports: Array, total: number, page: number, totalPages: number, hasMore: boolean}>}
   */
  static async getReports(options = {}) {
    const {
      page = 1,
      limit = 20,
      status,
      category,
      targetType,
      priority,
      sortBy = 'createdAt',
      sortOrder = -1,
    } = options;

    const query = {};

    if (status) {
      if (status === 'in_review') {
        query.status = 'reviewing';
      } else if (status === 'dismissed') {
        query.status = 'rejected';
      } else {
        query.status = status;
      }
    }
    if (category) query.category = category;
    if (targetType) query.targetType = targetType;
    if (priority !== undefined && priority !== null && priority !== '') {
      query.priority = Number(priority);
    }

    const sortOptions = {};
    sortOptions[sortBy] = sortOrder;

    const [reports, total] = await Promise.all([
      Report.find(query)
        .populate('reporter', 'username name avatar')
        .populate('targetUser', 'username name avatar')
        .populate('reviewedBy', 'username name')
        .sort(sortOptions)
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      Report.countDocuments(query),
    ]);

    return {
      reports,
      total,
      page,
      totalPages: Math.ceil(total / limit),
      hasMore: page * limit < total,
    };
  }

  /**
   * Review report
   * @param {string} reportId - Report ID
   * @param {string} adminId - Admin ID performing the action
   * @param {string} decision - Decision (resolved, rejected, escalated)
   * @param {string} actionTaken - Action taken
   * @returns {Promise<Object>} Updated report object
   * @throws {Error} If decision is invalid or report not found
   */
  static async reviewReport(reportId, adminId, payload = {}) {
    const {
      action,
      decision: rawDecision,
      actionTaken: rawActionTaken,
      resolution,
      notes,
    } = payload;

    let decision = rawDecision;
    let actionTaken = rawActionTaken;

    if (!decision && action && REVIEW_ACTION_TO_RESOLUTION[action]) {
      ({ decision, actionTaken } = REVIEW_ACTION_TO_RESOLUTION[action]);
    } else if (
      !decision &&
      resolution &&
      LEGACY_RESOLUTION_TO_REVIEW[resolution]
    ) {
      ({ decision, actionTaken } = LEGACY_RESOLUTION_TO_REVIEW[resolution]);
    } else if (!decision && actionTaken) {
      decision = 'resolved';
    }

    if (decision === 'dismissed') {
      decision = 'rejected';
    }

    const validDecisions = ['resolved', 'rejected', 'escalated'];
    if (!validDecisions.includes(decision)) {
      throw ApiError.badRequest('Invalid review decision');
    }

    const ReportService = (await import('../report/report.service.js')).default;
    const report = await ReportService.resolveReport(reportId, adminId, {
      decision,
      actionTaken,
      notes,
    });

    await this._logAdminAction(adminId, 'review_report', 'report', reportId, {
      decision,
      actionTaken,
      action,
      resolution,
      notes,
    });

    return report;
  }

  /**
   * Get dashboard overview statistics
   * @returns {Promise<Object>} Stats object with users, posts, reports
   */
  static async getDashboardStats() {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const thisWeek = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [
      totalUsers,
      activeUsers,
      newUsersToday,
      newUsersThisWeek,
      bannedUsers,
      totalPosts,
      postsToday,
      postsThisWeek,
      pendingReports,
      totalReports,
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ lastActiveAt: { $gte: thisWeek } }),
      User.countDocuments({ createdAt: { $gte: today } }),
      User.countDocuments({ createdAt: { $gte: thisWeek } }),
      User.countDocuments({ 'moderation.status': 'banned' }),
      Post.countDocuments({ isDeleted: false }),
      Post.countDocuments({ createdAt: { $gte: today }, isDeleted: false }),
      Post.countDocuments({ createdAt: { $gte: thisWeek }, isDeleted: false }),
      Report.countDocuments({ status: 'pending' }),
      Report.countDocuments(),
    ]);

    return {
      users: {
        total: totalUsers,
        active: activeUsers,
        newToday: newUsersToday,
        newThisWeek: newUsersThisWeek,
        banned: bannedUsers,
      },
      posts: {
        total: totalPosts,
        today: postsToday,
        thisWeek: postsThisWeek,
      },
      reports: {
        pending: pendingReports,
        total: totalReports,
      },
      timestamp: now,
    };
  }

  /**
   * Get user growth statistics by day
   * @param {number} days - Number of days to get statistics
   * @returns {Promise<{totalGrowth: number, percentage: number, chartData: Array}>}
   */
  static async getUserGrowthStats(days = 30) {
    const endDate = new Date();
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    const previousStartDate = new Date(
      startDate.getTime() - days * 24 * 60 * 60 * 1000
    );

    const stats = await User.aggregate([
      {
        $match: { createdAt: { $gte: startDate, $lte: endDate } },
      },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$createdAt' },
          },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    const filledStats = [];
    for (
      let d = new Date(startDate);
      d <= endDate;
      d.setDate(d.getDate() + 1)
    ) {
      const dateStr = d.toISOString().split('T')[0];
      const found = stats.find(s => s._id === dateStr);
      filledStats.push({
        name: dateStr,
        users: found ? found.count : 0,
      });
    }

    const totalGrowth = filledStats.reduce((acc, curr) => acc + curr.users, 0);

    const previousPeriodCount = await User.countDocuments({
      createdAt: { $gte: previousStartDate, $lt: startDate },
    });

    let percentage = 0;
    if (previousPeriodCount > 0) {
      percentage =
        ((totalGrowth - previousPeriodCount) / previousPeriodCount) * 100;
    } else if (totalGrowth > 0) {
      percentage = 100;
    }

    return {
      totalGrowth,
      percentage: parseFloat(percentage.toFixed(1)),
      chartData: filledStats,
    };
  }

  /**
   * Get post statistics by day
   * @param {number} days - Number of days to get statistics
   * @returns {Promise<Array>} List of stats by day
   */
  static async getPostStats(days = 30) {
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const stats = await Post.aggregate([
      {
        $match: { createdAt: { $gte: startDate }, isDeleted: false },
      },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$createdAt' },
          },
          count: { $sum: 1 },
          totalLikes: { $sum: '$likesCount' },
          totalComments: { $sum: '$commentsCount' },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    return stats;
  }

  /**
   * Get list of top users by engagement rate
   * @param {number} limit - Maximum number of users
   * @returns {Promise<Array>} List of top users
   */
  static async getTopEngagedUsers(limit = 10) {
    return User.find({ isActive: true, 'moderation.status': 'active' })
      .sort({ 'metrics.engagementRate': -1 })
      .limit(limit)
      .select('username name avatar verified followersCount postsCount metrics')
      .lean();
  }

  /**
   * Get statistics and list of interactions
   * @param {Object} options - Options {page, limit, type, search}
   * @returns {Promise<{interactions: Array, stats: Object, total: number, page: number, totalPages: number, hasMore: boolean}>}
   */
  static async getInteractions(options = {}) {
    const { page = 1, limit = 20, type, search } = options;
    const skip = (page - 1) * limit;
    const mixedTypes = Object.keys(INTERACTION_TYPE_TO_STATS_KEY);
    const perTypeLimit = Math.ceil(
      (type ? limit : skip + limit) / mixedTypes.length
    );

    const statsPromise = Promise.all([
      Like.countDocuments(),
      Comment.countDocuments({ isDeleted: false }),
      Follow.countDocuments({ status: 'active' }),
      SavePost.countDocuments(),
      UserInteraction.countDocuments({
        interactionType: 'share',
        targetType: 'post',
      }),
      Report.countDocuments(),
    ]);

    const interactionTasks = [];

    if (!type || type === 'like') {
      interactionTasks.push(
        Like.find()
          .select('user post createdAt')
          .sort({ createdAt: -1 })
          .skip(type === 'like' ? skip : 0)
          .limit(type === 'like' ? limit : perTypeLimit)
          .populate('user', 'username name avatar')
          .populate({
            path: 'post',
            select: 'caption user',
            populate: { path: 'user', select: 'username name' },
          })
          .lean()
          .then(likes =>
            likes
              .filter(like => like.user && like.post)
              .map(like => ({
                _id: like._id,
                type: 'like',
                user: like.user,
                target: {
                  type: 'post',
                  preview: like.post.caption?.substring(0, 100) || 'Bài viết',
                  author: like.post.user?.name || 'Unknown',
                },
                createdAt: like.createdAt,
              }))
          )
      );
    }

    if (!type || type === 'comment') {
      interactionTasks.push(
        Comment.find({ isDeleted: false })
          .select('user post content createdAt')
          .sort({ createdAt: -1 })
          .skip(type === 'comment' ? skip : 0)
          .limit(type === 'comment' ? limit : perTypeLimit)
          .populate('user', 'username name avatar')
          .populate({
            path: 'post',
            select: 'caption user',
            populate: { path: 'user', select: 'username name' },
          })
          .lean()
          .then(comments =>
            comments
              .filter(comment => comment.user && comment.post)
              .map(comment => ({
                _id: comment._id,
                type: 'comment',
                user: comment.user,
                content: comment.content?.substring(0, 100),
                target: {
                  type: 'post',
                  preview: comment.post.caption?.substring(0, 100) || 'Bài viết',
                  author: comment.post.user?.name || 'Unknown',
                },
                createdAt: comment.createdAt,
              }))
          )
      );
    }

    if (!type || type === 'follow') {
      interactionTasks.push(
        Follow.find({ status: 'active' })
          .select('follower following createdAt')
          .sort({ createdAt: -1 })
          .skip(type === 'follow' ? skip : 0)
          .limit(type === 'follow' ? limit : perTypeLimit)
          .populate('follower', 'username name avatar')
          .populate('following', 'username name')
          .lean()
          .then(follows =>
            follows
              .filter(follow => follow.follower && follow.following)
              .map(follow => ({
                _id: follow._id,
                type: 'follow',
                user: follow.follower,
                target: {
                  type: 'user',
                  name: follow.following.name,
                  username: `@${follow.following.username}`,
                },
                createdAt: follow.createdAt,
              }))
          )
      );
    }

    if (!type || type === 'save') {
      interactionTasks.push(
        SavePost.find()
          .select('user post createdAt')
          .sort({ createdAt: -1 })
          .skip(type === 'save' ? skip : 0)
          .limit(type === 'save' ? limit : perTypeLimit)
          .populate('user', 'username name avatar')
          .populate({
            path: 'post',
            select: 'caption user',
            populate: { path: 'user', select: 'username name' },
          })
          .lean()
          .then(saves =>
            saves
              .filter(save => save.user && save.post)
              .map(save => ({
                _id: save._id,
                type: 'save',
                user: save.user,
                target: {
                  type: 'post',
                  preview: save.post.caption?.substring(0, 100) || 'Bài viết',
                  author: save.post.user?.name || 'Unknown',
                },
                createdAt: save.createdAt,
              }))
          )
      );
    }

    if (!type || type === 'share') {
      interactionTasks.push(
        UserInteraction.find({
          interactionType: 'share',
          targetType: 'post',
        })
          .select('user targetId createdAt')
          .sort({ createdAt: -1 })
          .skip(type === 'share' ? skip : 0)
          .limit(type === 'share' ? limit : perTypeLimit)
          .populate('user', 'username name avatar')
          .lean()
          .then(async shares => {
            const postIds = shares.map(share => share.targetId).filter(Boolean);
            const sharedPosts = postIds.length
              ? await Post.find({ _id: { $in: postIds } })
                  .select('caption user')
                  .populate('user', 'username name')
                  .lean()
              : [];

            const postMap = new Map(
              sharedPosts.map(post => [String(post._id), post])
            );

            return shares
              .map(share => {
                const post = postMap.get(String(share.targetId));
                if (!share.user || !post) return null;

                return {
                  _id: share._id,
                  type: 'share',
                  user: share.user,
                  target: {
                    type: 'post',
                    preview: post.caption?.substring(0, 100) || 'Bài viết',
                    author: post.user?.name || 'Unknown',
                  },
                  createdAt: share.createdAt,
                };
              })
              .filter(Boolean);
          })
      );
    }

    if (!type || type === 'report') {
      interactionTasks.push(
        Report.find()
          .select('reporter targetUser targetType description reason createdAt')
          .sort({ createdAt: -1 })
          .skip(type === 'report' ? skip : 0)
          .limit(type === 'report' ? limit : perTypeLimit)
          .populate('reporter', 'username name avatar')
          .populate('targetUser', 'username name')
          .lean()
          .then(reports =>
            reports
              .filter(report => report.reporter)
              .map(report => ({
                _id: report._id,
                type: 'report',
                user: report.reporter,
                content: report.reason,
                target: {
                  type: report.targetType,
                  preview: report.description?.substring(0, 100) || report.reason,
                  author: report.targetUser?.name || null,
                },
                createdAt: report.createdAt,
              }))
          )
      );
    }

    const [statsRaw, interactionBuckets] = await Promise.all([
      statsPromise,
      Promise.all(interactionTasks),
    ]);

    const [
      totalLikes,
      totalComments,
      totalFollows,
      totalSaves,
      totalShares,
      totalReports,
    ] = statsRaw;

    const stats = {
      likes: totalLikes,
      comments: totalComments,
      follows: totalFollows,
      saves: totalSaves,
      shares: totalShares,
      reports: totalReports,
    };

    const interactions = interactionBuckets.flat();

    let filteredInteractions = interactions.sort(
      (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
    );

    if (search) {
      const searchLower = search.toLowerCase();
      filteredInteractions = filteredInteractions.filter(
        i =>
          i.user?.name?.toLowerCase().includes(searchLower) ||
          i.user?.username?.toLowerCase().includes(searchLower)
      );
    }

    let total;
    if (search && search.trim()) {
      total = filteredInteractions.length;
    } else if (type) {
      total =
        stats[INTERACTION_TYPE_TO_STATS_KEY[type]] ||
        filteredInteractions.length;
    } else {
      total = Object.values(stats).reduce((sum, value) => sum + value, 0);
    }
    const totalPages = Math.ceil(total / limit);

    return {
      interactions: type
        ? filteredInteractions.slice(0, limit)
        : filteredInteractions.slice(skip, skip + limit),
      stats,
      total,
      page,
      totalPages,
      hasMore: page < totalPages,
    };
  }

  /**
   * Log admin action (private method)
   * @param {string} adminId - Admin ID
   * @param {string} action - Action performed
   * @param {string} targetType - Target type (user, post, comment, report, system)
   * @param {string} targetId - Target ID
   * @param {Object} metadata - Additional data
   * @private
   */
  static async _logAdminAction(
    adminId,
    action,
    targetType,
    targetId,
    metadata = {}
  ) {
    // Simply log to console instead of using AdminLog model
    logger.info(`Admin action: ${action}`, {
      adminId,
      action,
      targetType,
      targetId,
      metadata,
    });
  }

  /**
   * Broadcast notification to a group of users
   * @param {string} adminId - Admin ID performing the action
   * @param {string} content - Notification content
   * @param {string} targetGroup - Target group (all, active)
   * @returns {Promise<{sentCount: number}>} Number of notifications sent
   * @throws {Error} If targetGroup is invalid
   */
  static async broadcastNotification(
    adminId,
    payloadOrContent,
    fallbackTargetGroup = 'all'
  ) {
    const payload =
      payloadOrContent && typeof payloadOrContent === 'object'
        ? payloadOrContent
        : { content: payloadOrContent, targetGroup: fallbackTargetGroup };
    const {
      content,
      targetGroup = fallbackTargetGroup,
      type = 'system',
      title,
      priority = 'normal',
      link,
    } = payload;

    let users;

    switch (targetGroup) {
      case 'all':
        users = await User.find({ isActive: true }).select('_id').lean();
        break;
      case 'active':
        const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        users = await User.find({
          isActive: true,
          lastActiveAt: { $gte: weekAgo },
        })
          .select('_id')
          .lean();
        break;
      case 'verified':
        users = await User.find({ isActive: true, verified: true })
          .select('_id')
          .lean();
        break;
      case 'new_users':
        const monthAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        users = await User.find({
          isActive: true,
          createdAt: { $gte: monthAgo },
        })
          .select('_id')
          .lean();
        break;
      default:
        throw ApiError.badRequest('Invalid target group');

    }

    const userIds = users.map(user => user._id);
    const settingsList = await UserSettings.find({ user: { $in: userIds } })
      .select('user notifications')
      .lean();
    const settingsMap = new Map(
      settingsList.map(s => [s.user.toString(), s.notifications || {}])
    );

    const eligibleUsers = users.filter(user => {
      const notifications = settingsMap.get(user._id.toString()) || {};
      const pushSettings =
        notifications.push && typeof notifications.push === 'object'
          ? notifications.push
          : notifications;

      if (pushSettings.enabled === false) return false;
      if (pushSettings.systemUpdates === false) return false;
      return true;
    });

    const notifications = eligibleUsers.map(user => ({
      recipient: user._id,
      sender: adminId,
      type,
      content,
      metadata: {
        broadcastBy: adminId,
        ...(title ? { title } : {}),
        ...(priority ? { priority } : {}),
        ...(link ? { link } : {}),
      },
    }));

    if (notifications.length > 0) {
      await Notification.insertMany(notifications, { ordered: false });
    }

    await this._logAdminAction(
      adminId,
      'broadcast_notification',
      'system',
      null,
      {
        content,
        targetGroup,
        type,
        count: eligibleUsers.length,
        skipped: users.length - eligibleUsers.length,
      }
    );

    return {
      sentCount: eligibleUsers.length,
      skippedCount: users.length - eligibleUsers.length,
      targetCount: users.length,
    };
  }
}

export default AdminService;



