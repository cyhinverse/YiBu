import UserService from "../services/User.Service.js";
import PostService from "../services/Post.Service.js";
import AdminService from "../services/Admin.Service.js";
import mongoose from "mongoose";
import { CatchError } from "../configs/CatchError.js";
import { formatResponse } from "../helpers/formatResponse.js";
import {
  getPaginationParams,
  getPaginationResponse,
} from "../helpers/pagination.js";
import logger from "../configs/logger.js";

export const AdminController = {
  // ======================================
  // Dashboard & Analytics
  // ======================================

  getDashboardStats: CatchError(async (req, res) => {
    const stats = await AdminService.getDashboardStats();
    return formatResponse(
      res,
      200,
      1,
      "Dashboard stats retrieved successfully",
      stats
    );
  }),

  getUserGrowthStats: CatchError(async (req, res) => {
    const days = parseInt(req.query.days) || 30;
    const stats = await AdminService.getUserGrowthStats(days);
    return formatResponse(res, 200, 1, "User growth stats retrieved", stats);
  }),

  getPostStats: CatchError(async (req, res) => {
    const days = parseInt(req.query.days) || 30;
    const stats = await AdminService.getPostStats(days);
    return formatResponse(res, 200, 1, "Post stats retrieved", stats);
  }),

  getTopEngagedUsers: CatchError(async (req, res) => {
    const limit = parseInt(req.query.limit) || 10;
    const users = await AdminService.getTopEngagedUsers(limit);
    return formatResponse(res, 200, 1, "Top engaged users retrieved", users);
  }),

  // ======================================
  // User Management
  // ======================================

  getAllUsers: CatchError(async (req, res) => {
    const { page, limit } = getPaginationParams(req.query);
    const { search, status, sortBy, sortOrder } = req.query;

    const result = await AdminService.getAllUsers({
      page,
      limit,
      search,
      status,
      sortBy,
      sortOrder: sortOrder === "asc" ? 1 : -1,
    });

    return formatResponse(res, 200, 1, "Users retrieved successfully", {
      users: result.users,
      pagination: {
        total: result.total,
        page: result.page,
        totalPages: result.totalPages,
        hasMore: result.hasMore,
      },
    });
  }),

  getUserDetails: CatchError(async (req, res) => {
    const { userId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return formatResponse(res, 400, 0, "Invalid user ID format");
    }

    const user = await AdminService.getUserById(userId);
    return formatResponse(
      res,
      200,
      1,
      "User details retrieved successfully",
      user
    );
  }),

  updateUser: CatchError(async (req, res) => {
    const { userId } = req.params;
    const adminId = req.user.id;

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return formatResponse(res, 400, 0, "Invalid user ID format");
    }

    const updatedUser = await AdminService.updateUser(
      userId,
      req.body,
      adminId
    );
    return formatResponse(
      res,
      200,
      1,
      "User updated successfully",
      updatedUser
    );
  }),

  deleteUser: CatchError(async (req, res) => {
    const { userId } = req.params;
    const adminId = req.user.id;

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return formatResponse(res, 400, 0, "Invalid user ID format");
    }

    await UserService.deleteUser(userId);

    logger.info(`User ${userId} deleted by admin ${adminId}`);

    return formatResponse(res, 200, 1, "User deleted successfully");
  }),

  // ======================================
  // User Moderation
  // ======================================

  banUser: CatchError(async (req, res) => {
    const { userId, reason } = req.body;
    const adminId = req.user.id;

    if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
      return formatResponse(res, 400, 0, "Valid user ID is required");
    }

    const user = await AdminService.banUser(userId, adminId, reason);
    return formatResponse(res, 200, 1, "User banned successfully", user);
  }),

  unbanUser: CatchError(async (req, res) => {
    const { userId } = req.body;
    const adminId = req.user.id;

    if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
      return formatResponse(res, 400, 0, "Valid user ID is required");
    }

    const user = await AdminService.unbanUser(userId, adminId);
    return formatResponse(res, 200, 1, "User unbanned successfully", user);
  }),

  suspendUser: CatchError(async (req, res) => {
    const { userId, days, reason } = req.body;
    const adminId = req.user.id;

    if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
      return formatResponse(res, 400, 0, "Valid user ID is required");
    }

    const user = await AdminService.suspendUser(userId, adminId, days, reason);
    return formatResponse(res, 200, 1, "User suspended successfully", user);
  }),

  warnUser: CatchError(async (req, res) => {
    const { userId, reason } = req.body;
    const adminId = req.user.id;

    if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
      return formatResponse(res, 400, 0, "Valid user ID is required");
    }

    if (!reason) {
      return formatResponse(res, 400, 0, "Warning reason is required");
    }

    const user = await AdminService.warnUser(userId, adminId, reason);
    return formatResponse(res, 200, 1, "Warning issued successfully", user);
  }),

  getBannedUsers: CatchError(async (req, res) => {
    const { page, limit } = getPaginationParams(req.query);

    const result = await AdminService.getAllUsers({
      page,
      limit,
      status: "banned",
    });

    return formatResponse(res, 200, 1, "Banned users retrieved", {
      users: result.users,
      pagination: {
        total: result.total,
        page: result.page,
        totalPages: result.totalPages,
        hasMore: result.hasMore,
      },
    });
  }),

  // ======================================
  // Content Moderation
  // ======================================

  getAllPosts: CatchError(async (req, res) => {
    const { page, limit } = getPaginationParams(req.query);
    const { status, sortBy, sortOrder } = req.query;

    const result = await AdminService.getAllPosts({
      page,
      limit,
      status,
      sortBy,
      sortOrder: sortOrder === "asc" ? 1 : -1,
    });

    return formatResponse(res, 200, 1, "Posts retrieved successfully", {
      posts: result.posts,
      pagination: {
        total: result.total,
        page: result.page,
        totalPages: result.totalPages,
        hasMore: result.hasMore,
      },
    });
  }),

  moderatePost: CatchError(async (req, res) => {
    const { postId } = req.params;
    const { action, reason } = req.body;
    const adminId = req.user.id;

    if (!mongoose.Types.ObjectId.isValid(postId)) {
      return formatResponse(res, 400, 0, "Invalid post ID format");
    }

    if (!action) {
      return formatResponse(
        res,
        400,
        0,
        "Action is required (approve/reject/flag/remove)"
      );
    }

    const post = await AdminService.moderatePost(
      postId,
      adminId,
      action,
      reason
    );
    return formatResponse(res, 200, 1, `Post ${action}d successfully`, post);
  }),

  approvePost: CatchError(async (req, res) => {
    const { postId } = req.params;
    const adminId = req.user.id;

    if (!mongoose.Types.ObjectId.isValid(postId)) {
      return formatResponse(res, 400, 0, "Invalid post ID format");
    }

    const post = await AdminService.moderatePost(postId, adminId, "approve");
    return formatResponse(res, 200, 1, "Post approved successfully", post);
  }),

  deletePost: CatchError(async (req, res) => {
    const { postId } = req.params;
    const { reason } = req.body;
    const adminId = req.user.id;

    if (!mongoose.Types.ObjectId.isValid(postId)) {
      return formatResponse(res, 400, 0, "Invalid post ID format");
    }

    await AdminService.deletePost(postId, adminId, reason);
    return formatResponse(res, 200, 1, "Post deleted successfully");
  }),

  moderateComment: CatchError(async (req, res) => {
    const { commentId } = req.params;
    const { action, reason } = req.body;
    const adminId = req.user.id;

    if (!mongoose.Types.ObjectId.isValid(commentId)) {
      return formatResponse(res, 400, 0, "Invalid comment ID format");
    }

    const comment = await AdminService.moderateComment(
      commentId,
      adminId,
      action,
      reason
    );
    return formatResponse(
      res,
      200,
      1,
      `Comment ${action}d successfully`,
      comment
    );
  }),

  deleteComment: CatchError(async (req, res) => {
    const { commentId } = req.params;
    const { reason } = req.body;
    const adminId = req.user.id;

    if (!mongoose.Types.ObjectId.isValid(commentId)) {
      return formatResponse(res, 400, 0, "Invalid comment ID format");
    }

    const comment = await AdminService.moderateComment(
      commentId,
      adminId,
      "remove",
      reason
    );
    return formatResponse(res, 200, 1, "Comment deleted successfully", comment);
  }),

  // ======================================
  // Reports Management
  // ======================================

  getReports: CatchError(async (req, res) => {
    const { page, limit } = getPaginationParams(req.query);
    const { status, category, priority } = req.query;

    const result = await AdminService.getReports({
      page,
      limit,
      status,
      category,
      priority,
    });

    return formatResponse(res, 200, 1, "Reports retrieved successfully", {
      reports: result.reports,
      pagination: {
        total: result.total,
        page: result.page,
        totalPages: result.totalPages,
        hasMore: result.hasMore,
      },
    });
  }),

  reviewReport: CatchError(async (req, res) => {
    const { reportId } = req.params;
    const { decision, actionTaken } = req.body;
    const adminId = req.user.id;

    if (!mongoose.Types.ObjectId.isValid(reportId)) {
      return formatResponse(res, 400, 0, "Invalid report ID format");
    }

    if (!decision) {
      return formatResponse(
        res,
        400,
        0,
        "Decision is required (resolved/rejected/escalated)"
      );
    }

    const report = await AdminService.reviewReport(
      reportId,
      adminId,
      decision,
      actionTaken
    );
    return formatResponse(res, 200, 1, "Report reviewed successfully", report);
  }),

  // ======================================
  // System Management
  // ======================================

  broadcastNotification: CatchError(async (req, res) => {
    const { content, targetGroup } = req.body;
    const adminId = req.user.id;

    if (!content) {
      return formatResponse(res, 400, 0, "Notification content is required");
    }

    const result = await AdminService.broadcastNotification(
      adminId,
      content,
      targetGroup
    );
    return formatResponse(
      res,
      200,
      1,
      `Notification sent to ${result.sentCount} users`,
      result
    );
  }),

  getSystemHealth: CatchError(async (req, res) => {
    const health = {
      status: "healthy",
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      timestamp: new Date(),
    };
    return formatResponse(res, 200, 1, "System health retrieved", health);
  }),

  getAdminLogs: CatchError(async (req, res) => {
    const { page, limit } = getPaginationParams(req.query);

    const result = await AdminService.getAdminLogs({ page, limit });
    return formatResponse(res, 200, 1, "Admin logs retrieved", result);
  }),
};
