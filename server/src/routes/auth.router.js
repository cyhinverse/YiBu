import express from "express";
import AuthController from "../controllers/auth.controller.js";
import { verifyToken } from "../middlewares/auth.middleware.js";

const router = express.Router();

// ======================================
// Public Routes
// ======================================
router.post("/register", AuthController.Register);
router.post("/login", AuthController.Login);
router.post("/google", AuthController.GoogleAuth);

// Password Reset
router.post("/password/reset-request", AuthController.RequestPasswordReset);
router.post("/password/reset", AuthController.ResetPassword);

// ======================================
// Protected Routes (require auth)
// ======================================
router.use(verifyToken);

// Token Management
router.post("/refresh", AuthController.RefreshToken);
router.post("/logout", AuthController.Logout);
router.post("/logout-all", AuthController.LogoutAllDevices);

// Password
router.put("/password", AuthController.UpdatePassword);

// Two-Factor Authentication
router.post("/2fa/enable", AuthController.EnableTwoFactor);
router.post("/2fa/verify", AuthController.VerifyTwoFactor);
router.post("/2fa/disable", AuthController.DisableTwoFactor);

// Session Management
router.get("/sessions", AuthController.GetActiveSessions);
router.delete("/sessions/:sessionId", AuthController.RevokeSession);

export default router;
