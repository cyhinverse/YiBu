import express from "express";
import PostController from "../controllers/post.controller.js";
import { verifyToken } from "../middlewares/auth.middleware.js";

const router = express.Router();

router.use(verifyToken);

// ======================================
// Saved Posts
// ======================================
router.get("/", PostController.getSavedPosts);
router.get("/collections", PostController.getSavedCollections);
router.get("/:postId/status", PostController.checkSavedStatus);

router.post("/:postId", PostController.savePost);
router.delete("/:postId", PostController.unsavePost);

export default router;
