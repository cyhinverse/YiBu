import UserService from "../services/User.Service.js";
import PostService from "../services/Post.Service.js";
import AdminService from "../services/Admin.Service.js";
import mongoose from "mongoose";
import { CatchError } from "../configs/CatchError.js";
import { formatResponse } from "../helpers/formatResponse.js";
import { getPaginationParams, getPaginationResponse } from "../helpers/pagination.js";

export const AdminController = {
  // --- Dashboard & Analytics ---
  getDashboardStats: CatchError(async (req, res) => {
    const timeRange = req.query.timeRange || "week";
    const stats = await AdminService.getDashboardStats(timeRange);
    return formatResponse(res, 200, 1, "Dashboard stats retrieved successfully", stats);
  }),

  getRecentActivities: CatchError(async (req, res) => {
    const limit = parseInt(req.query.limit) || 10;
    const activities = await AdminService.getRecentActivities(limit);
    return formatResponse(res, 200, 1, "Recent activities retrieved successfully", activities);
  }),

  getInteractionStats: CatchError(async (req, res) => {
    const timeRange = req.query.timeRange || "week";
    const stats = await AdminService.getInteractionStats(timeRange);
    return formatResponse(res, 200, 1, "Interaction stats retrieved successfully", stats);
  }),

  getInteractionTimeline: CatchError(async (req, res) => {
    const timeRange = req.query.timeRange || "week";
    const timeline = await AdminService.getInteractionTimeline(timeRange);
    return formatResponse(res, 200, 1, "Timeline retrieved successfully", timeline);
  }),

  getUserInteractions: CatchError(async (req, res) => {
    const { page, limit, skip } = getPaginationParams(req.query);
    const { users, total } = await AdminService.getUserInteractions(req.query, skip, limit);
    const { pagination } = getPaginationResponse({ data: users, total, page, limit });
    return formatResponse(res, 200, 1, "User interactions retrieved", null, { users, pagination });
  }),

  removeInteraction: CatchError(async (req, res) => {
    const { interactionId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(interactionId)) {
        const error = new Error("Invalid interaction ID format");
        error.statusCode = 400;
        throw error;
    }
    await AdminService.removeInteraction(interactionId);
    return formatResponse(res, 200, 1, "Interaction removed successfully");
  }),

  getInteractionTypes: CatchError(async (req, res) => {
      const types = await AdminService.getInteractionTypes();
      return formatResponse(res, 200, 1, "Interaction types retrieved", types);
  }),

  // --- User Management ---
  getAllUsers: CatchError(async (req, res) => {
    const { page, limit, skip } = getPaginationParams(req.query);
    const { users, total } = await AdminService.getAllUsers(req.query, skip, limit);
    const { pagination } = getPaginationResponse({ data: users, total, page, limit });

    return formatResponse(res, 200, 1, "Users retrieved successfully", null, {
        users,
        pagination,
    });
  }),

  getUserDetails: CatchError(async (req, res) => {
    const { userId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      const error = new Error("Invalid user ID format");
      error.statusCode = 400;
      throw error;
    }

    const user = await AdminService.getUserDetails(userId);
    return formatResponse(res, 200, 1, "User details retrieved successfully", user);
  }),

  updateUser: CatchError(async (req, res) => {
    const { userId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      const error = new Error("Invalid user ID format");
      error.statusCode = 400;
      throw error;
    }

    const updatedUser = await AdminService.updateUser(userId, req.body);
    return formatResponse(res, 200, 1, "User updated successfully", updatedUser);
  }),

  deleteUser: CatchError(async (req, res) => {
    const { userId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      const error = new Error("Invalid user ID format");
      error.statusCode = 400;
      throw error;
    }

    await UserService.deleteUser(userId);
    return formatResponse(res, 200, 1, "User deleted successfully");
  }),

  // --- Ban & Flag Management ---
  banUser: CatchError(async (req, res) => {
    const { userId, reason, duration } = req.body;
    if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
      const error = new Error("Valid user ID is required");
      error.statusCode = 400;
      throw error;
    }

    const user = await AdminService.banUser(userId, reason, duration, req.user.id);
    return formatResponse(res, 200, 1, "User banned successfully", user);
  }),

  unbanUser: CatchError(async (req, res) => {
    const { userId } = req.body;
    if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
      const error = new Error("Valid user ID is required");
      error.statusCode = 400;
      throw error;
    }

    const user = await AdminService.unbanUser(userId, req.user.id);
    return formatResponse(res, 200, 1, "User unbanned successfully", user);
  }),

  getBannedAccounts: CatchError(async (req, res) => {
    const { page, limit, skip } = getPaginationParams(req.query);
    const { users, total } = await AdminService.getBannedAccounts(skip, limit);
    const { pagination } = getPaginationResponse({ data: users, total, page, limit });

    return formatResponse(res, 200, 1, "Banned accounts retrieved successfully", null, {
        users,
        pagination,
    });
  }),

  getBanHistory: CatchError(async (req, res) => {
    const { userId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(userId)) {
        const error = new Error("Invalid user ID format");
        error.statusCode = 400;
        throw error;
    }
    const history = await AdminService.getBanHistory(userId);
    return formatResponse(res, 200, 1, "Ban history retrieved successfully", history);
  }),

  extendBan: CatchError(async (req, res) => {
    const { userId, duration } = req.body;
    if (!userId || !duration) {
      const error = new Error("User ID and duration are required");
      error.statusCode = 400;
      throw error;
    }

    const newExpiration = await AdminService.extendBan(userId, duration, req.user.id);
    return formatResponse(res, 200, 1, "Ban extended successfully", { banExpiration: newExpiration });
  }),

  temporaryUnban: CatchError(async (req, res) => {
    const { userId, duration, reason } = req.body;
    const result = await AdminService.temporaryUnban(userId, duration, reason, req.user.id);
    return formatResponse(res, 200, 1, "User temporarily unbanned", result);
  }),

  getSpamAccounts: CatchError(async (req, res) => {
    const { page, limit, skip } = getPaginationParams(req.query);
    const { accounts, total } = await AdminService.getSpamAccounts(skip, limit);
    const { pagination } = getPaginationResponse({ data: accounts, total, page, limit });

    return formatResponse(res, 200, 1, "Suspicious accounts retrieved successfully", null, {
        accounts,
        pagination,
    });
  }),

  flagAccount: CatchError(async (req, res) => {
    const { userId, reason } = req.body;
    if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
      const error = new Error("Valid user ID is required");
      error.statusCode = 400;
      throw error;
    }

    const user = await AdminService.flagAccount(userId, reason, req.user.id);
    return formatResponse(res, 200, 1, "Account flagged successfully", {
        id: user._id,
        isFlagged: true,
        reason: user.moderation.flagReason
    });
  }),

  // --- Post Management ---
  getAllPosts: CatchError(async (req, res) => {
    const { page, limit, skip } = getPaginationParams(req.query);
    const { posts, total } = await AdminService.getAllPosts(req.query, skip, limit);
    const { pagination } = getPaginationResponse({ data: posts, total, page, limit });

    return formatResponse(res, 200, 1, "Posts retrieved successfully", null, {
        posts,
        pagination,
    });
  }),

  getPostDetails: CatchError(async (req, res) => {
    const { postId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(postId)) {
      const error = new Error("Invalid post ID format");
      error.statusCode = 400;
      throw error;
    }

    const post = await AdminService.getPostDetails(postId);
    return formatResponse(res, 200, 1, "Post details retrieved successfully", post);
  }),

  deletePost: CatchError(async (req, res) => {
    const { postId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(postId)) {
      const error = new Error("Invalid post ID format");
      error.statusCode = 400;
      throw error;
    }

    await PostService.deletePost(postId);
    return formatResponse(res, 200, 1, "Post deleted successfully");
  }),

  approvePost: CatchError(async (req, res) => {
    const { postId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(postId)) {
      const error = new Error("Invalid post ID format");
      error.statusCode = 400;
      throw error;
    }

    const post = await AdminService.approvePost(postId);
    return formatResponse(res, 200, 1, "Post approved successfully", post);
  }),

  // --- Comment Management ---
  getAllComments: CatchError(async (req, res) => {
    const { page, limit, skip } = getPaginationParams(req.query);
    const { comments, total } = await AdminService.getAllComments(req.query, skip, limit);
    const { pagination } = getPaginationResponse({ data: comments, total, page, limit });

    return formatResponse(res, 200, 1, "Comments retrieved successfully", null, {
        comments,
        pagination,
    });
  }),

  deleteComment: CatchError(async (req, res) => {
    const { commentId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(commentId)) {
      const error = new Error("Invalid comment ID format");
      error.statusCode = 400;
      throw error;
    }

    await AdminService.deleteComment(commentId);
    return formatResponse(res, 200, 1, "Comment deleted successfully");
  }),

  // --- System Management & Settings ---


  // Placeholder implementations for System Settings
  getAdminSettings: CatchError(async (req, res) => {
    // Mock settings - replace with Service fetch if Settings model is created
    const mockSettings = {
      site: { name: "YiBu Social", maintenance: false },
      security: { maxLoginAttempts: 5, twoFactorAuth: true },
    };
    return formatResponse(res, 200, 1, "Admin settings retrieved", mockSettings);
  }),

  updateAdminSettings: CatchError(async (req, res) => {
    const updates = req.body;
    // Save logic goes here via service
    return formatResponse(res, 200, 1, "Admin settings updated", updates);
  }),
  
  updateSecuritySettings: CatchError(async (req, res) => { 
      return formatResponse(res, 200, 1, "Security settings updated", req.body); 
  }),
  updateContentPolicy: CatchError(async (req, res) => { 
      return formatResponse(res, 200, 1, "Content policy updated", req.body); 
  }),
  updateUserPermissions: CatchError(async (req, res) => { 
      return formatResponse(res, 200, 1, "User permissions updated", req.body); 
  }),
  updateNotificationSettings: CatchError(async (req, res) => { 
      return formatResponse(res, 200, 1, "Notification settings updated", req.body); 
  }),
  getSystemHealth: CatchError(async (req, res) => {
    const health = {
        status: "healthy",
        uptime: process.uptime(),
        timestamp: new Date()
    };
    return formatResponse(res, 200, 1, "System health retrieved", health);
  }),
  updateSystemConfig: CatchError(async (req, res) => {
      // Logic to update system config
      return formatResponse(res, 200, 1, "System config updated", req.body);
  }),
};
