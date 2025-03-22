import express from "express";
import savePostController from "../controllers/savePostController.js";
import { verifyToken } from "../middleware/auth.js";

const router = express.Router();

router.use(verifyToken);

router.post("/:postId", savePostController.savePost);
router.delete("/:postId", savePostController.unsavePost);
router.get("/", savePostController.getSavedPosts);
router.get("/check/:postId", savePostController.checkSavedStatus);

export default router;
