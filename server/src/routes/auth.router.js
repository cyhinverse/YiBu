import express from "express";
import AuthController from "../controllers/auth.controller.js";
import { verifyToken } from "../middlewares/auth.middleware.js";

const router = express.Router();

router.post("/register", AuthController.Register);
router.post("/login", AuthController.Login);
router.post("/refresh", verifyToken, AuthController.RefreshToken);
router.post("/logout", verifyToken, AuthController.Logout);

router.post("/verify", verifyToken, AuthController.VerifyAccount);
router.post("/connect", verifyToken, AuthController.ConnectSocialAccount);

router.put("/update-email", verifyToken, AuthController.UpdateEmail);
router.put("/update-password", verifyToken, AuthController.UpdatePassword);

router.delete("/delete", verifyToken, AuthController.DeleteAccount);

export default router;
