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

/* POST /register - Register new user account */
router.post(
  '/register',
  authRateLimiter,
  validateBody(registerBody),
  AuthController.Register
);
/* POST /login - User login */
router.post(
  '/login',
  authRateLimiter,
  validateBody(loginBody),
  AuthController.Login
);
/* POST /google - Google OAuth authentication */
router.post(
  '/google',
  authRateLimiter,
  validateBody(googleAuthBody),
  AuthController.GoogleAuth
);

/* POST /password/reset-request - Request password reset email */
router.post(
  '/password/reset-request',
  authRateLimiter,
  validateBody(forgotPasswordBody),
  AuthController.RequestPasswordReset
);
/* POST /password/reset - Reset password using token */
router.post(
  '/password/reset',
  authRateLimiter,
  validateBody(resetPasswordBody),
  AuthController.ResetPassword
);

/* POST /refresh - Refresh access token */
router.post(
  '/refresh',
  validateBody(refreshTokenBody),
  AuthController.RefreshToken
);

router.use(verifyToken);

/* POST /logout - Logout user */
router.post('/logout', AuthController.Logout);
/* POST /logout-all - Logout from all devices */
router.post('/logout-all', AuthController.LogoutAllDevices);

/* PUT /password - Update user password */
router.put(
  '/password',
  validateBody(updatePasswordBody),
  AuthController.UpdatePassword
);

/* POST /2fa/enable - Enable two-factor authentication */
router.post('/2fa/enable', AuthController.EnableTwoFactor);
/* POST /2fa/verify - Verify and complete 2FA setup */
router.post(
  '/2fa/verify',
  validateBody(verifyTwoFactorBody),
  AuthController.VerifyTwoFactor
);
/* POST /2fa/disable - Disable two-factor authentication */
router.post('/2fa/disable', AuthController.DisableTwoFactor);

/* GET /sessions - Get all active login sessions */
router.get('/sessions', AuthController.GetActiveSessions);
/* DELETE /sessions/:sessionId - Revoke a specific session */
router.delete(
  '/sessions/:sessionId',
  validateParams(sessionIdParam),
  AuthController.RevokeSession
);

export default router;
