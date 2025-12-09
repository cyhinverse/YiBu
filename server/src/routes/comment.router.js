import express from "express";
import PostController from "../controllers/post.controller.js";
import { verifyToken } from "../middlewares/auth.middleware.js";

const router = express.Router();

router.use(verifyToken);

// ======================================
// Comment CRUD
// ======================================
router.post("/", PostController.createComment);
router.get("/post/:postId", PostController.getCommentsByPost);
router.get("/:commentId/replies", PostController.getCommentReplies);
router.put("/:id", PostController.updateComment);
router.delete("/:id", PostController.deleteComment);

// ======================================
// Comment Likes
// ======================================
router.post("/:commentId/like", PostController.likeComment);
router.delete("/:commentId/like", PostController.unlikeComment);

export default router;
