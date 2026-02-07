import { CatchError } from '../../configs/CatchError.js';
import AuthService from './auth.service.js';
import { sendCreated, sendOk } from '../../helpers/apiResponse.js';
import { setAuthCookies, clearAuthCookies } from '../../configs/cookieOptions.js';
import logger from '../../configs/logger.js';
import ApiError from '../../helpers/ApiError.js';


/**
 * Auth Controller
 * Handle all authentication-related requests
 *
 * Main features:
 * - Registration and login
 * - Token management (refresh, logout)
 * - Password management (change, reset)
 * - Email verification
 * - Two-Factor Authentication (2FA)
 * - Session management
 * - OAuth (Google)
 */
const AuthController = {
  /**
   * Register new user account
   * @param {Object} req - Express request object
   * @param {Object} req.body - Request body
   * @param {string} req.body.name - User's full name
   * @param {string} req.body.email - User's email address
   * @param {string} req.body.password - User's password
   * @param {string} req.body.username - User's unique username
   * @param {Object} res - Express response object
   * @returns {Object} Response with user data and access token cookie
   */
  Register: CatchError(async (req, res) => {
    const { name, email, password, username } = req.body;

    if (!name || !password || !email) {
      throw ApiError.badRequest('Vui lòng điền đầy đủ thông tin bắt buộc');
    }

    if (!username) {
      throw ApiError.badRequest('Username là bắt buộc');
    }


    const { user, accessToken, refreshToken } = await AuthService.register({
      name,
      email,
      password,
      username,
    });

    setAuthCookies(res, accessToken, refreshToken);

    return sendCreated(res, {
      message: 'Đăng ký tài khoản thành công',
      data: user,
    });

  }),

  /**
   * Login user and return tokens
   * @param {Object} req - Express request object
   * @param {Object} req.body - Request body
   * @param {string} req.body.email - User's email address
   * @param {string} req.body.password - User's password
   * @param {string} [req.body.platform='web'] - Login platform (web/mobile/desktop)
   * @param {Object} res - Express response object
   * @returns {Object} Response with user data and HttpOnly cookies for tokens
   */
  Login: CatchError(async (req, res) => {
    const { email, password, twoFactorToken } = req.body;

    if (!email || !password) {
      throw ApiError.badRequest('Vui lòng nhập email và mật khẩu');
    }


    const deviceInfo = {
      userAgent: req.headers['user-agent'],
      ip: req.ip || req.connection?.remoteAddress,
      platform: req.body.platform || 'web',
    };

    const { user, accessToken, refreshToken } = await AuthService.login(
      { email, password, twoFactorToken },
      deviceInfo
    );

    setAuthCookies(res, accessToken, refreshToken);

    return sendOk(res, {
      message: 'Đăng nhập thành công',
      data: user,
      meta: { twoFactorRequired: false },
    });

  }),

  /**
   * Refresh access token using refresh token
   * @param {Object} req - Express request object
   * @param {Object} [req.cookies] - Request cookies
   * @param {string} [req.cookies.refreshToken] - Refresh token from cookie
   * @param {Object} [req.body] - Request body
   * @param {string} [req.body.refreshToken] - Refresh token from body (fallback)
   * @param {Object} res - Express response object
   * @returns {Object} Response with new HttpOnly cookies for tokens
   */
  RefreshToken: CatchError(async (req, res) => {
    const refreshToken = req.cookies?.refreshToken || req.body.refreshToken;

    if (!refreshToken) {
      throw ApiError.unauthorized('Refresh token không hợp lệ');
    }


    const deviceInfo = {
      userAgent: req.headers['user-agent'],
      ip: req.ip || req.connection?.remoteAddress,
    };

    const { accessToken, refreshToken: newRefreshToken } =
      await AuthService.refreshToken(refreshToken, deviceInfo);

    setAuthCookies(res, accessToken, newRefreshToken);

    return sendOk(res, {
      message: 'Token refreshed successfully',
    });

  }),

  /**
   * Logout user and invalidate tokens
   * @param {Object} req - Express request object
   * @param {Object} [req.cookies] - Request cookies
   * @param {string} [req.cookies.refreshToken] - Refresh token from cookie
   * @param {Object} [req.body] - Request body
   * @param {string} [req.body.refreshToken] - Refresh token from body (fallback)
   * @param {Object} res - Express response object
   * @returns {Object} Response with logout success message
   */
  Logout: CatchError(async (req, res) => {
    const refreshToken = req.cookies?.refreshToken || req.body.refreshToken;

    await AuthService.logout(refreshToken);

    clearAuthCookies(res);

    return sendOk(res, {
      message: 'Đăng xuất thành công',
    });

  }),

  /**
   * Logout user from all devices
   * @param {Object} req - Express request object
   * @param {Object} req.user - Authenticated user object
   * @param {string} req.user.id - Current user's ID
   * @param {Object} res - Express response object
   * @returns {Object} Response with logout all devices success message
   */
  LogoutAllDevices: CatchError(async (req, res) => {
    const userId = req.user.id;

    await AuthService.logoutAllDevices(userId);

    clearAuthCookies(res);

    return sendOk(res, {
      message: 'Đã đăng xuất khỏi tất cả thiết bị',
    });

  }),

  /**
   * Update user password
   * @param {Object} req - Express request object
   * @param {Object} req.body - Request body
   * @param {string} req.body.currentPassword - User's current password
   * @param {string} req.body.newPassword - User's new password (min 6 characters)
   * @param {Object} req.user - Authenticated user object
   * @param {string} req.user.id - Current user's ID
   * @param {Object} res - Express response object
   * @returns {Object} Response with password change success message
   */
  UpdatePassword: CatchError(async (req, res) => {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user.id;

    if (!currentPassword || !newPassword) {
      throw ApiError.badRequest('Vui lòng nhập mật khẩu hiện tại và mật khẩu mới');
    }

    if (newPassword.length < 6) {
      throw ApiError.badRequest('Mật khẩu mới phải có ít nhất 6 ký tự');
    }

    await AuthService.changePassword(userId, currentPassword, newPassword);

    clearAuthCookies(res);

    return sendOk(res, {
      message: 'Đổi mật khẩu thành công. Vui lòng đăng nhập lại',
    });

  }),

  /**
   * Request password reset email
   * @param {Object} req - Express request object
   * @param {Object} req.body - Request body
   * @param {string} req.body.email - User's email address
   * @param {Object} res - Express response object
   * @returns {Object} Response with password reset email sent message
   */
  RequestPasswordReset: CatchError(async (req, res) => {
    const { email } = req.body;

    if (!email) {
      throw ApiError.badRequest('Vui lòng nhập email');
    }

    await AuthService.requestPasswordReset(email);

    return sendOk(res, {
      message: 'Nếu email tồn tại, bạn sẽ nhận được link đặt lại mật khẩu',
    });

  }),

  /**
   * Reset password using token
   * @param {Object} req - Express request object
   * @param {Object} req.body - Request body
   * @param {string} req.body.token - Password reset token from email
   * @param {string} req.body.newPassword - New password (min 6 characters)
   * @param {Object} res - Express response object
   * @returns {Object} Response with password reset success message
   */
  ResetPassword: CatchError(async (req, res) => {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
      throw ApiError.badRequest('Token và mật khẩu mới là bắt buộc');
    }

    if (newPassword.length < 6) {
      throw ApiError.badRequest('Mật khẩu mới phải có ít nhất 6 ký tự');
    }

    await AuthService.resetPassword(token, newPassword);

    return sendOk(res, {
      message: 'Đặt lại mật khẩu thành công',
    });

  }),

  /**
   * Request email verification for account
   * @param {Object} req - Express request object
   * @param {Object} req.user - Authenticated user object
   * @param {string} req.user.id - Current user's ID
   * @param {Object} res - Express response object
   * @returns {Object} Response with verification email sent message
   */
  VerifyAccount: CatchError(async (req, res) => {
    const userId = req.user.id;

    const result = await AuthService.requestEmailVerification(userId);

    return sendOk(res, {
      message: 'Email xác thực đã được gửi. Vui lòng kiểm tra hộp thư',
      data: result,
    });

  }),

  /**
   * Verify email using token
   * @param {Object} req - Express request object
   * @param {Object} req.body - Request body
   * @param {string} req.body.token - Email verification token
   * @param {Object} res - Express response object
   * @returns {Object} Response with email verification success message
   */
  VerifyEmail: CatchError(async (req, res) => {
    const { token } = req.body;

    if (!token) {
      throw ApiError.badRequest('Token xác thực là bắt buộc');
    }

    await AuthService.verifyEmail(token);

    return sendOk(res, {
      message: 'Xác thực email thành công',
    });

  }),

  /**
   * Enable two-factor authentication
   * @param {Object} req - Express request object
   * @param {Object} req.user - Authenticated user object
   * @param {string} req.user.id - Current user's ID
   * @param {Object} res - Express response object
   * @returns {Object} Response with 2FA secret and QR code for setup
   */
  EnableTwoFactor: CatchError(async (req, res) => {
    const userId = req.user.id;

    const { secret, qrCode } = await AuthService.enableTwoFactor(userId);

    return sendOk(res, {
      message: 'Quét mã QR để kích hoạt 2FA',
      data: { secret, qrCode },
    });

  }),

  /**
   * Verify and complete 2FA setup
   * @param {Object} req - Express request object
   * @param {Object} req.body - Request body
   * @param {string} req.body.token - 2FA verification token from authenticator app
   * @param {Object} req.user - Authenticated user object
   * @param {string} req.user.id - Current user's ID
   * @param {Object} res - Express response object
   * @returns {Object} Response with backup codes for 2FA recovery
   */
  VerifyTwoFactor: CatchError(async (req, res) => {
    const userId = req.user.id;
    const { token } = req.body;

    if (!token) {
      throw ApiError.badRequest('Mã xác thực là bắt buộc');
    }

    const { backupCodes } = await AuthService.verifyAndEnableTwoFactor(
      userId,
      token
    );

    return sendOk(res, {
      message: 'Đã kích hoạt xác thực 2 lớp',
      data: { backupCodes },
    });

  }),

  /**
   * Disable two-factor authentication
   * @param {Object} req - Express request object
   * @param {Object} req.body - Request body
   * @param {string} req.body.password - User's current password for verification
   * @param {Object} req.user - Authenticated user object
   * @param {string} req.user.id - Current user's ID
   * @param {Object} res - Express response object
   * @returns {Object} Response with 2FA disabled success message
   */
  DisableTwoFactor: CatchError(async (req, res) => {
    const userId = req.user.id;
    const { password } = req.body;

    if (!password) {
      throw ApiError.badRequest('Mật khẩu là bắt buộc');
    }

    await AuthService.disableTwoFactor(userId, password);

    return sendOk(res, {
      message: 'Đã tắt xác thực 2 lớp',
    });

  }),

  /**
   * Get all active login sessions
   * @param {Object} req - Express request object
   * @param {Object} req.user - Authenticated user object
   * @param {string} req.user.id - Current user's ID
   * @param {Object} [req.cookies] - Request cookies
   * @param {string} [req.cookies.refreshToken] - Refresh token from cookie
   * @param {Object} [req.body] - Request body
   * @param {string} [req.body.refreshToken] - Refresh token from body (fallback)
   * @param {Object} res - Express response object
   * @returns {Object} Response with list of active sessions
   */
  GetActiveSessions: CatchError(async (req, res) => {
    const userId = req.user.id;

    const refreshToken = req.cookies?.refreshToken || req.body.refreshToken;
    const sessions = await AuthService.getActiveSessions(userId, refreshToken);

    return sendOk(res, {
      message: 'Success',
      data: { sessions },
    });

  }),

  /**
   * Revoke a specific login session
   * @param {Object} req - Express request object
   * @param {Object} req.params - Route parameters
   * @param {string} req.params.sessionId - Session ID to revoke
   * @param {Object} req.user - Authenticated user object
   * @param {string} req.user.id - Current user's ID
   * @param {Object} res - Express response object
   * @returns {Object} Response with session revoked success message
   */
  RevokeSession: CatchError(async (req, res) => {
    const userId = req.user.id;
    const { sessionId } = req.params;

    if (!sessionId) {
      throw ApiError.badRequest('Session ID là bắt buộc');
    }

    await AuthService.revokeSession(userId, sessionId);

    return sendOk(res, {
      message: 'Đã thu hồi phiên đăng nhập',
    });

  }),

  /**
   * Authenticate user via Google OAuth
   * @param {Object} req - Express request object
   * @param {Object} req.body - Request body
   * @param {string} req.body.credential - Google OAuth credential token
   * @param {Object} res - Express response object
   * @returns {Object} Response with user data and HttpOnly cookies for tokens
   */
  GoogleAuth: CatchError(async (req, res) => {
    const { credential } = req.body;

    if (!credential) {
      throw ApiError.badRequest('Google credential is required');
    }


    const { OAuth2Client } = await import('google-auth-library');
    const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

    const ticket = await client.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const profile = ticket.getPayload();

    const { user, accessToken, refreshToken } = await AuthService.googleAuth(
      profile
    );

    setAuthCookies(res, accessToken, refreshToken);

    return sendOk(res, {
      message: 'Đăng nhập Google thành công',
      data: user,
    });

  }),

  /**
   * Update user email address
   * @param {Object} req - Express request object
   * @param {Object} req.body - Request body
   * @param {string} req.body.email - New email address
   * @param {string} req.body.password - User's current password for verification
   * @param {Object} req.user - Authenticated user object
   * @param {string} req.user.id - Current user's ID
   * @param {Object} res - Express response object
   * @returns {Object} Response with email update status (feature in development)
   */
  UpdateEmail: CatchError(async (req, res) => {
    const { email, password } = req.body;
    const userId = req.user.id;

    if (!email) {
      throw ApiError.badRequest('Email mới là bắt buộc');
    }

    return sendOk(res, {
      message: 'Tính năng đang được phát triển',
    });

  }),

  /**
   * Delete user account permanently
   * @param {Object} req - Express request object
   * @param {Object} req.body - Request body
   * @param {string} req.body.password - User's current password for verification
   * @param {Object} req.user - Authenticated user object
   * @param {string} req.user.id - Current user's ID
   * @param {Object} res - Express response object
   * @returns {Object} Response with account deletion success message
   */
  DeleteAccount: CatchError(async (req, res) => {
    const { password } = req.body;
    const userId = req.user.id;

    if (!password) {
      throw ApiError.badRequest('Mật khẩu là bắt buộc để xóa tài khoản');
    }

    const UserService = (await import('../user/user.service.js')).default;

    await UserService.deleteUser(userId);

    clearAuthCookies(res);

    return sendOk(res, {
      message: 'Tài khoản đã được xóa',
    });

  }),

  /**
   * Connect social account to user profile
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @returns {Object} Response with social account connection status (feature in development)
   */
  ConnectSocialAccount: CatchError(async (req, res) => {
    return sendOk(res, {
      message: 'Tính năng đang được phát triển',
    });
  }),

};

export default AuthController;
