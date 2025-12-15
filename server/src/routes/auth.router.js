import express from 'express';
import AuthController from '../controllers/auth.controller.js';
import { verifyToken } from '../middlewares/auth.middleware.js';
import { authRateLimiter } from '../middlewares/security.middleware.js';
import {
  validateBody,
  validateParams,
} from '../middlewares/validation.middleware.js';
import {
  registerBody,
  loginBody,
  googleAuthBody,
  forgotPasswordBody,
  resetPasswordBody,
  refreshTokenBody,
  updatePasswordBody,
  verifyTwoFactorBody,
  sessionIdParam,
} from '../validations/auth.validation.js';

const router = express.Router();

// ======================================
// Public Routes (với rate limiting và validation)
// ======================================
router.post(
  '/register',
  authRateLimiter,
  validateBody(registerBody),
  AuthController.Register
);
router.post(
  '/login',
  authRateLimiter,
  validateBody(loginBody),
  AuthController.Login
);
router.post(
  '/google',
  authRateLimiter,
  validateBody(googleAuthBody),
  AuthController.GoogleAuth
);

// Password Reset (với rate limiting)
router.post(
  '/password/reset-request',
  authRateLimiter,
  validateBody(forgotPasswordBody),
  AuthController.RequestPasswordReset
);
router.post(
  '/password/reset',
  authRateLimiter,
  validateBody(resetPasswordBody),
  AuthController.ResetPassword
);

// Token Management (Public because access token might be expired)
router.post(
  '/refresh',
  validateBody(refreshTokenBody),
  AuthController.RefreshToken
);

// ======================================
// Protected Routes (require auth)
// ======================================
router.use(verifyToken);

router.post('/logout', AuthController.Logout);
router.post('/logout-all', AuthController.LogoutAllDevices);

// Password
router.put(
  '/password',
  validateBody(updatePasswordBody),
  AuthController.UpdatePassword
);

// Two-Factor Authentication
router.post('/2fa/enable', AuthController.EnableTwoFactor);
router.post(
  '/2fa/verify',
  validateBody(verifyTwoFactorBody),
  AuthController.VerifyTwoFactor
);
router.post('/2fa/disable', AuthController.DisableTwoFactor);

// Session Management
router.get('/sessions', AuthController.GetActiveSessions);
router.delete(
  '/sessions/:sessionId',
  validateParams(sessionIdParam),
  AuthController.RevokeSession
);

export default router;
