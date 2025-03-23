import express from "express";
import CommentController from "../../controllers/mongodb/comment.controller.js";
import VerifyToken from "../../middlewares/middlewareController.js";

const router = express.Router();

// Tạo comment mới
router.post(
  "/",
  VerifyToken.VerifyAccessToken,
  CommentController.createComment
);

// Lấy tất cả comments cho một bài viết
router.get("/post/:postId", CommentController.getCommentsByPost);

// Cập nhật comment
router.put(
  "/:id",
  VerifyToken.VerifyAccessToken,
  CommentController.updateComment
);

// Xóa comment
router.delete(
  "/:id",
  VerifyToken.VerifyAccessToken,
  CommentController.deleteComment
);

export default router;
