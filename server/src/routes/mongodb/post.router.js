import express from "express";
import PostController from "../../controllers/mongodb/post.controller.js";
import VerifyToken from "../../middlewares/middlewareController.js";
import upload from "../../middlewares/multerUpload.js";

const router = express.Router();

router.get("/posts", PostController.GetAllPost);

// router.get(
//   "/post-user",
//   VerifyToken.VerifyAccessToken,
//   PostController.GetPostPostUserById
// );

router.post(
  "/create-post",
  upload.array("media", 5),
  VerifyToken.VerifyAccessToken,
  PostController.CreatePost
);

// Cập nhật bài post
router.put("/post/:id", PostController.UpdatePost);

// Xóa bài post
router.delete("/post/:id", PostController.DeletePost);

export default router;
