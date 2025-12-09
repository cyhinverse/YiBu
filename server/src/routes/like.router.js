import express from "express";
import PostController from "../controllers/post.controller.js";
import { verifyToken } from "../middlewares/auth.middleware.js";

const router = express.Router();

router.use(verifyToken);

// ======================================
// Like Operations
// ======================================
router.post("/", PostController.CreateLike);
router.delete("/", PostController.DeleteLike);
router.post("/toggle", PostController.ToggleLike);

// ======================================
// Like Status
// ======================================
router.get("/status/:postId", PostController.GetLikeStatus);
router.post("/batch-status", PostController.GetAllLikeFromPosts);
router.get("/post/:postId/users", PostController.GetPostLikes);

// ======================================
// User's Liked Posts
// ======================================
router.get("/my-likes", PostController.GetLikedPosts);

export default router;
