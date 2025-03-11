import express from "express";
import PostController from "../../controllers/mongodb/post.controller.js";
import multer from "multer";
import VerifyToken from "../../middlewares/middlewareController.js";

const upload = multer({ dest: "uploads/" });

const router = express.Router();

router.get("/posts", PostController.GetAllPost);

router.get(
  "/post-user",
  VerifyToken.VerifyAccessToken,
  PostController.GetPostPostUserById
);

router.post(
  "/create-post",
  upload.array("media"),
  VerifyToken.VerifyAccessToken,
  PostController.CreatePost
);

router.put("/post/:id", PostController.UpdatePost);

router.delete("/post/:id", PostController.DeletePost);

router.post("/posts-user");

export default router;
