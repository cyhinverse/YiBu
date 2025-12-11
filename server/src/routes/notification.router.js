import express from 'express';
import NotificationController from '../controllers/notification.controller.js';
import { verifyToken } from '../middlewares/auth.middleware.js';
import {
  validateBody,
  validateParams,
  validateQuery,
} from '../middlewares/validation.middleware.js';
import {
  getNotificationsQuery,
  notificationIdParam,
  createNotificationBody,
  markAsReadParam,
  deleteNotificationParam,
  updatePreferencesBody,
} from '../validations/notification.validation.js';

const router = express.Router();

router.use(verifyToken);

// ======================================
// Get Notifications
// ======================================
router.get(
  '/',
  validateQuery(getNotificationsQuery),
  NotificationController.getNotifications
);
router.get('/unread-count', NotificationController.getUnreadCount);
router.get(
  '/unread-count-by-type',
  NotificationController.getUnreadCountByType
);
router.get(
  '/:notificationId',
  validateParams(notificationIdParam),
  NotificationController.getNotificationById
);

// ======================================
// Notification Actions
// ======================================
router.post(
  '/',
  validateBody(createNotificationBody),
  NotificationController.createNotification
); // Internal/admin use
router.put(
  '/:notificationId/read',
  validateParams(markAsReadParam),
  NotificationController.markAsRead
);
router.post('/read-all', NotificationController.markAllAsRead);
router.delete(
  '/:notificationId',
  validateParams(deleteNotificationParam),
  NotificationController.deleteNotification
);
router.delete('/', NotificationController.deleteAllNotifications);

// ======================================
// Notification Preferences
// ======================================
router.get('/preferences', NotificationController.getNotificationPreferences);
router.put(
  '/preferences',
  validateBody(updatePreferencesBody),
  NotificationController.updateNotificationPreferences
);

export default router;
