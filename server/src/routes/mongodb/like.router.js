import express from "express";
import LikeController from "../../controllers/mongodb/like.controller.js";
import VerifyToken from "../../middlewares/middlewareController.js";
const router = express.Router();

router.post(
  "/create-like",
  VerifyToken.VerifyAccessToken,
  LikeController.CreateLike
);

router.get("/post/:postId");

router.get("/likes", )

router.delete(
  "/delete-like",
  VerifyToken.VerifyAccessToken,
  LikeController.DeleteLike
);

router.get("/user/:userId");

router.get("/post/:postId");

export default router;
