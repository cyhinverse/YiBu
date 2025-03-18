import express from "express";
import PostController from "../../controllers/mongodb/post.controller.js";
import VerifyToken from "../../middlewares/middlewareController.js";
import upload from "../../middlewares/multerUpload.js";

const router = express.Router();

router.get("/posts", PostController.GetAllPost);

router.get("/post-user/:id", PostController.GetPostUserById);

router.post(
  "/create-post",
  upload.array("media", 5),
  VerifyToken.VerifyAccessToken,
  PostController.CreatePost
);

router.put("/post/:id", PostController.UpdatePost);

router.delete("/post/:id", PostController.DeletePost);

export default router;
