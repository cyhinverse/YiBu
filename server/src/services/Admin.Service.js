import mongoose from "mongoose";
import User from "../models/User.js";
import Post from "../models/Post.js";
import Comment from "../models/Comment.js";
import Report from "../models/Report.js";
import RefreshToken from "../models/RefreshToken.js";
import UserSettings from "../models/UserSettings.js";
import Notification from "../models/Notification.js";
import logger from "../configs/logger.js";

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
      sortBy = "createdAt",
      sortOrder = -1,
    } = options;

    const query = {};

    if (search) {
      query.$or = [
        { username: { $regex: search, $options: "i" } },
        { name: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
      ];
    }

    if (status) {
      query["moderation.status"] = status;
    }

    const sortOptions = {};
    sortOptions[sortBy] = sortOrder;

    const [users, total] = await Promise.all([
      User.find(query)
        .select("-loginAttempts -security")
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
    const user = await User.findById(userId).select("-loginAttempts").lean();

    if (!user) {
      throw new Error("User not found");
    }

    const settings = await UserSettings.findOne({ user: userId }).lean();

    const recentReports = await Report.find({
      targetUser: userId,
      status: { $in: ["pending", "reviewing"] },
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

  static async updateUser(userId, updateData, adminId) {
    const { password, email, ...safeData } = updateData;

    const user = await User.findByIdAndUpdate(
      userId,
      { $set: safeData },
      { new: true }
    ).select("-loginAttempts -security");

    if (!user) {
      throw new Error("User not found");
    }

    await this._logAdminAction(adminId, "update_user", "user", userId, {
      updateData: safeData,
    });

    return user;
  }

  // ======================================
  // User Moderation
  // ======================================

  static async banUser(userId, adminId, reason = "Violation of terms") {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const user = await User.findByIdAndUpdate(
        userId,
        {
          $set: {
            "moderation.status": "banned",
            "moderation.reason": reason,
            "moderation.moderatedBy": adminId,
            "moderation.moderatedAt": new Date(),
          },
        },
        { new: true, session }
      );

      if (!user) {
        throw new Error("User not found");
      }

      await RefreshToken.updateMany(
        { user: userId },
        { isRevoked: true, revokedReason: "user_banned" }
      ).session(session);

      await this._logAdminAction(adminId, "ban_user", "user", userId, {
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
          "moderation.status": "active",
          "moderation.reason": null,
          "moderation.moderatedBy": adminId,
          "moderation.moderatedAt": new Date(),
        },
      },
      { new: true }
    );

    if (!user) {
      throw new Error("User not found");
    }

    await this._logAdminAction(adminId, "unban_user", "user", userId);

    logger.info(`User ${userId} unbanned by admin ${adminId}`);

    return user;
  }

  static async suspendUser(
    userId,
    adminId,
    days = 7,
    reason = "Temporary suspension"
  ) {
    const suspendedUntil = new Date(Date.now() + days * 24 * 60 * 60 * 1000);

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const user = await User.findByIdAndUpdate(
        userId,
        {
          $set: {
            "moderation.status": "suspended",
            "moderation.reason": reason,
            "moderation.suspendedUntil": suspendedUntil,
            "moderation.moderatedBy": adminId,
            "moderation.moderatedAt": new Date(),
          },
        },
        { new: true, session }
      );

      if (!user) {
        throw new Error("User not found");
      }

      await RefreshToken.updateMany(
        { user: userId },
        { isRevoked: true, revokedReason: "user_suspended" }
      ).session(session);

      await Notification.createNotification({
        recipient: userId,
        type: "system",
        content: `Tài khoản của bạn đã bị tạm khóa ${days} ngày. Lý do: ${reason}`,
      });

      await this._logAdminAction(adminId, "suspend_user", "user", userId, {
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
        $inc: { "moderation.warnings": 1 },
        $set: {
          "moderation.lastWarningAt": new Date(),
          "moderation.moderatedBy": adminId,
        },
      },
      { new: true }
    );

    if (!user) {
      throw new Error("User not found");
    }

    await Notification.createNotification({
      recipient: userId,
      type: "system",
      content: `Bạn đã nhận được cảnh báo từ quản trị viên. Lý do: ${reason}`,
    });

    await this._logAdminAction(adminId, "warn_user", "user", userId, {
      reason,
    });

    if (user.moderation.warnings >= 3) {
      await this.suspendUser(userId, adminId, 3, "Nhận quá nhiều cảnh báo");
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
      sortBy = "createdAt",
      sortOrder = -1,
    } = options;

    const query = { isDeleted: false };

    if (status) {
      query["moderation.status"] = status;
    }

    const sortOptions = {};
    sortOptions[sortBy] = sortOrder;

    const [posts, total] = await Promise.all([
      Post.find(query)
        .populate("user", "username name avatar verified")
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

  static async moderatePost(postId, adminId, action, reason = "") {
    const validActions = ["approve", "reject", "flag", "remove"];

    if (!validActions.includes(action)) {
      throw new Error("Invalid moderation action");
    }

    const statusMap = {
      approve: "approved",
      reject: "rejected",
      flag: "flagged",
      remove: "removed",
    };

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const updateData = {
        "moderation.status": statusMap[action],
        "moderation.reviewedBy": adminId,
        "moderation.reviewedAt": new Date(),
      };

      if (reason) {
        updateData["moderation.reason"] = reason;
      }

      if (action === "remove") {
        updateData.isDeleted = true;
      }

      const post = await Post.findByIdAndUpdate(
        postId,
        { $set: updateData },
        { new: true, session }
      ).populate("user", "username name avatar");

      if (!post) {
        throw new Error("Post not found");
      }

      if (action === "reject" || action === "remove") {
        await User.findByIdAndUpdate(post.user._id, {
          $inc: { postsCount: -1 },
        }).session(session);

        await Notification.createNotification({
          recipient: post.user._id,
          type: "system",
          content: `Bài viết của bạn đã bị ${
            action === "remove" ? "gỡ bỏ" : "từ chối"
          }. Lý do: ${reason || "Vi phạm quy định cộng đồng"}`,
        });
      }

      await this._logAdminAction(adminId, `${action}_post`, "post", postId, {
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

  static async deletePost(postId, adminId, reason = "Admin action") {
    return this.moderatePost(postId, adminId, "remove", reason);
  }

  static async moderateComment(commentId, adminId, action, reason = "") {
    const validActions = ["approve", "remove"];

    if (!validActions.includes(action)) {
      throw new Error("Invalid moderation action");
    }

    const comment = await Comment.findById(commentId);

    if (!comment) {
      throw new Error("Comment not found");
    }

    if (action === "remove") {
      comment.isDeleted = true;
      comment.content = "[Nội dung đã bị xóa bởi quản trị viên]";
      await comment.save();

      await Post.findByIdAndUpdate(comment.post, {
        $inc: { commentsCount: -1 },
      });

      await Notification.createNotification({
        recipient: comment.user,
        type: "system",
        content: `Bình luận của bạn đã bị xóa. Lý do: ${
          reason || "Vi phạm quy định cộng đồng"
        }`,
      });
    }

    await this._logAdminAction(
      adminId,
      `${action}_comment`,
      "comment",
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
        .populate("reporter", "username name avatar")
        .populate("targetUser", "username name avatar")
        .populate("reviewedBy", "username name")
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

  static async reviewReport(reportId, adminId, decision, actionTaken = "") {
    const validDecisions = ["resolved", "rejected", "escalated"];

    if (!validDecisions.includes(decision)) {
      throw new Error("Invalid decision");
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
      .populate("reporter", "username name avatar")
      .populate("targetUser", "username name avatar");

    if (!report) {
      throw new Error("Report not found");
    }

    await this._logAdminAction(adminId, "review_report", "report", reportId, {
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
      User.countDocuments({ "moderation.status": "banned" }),
      Post.countDocuments({ isDeleted: false }),
      Post.countDocuments({ createdAt: { $gte: today }, isDeleted: false }),
      Post.countDocuments({ createdAt: { $gte: thisWeek }, isDeleted: false }),
      Report.countDocuments({ status: "pending" }),
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
            $dateToString: { format: "%Y-%m-%d", date: "$createdAt" },
          },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    return stats.map((s) => ({ date: s._id, count: s.count }));
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
            $dateToString: { format: "%Y-%m-%d", date: "$createdAt" },
          },
          count: { $sum: 1 },
          totalLikes: { $sum: "$likesCount" },
          totalComments: { $sum: "$commentsCount" },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    return stats;
  }

  static async getTopEngagedUsers(limit = 10) {
    return User.find({ isActive: true, "moderation.status": "active" })
      .sort({ "metrics.engagementRate": -1 })
      .limit(limit)
      .select("username name avatar verified followersCount postsCount metrics")
      .lean();
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
    // TODO: Create AdminLog model for persistent logging
    logger.info({
      type: "admin_action",
      adminId,
      action,
      targetType,
      targetId,
      metadata,
      timestamp: new Date(),
    });
  }

  static async getAdminLogs(options = {}) {
    // TODO: Implement when AdminLog model is created
    return { logs: [], total: 0 };
  }

  // ======================================
  // System Management
  // ======================================

  static async broadcastNotification(adminId, content, targetGroup = "all") {
    let users;

    switch (targetGroup) {
      case "all":
        users = await User.find({ isActive: true }).select("_id").lean();
        break;
      case "active":
        const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        users = await User.find({
          isActive: true,
          lastActiveAt: { $gte: weekAgo },
        })
          .select("_id")
          .lean();
        break;
      default:
        throw new Error("Invalid target group");
    }

    const notifications = users.map((user) => ({
      recipient: user._id,
      type: "system",
      content,
      metadata: { broadcastBy: adminId },
    }));

    await Notification.insertMany(notifications, { ordered: false });

    await this._logAdminAction(
      adminId,
      "broadcast_notification",
      "system",
      null,
      { content, targetGroup, count: users.length }
    );

    return { sentCount: users.length };
  }
}

export default AdminService;
