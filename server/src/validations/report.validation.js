import Joi from 'joi';
import { objectId } from './common.validation.js';

/**
 * Report Validation Schemas
 * Validation cho tất cả endpoints trong reports.router.js
 */

// ======================================
// POST / (createReport - generic)
// Body: { targetType, targetId, reason, description? }
// ======================================
export const createReportBody = Joi.object({
  targetType: Joi.string()
    .valid('post', 'comment', 'user', 'message')
    .required()
    .messages({
      'any.only': 'Loại đối tượng báo cáo không hợp lệ',
      'any.required': 'Loại đối tượng là bắt buộc',
    }),
  targetId: objectId.required().messages({
    'any.required': 'ID đối tượng là bắt buộc',
  }),
  reason: Joi.string()
    .valid(
      'spam',
      'harassment',
      'violence',
      'hate_speech',
      'nudity',
      'misinformation',
      'copyright',
      'other'
    )
    .required()
    .messages({
      'any.only': 'Lý do báo cáo không hợp lệ',
      'any.required': 'Lý do báo cáo là bắt buộc',
    }),
  description: Joi.string().trim().max(500).allow('').messages({
    'string.max': 'Mô tả không được quá 500 ký tự',
  }),
});

// ======================================
// POST /post/:postId (reportPost)
// Params: { postId }
// Body: { reason, description? }
// ======================================
export const reportPostParam = Joi.object({
  postId: objectId.required(),
});

export const reportPostBody = Joi.object({
  reason: Joi.string()
    .valid('spam', 'harassment', 'violence', 'hate_speech', 'nudity', 'other')
    .required()
    .messages({
      'any.only': 'Lý do báo cáo không hợp lệ',
      'any.required': 'Lý do báo cáo là bắt buộc',
    }),
  description: Joi.string().trim().max(500).allow(''),
});

// ======================================
// POST /comment/:commentId (reportComment)
// Params: { commentId }
// Body: { reason, description? }
// ======================================
export const reportCommentParam = Joi.object({
  commentId: objectId.required(),
});

export const reportCommentBody = Joi.object({
  reason: Joi.string()
    .valid('spam', 'harassment', 'violence', 'hate_speech', 'other')
    .required()
    .messages({
      'any.only': 'Lý do báo cáo không hợp lệ',
      'any.required': 'Lý do báo cáo là bắt buộc',
    }),
  description: Joi.string().trim().max(500).allow(''),
});

// ======================================
// POST /user/:userId (reportUser)
// Params: { userId }
// Body: { reason, description? }
// ======================================
export const reportUserParam = Joi.object({
  userId: objectId.required(),
});

export const reportUserBody = Joi.object({
  reason: Joi.string()
    .valid('spam', 'harassment', 'fake_account', 'impersonation', 'other')
    .required()
    .messages({
      'any.only': 'Lý do báo cáo không hợp lệ',
      'any.required': 'Lý do báo cáo là bắt buộc',
    }),
  description: Joi.string().trim().max(500).allow(''),
});

// ======================================
// POST /message/:messageId (reportMessage)
// Params: { messageId }
// Body: { reason, description? }
// ======================================
export const reportMessageParam = Joi.object({
  messageId: objectId.required(),
});

export const reportMessageBody = Joi.object({
  reason: Joi.string()
    .valid('spam', 'harassment', 'violence', 'hate_speech', 'other')
    .required()
    .messages({
      'any.only': 'Lý do báo cáo không hợp lệ',
      'any.required': 'Lý do báo cáo là bắt buộc',
    }),
  description: Joi.string().trim().max(500).allow(''),
});

// ======================================
// GET /my-reports
// Query: { page?, limit?, status? }
// ======================================
export const myReportsQuery = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(50).default(20),
  status: Joi.string().valid('pending', 'reviewed', 'resolved', 'dismissed'),
});

// ======================================
// GET /:reportId (getReportById)
// Params: { reportId }
// ======================================
export const reportIdParam = Joi.object({
  reportId: objectId.required(),
});

// ======================================
// GET / (getAllReports - Admin)
// Query: { page?, limit?, status?, targetType?, sort? }
// ======================================
export const getAllReportsQuery = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20),
  status: Joi.string().valid('pending', 'reviewing', 'resolved', 'dismissed'),
  targetType: Joi.string().valid('post', 'comment', 'user', 'message'),
  sort: Joi.string().valid('newest', 'oldest').default('newest'),
});

// ======================================
// GET /pending (getPendingReports - Admin)
// Query: { page?, limit? }
// ======================================
export const pendingReportsQuery = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20),
});

// ======================================
// GET /user/:userId/against (getReportsAgainstUser - Admin)
// Params: { userId }
// Query: { page?, limit? }
// ======================================
export const reportsAgainstUserParam = Joi.object({
  userId: objectId.required(),
});

export const reportsAgainstUserQuery = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(50).default(20),
});

// ======================================
// POST /:reportId/start-review (startReview - Admin)
// Params: { reportId }
// ======================================
export const startReviewParam = Joi.object({
  reportId: objectId.required(),
});

// ======================================
// PUT /:reportId/resolve (resolveReport - Admin)
// Params: { reportId }
// Body: { action, notes? }
// ======================================
export const resolveReportParam = Joi.object({
  reportId: objectId.required(),
});

export const resolveReportBody = Joi.object({
  action: Joi.string()
    .valid('warn', 'remove_content', 'suspend', 'ban', 'dismiss')
    .required()
    .messages({
      'any.only': 'Hành động không hợp lệ',
      'any.required': 'Hành động xử lý là bắt buộc',
    }),
  notes: Joi.string().trim().max(1000).allow(''),
  duration: Joi.number().integer().min(1).max(365), // Days for suspension
});

// ======================================
// PUT /:reportId/status (updateReportStatus - Admin)
// Params: { reportId }
// Body: { status }
// ======================================
export const updateStatusParam = Joi.object({
  reportId: objectId.required(),
});

export const updateStatusBody = Joi.object({
  status: Joi.string()
    .valid('pending', 'reviewing', 'resolved', 'dismissed')
    .required()
    .messages({
      'any.only': 'Trạng thái không hợp lệ',
      'any.required': 'Trạng thái là bắt buộc',
    }),
});

export default {
  createReportBody,
  reportPostParam,
  reportPostBody,
  reportCommentParam,
  reportCommentBody,
  reportUserParam,
  reportUserBody,
  reportMessageParam,
  reportMessageBody,
  myReportsQuery,
  reportIdParam,
  getAllReportsQuery,
  pendingReportsQuery,
  reportsAgainstUserParam,
  reportsAgainstUserQuery,
  startReviewParam,
  resolveReportParam,
  resolveReportBody,
  updateStatusParam,
  updateStatusBody,
};
