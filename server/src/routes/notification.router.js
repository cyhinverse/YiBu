import express from "express";
import NotificationController from "../controllers/notification.controller.js";
import { verifyToken } from "../middlewares/auth.middleware.js";

const router = express.Router();

router.use(verifyToken);

// ======================================
// Get Notifications
// ======================================
router.get("/", NotificationController.getNotifications);
router.get("/unread-count", NotificationController.getUnreadCount);
router.get(
  "/unread-count-by-type",
  NotificationController.getUnreadCountByType
);
router.get("/:notificationId", NotificationController.getNotificationById);

// ======================================
// Notification Actions
// ======================================
router.post("/", NotificationController.createNotification); // Internal/admin use
router.put("/:notificationId/read", NotificationController.markAsRead);
router.post("/read-all", NotificationController.markAllAsRead);
router.delete("/:notificationId", NotificationController.deleteNotification);
router.delete("/", NotificationController.deleteAllNotifications);

// ======================================
// Notification Preferences
// ======================================
router.get("/preferences", NotificationController.getNotificationPreferences);
router.put(
  "/preferences",
  NotificationController.updateNotificationPreferences
);

export default router;
