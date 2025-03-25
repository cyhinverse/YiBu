import express from "express";
import CommentController from "../../controllers/mongodb/comment.controller.js";
import { verifyToken } from "../../middlewares/auth.middleware.js";

const router = express.Router();

// Tạo comment mới
router.post("/", verifyToken, CommentController.createComment);

// Lấy tất cả comments cho một bài viết
router.get("/post/:postId", CommentController.getCommentsByPost);

// Cập nhật comment
router.put("/:id", verifyToken, CommentController.updateComment);

// Xóa comment
router.delete("/:id", verifyToken, CommentController.deleteComment);

export default router;
