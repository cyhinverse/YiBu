import express from "express";
import NotificationController from "../../controllers/mongodb/notification.controller.js";
import { verifyToken } from "../../middlewares/auth.middleware.js";

const router = express.Router();

router.use(verifyToken);

// Tạo thông báo mới
router.post("/", NotificationController.createNotification);

// Get all notifications with pagination
router.get("/", NotificationController.getNotifications);

// Mark a notification as read
router.put("/:notificationId/read", NotificationController.markAsRead);

// Mark all notifications as read
router.put("/read-all", NotificationController.markAllAsRead);

// Delete a notification
router.delete("/:notificationId", NotificationController.deleteNotification);

// Get unread notifications count
router.get("/unread-count", NotificationController.getUnreadCount);

export default router;
