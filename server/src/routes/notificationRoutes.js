import express from "express";
import notificationController from "../controllers/notificationController.js";
import { verifyToken } from "../middleware/auth.js";

const router = express.Router();

router.use(verifyToken);

router.get("/", notificationController.getNotifications);
router.put("/:notificationId/read", notificationController.markAsRead);
router.put("/read-all", notificationController.markAllAsRead);
router.delete("/:notificationId", notificationController.deleteNotification);

export default router;
