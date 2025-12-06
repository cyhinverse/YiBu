import express from "express";
import UserController from "../controllers/user.controller.js";
import { verifyToken } from "../middlewares/auth.middleware.js";
import upload from "../middlewares/multerUpload.js";

const router = express.Router();

router.use(verifyToken);

router.get("/:id", UserController.GET_PROFILE_BY_ID);
router.put("/", upload.fields([{ name: "avatar", maxCount: 1 }]), UserController.updateProfileSettings);

export default router;
