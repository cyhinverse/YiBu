import express from "express";
import MessageController from "../../controllers/mongodb/message.controller.js";
import { verifyToken } from "../../middleware/auth.middleware.js";

const router = express.Router();

// Bảo vệ tất cả routes với middleware xác thực
router.use(verifyToken);

// Tạo tin nhắn mới
router.post("/", MessageController.createMessage);

// Lấy tin nhắn giữa 2 người dùng
router.get("/user/:userId", MessageController.getMessages);

// Đánh dấu tin nhắn đã đọc
router.patch("/:messageId/read", MessageController.markAsRead);

// Xóa tin nhắn
router.delete("/:messageId", MessageController.deleteMessage);

export default router;
