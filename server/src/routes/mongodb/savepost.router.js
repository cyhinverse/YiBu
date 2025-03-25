import express from "express";
import SavePostController from "../../controllers/mongodb/savepost.controller.js";
import { verifyToken } from "../../middlewares/auth.middleware.js";

const router = express.Router();

router.use(verifyToken);

// Save a post
router.post("/:postId", SavePostController.savePost);

// Unsave a post
router.delete("/:postId", SavePostController.unsavePost);

// Get all saved posts with pagination
router.get("/", SavePostController.getSavedPosts);

// Check if a post is saved by the user
router.get("/check/:postId", SavePostController.checkSavedStatus);

export default router;
