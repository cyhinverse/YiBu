import Joi from 'joi';
import { objectId } from './common.validation.js';

const REPORT_CATEGORIES = [
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
  'fake_account',
];

const REPORT_TARGET_TYPES = ['post', 'comment', 'user', 'message'];

/**
 * Admin Validation Schemas
 * Validation for all endpoints in admin.router.js
 */


// GET /users
export const getUsersQuery = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20),
  search: Joi.string().trim().max(100),
  status: Joi.string().valid('active', 'banned', 'suspended', 'warned'),
  role: Joi.string().valid('user', 'admin', 'moderator'),
  sortBy: Joi.string().valid('createdAt', 'username', 'email', 'lastLogin', 'lastLoginAt'),
  sortOrder: Joi.string().valid('asc', 'desc').default('desc'),
});

// GET /users/:userId
export const userIdParam = Joi.object({
  userId: objectId.required().messages({
    'any.required': 'User ID là bắt buộc',
    'string.pattern.base': 'User ID không hợp lệ',
  }),
});

// PUT /users/:userId
export const updateUserBody = Joi.object({
  role: Joi.string().valid('user', 'admin', 'moderator'),
  status: Joi.string().valid('active', 'warned', 'banned', 'suspended'),
  verified: Joi.boolean(),
  isVerified: Joi.boolean(),
  isAdmin: Joi.boolean(),
  isActive: Joi.boolean(),
})
  .min(1)
  .messages({
    'object.min': 'Cần ít nhất một trường để cập nhật',
  });

// POST /users/ban
export const banUserBody = Joi.object({
  userId: objectId.required().messages({
    'any.required': 'User ID là bắt buộc',
  }),
  reason: Joi.string().trim().max(500).required().messages({
    'any.required': 'Lý do ban là bắt buộc',
    'string.max': 'Lý do không được quá 500 ký tự',
  }),
  duration: Joi.number().integer().min(0), // 0 = permanent, else days
});

// POST /users/unban
export const unbanUserBody = Joi.object({
  userId: objectId.required().messages({
    'any.required': 'User ID là bắt buộc',
  }),
});

// POST /users/suspend
export const suspendUserBody = Joi.object({
  userId: objectId.required().messages({
    'any.required': 'User ID là bắt buộc',
  }),
  reason: Joi.string().trim().max(500).required().messages({
    'any.required': 'Lý do suspend là bắt buộc',
  }),
  duration: Joi.number().integer().min(1).max(365).messages({
    'number.min': 'Thời gian phải ít nhất 1 ngày',
    'number.max': 'Thời gian tối đa là 365 ngày',
  }),
  days: Joi.number().integer().min(1).max(365).messages({
    'number.min': 'Thời gian phải ít nhất 1 ngày',
    'number.max': 'Thời gian tối đa là 365 ngày',
  }),
})
  .or('duration', 'days')
  .messages({
    'object.missing': 'Thời gian suspend là bắt buộc (ngày)',
  });

// POST /users/warn
export const warnUserBody = Joi.object({
  userId: objectId.required().messages({
    'any.required': 'User ID là bắt buộc',
  }),
  reason: Joi.string().trim().max(500).required().messages({
    'any.required': 'Lý do cảnh báo là bắt buộc',
  }),
  severity: Joi.string().valid('low', 'medium', 'high').default('low'),
});


// GET /posts
export const getPostsQuery = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20),
  status: Joi.string().valid(
    'active',
    'approved',
    'pending',
    'flagged',
    'rejected',
    'hidden',
    'removed',
    'deleted'
  ),
  type: Joi.string().valid('text', 'image', 'video', 'mixed'),
  sortBy: Joi.string().valid('createdAt', 'likes', 'comments'),
  sortOrder: Joi.string().valid('asc', 'desc').default('desc'),
});

export const getCommentsQuery = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20),
  search: Joi.string().trim().max(200),
  status: Joi.string().valid(
    'active',
    'approved',
    'pending',
    'flagged',
    'hidden',
    'removed',
    'deleted'
  ),
  sortBy: Joi.string().valid('createdAt', 'likes', 'replies'),
  sortOrder: Joi.string().valid('asc', 'desc').default('desc'),
});

// POST /posts/:postId/moderate
export const postIdParam = Joi.object({
  postId: objectId.required().messages({
    'any.required': 'Post ID là bắt buộc',
  }),
});

export const moderatePostBody = Joi.object({
  action: Joi.string()
    .valid(
      'approve',
      'reject',
      'flag',
      'unflag',
      'hide',
      'unhide',
      'remove',
      'delete'
    )
    .required()
    .messages({
      'any.required': 'Hành động là bắt buộc',
      'any.only': 'Hành động không hợp lệ',
    }),
  reason: Joi.string()
    .trim()
    .max(500)
    .when('action', {
      is: Joi.string().valid('hide', 'flag', 'delete', 'reject', 'remove'),
      then: Joi.required(),
      otherwise: Joi.optional(),
    }),
});

// POST /comments/:commentId/moderate
export const commentIdParam = Joi.object({
  commentId: objectId.required().messages({
    'any.required': 'Comment ID là bắt buộc',
  }),
});

export const moderateCommentBody = Joi.object({
  action: Joi.string()
    .valid('approve', 'remove', 'hide', 'unhide', 'delete')
    .required()
    .messages({
      'any.required': 'Hành động là bắt buộc',
    }),
  reason: Joi.string()
    .trim()
    .max(500)
    .when('action', {
      is: Joi.string().valid('hide', 'delete', 'remove'),
      then: Joi.required(),
      otherwise: Joi.optional(),
    }),
});


// GET /reports
export const getReportsQuery = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20),
  status: Joi.string().valid(
    'pending',
    'reviewing',
    'in_review',
    'resolved',
    'dismissed',
    'rejected',
    'escalated'
  ),
  type: Joi.string().valid(...REPORT_TARGET_TYPES),
  targetType: Joi.string().valid(...REPORT_TARGET_TYPES),
  category: Joi.string().valid(...REPORT_CATEGORIES),
  priority: Joi.alternatives().try(
    Joi.number().integer().min(0),
    Joi.string().valid('low', 'medium', 'high', 'urgent')
  ),
  sortBy: Joi.string().valid('createdAt', 'priority'),
  sortOrder: Joi.string().valid('asc', 'desc').default('desc'),
});

// POST /reports/:reportId/review
export const reportIdParam = Joi.object({
  reportId: objectId.required().messages({
    'any.required': 'Report ID là bắt buộc',
  }),
});

export const reviewReportBody = Joi.object({
  action: Joi.string()
    .valid(
      'dismiss',
      'warn',
      'hide_content',
      'remove_content',
      'suspend_user',
      'ban_user'
    )
    .messages({
      'any.required': 'Hành động là bắt buộc',
    }),
  decision: Joi.string().valid('resolved', 'rejected', 'escalated'),
  actionTaken: Joi.string().valid(
    'warn_user',
    'remove_content',
    'suspend_user',
    'ban_user'
  ),
  notes: Joi.string().trim().max(1000),
  notifyReporter: Joi.boolean().default(true),
  notifyReported: Joi.boolean().default(true),
}).or('action', 'decision', 'actionTaken');

// PUT /reports/:reportId/resolve
export const resolveReportBody = Joi.object({
  decision: Joi.string().valid('resolved', 'rejected', 'escalated'),
  actionTaken: Joi.string().valid(
    'warn_user',
    'remove_content',
    'suspend_user',
    'ban_user'
  ),
  action: Joi.string().valid(
    'dismiss',
    'warn',
    'hide_content',
    'remove_content',
    'suspend_user',
    'ban_user'
  ),
  resolution: Joi.string()
    .valid(
      'dismissed',
      'content_removed',
      'user_warned',
      'user_suspended',
      'user_banned'
    )
    .messages({
      'any.required': 'Kết quả xử lý là bắt buộc',
    }),
  notes: Joi.string().trim().max(1000),
}).or('resolution', 'decision', 'action', 'actionTaken');


// POST /broadcast
export const broadcastBody = Joi.object({
  title: Joi.string().trim().max(100).messages({
    'string.max': 'Tiêu đề không được quá 100 ký tự',
  }),
  message: Joi.string()
    .trim()
    .max(1000)
    .when('title', {
      is: Joi.exist(),
      then: Joi.required(),
      otherwise: Joi.optional(),
    })
    .messages({
      'any.required': 'Nội dung là bắt buộc khi có tiêu đề',
      'string.max': 'Nội dung không được quá 1000 ký tự',
    }),
  content: Joi.string().trim().max(1200),
  targetAudience: Joi.string()
    .valid('all', 'active', 'verified', 'new_users')
    .default('all'),
  type: Joi.string().valid('system', 'announcement').default('system'),
  priority: Joi.string()
    .valid('low', 'normal', 'high', 'urgent')
    .default('normal'),
  link: Joi.string().uri(),
  expiresAt: Joi.date().min('now'),
}).or('message', 'content');

// GET /logs
export const getLogsQuery = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(50),
  type: Joi.string().valid('auth', 'moderation', 'system', 'error'),
  level: Joi.string().valid('info', 'warn', 'error'),
  startDate: Joi.date(),
  endDate: Joi.date().min(Joi.ref('startDate')),
  adminId: objectId,
});

// GET /dashboard/stats
export const getStatsQuery = Joi.object({
  days: Joi.number().integer().min(1).max(365).default(30),
});

// GET /analytics/top-users
export const getTopUsersQuery = Joi.object({
  limit: Joi.number().integer().min(1).max(100).default(10),
});

// GET /analytics/interactions
export const getInteractionsQuery = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20),
  type: Joi.string().valid(
    'like',
    'comment',
    'follow',
    'save',
    'share',
    'report'
  ),
  search: Joi.string().trim().max(100),
});

// GET /users/banned
export const getBannedUsersQuery = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20),
});

export default {
  getUsersQuery,
  userIdParam,
  updateUserBody,
  banUserBody,
  unbanUserBody,
  suspendUserBody,
  warnUserBody,
  getPostsQuery,
  getCommentsQuery,
  postIdParam,
  moderatePostBody,
  commentIdParam,
  moderateCommentBody,
  getReportsQuery,
  reportIdParam,
  reviewReportBody,
  resolveReportBody,
  broadcastBody,
  getLogsQuery,
  getStatsQuery,
  getTopUsersQuery,
  getInteractionsQuery,
  getBannedUsersQuery,
};
