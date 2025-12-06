import express from "express";
import PostController from "../controllers/post.controller.js";
import { verifyToken } from "../middlewares/auth.middleware.js";
import upload from "../middlewares/multerUpload.js";

const router = express.Router();

router.use(verifyToken);

router.get("/", PostController.GetAllPost);
router.post("/", upload.array("files"), PostController.CreatePost); // Assuming "files" is the field name

router.get("/user/:id", PostController.GetPostUserById);

router.put("/:id", PostController.UpdatePost);
router.delete("/:id", PostController.DeletePost);

export default router;
