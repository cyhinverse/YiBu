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

/* GET / - Get notifications for current user */
router.get(
  '/',
  validateQuery(getNotificationsQuery),
  NotificationController.getNotifications
);
/* GET /unread-count - Get total unread notification count */
router.get('/unread-count', NotificationController.getUnreadCount);
/* GET /unread-count-by-type - Get unread count by notification type */
router.get(
  '/unread-count-by-type',
  NotificationController.getUnreadCountByType
);
/* GET /:notificationId - Get single notification by ID */
router.get(
  '/:notificationId',
  validateParams(notificationIdParam),
  NotificationController.getNotificationById
);

/* POST / - Create a new notification */
router.post(
  '/',
  validateBody(createNotificationBody),
  NotificationController.createNotification
);
/* PUT /:notificationId/read - Mark a notification as read */
router.put(
  '/:notificationId/read',
  validateParams(markAsReadParam),
  NotificationController.markAsRead
);
/* POST /read-all - Mark all notifications as read */
router.post('/read-all', NotificationController.markAllAsRead);
/* DELETE /:notificationId - Delete a notification */
router.delete(
  '/:notificationId',
  validateParams(deleteNotificationParam),
  NotificationController.deleteNotification
);
/* DELETE / - Delete all notifications */
router.delete('/', NotificationController.deleteAllNotifications);

/* GET /preferences - Get notification preferences */
router.get('/preferences', NotificationController.getNotificationPreferences);
/* PUT /preferences - Update notification preferences */
router.put(
  '/preferences',
  validateBody(updatePreferencesBody),
  NotificationController.updateNotificationPreferences
);

export default router;
