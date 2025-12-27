import mongoose from 'mongoose';
import User from '../models/User.js';
import Post from '../models/Post.js';
import Comment from '../models/Comment.js';
import Report from '../models/Report.js';
import RefreshToken from '../models/RefreshToken.js';
import UserSettings from '../models/UserSettings.js';
import Notification from '../models/Notification.js';
import logger from '../configs/logger.js';
import SystemSetting from '../models/SystemSetting.js';
import Transaction from '../models/Transaction.js';
import Like from '../models/Like.js';
import Follow from '../models/Follow.js';
import SavePost from '../models/SavePost.js';

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
  // ======================================
  // User Management
  // ======================================

  static async getAllUsers(options = {}) {
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
      query.$or = [
        { username: { $regex: search, $options: 'i' } },
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }

    if (status) {
      query['moderation.status'] = status;
    }

    const sortOptions = {};
    sortOptions[sortBy] = sortOrder;

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

  static async getUserById(userId) {
    const user = await User.findById(userId).select('-loginAttempts').lean();

    if (!user) {
      throw new Error('User not found');
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

  static async getUserReports(userId, options = {}) {
    const { page = 1, limit = 20 } = options;

    const [reports, total] = await Promise.all([
      Report.find({ targetUser: userId })
        .populate('reporter', 'username name avatar')
        .populate('targetUser', 'username name avatar') // Populate targetUser details
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

  static async updateUser(userId, updateData, adminId) {
    const { password, email, ...safeData } = updateData;

    const user = await User.findByIdAndUpdate(
      userId,
      { $set: safeData },
      { new: true }
    ).select('-loginAttempts -security');

    if (!user) {
      throw new Error('User not found');
    }

    await this._logAdminAction(adminId, 'update_user', 'user', userId, {
      updateData: safeData,
    });

    return user;
  }

  // ======================================
  // User Moderation
  // ======================================

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
        throw new Error('User not found');
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

  static async unbanUser(userId, adminId) {
    const user = await User.findByIdAndUpdate(
      userId,
      {
        $set: {
          'moderation.status': 'active',
          'moderation.reason': null,
          'moderation.moderatedBy': adminId,
          'moderation.moderatedAt': new Date(),
        },
      },
      { new: true }
    );

    if (!user) {
      throw new Error('User not found');
    }

    await this._logAdminAction(adminId, 'unban_user', 'user', userId);

    logger.info(`User ${userId} unbanned by admin ${adminId}`);

    return user;
  }

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
            'moderation.moderatedBy': adminId,
            'moderation.moderatedAt': new Date(),
          },
        },
        { new: true, session }
      );

      if (!user) {
        throw new Error('User not found');
      }

      await RefreshToken.updateMany(
        { user: userId },
        { isRevoked: true, revokedReason: 'user_suspended' }
      ).session(session);

      await Notification.createNotification({
        recipient: userId,
        type: 'system',
        content: `Tài khoản của bạn đã bị tạm khóa ${days} ngày. Lý do: ${reason}`,
      });

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

  static async warnUser(userId, adminId, reason) {
    const user = await User.findByIdAndUpdate(
      userId,
      {
        $inc: { 'moderation.warnings': 1 },
        $set: {
          'moderation.lastWarningAt': new Date(),
          'moderation.moderatedBy': adminId,
        },
      },
      { new: true }
    );

    if (!user) {
      throw new Error('User not found');
    }

    await Notification.createNotification({
      recipient: userId,
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

  // ======================================
  // Content Moderation
  // ======================================

  static async getAllPosts(options = {}) {
    const {
      page = 1,
      limit = 20,
      status,
      sortBy = 'createdAt',
      sortOrder = -1,
    } = options;

    const query = { isDeleted: false };

    if (status) {
      query['moderation.status'] = status;
    }

    const sortOptions = {};
    sortOptions[sortBy] = sortOrder;

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

  static async moderatePost(postId, adminId, action, reason = '') {
    const validActions = ['approve', 'reject', 'flag', 'remove', 'hide'];

    if (!validActions.includes(action)) {
      throw new Error('Invalid moderation action');
    }

    const statusMap = {
      approve: 'approved',
      reject: 'rejected',
      flag: 'flagged',
      remove: 'removed',
      hide: 'removed',
    };

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const updateData = {
        'moderation.status': statusMap[action],
        'moderation.reviewedBy': adminId,
        'moderation.reviewedAt': new Date(),
      };

      if (reason) {
        updateData['moderation.reason'] = reason;
      }

      if (action === 'remove' || action === 'hide') {
        updateData.isDeleted = true;
      }

      const post = await Post.findByIdAndUpdate(
        postId,
        { $set: updateData },
        { new: true, session }
      ).populate('user', 'username name avatar');

      if (!post) {
        throw new Error('Post not found');
      }

      if (action === 'reject' || action === 'remove' || action === 'hide') {
        await User.findByIdAndUpdate(post.user._id, {
          $inc: { postsCount: -1 },
        }).session(session);

        await Notification.createNotification({
          recipient: post.user._id,
          type: 'system',
          content: `Bài viết của bạn đã bị ${
            action === 'remove' ? 'gỡ bỏ' : 'từ chối'
          }. Lý do: ${reason || 'Vi phạm quy định cộng đồng'}`,
        });
      }

      await this._logAdminAction(adminId, `${action}_post`, 'post', postId, {
        reason,
      });

      await session.commitTransaction();

      return post;
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }

  static async deletePost(postId, adminId, reason = 'Admin action') {
    return this.moderatePost(postId, adminId, 'remove', reason);
  }

  static async getAllComments(options = {}) {
    const {
      page = 1,
      limit = 20,
      search,
      status, // "active", "hidden", "flagged"
      sortBy = 'createdAt',
      sortOrder = -1,
    } = options;

    const query = {};

    if (search) {
      query.content = { $regex: search, $options: 'i' };
    }

    if (status) {
      if (status === 'hidden') {
        query.isDeleted = true;
      } else if (status === 'active') {
        query.isDeleted = false;
      }
      // Note: "flagged" typically requires a separate report check or a specific flag on the comment
    }

    // Sort options
    const sortOptions = {};
    sortOptions[sortBy] = sortOrder;

    const [comments, total] = await Promise.all([
      Comment.find(query)
        .populate('user', 'username name avatar')
        .populate('post', 'caption') // To show post preview
        .sort(sortOptions)
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      Comment.countDocuments(query),
    ]);

    // Enhance comments with additional data if needed (e.g. report count)
    // For now, return basic info
    return {
      comments,
      total,
      page,
      totalPages: Math.ceil(total / limit),
      hasMore: page * limit < total,
    };
  }

  static async moderateComment(commentId, adminId, action, reason = '') {
    const validActions = ['approve', 'remove'];

    if (!validActions.includes(action)) {
      throw new Error('Invalid moderation action');
    }

    const comment = await Comment.findById(commentId);

    if (!comment) {
      throw new Error('Comment not found');
    }

    if (action === 'remove') {
      comment.isDeleted = true;
      comment.content = '[Nội dung đã bị xóa bởi quản trị viên]';
      await comment.save();

      await Post.findByIdAndUpdate(comment.post, {
        $inc: { commentsCount: -1 },
      });

      await Notification.createNotification({
        recipient: comment.user,
        type: 'system',
        content: `Bình luận của bạn đã bị xóa. Lý do: ${
          reason || 'Vi phạm quy định cộng đồng'
        }`,
      });
    } else if (action === 'approve' && comment.isDeleted) {
      comment.isDeleted = false;
      await comment.save();

      await Post.findByIdAndUpdate(comment.post, {
        $inc: { commentsCount: 1 },
      });
    }

    await this._logAdminAction(
      adminId,
      `${action}_comment`,
      'comment',
      commentId,
      { reason }
    );

    return comment;
  }

  // ======================================
  // Reports Management
  // ======================================

  static async getReports(options = {}) {
    const { page = 1, limit = 20, status, category, priority } = options;

    const query = {};

    if (status) query.status = status;
    if (category) query.category = category;
    if (priority) query.priority = priority;

    const [reports, total] = await Promise.all([
      Report.find(query)
        .populate('reporter', 'username name avatar')
        .populate('targetUser', 'username name avatar')
        .populate('reviewedBy', 'username name')
        .sort({ priority: -1, createdAt: -1 })
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

  static async reviewReport(reportId, adminId, decision, actionTaken = '') {
    const validDecisions = ['resolved', 'rejected', 'escalated'];

    if (!validDecisions.includes(decision)) {
      throw new Error('Invalid decision');
    }

    const report = await Report.findByIdAndUpdate(
      reportId,
      {
        $set: {
          status: decision,
          reviewedBy: adminId,
          reviewedAt: new Date(),
          resolution: {
            decision,
            actionTaken,
            resolvedAt: new Date(),
          },
        },
      },
      { new: true }
    )
      .populate('reporter', 'username name avatar')
      .populate('targetUser', 'username name avatar');

    if (!report) {
      throw new Error('Report not found');
    }

    await this._logAdminAction(adminId, 'review_report', 'report', reportId, {
      decision,
      actionTaken,
    });

    return report;
  }

  // ======================================
  // Analytics & Statistics
  // ======================================

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

  static async getUserGrowthStats(days = 30) {
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const stats = await User.aggregate([
      {
        $match: { createdAt: { $gte: startDate } },
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

    return stats.map(s => ({ date: s._id, count: s.count }));
  }

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

  static async getTopEngagedUsers(limit = 10) {
    return User.find({ isActive: true, 'moderation.status': 'active' })
      .sort({ 'metrics.engagementRate': -1 })
      .limit(limit)
      .select('username name avatar verified followersCount postsCount metrics')
      .lean();
  }

  // ======================================
  // Interactions Analytics
  // ======================================

  static async getInteractions(options = {}) {
    const { page = 1, limit = 20, type, search } = options;

    // Get interaction stats
    const [totalLikes, totalComments, totalFollows, totalSaves, totalShares] =
      await Promise.all([
        Like.countDocuments(),
        Comment.countDocuments({ isDeleted: false }),
        Follow.countDocuments({ status: 'active' }),
        SavePost.countDocuments(),
        Post.aggregate([
          { $group: { _id: null, total: { $sum: '$sharesCount' } } },
        ]).then(r => r[0]?.total || 0),
      ]);

    const stats = {
      likes: totalLikes,
      comments: totalComments,
      follows: totalFollows,
      saves: totalSaves,
      shares: totalShares,
    };

    // Build aggregation pipeline for recent interactions
    const interactions = [];
    const skip = (page - 1) * limit;
    const perType = Math.ceil(limit / 5);

    // Get likes
    if (!type || type === 'like') {
      const likes = await Like.find()
        .sort({ createdAt: -1 })
        .skip(type === 'like' ? skip : 0)
        .limit(type === 'like' ? limit : perType)
        .populate('user', 'username name avatar')
        .populate({
          path: 'post',
          select: 'caption user',
          populate: { path: 'user', select: 'username name' },
        })
        .lean();

      likes.forEach(like => {
        if (like.user && like.post) {
          interactions.push({
            _id: like._id,
            type: 'like',
            user: like.user,
            target: {
              type: 'post',
              preview: like.post.caption?.substring(0, 100) || 'Bài viết',
              author: like.post.user?.name || 'Unknown',
            },
            createdAt: like.createdAt,
          });
        }
      });
    }

    // Get comments
    if (!type || type === 'comment') {
      const comments = await Comment.find({ isDeleted: false })
        .sort({ createdAt: -1 })
        .skip(type === 'comment' ? skip : 0)
        .limit(type === 'comment' ? limit : perType)
        .populate('user', 'username name avatar')
        .populate({
          path: 'post',
          select: 'caption user',
          populate: { path: 'user', select: 'username name' },
        })
        .lean();

      comments.forEach(comment => {
        if (comment.user && comment.post) {
          interactions.push({
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
          });
        }
      });
    }

    // Get follows
    if (!type || type === 'follow') {
      const follows = await Follow.find({ status: 'active' })
        .sort({ createdAt: -1 })
        .skip(type === 'follow' ? skip : 0)
        .limit(type === 'follow' ? limit : perType)
        .populate('follower', 'username name avatar')
        .populate('following', 'username name')
        .lean();

      follows.forEach(follow => {
        if (follow.follower && follow.following) {
          interactions.push({
            _id: follow._id,
            type: 'follow',
            user: follow.follower,
            target: {
              type: 'user',
              name: follow.following.name,
              username: `@${follow.following.username}`,
            },
            createdAt: follow.createdAt,
          });
        }
      });
    }

    // Get saves
    if (!type || type === 'save') {
      const saves = await SavePost.find()
        .sort({ createdAt: -1 })
        .skip(type === 'save' ? skip : 0)
        .limit(type === 'save' ? limit : perType)
        .populate('user', 'username name avatar')
        .populate({
          path: 'post',
          select: 'caption user',
          populate: { path: 'user', select: 'username name' },
        })
        .lean();

      saves.forEach(save => {
        if (save.user && save.post) {
          interactions.push({
            _id: save._id,
            type: 'save',
            user: save.user,
            target: {
              type: 'post',
              preview: save.post.caption?.substring(0, 100) || 'Bài viết',
              author: save.post.user?.name || 'Unknown',
            },
            createdAt: save.createdAt,
          });
        }
      });
    }

    // Sort by date and apply search filter
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

    const total = type
      ? stats[type + 's'] || filteredInteractions.length
      : filteredInteractions.length;
    const totalPages = Math.ceil(total / limit);

    return {
      interactions: filteredInteractions.slice(0, limit),
      stats,
      total,
      page,
      totalPages,
      hasMore: page < totalPages,
    };
  }

  // ======================================
  // Admin Action Logging
  // ======================================

  static async _logAdminAction(
    adminId,
    action,
    targetType,
    targetId,
    metadata = {}
  ) {
    try {
      const AdminLog = (await import('../models/AdminLog.js')).default;
      
      let level = 'info';
      if (action.includes('ban') || action.includes('delete') || action.includes('remove')) {
        level = 'warning';
      } else if (action.includes('unban') || action.includes('approve') || action.includes('resolve')) {
        level = 'success';
      }

      await AdminLog.create({
        admin: adminId,
        action,
        targetType,
        targetId,
        level,
        details: metadata.reason || metadata.content || `Performed ${action}`,
        metadata,
      });
      
    } catch (error) {
      // Don't crash if logging fails, just log to console
      logger.error('Failed to create admin log:', error);
    }
  }

  static async getAdminLogs(options = {}) {
    const {
      page = 1,
      limit = 20,
      level,
      startDate,
      endDate
    } = options;

    const AdminLog = (await import('../models/AdminLog.js')).default;
    const query = {};

    if (level && level !== 'all') {
      query.level = level;
    }

    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }

    const [logs, total] = await Promise.all([
      AdminLog.find(query)
        .populate('admin', 'username name email avatar')
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      AdminLog.countDocuments(query),
    ]);
    
    // Transform logs to match frontend expectations
    const formattedLogs = logs.map(log => ({
      _id: log._id,
      createdAt: log.createdAt,
      level: log.level,
      action: log.action,
      message: log.details,
      user: log.admin, // Key 'user' for table column 'Người dùng'
      ip: log.ip,
      metadata: log.metadata
    }));

    return {
      logs: formattedLogs,
      total,
      page,
      totalPages: Math.ceil(total / limit),
      hasMore: page * limit < total,
    };
  }

  // ======================================
  // System Management
  // ======================================

  static async broadcastNotification(adminId, content, targetGroup = 'all') {
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
      default:
        throw new Error('Invalid target group');
    }

    const notifications = users.map(user => ({
      recipient: user._id,
      type: 'system',
      content,
      metadata: { broadcastBy: adminId },
    }));

    await Notification.insertMany(notifications, { ordered: false });

    await this._logAdminAction(
      adminId,
      'broadcast_notification',
      'system',
      null,
      { content, targetGroup, count: users.length }
    );

    return { sentCount: users.length };
  }
  // ======================================
  // Settings Management
  // ======================================

  static async getSystemSettings() {
    let settings = await SystemSetting.findOne().lean();
    if (!settings) {
      settings = await SystemSetting.create({});
    }
    return settings;
  }

  static async updateSystemSettings(updateData, adminId) {
    const settings = await SystemSetting.findOneAndUpdate(
      {},
      {
        $set: {
          ...updateData,
          updatedBy: adminId,
        },
      },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );

    await this._logAdminAction(adminId, 'update_settings', 'system', null, {
      changes: Object.keys(updateData),
    });

    return settings;
  }

  // ======================================
  // Revenue & Transactions
  // ======================================

  static async getRevenueStats() {
    const now = new Date();
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const firstDayOfLastMonth = new Date(
      now.getFullYear(),
      now.getMonth() - 1,
      1
    );
    const lastDayOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);

    const [
      totalRevenue,
      thisMonthRevenue,
      lastMonthRevenue,
      transactionCount,
      monthlyData,
    ] = await Promise.all([
      // Total Revenue
      Transaction.aggregate([
        { $match: { status: 'completed' } },
        { $group: { _id: null, total: { $sum: '$amount' } } },
      ]),
      // This Month
      Transaction.aggregate([
        {
          $match: { status: 'completed', createdAt: { $gte: firstDayOfMonth } },
        },
        { $group: { _id: null, total: { $sum: '$amount' } } },
      ]),
      // Last Month
      Transaction.aggregate([
        {
          $match: {
            status: 'completed',
            createdAt: { $gte: firstDayOfLastMonth, $lte: lastDayOfLastMonth },
          },
        },
        { $group: { _id: null, total: { $sum: '$amount' } } },
      ]),
      // Transaction Count
      Transaction.countDocuments({ status: 'completed' }),
      // Monthly Data for Chart (Last 6 months)
      Transaction.aggregate([
        {
          $match: {
            status: 'completed',
            createdAt: {
              $gte: new Date(now.getFullYear(), now.getMonth() - 5, 1),
            },
          },
        },
        {
          $group: {
            _id: {
              month: { $month: '$createdAt' },
              year: { $year: '$createdAt' },
            },
            revenue: { $sum: '$amount' },
          },
        },
        { $sort: { '_id.year': 1, '_id.month': 1 } },
      ]),
    ]);

    const total = totalRevenue[0]?.total || 0;
    const thisMonth = thisMonthRevenue[0]?.total || 0;
    const lastMonth = lastMonthRevenue[0]?.total || 0;

    // Calculate growth
    let growth = 0;
    if (lastMonth > 0) {
      growth = ((thisMonth - lastMonth) / lastMonth) * 100;
    } else if (thisMonth > 0) {
      growth = 100;
    }

    const avgTransaction = transactionCount > 0 ? total / transactionCount : 0;

    return {
      total,
      thisMonth,
      lastMonth,
      growth,
      transactions: transactionCount,
      avgTransaction,
      chartData: monthlyData.map(d => ({
        month: `T${d._id.month}`,
        revenue: d.revenue,
      })),
    };
  }

  static async getTransactions(options = {}) {
    const { page = 1, limit = 20, status, type } = options;
    const query = {};
    if (status) query.status = status;
    if (type) query.type = type;

    const [transactions, total] = await Promise.all([
      Transaction.find(query)
        .populate('user', 'username name avatar email')
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      Transaction.countDocuments(query),
    ]);

    return {
      transactions,
      total,
      page,
      totalPages: Math.ceil(total / limit),
      hasMore: page * limit < total,
    };
  }
}

export default AdminService;
