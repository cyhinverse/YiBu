import Joi from 'joi';
import { objectId, paginationQuery } from './common.validation.js';

/**
 * User Validation Schemas
 * Validation for all endpoints in user.router.js
 */

// ======================================
// GET /search
// Query: { q, page?, limit? }
// ======================================
export const searchUsersQuery = Joi.object({
  q: Joi.string().trim().min(1).max(100).required().messages({
    'string.empty': 'Từ khóa tìm kiếm không được để trống',
    'string.min': 'Từ khóa phải có ít nhất 1 ký tự',
    'any.required': 'Từ khóa tìm kiếm là bắt buộc',
  }),
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(50).default(20),
});

// ======================================
// GET /suggestions
// Query: { limit? }
// ======================================
export const suggestionsQuery = Joi.object({
  limit: Joi.number().integer().min(1).max(20).default(10),
});

// ======================================
// GET /profile/:id
// Params: { id } - can be ObjectId or username
// ======================================
export const profileIdParam = Joi.object({
  id: Joi.alternatives()
    .try(
      objectId,
      Joi.string()
        .trim()
        .min(3)
        .max(30)
        .pattern(/^[a-zA-Z0-9_]+$/)
    )
    .required()
    .messages({
      'alternatives.match': 'ID hoặc username không hợp lệ',
      'any.required': 'ID hoặc username là bắt buộc',
    }),
});

// ======================================
// PUT /profile
// Body: { name?, bio?, location?, website?, dateOfBirth? }
// ======================================
export const updateProfileBody = Joi.object({
  name: Joi.string().trim().min(2).max(50).messages({
    'string.min': 'Tên phải có ít nhất 2 ký tự',
    'string.max': 'Tên không được quá 50 ký tự',
  }),
  bio: Joi.string().trim().max(500).allow('').messages({
    'string.max': 'Bio không được quá 500 ký tự',
  }),
  location: Joi.string().trim().max(100).allow('').messages({
    'string.max': 'Location không được quá 100 ký tự',
  }),
  website: Joi.string().trim().allow('').messages({
    'string.uri': 'Website không hợp lệ',
  }),
  dateOfBirth: Joi.date().max('now').allow(null).messages({
    'date.max': 'Ngày sinh không hợp lệ',
  }),
  gender: Joi.string().valid('male', 'female', 'other', 'prefer_not_to_say'),
  cover: Joi.string().allow(''),
});

// ======================================
// GET /check-follow/:targetUserId
// Params: { targetUserId } - can be ObjectId or username
// ======================================
export const targetUserIdParam = Joi.object({
  targetUserId: Joi.alternatives()
    .try(
      objectId,
      Joi.string()
        .trim()
        .min(3)
        .max(30)
        .pattern(/^[a-zA-Z0-9_]+$/)
    )
    .required()
    .messages({
      'alternatives.match': 'ID hoặc username không hợp lệ',
      'any.required': 'ID hoặc username là bắt buộc',
    }),
});

// ======================================
// POST /follow
// Body: { targetUserId } - can be ObjectId or username
// ======================================
const usernamePattern = Joi.string()
  .pattern(/^[a-zA-Z0-9_]{3,30}$/)
  .messages({
    'string.pattern.base': 'Username không hợp lệ',
  });

export const followBody = Joi.object({
  targetUserId: Joi.alternatives()
    .try(objectId, usernamePattern)
    .required()
    .messages({
      'any.required': 'ID người dùng cần follow là bắt buộc',
      'alternatives.match': 'ID hoặc username không hợp lệ',
    }),
});

// ======================================
// POST /unfollow
// Body: { targetUserId } - can be ObjectId or username
// ======================================
export const unfollowBody = Joi.object({
  targetUserId: Joi.alternatives()
    .try(objectId, usernamePattern)
    .required()
    .messages({
      'any.required': 'ID người dùng cần unfollow là bắt buộc',
      'alternatives.match': 'ID hoặc username không hợp lệ',
    }),
});

// ======================================
// GET /followers/:userId, GET /following/:userId
// Params: { userId }
// Query: { page?, limit? }
// ======================================
export const userIdParam = Joi.object({
  userId: objectId.required(),
});

export const followListQuery = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(50).default(20),
});

// ======================================
// POST /follow-requests/:requestId/accept, reject
// Params: { requestId }
// ======================================
export const requestIdParam = Joi.object({
  requestId: objectId.required(),
});

// ======================================
// POST /block/:userId, DELETE /block/:userId
// POST /mute/:userId, DELETE /mute/:userId
// Params: { userId }
// ======================================
export const blockMuteUserIdParam = Joi.object({
  userId: objectId.required(),
});

// ======================================
// PUT /settings/privacy
// Body: { isPrivate?, allowTagging?, allowMentions?, showOnlineStatus? }
// ======================================
export const updatePrivacyBody = Joi.object({
  isPrivate: Joi.boolean(),
  allowTagging: Joi.string().valid('everyone', 'followers', 'no_one'),
  allowMentions: Joi.string().valid('everyone', 'followers', 'no_one'),
  showOnlineStatus: Joi.boolean(),
  showLastSeen: Joi.boolean(),
  showReadReceipts: Joi.boolean(),
});

// ======================================
// PUT /settings/notifications
// Body: { likes?, comments?, follows?, messages?, mentions? }
// ======================================
export const updateNotificationBody = Joi.object({
  likes: Joi.boolean(),
  comments: Joi.boolean(),
  follows: Joi.boolean(),
  messages: Joi.boolean(),
  mentions: Joi.boolean(),
  emailNotifications: Joi.boolean(),
  pushNotifications: Joi.boolean(),
});

// ======================================
// PUT /settings/security
// Body: { twoFactorEnabled?, loginAlerts? }
// ======================================
export const updateSecurityBody = Joi.object({
  twoFactorEnabled: Joi.boolean(),
  loginAlerts: Joi.boolean(),
  trustedDevicesOnly: Joi.boolean(),
});

// ======================================
// PUT /settings/content
// Body: { language?, sensitiveContent?, autoplayVideos? }
// ======================================
export const updateContentBody = Joi.object({
  language: Joi.string().max(10),
  sensitiveContent: Joi.boolean(),
  autoplayVideos: Joi.boolean(),
  dataUsage: Joi.string().valid('low', 'medium', 'high'),
});

// ======================================
// PUT /settings/theme
// Body: { theme, fontSize? }
// ======================================
export const updateThemeBody = Joi.object({
  theme: Joi.string().valid('light', 'dark', 'system').required().messages({
    'any.required': 'Theme là bắt buộc',
    'any.only': 'Theme phải là light, dark hoặc system',
  }),
  fontSize: Joi.string().valid('small', 'medium', 'large'),
  accentColor: Joi.string().pattern(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/),
  primaryColor: Joi.string()
    .pattern(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/)
    .allow(''),
  secondaryColor: Joi.string()
    .pattern(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/)
    .allow(''),
  textColor: Joi.string()
    .pattern(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/)
    .allow(''),
});

// ======================================
// POST /settings/devices
// Body: { deviceName, deviceType }
// ======================================
export const addDeviceBody = Joi.object({
  deviceName: Joi.string().trim().min(1).max(50).required().messages({
    'string.empty': 'Tên thiết bị không được để trống',
    'any.required': 'Tên thiết bị là bắt buộc',
  }),
  deviceType: Joi.string()
    .valid('mobile', 'tablet', 'desktop', 'other')
    .required()
    .messages({
      'any.required': 'Loại thiết bị là bắt buộc',
    }),
});

// ======================================
// DELETE /settings/devices/:deviceId
// Params: { deviceId }
// ======================================
export const deviceIdParam = Joi.object({
  deviceId: objectId.required(),
});

// ======================================
// GET /:id (Get User By Id)
// Params: { id }
// ======================================
export const getUserByIdParam = Joi.object({
  id: objectId.required(),
});

// GET /mutual-followers/:targetUserId
export const getMutualFollowersQuery = Joi.object({
  limit: Joi.number().integer().min(1).max(50).default(10),
});

// GET /follow-requests/pending
export const getPendingFollowRequestsQuery = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(50).default(20),
});

export default {
  searchUsersQuery,
  suggestionsQuery,
  profileIdParam,
  updateProfileBody,
  targetUserIdParam,
  followBody,
  unfollowBody,
  userIdParam,
  followListQuery,
  requestIdParam,
  blockMuteUserIdParam,
  updatePrivacyBody,
  updateNotificationBody,
  updateSecurityBody,
  updateContentBody,
  updateThemeBody,
  addDeviceBody,
  deviceIdParam,
  getUserByIdParam,
  getMutualFollowersQuery,
  getPendingFollowRequestsQuery,
};
