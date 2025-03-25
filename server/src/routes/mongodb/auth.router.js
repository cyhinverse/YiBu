import express from "express";
import UserController from "../../controllers/mongodb/auth.controller.js";
import { verifyToken } from "../../middlewares/auth.middleware.js";
const router = express.Router();

router.post("/register", UserController.Register);
router.post("/login", UserController.Login);
router.post("/refresh-token", UserController.RefreshToken);
router.post("/logout", verifyToken, UserController.Logout);

// Account settings routes
router.put("/update-email", verifyToken, UserController.UpdateEmail);
router.put("/update-password", verifyToken, UserController.UpdatePassword);
router.post(
  "/connect-social",
  verifyToken,
  UserController.ConnectSocialAccount
);
router.post("/verify-account", verifyToken, UserController.VerifyAccount);
router.delete("/delete-account", verifyToken, UserController.DeleteAccount);

export default router;
