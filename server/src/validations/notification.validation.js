import Joi from 'joi';
import { objectId } from './common.validation.js';

/**
 * Notification Validation Schemas
 * Validation for all endpoints in notification.router.js
 */

const notificationType = Joi.string().valid(
  'like',
  'comment',
  'follow',
  'save',
  'mention',
  'reply',
  'tag',
  'share',
  'message',
  'system',
  'announcement'
);

// ======================================
// GET / (getNotifications)
// Query: { page?, limit?, type?, unreadOnly? }
// ======================================
export const getNotificationsQuery = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(50).default(20),
  type: notificationType,
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
// Body: { recipient, type, content, title?, metadata? }
// ======================================
export const createNotificationBody = Joi.object({
  recipient: objectId.required(),
  sender: objectId,
  type: notificationType.required(),
  content: Joi.string().trim().max(500).required(),
  title: Joi.string().trim().max(100),
  relatedPost: objectId,
  relatedComment: objectId,
  groupKey: Joi.string(),
  metadata: Joi.object(),
});

export const bulkNotificationActionBody = Joi.object({
  type: notificationType.optional(),
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
  newFollower: Joi.boolean(),
  messages: Joi.boolean(),
  directMessages: Joi.boolean(),
  mentions: Joi.boolean(),
  replies: Joi.boolean(),
  shares: Joi.boolean(),
  saves: Joi.boolean(),
  tags: Joi.boolean(),
  systemUpdates: Joi.boolean(),
  email: Joi.alternatives().try(
    Joi.boolean(),
    Joi.object({
      enabled: Joi.boolean(),
      accountUpdates: Joi.boolean(),
      newFeatures: Joi.boolean(),
      marketing: Joi.boolean(),
      digest: Joi.string().valid('none', 'daily', 'weekly'),
    })
  ),
  push: Joi.alternatives().try(
    Joi.boolean(),
    Joi.object({
      enabled: Joi.boolean(),
      likes: Joi.boolean(),
      comments: Joi.boolean(),
      follows: Joi.boolean(),
      messages: Joi.boolean(),
      mentions: Joi.boolean(),
      shares: Joi.boolean(),
      replies: Joi.boolean(),
      saves: Joi.boolean(),
      tags: Joi.boolean(),
      systemUpdates: Joi.boolean(),
      sound: Joi.boolean(),
      vibration: Joi.boolean(),
    })
  ),
  sound: Joi.boolean(),
  vibration: Joi.boolean(),
})
  .min(1)
  .rename('newFollower', 'follows', { ignoreUndefined: true, override: false })
  .rename('directMessages', 'messages', {
    ignoreUndefined: true,
    override: false,
  });

export default {
  getNotificationsQuery,
  notificationIdParam,
  createNotificationBody,
  bulkNotificationActionBody,
  markAsReadParam,
  deleteNotificationParam,
  updatePreferencesBody,
};
