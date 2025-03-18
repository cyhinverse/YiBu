import express from "express";
import LikeController from "../../controllers/mongodb/like.controller.js";
import VerifyToken from "../../middlewares/middlewareController.js";
const router = express.Router();

router.post(
  "/create-like",
  VerifyToken.VerifyAccessToken,
  LikeController.CreateLike
);

router.delete(
  "/delete-like",
  VerifyToken.VerifyAccessToken,
  LikeController.DeleteLike
);

router.get(
  "/post/:postId",
  VerifyToken.VerifyAccessToken,
  LikeController.GetLikeStatus
);

router.post(
  "/getAllLikes",
  VerifyToken.VerifyAccessToken,
  LikeController.GetAllLikeFromPosts
);

export default router;
