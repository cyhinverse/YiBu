import express from "express";
import LikeController from "../controllers/mongodb/like.controller.js";
import { verifyToken } from "../middleware/auth.middleware.js";

const router = express.Router();

router.use(verifyToken);

router.post("/create", LikeController.CreateLike);

router.post("/delete", LikeController.DeleteLike);

router.get("/status/:postId", LikeController.GetLikeStatus);

router.post("/get-all", LikeController.GetAllLikeFromPosts);

export default router;
