import express from "express";
import NotificationController from "../controllers/notification.controller.js";
import { verifyToken } from "../middlewares/auth.middleware.js";

const router = express.Router();

router.use(verifyToken);

router.get("/", NotificationController.getNotifications);
router.post("/", NotificationController.createNotification); // Internal usage
router.get("/unread-count", NotificationController.getUnreadCount);

router.post("/read-all", NotificationController.markAllAsRead);
router.put("/:notificationId/read", NotificationController.markAsRead);
router.delete("/:notificationId", NotificationController.deleteNotification);

export default router;
