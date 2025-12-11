import Joi from 'joi';
import { objectId } from './common.validation.js';

/**
 * Notification Validation Schemas
 * Validation cho tất cả endpoints trong notification.router.js
 */

// ======================================
// GET / (getNotifications)
// Query: { page?, limit?, type?, unreadOnly? }
// ======================================
export const getNotificationsQuery = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(50).default(20),
  type: Joi.string().valid(
    'like',
    'comment',
    'follow',
    'mention',
    'reply',
    'share',
    'message',
    'system'
  ),
  unreadOnly: Joi.boolean().default(false),
});

// ======================================
// GET /:notificationId (getNotificationById)
// Params: { notificationId }
// ======================================
export const notificationIdParam = Joi.object({
  notificationId: objectId.required(),
});

// ======================================
// POST / (createNotification - Admin/Internal)
// Body: { userId, type, title, message, data? }
// ======================================
export const createNotificationBody = Joi.object({
  userId: objectId.required().messages({
    'any.required': 'User ID là bắt buộc',
  }),
  type: Joi.string()
    .valid(
      'like',
      'comment',
      'follow',
      'mention',
      'reply',
      'share',
      'message',
      'system'
    )
    .required()
    .messages({
      'any.only': 'Loại thông báo không hợp lệ',
      'any.required': 'Loại thông báo là bắt buộc',
    }),
  title: Joi.string().trim().max(100).required().messages({
    'string.max': 'Tiêu đề không được quá 100 ký tự',
    'any.required': 'Tiêu đề là bắt buộc',
  }),
  message: Joi.string().trim().max(500).required().messages({
    'string.max': 'Nội dung không được quá 500 ký tự',
    'any.required': 'Nội dung là bắt buộc',
  }),
  data: Joi.object({
    postId: objectId,
    commentId: objectId,
    userId: objectId,
    link: Joi.string().uri(),
  }),
});

// ======================================
// PUT /:notificationId/read (markAsRead)
// Params: { notificationId }
// ======================================
export const markAsReadParam = Joi.object({
  notificationId: objectId.required(),
});

// ======================================
// DELETE /:notificationId (deleteNotification)
// Params: { notificationId }
// ======================================
export const deleteNotificationParam = Joi.object({
  notificationId: objectId.required(),
});

// ======================================
// PUT /preferences (updateNotificationPreferences)
// Body: { likes?, comments?, follows?, messages?, mentions?, email?, push? }
// ======================================
export const updatePreferencesBody = Joi.object({
  likes: Joi.boolean(),
  comments: Joi.boolean(),
  follows: Joi.boolean(),
  messages: Joi.boolean(),
  mentions: Joi.boolean(),
  replies: Joi.boolean(),
  shares: Joi.boolean(),
  email: Joi.boolean(),
  push: Joi.boolean(),
  sound: Joi.boolean(),
  quietHoursEnabled: Joi.boolean(),
  quietHoursStart: Joi.string().pattern(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/), // HH:mm
  quietHoursEnd: Joi.string().pattern(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/),
});

export default {
  getNotificationsQuery,
  notificationIdParam,
  createNotificationBody,
  markAsReadParam,
  deleteNotificationParam,
  updatePreferencesBody,
};
