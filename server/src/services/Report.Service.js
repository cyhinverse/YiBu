import mongoose from "mongoose";
import Report from "../models/Report.js";
import User from "../models/User.js";
import Post from "../models/Post.js";
import Comment from "../models/Comment.js";
import Message from "../models/Message.js";
import Notification from "../models/Notification.js";
import logger from "../configs/logger.js";

/**
 * Report Service - Refactored for new model structure
 *
 * Key Changes:
 * 1. Uses targetType instead of reportType
 * 2. Uses category for report classification
 * 3. Priority scoring for triage
 * 4. Content snapshots for evidence
 */
class ReportService {
  // ======================================
  // Report Creation
  // ======================================

  static async createReport(reporterId, targetType, targetId, reportData) {
    const { category, reason, description } = reportData;

    const validTargetTypes = ["post", "comment", "user", "message"];
    if (!validTargetTypes.includes(targetType)) {
      throw new Error("Invalid report target type");
    }

    const existingReport = await Report.findOne({
      reporter: reporterId,
      targetType,
      targetId,
      status: { $in: ["pending", "reviewing"] },
    });

    if (existingReport) {
      throw new Error("Bạn đã báo cáo nội dung này rồi");
    }

    let targetUser;
    let contentSnapshot = {};

    switch (targetType) {
      case "post":
        const post = await Post.findById(targetId).lean();
        if (!post) throw new Error("Bài viết không tồn tại");
        targetUser = post.user;
        contentSnapshot = {
          caption: post.caption,
          media: post.media?.slice(0, 3),
          createdAt: post.createdAt,
        };
        break;

      case "comment":
        const comment = await Comment.findById(targetId).lean();
        if (!comment) throw new Error("Bình luận không tồn tại");
        targetUser = comment.user;
        contentSnapshot = {
          content: comment.content,
          postId: comment.post,
          createdAt: comment.createdAt,
        };
        break;

      case "user":
        const user = await User.findById(targetId).lean();
        if (!user) throw new Error("Người dùng không tồn tại");
        targetUser = targetId;
        contentSnapshot = {
          username: user.username,
          name: user.name,
          bio: user.bio,
          avatar: user.avatar,
        };
        break;

      case "message":
        const message = await Message.findById(targetId).lean();
        if (!message) throw new Error("Tin nhắn không tồn tại");
        targetUser = message.sender;
        contentSnapshot = {
          content: message.content,
          type: message.type,
          createdAt: message.createdAt,
        };
        break;
    }

    if (targetUser?.toString() === reporterId.toString()) {
      throw new Error("Bạn không thể báo cáo nội dung của chính mình");
    }

    const report = await Report.create({
      reporter: reporterId,
      targetType,
      targetId,
      targetUser,
      category,
      reason,
      description,
      contentSnapshot,
    });

    const populatedReport = await Report.findById(report._id)
      .populate("reporter", "username name avatar")
      .populate("targetUser", "username name avatar")
      .lean();

    logger.info(`Report created: ${report._id} by user ${reporterId}`);

    return populatedReport;
  }

  // ======================================
  // Report Types
  // ======================================

  static async reportPost(reporterId, postId, reportData) {
    return this.createReport(reporterId, "post", postId, reportData);
  }

  static async reportComment(reporterId, commentId, reportData) {
    return this.createReport(reporterId, "comment", commentId, reportData);
  }

  static async reportUser(reporterId, userId, reportData) {
    return this.createReport(reporterId, "user", userId, reportData);
  }

  static async reportMessage(reporterId, messageId, reportData) {
    return this.createReport(reporterId, "message", messageId, reportData);
  }

  // ======================================
  // Report Retrieval
  // ======================================

  static async getReportById(reportId) {
    const report = await Report.findById(reportId)
      .populate("reporter", "username name avatar")
      .populate("targetUser", "username name avatar")
      .populate("reviewedBy", "username name")
      .lean();

    if (!report) {
      throw new Error("Report not found");
    }

    return report;
  }

  static async getUserReports(userId, options = {}) {
    const { page = 1, limit = 20 } = options;

    const [reports, total] = await Promise.all([
      Report.find({ reporter: userId })
        .populate("targetUser", "username name avatar")
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      Report.countDocuments({ reporter: userId }),
    ]);

    return {
      reports,
      total,
      hasMore: page * limit < total,
    };
  }

  static async getReportsAgainstUser(userId, options = {}) {
    const { page = 1, limit = 20, status } = options;

    const query = { targetUser: userId };
    if (status) {
      query.status = status;
    }

    const [reports, total] = await Promise.all([
      Report.find(query)
        .populate("reporter", "username name avatar")
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      Report.countDocuments(query),
    ]);

    return {
      reports,
      total,
      hasMore: page * limit < total,
    };
  }

  // ======================================
  // Report Management (Admin)
  // ======================================

  static async getPendingReports(options = {}) {
    const { page = 1, limit = 20, category, targetType, priority } = options;

    const query = { status: "pending" };

    if (category) query.category = category;
    if (targetType) query.targetType = targetType;
    if (priority) query.priority = priority;

    const [reports, total] = await Promise.all([
      Report.find(query)
        .populate("reporter", "username name avatar")
        .populate("targetUser", "username name avatar")
        .sort({ priority: -1, createdAt: 1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      Report.countDocuments(query),
    ]);

    return {
      reports,
      total,
      hasMore: page * limit < total,
    };
  }

  static async startReview(reportId, adminId) {
    const report = await Report.findByIdAndUpdate(
      reportId,
      {
        $set: {
          status: "reviewing",
          reviewedBy: adminId,
        },
      },
      { new: true }
    );

    if (!report) {
      throw new Error("Report not found");
    }

    return report;
  }

  static async resolveReport(reportId, adminId, resolution) {
    const { decision, actionTaken, notes } = resolution;

    const validDecisions = ["resolved", "rejected", "escalated"];
    if (!validDecisions.includes(decision)) {
      throw new Error("Invalid decision");
    }

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
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
              notes,
              resolvedAt: new Date(),
            },
          },
        },
        { new: true, session }
      )
        .populate("reporter", "username name avatar")
        .populate("targetUser", "username name avatar");

      if (!report) {
        throw new Error("Report not found");
      }

      if (decision === "resolved" && actionTaken) {
        await this._executeAction(report, actionTaken, adminId, session);
      }

      await Notification.createNotification({
        recipient: report.reporter,
        type: "system",
        content: `Báo cáo của bạn đã được xử lý. Kết quả: ${this._getDecisionText(
          decision
        )}`,
      });

      await session.commitTransaction();

      logger.info(
        `Report ${reportId} resolved by admin ${adminId}: ${decision}`
      );

      return report;
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }

  static _getDecisionText(decision) {
    const texts = {
      resolved: "Đã xử lý vi phạm",
      rejected: "Không phát hiện vi phạm",
      escalated: "Đang điều tra thêm",
    };
    return texts[decision] || decision;
  }

  static async _executeAction(report, action, adminId, session) {
    const AdminService = (await import("./Admin.Service.js")).default;

    switch (action) {
      case "warn_user":
        await AdminService.warnUser(report.targetUser, adminId, report.reason);
        break;

      case "remove_content":
        if (report.targetType === "post") {
          await Post.findByIdAndUpdate(report.targetId, {
            isDeleted: true,
          }).session(session);
        } else if (report.targetType === "comment") {
          await Comment.findByIdAndUpdate(report.targetId, {
            isDeleted: true,
          }).session(session);
        }
        break;

      case "suspend_user":
        await AdminService.suspendUser(
          report.targetUser,
          adminId,
          7,
          report.reason
        );
        break;

      case "ban_user":
        await AdminService.banUser(report.targetUser, adminId, report.reason);
        break;

      default:
        logger.warn(`Unknown action: ${action}`);
    }
  }

  static async dismissReport(reportId, adminId, reason = "") {
    return this.resolveReport(reportId, adminId, {
      decision: "rejected",
      actionTaken: "none",
      notes: reason || "No violation found",
    });
  }

  // ======================================
  // Report Statistics
  // ======================================

  static async getReportStats(timeframe = "week") {
    const timeframeDays = { day: 1, week: 7, month: 30, year: 365 };
    const days = timeframeDays[timeframe] || 7;
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const [
      totalPending,
      totalReviewing,
      totalResolved,
      byCategory,
      byTargetType,
    ] = await Promise.all([
      Report.countDocuments({ status: "pending" }),
      Report.countDocuments({ status: "reviewing" }),
      Report.countDocuments({
        status: "resolved",
        reviewedAt: { $gte: startDate },
      }),
      Report.aggregate([
        { $match: { createdAt: { $gte: startDate } } },
        { $group: { _id: "$category", count: { $sum: 1 } } },
      ]),
      Report.aggregate([
        { $match: { createdAt: { $gte: startDate } } },
        { $group: { _id: "$targetType", count: { $sum: 1 } } },
      ]),
    ]);

    return {
      pending: totalPending,
      reviewing: totalReviewing,
      resolvedInPeriod: totalResolved,
      byCategory: byCategory.reduce((acc, item) => {
        acc[item._id] = item.count;
        return acc;
      }, {}),
      byTargetType: byTargetType.reduce((acc, item) => {
        acc[item._id] = item.count;
        return acc;
      }, {}),
      timeframe,
      startDate,
    };
  }

  static async getUserReportHistory(userId) {
    const [reportsBy, reportsAgainst, resolvedAgainst] = await Promise.all([
      Report.countDocuments({ reporter: userId }),
      Report.countDocuments({ targetUser: userId }),
      Report.countDocuments({ targetUser: userId, status: "resolved" }),
    ]);

    return {
      reportsMade: reportsBy,
      reportsReceived: reportsAgainst,
      violationsConfirmed: resolvedAgainst,
    };
  }

  // ======================================
  // Report Categories
  // ======================================

  static getReportCategories() {
    return [
      { value: "spam", label: "Spam hoặc lừa đảo", priority: 2 },
      { value: "harassment", label: "Quấy rối hoặc bắt nạt", priority: 3 },
      { value: "hate_speech", label: "Ngôn từ thù địch", priority: 3 },
      { value: "violence", label: "Bạo lực hoặc nguy hiểm", priority: 4 },
      { value: "nudity", label: "Nội dung khiêu dâm", priority: 3 },
      { value: "false_information", label: "Thông tin sai lệch", priority: 2 },
      {
        value: "intellectual_property",
        label: "Vi phạm bản quyền",
        priority: 2,
      },
      { value: "self_harm", label: "Tự làm hại bản thân", priority: 5 },
      { value: "other", label: "Khác", priority: 1 },
    ];
  }

  // ======================================
  // Bulk Operations
  // ======================================

  static async bulkResolve(reportIds, adminId, decision, actionTaken = "") {
    const results = [];

    for (const reportId of reportIds) {
      try {
        const report = await this.resolveReport(reportId, adminId, {
          decision,
          actionTaken,
          notes: "Bulk action",
        });
        results.push({ reportId, success: true });
      } catch (error) {
        results.push({ reportId, success: false, error: error.message });
      }
    }

    return results;
  }
}

export default ReportService;
