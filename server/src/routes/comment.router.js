import express from "express";
import PostController from "../controllers/post.controller.js";
import { verifyToken } from "../middlewares/auth.middleware.js";

const router = express.Router();

router.use(verifyToken);

router.post("/create", PostController.createComment);
router.get("/:postId", PostController.getCommentsByPost);
router.put("/:id", PostController.updateComment);
router.delete("/:id", PostController.deleteComment);

export default router;
