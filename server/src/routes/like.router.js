import express from "express";
import PostController from "../controllers/post.controller.js";
import { verifyToken } from "../middlewares/auth.middleware.js";

const router = express.Router();

router.use(verifyToken);

router.post("/create", PostController.CreateLike);

router.post("/delete", PostController.DeleteLike);

router.get("/status/:postId", PostController.GetLikeStatus);

router.post("/get-all", PostController.GetAllLikeFromPosts);

router.post("/toggle", PostController.ToggleLike);

router.get("/liked-posts", PostController.GetLikedPosts);

export default router;
