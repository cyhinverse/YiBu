import express from "express";
import PostController from "../controllers/post.controller.js";

const router = express.Router();

router.get("/posts", PostController.GetAllPost);

router.get("/post/:id", PostController.GetPost);

router.post("/create-post", PostController.CreatePost);

router.put("/post/:id", PostController.UpdatePost);

router.delete("/post/:id", PostController.DeletePost);

export default router;
