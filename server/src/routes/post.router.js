import express from "express";
import PostController from "../controllers/post.controller.js";
import { verifyToken } from "../middlewares/auth.middleware.js";
import upload from "../middlewares/multerUpload.js";

const router = express.Router();

router.use(verifyToken);

// ======================================
// Feeds
// ======================================
router.get("/", PostController.GetAllPost);
router.get("/explore", PostController.GetExploreFeed);
router.get("/personalized", PostController.GetPersonalizedFeed);
router.get("/trending", PostController.GetTrendingPosts);

// ======================================
// Search
// ======================================
router.get("/search", PostController.SearchPosts);
router.get("/hashtag/:hashtag", PostController.GetPostsByHashtag);
router.get("/hashtags/trending", PostController.GetTrendingHashtags);

// ======================================
// Post CRUD
// ======================================
router.post("/", upload.array("files", 10), PostController.CreatePost);
router.get("/user/:id", PostController.GetPostUserById);
router.get("/:id", PostController.GetPostById);
router.put("/:id", PostController.UpdatePost);
router.delete("/:id", PostController.DeletePost);

// ======================================
// Interactions
// ======================================
router.post("/:postId/share", PostController.sharePost);
router.post("/:postId/report", PostController.reportPost);

export default router;
