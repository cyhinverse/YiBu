import express from "express";
import UserController from "../../controllers/mongodb/auth.controller.js";
import VerifyToken from "../../middlewares/middlewareController.js";
const router = express.Router();

router.post("/register", UserController.Register);
router.post("/login", UserController.Login);
router.post("/refresh-token", UserController.RefreshToken);
router.post("/logout", VerifyToken.VerifyAccessToken, UserController.Logout);

// Account settings routes
router.put(
  "/update-email",
  VerifyToken.VerifyAccessToken,
  UserController.UpdateEmail
);
router.put(
  "/update-password",
  VerifyToken.VerifyAccessToken,
  UserController.UpdatePassword
);
router.post(
  "/connect-social",
  VerifyToken.VerifyAccessToken,
  UserController.ConnectSocialAccount
);
router.post(
  "/verify-account",
  VerifyToken.VerifyAccessToken,
  UserController.VerifyAccount
);
router.delete(
  "/delete-account",
  VerifyToken.VerifyAccessToken,
  UserController.DeleteAccount
);

export default router;
