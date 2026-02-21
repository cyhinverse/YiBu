import mongoose from 'mongoose';
import Report from '../../models/Report.js';
import User from '../../models/User.js';
import Post from '../../models/Post.js';
import Comment from '../../models/Comment.js';
import Message from '../../models/Message.js';
import RefreshToken from '../../models/RefreshToken.js';
import logger from '../../configs/logger.js';
import ApiError from '../../helpers/ApiError.js';
import { createSystemNotification } from '../../utils/systemNotification.js';
import { normalizeReportStatus } from '../../utils/reportStatus.js';

const CATEGORY_ALIASES = {
  fake_account: 'impersonation',
};

const VALID_CATEGORIES = [
  'spam',
  'harassment',
  'hate_speech',
  'violence',
  'nudity',
  'misinformation',
  'copyright',
  'impersonation',
  'self_harm',
  'illegal',
  'scam',
  'other',
];

const ACTION_TO_RESOLUTION = {
  warn_user: 'warning',
  remove_content: 'content_removed',
  suspend_user: 'user_suspended',
  ban_user: 'user_banned',
};


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
  /**
   * Create new report
   * @param {string} reporterId - Reporting user ID
   * @param {string} targetType - Target type (post, comment, user, message)
   * @param {string} targetId - Target ID
   * @param {Object} reportData - Report data {category, reason, description}
   * @returns {Promise<Object>} Created report object
   * @throws {Error} If targetType is invalid, already reported, or reporting self
   */
  static async createReport(reporterId, targetType, targetId, reportData) {
    const { category, reason, description } = reportData;

    if (!reason) {
      throw ApiError.badRequest('Reason is required');
    }

    const normalizedCategory = this._normalizeCategory(category, reason);

    const validTargetTypes = ['post', 'comment', 'user', 'message'];
    if (!validTargetTypes.includes(targetType)) {
      throw ApiError.badRequest('Invalid report target type');
    }


    const existingReport = await Report.findOne({
      reporter: reporterId,
      targetType,
      targetId,
      status: { $in: ['pending', 'reviewing'] },
    });

    if (existingReport) {
      throw ApiError.conflict('Bạn đã báo cáo nội dung này rồi');
    }


    let targetUser;
    let contentSnapshot = {};

    switch (targetType) {
      case 'post': {
        const post = await Post.findById(targetId).lean();
        if (!post) throw ApiError.notFound('Bài viết không tồn tại');
        targetUser = post.user;
        contentSnapshot = {
          caption: post.caption,
          media: post.media?.slice(0, 3),
          createdAt: post.createdAt,
        };
        break;
      }

      case 'comment': {
        const comment = await Comment.findById(targetId).lean();
        if (!comment) throw ApiError.notFound('Bình luận không tồn tại');
        targetUser = comment.user;
        contentSnapshot = {
          content: comment.content,
          postId: comment.post,
          createdAt: comment.createdAt,
        };
        break;
      }

      case 'user': {
        const user = await User.findById(targetId).lean();
        if (!user) throw ApiError.notFound('Người dùng không tồn tại');
        targetUser = targetId;
        contentSnapshot = {
          username: user.username,
          name: user.name,
          bio: user.bio,
          avatar: user.avatar,
        };
        break;
      }

      case 'message': {
        const message = await Message.findById(targetId).lean();
        if (!message) throw ApiError.notFound('Tin nhắn không tồn tại');
        const normalizedMessageType =
          message.messageType || message.type || 'text';
        targetUser = message.sender;
        contentSnapshot = {
          content: message.content,
          type: normalizedMessageType,
          messageType: normalizedMessageType,
          createdAt: message.createdAt,
        };
        break;
      }
    }


    if (targetUser?.toString() === reporterId.toString()) {
      throw ApiError.forbidden('Bạn không thể báo cáo nội dung của chính mình');
    }


    const report = await Report.create({
      reporter: reporterId,
      targetType,
      targetId,
      targetUser,
      category: normalizedCategory,
      reason,
      description,
      contentSnapshot,
    });

    const populatedReport = await Report.findById(report._id)
      .populate('reporter', 'username name avatar')
      .populate('targetUser', 'username name avatar')
      .lean();

    logger.info(`Report created: ${report._id} by user ${reporterId}`);

    return populatedReport;
  }

  /**
   * Report post
   * @param {string} reporterId - Reporting user ID
   * @param {string} postId - Post ID
   * @param {Object} reportData - Report data
   * @returns {Promise<Object>} Report object
   */
  static async reportPost(reporterId, postId, reportData) {
    return this.createReport(reporterId, 'post', postId, reportData);
  }

  /**
   * Report comment
   * @param {string} reporterId - Reporting user ID
   * @param {string} commentId - Comment ID
   * @param {Object} reportData - Report data
   * @returns {Promise<Object>} Report object
   */
  static async reportComment(reporterId, commentId, reportData) {
    return this.createReport(reporterId, 'comment', commentId, reportData);
  }

  /**
   * Report user
   * @param {string} reporterId - Reporting user ID
   * @param {string} userId - Reported user ID
   * @param {Object} reportData - Report data
   * @returns {Promise<Object>} Report object
   */
  static async reportUser(reporterId, userId, reportData) {
    return this.createReport(reporterId, 'user', userId, reportData);
  }

  /**
   * Report message
   * @param {string} reporterId - Reporting user ID
   * @param {string} messageId - Message ID
   * @param {Object} reportData - Report data
   * @returns {Promise<Object>} Report object
   */
  static async reportMessage(reporterId, messageId, reportData) {
    return this.createReport(reporterId, 'message', messageId, reportData);
  }

  /**
   * Get report by ID
   * @param {string} reportId - Report ID
   * @returns {Promise<Object>} Report object with full information
   * @throws {Error} If report not found
   */
  static async getReportById(reportId) {
    const report = await Report.findById(reportId)
      .populate('reporter', 'username name avatar')
      .populate('targetUser', 'username name avatar')
      .populate('reviewedBy', 'username name')
      .lean();

    if (!report) {
      throw ApiError.notFound('Report not found');
    }

    return report;
  }


  /**
   * Get list of reports by user (reports that user created)
   * @param {string} userId - User ID
   * @param {Object} options - Pagination options {page, limit}
   * @returns {Promise<{reports: Array, total: number, hasMore: boolean}>}
   */
  static async getUserReports(userId, options = {}) {
    const { page = 1, limit = 20, status } = options;
    const query = { reporter: userId };
    if (status) {
      query.status = normalizeReportStatus(status);
    }

    const [reports, total] = await Promise.all([
      Report.find(query)
        .populate('targetUser', 'username name avatar')
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

  /**
   * Get list of reports against user (reports where user is reported)
   * @param {string} userId - User ID
   * @param {Object} options - Options {page, limit, status}
   * @returns {Promise<{reports: Array, total: number, hasMore: boolean}>}
   */
  static async getReportsAgainstUser(userId, options = {}) {
    const { page = 1, limit = 20, status } = options;

    const query = { targetUser: userId };
    if (status) {
      query.status = normalizeReportStatus(status);
    }

    const [reports, total] = await Promise.all([
      Report.find(query)
        .populate('reporter', 'username name avatar')
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

  /**
   * Get list of reports with filters
   * @param {Object} options - Options {page, limit, status, category, targetType, priority}
   * @returns {Promise<{reports: Array, total: number, hasMore: boolean}>}
   */
  static async getAllReports(options = {}) {
    const {
      page = 1,
      limit = 20,
      status,
      category,
      targetType,
      priority,
      sort = 'newest',
    } = options;

    const query = {};
    if (status) query.status = normalizeReportStatus(status);
    if (category) query.category = category;
    if (targetType) query.targetType = targetType;
    if (priority !== undefined && priority !== null && priority !== '') {
      query.priority = Number(priority);
    }

    const sortOptions = sort === 'oldest' ? { createdAt: 1 } : { createdAt: -1 };

    const [reports, total] = await Promise.all([
      Report.find(query)
        .populate('reporter', 'username name avatar')
        .populate('targetUser', 'username name avatar')
        .sort(sortOptions)
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

  /**
   * Get list of pending reports
   * @param {Object} options - Options {page, limit, category, targetType, priority}
   * @returns {Promise<{reports: Array, total: number, hasMore: boolean}>}
   */
  static async getPendingReports(options = {}) {
    const { page = 1, limit = 20, category, targetType, priority } = options;

    return this.getAllReports({
      page,
      limit,
      status: 'pending',
      category,
      targetType,
      priority,
    });
  }


  /**
   * Start reviewing report
   * @param {string} reportId - Report ID
   * @param {string} adminId - Admin ID
   * @returns {Promise<Object>} Updated report object
   * @throws {Error} If report not found
   */
  static async startReview(reportId, adminId) {
    const report = await Report.findByIdAndUpdate(
      reportId,
      {
        $set: {
          status: 'reviewing',
          reviewedBy: adminId,
        },
      },
      { new: true }
    );

    if (!report) {
      throw ApiError.notFound('Report not found');
    }


    return report;
  }

  /**
   * Resolve report
   * @param {string} reportId - Report ID
   * @param {string} adminId - Admin ID
   * @param {Object} resolution - Decision {decision, actionTaken, notes}
   * @returns {Promise<Object>} Updated report object
   * @throws {Error} If decision is invalid or report not found
   */
  static async resolveReport(reportId, adminId, resolution) {
    const { decision, actionTaken, notes } = resolution;

    const validDecisions = ['resolved', 'rejected', 'escalated', 'dismissed'];
    if (!validDecisions.includes(decision)) {
      throw ApiError.badRequest('Invalid decision');
    }

    const normalizedDecision = decision === 'dismissed' ? 'rejected' : decision;
    if (normalizedDecision === 'resolved' && !actionTaken) {
      throw ApiError.badRequest(
        'actionTaken is required when decision is resolved'
      );
    }

    const resolutionAction =
      normalizedDecision === 'resolved'
        ? ACTION_TO_RESOLUTION[actionTaken] || 'content_removed'
        : 'no_violation';


    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const report = await Report.findByIdAndUpdate(
        reportId,
        {
          $set: {
            status: normalizedDecision,
            reviewedBy: adminId,
            reviewedAt: new Date(),
            resolution: {
              action: resolutionAction,
              note: notes || undefined,
              resolvedBy: adminId,
              resolvedAt: new Date(),
            },
          },
        },
        { new: true, session }
      )
        .populate('reporter', 'username name avatar')
        .populate('targetUser', 'username name avatar');

      if (!report) {
        throw ApiError.notFound('Report not found');
      }


      if (normalizedDecision === 'resolved' && actionTaken) {
        await this._executeAction(report, actionTaken, adminId, session);
      }

      const reporterId = report.reporter?._id || report.reporter;
      if (reporterId) {
        await createSystemNotification({
          recipient: reporterId,
          sender: adminId,
          content: `Báo cáo của bạn đã được xử lý. Kết quả: ${this._getDecisionText(
            normalizedDecision
          )}`,
          session,
        });
      }

      await session.commitTransaction();

      logger.info(
        `Report ${reportId} resolved by admin ${adminId}: ${normalizedDecision}`
      );

      return report;
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }

  static async updateReportStatus(reportId, adminId, payload) {
    const { status, notes } = payload;
    const validStatuses = [
      'pending',
      'reviewing',
      'resolved',
      'dismissed',
      'rejected',
      'escalated',
    ];

    if (!validStatuses.includes(status)) {
      throw ApiError.badRequest('Invalid status');
    }

    const normalizedStatus = status === 'dismissed' ? 'rejected' : status;
    const update = {
      status: normalizedStatus,
      reviewedBy: adminId,
      reviewedAt: new Date(),
    };

    if (notes || normalizedStatus === 'rejected') {
      update.resolution = {
        action: normalizedStatus === 'resolved' ? 'content_removed' : 'no_violation',
        note: notes || undefined,
        resolvedBy: adminId,
        resolvedAt: new Date(),
      };
    }

    const report = await Report.findByIdAndUpdate(
      reportId,
      { $set: update },
      { new: true }
    )
      .populate('reporter', 'username name avatar')
      .populate('targetUser', 'username name avatar')
      .populate('reviewedBy', 'username name');

    if (!report) {
      throw ApiError.notFound('Report not found');
    }

    return report;
  }

  static _normalizeCategory(category, reason) {
    const raw = String(category || reason || 'other')
      .trim()
      .toLowerCase();
    const mapped = CATEGORY_ALIASES[raw] || raw;
    return VALID_CATEGORIES.includes(mapped) ? mapped : 'other';
  }

  static _getDecisionText(decision) {
    const texts = {
      resolved: 'Đã xử lý vi phạm',
      rejected: 'Không phát hiện vi phạm',
      escalated: 'Đang điều tra thêm',
    };
    return texts[decision] || decision;
  }

  static async _executeAction(report, action, adminId, session) {
    const targetUserId = report.targetUser?._id || report.targetUser;

    switch (action) {
      case 'warn_user':
        if (!targetUserId) break;

        {
          const warnedUser = await User.findByIdAndUpdate(
            targetUserId,
            {
              $inc: { 'moderation.warnings': 1 },
              $set: {
                'moderation.status': 'warned',
                'moderation.reason': report.reason,
                'moderation.lastWarningAt': new Date(),
                'moderation.moderatedBy': adminId,
                'moderation.moderatedAt': new Date(),
              },
            },
            { new: true, session }
          );

          if (!warnedUser) break;

          await createSystemNotification({
            recipient: warnedUser._id,
            sender: adminId,
            content: `Bạn đã nhận được cảnh báo từ quản trị viên. Lý do: ${report.reason}`,
            session,
          });
        }
        break;

      case 'remove_content':
        if (report.targetType === 'post') {
          const existingPost = await Post.findById(report.targetId)
            .select('isDeleted user')
            .session(session);

          await Post.findByIdAndUpdate(report.targetId, {
            $set: {
              isDeleted: true,
              'moderation.status': 'removed',
              'moderation.reason': report.reason,
              'moderation.reviewedBy': adminId,
              'moderation.reviewedAt': new Date(),
            },
          }).session(session);

          if (existingPost && !existingPost.isDeleted && existingPost.user) {
            await User.findByIdAndUpdate(existingPost.user, {
              $inc: { postsCount: -1 },
            }).session(session);

            await createSystemNotification({
              recipient: existingPost.user,
              sender: adminId,
              content: `Bài viết của bạn đã bị gỡ bỏ. Lý do: ${
                report.reason || 'Vi phạm quy định cộng đồng'
              }`,
              session,
            });
          }
        } else if (report.targetType === 'comment') {
          const existingComment = await Comment.findById(report.targetId)
            .select('isDeleted post user')
            .session(session);

          await Comment.findByIdAndUpdate(report.targetId, {
            $set: {
              isDeleted: true,
              content: '[Nội dung đã bị xóa bởi quản trị viên]',
              'moderation.status': 'removed',
              'moderation.reason': report.reason,
            },
          }).session(session);

          if (existingComment && !existingComment.isDeleted && existingComment.post) {
            await Post.findByIdAndUpdate(existingComment.post, {
              $inc: { commentsCount: -1 },
            }).session(session);

            if (existingComment.user) {
              await createSystemNotification({
                recipient: existingComment.user,
                sender: adminId,
                content: `Bình luận của bạn đã bị xóa. Lý do: ${
                  report.reason || 'Vi phạm quy định cộng đồng'
                }`,
                session,
              });
            }
          }
        }
        break;

      case 'suspend_user':
        if (!targetUserId) break;

        {
          const suspendedUntil = new Date(
            Date.now() + 7 * 24 * 60 * 60 * 1000
          );

          await User.findByIdAndUpdate(
            targetUserId,
            {
              $set: {
                'moderation.status': 'suspended',
                'moderation.reason': report.reason,
                'moderation.suspendedUntil': suspendedUntil,
                'moderation.expiresAt': suspendedUntil,
                'moderation.moderatedBy': adminId,
                'moderation.moderatedAt': new Date(),
              },
            },
            { session }
          );

          await RefreshToken.updateMany(
            { user: targetUserId },
            { isRevoked: true, revokedReason: 'user_suspended' },
            { session }
          );

          await createSystemNotification({
            recipient: targetUserId,
            sender: adminId,
            content: `Tài khoản của bạn đã bị tạm khóa 7 ngày. Lý do: ${report.reason}`,
            session,
          });
        }
        break;

      case 'ban_user':
        if (!targetUserId) break;

        await User.findByIdAndUpdate(
          targetUserId,
          {
            $set: {
              'moderation.status': 'banned',
              'moderation.reason': report.reason,
              'moderation.moderatedBy': adminId,
              'moderation.moderatedAt': new Date(),
            },
          },
          { session }
        );

        await RefreshToken.updateMany(
          { user: targetUserId },
          { isRevoked: true, revokedReason: 'user_banned' },
          { session }
        );

        await createSystemNotification({
          recipient: targetUserId,
          sender: adminId,
          content: `Tài khoản của bạn đã bị khóa. Lý do: ${report.reason}`,
          session,
        });
        break;

      default:
        logger.warn(`Unknown action: ${action}`);
    }
  }

}

export default ReportService;



