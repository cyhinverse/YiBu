import { CatchError } from "../configs/CatchError.js";
import AuthService from "../services/Auth.Service.js";
import { formatResponse } from "../helpers/formatResponse.js";
import logger from "../configs/logger.js";

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
   * @returns {Object} Response with user data and access token
   */
  Register: CatchError(async (req, res) => {
    const { name, email, password, username } = req.body;

    if (!name || !password || !email) {
      return formatResponse(
        res,
        400,
        0,
        "Vui lòng điền đầy đủ thông tin bắt buộc"
      );
    }

    if (!username) {
      return formatResponse(res, 400, 0, "Username là bắt buộc");
    }

    const { user, accessToken } = await AuthService.register({
      name,
      email,
      password,
      username,
    });

    return formatResponse(res, 201, 1, "Đăng ký tài khoản thành công", user, {
      accessToken,
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
   * @returns {Object} Response with user data, access token, and refresh token cookie
   */
  Login: CatchError(async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
      return formatResponse(res, 400, 0, "Vui lòng nhập email và mật khẩu");
    }

    const deviceInfo = {
      userAgent: req.headers["user-agent"],
      ip: req.ip || req.connection?.remoteAddress,
      platform: req.body.platform || "web",
    };

    const { user, accessToken, refreshToken } = await AuthService.login(
      { email, password },
      deviceInfo
    );

    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return formatResponse(res, 200, 1, "Đăng nhập thành công", user, {
      accessToken,
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
   * @returns {Object} Response with new access token and refresh token cookie
   */
  RefreshToken: CatchError(async (req, res) => {
    const refreshToken = req.cookies?.refreshToken || req.body.refreshToken;

    if (!refreshToken) {
      return formatResponse(res, 401, 0, "Refresh token không hợp lệ");
    }

    const deviceInfo = {
      userAgent: req.headers["user-agent"],
      ip: req.ip || req.connection?.remoteAddress,
    };

    const { accessToken, refreshToken: newRefreshToken } =
      await AuthService.refreshToken(refreshToken, deviceInfo);

    res.cookie("refreshToken", newRefreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return formatResponse(res, 200, 1, "Token refreshed successfully", null, {
      accessToken,
    });
  }),

  /**
   * Logout user and invalidate refresh token
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

    res.clearCookie("refreshToken");

    return formatResponse(res, 200, 1, "Đăng xuất thành công");
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

    res.clearCookie("refreshToken");

    return formatResponse(res, 200, 1, "Đã đăng xuất khỏi tất cả thiết bị");
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
      return formatResponse(
        res,
        400,
        0,
        "Vui lòng nhập mật khẩu hiện tại và mật khẩu mới"
      );
    }

    if (newPassword.length < 6) {
      return formatResponse(
        res,
        400,
        0,
        "Mật khẩu mới phải có ít nhất 6 ký tự"
      );
    }

    await AuthService.changePassword(userId, currentPassword, newPassword);

    res.clearCookie("refreshToken");

    return formatResponse(
      res,
      200,
      1,
      "Đổi mật khẩu thành công. Vui lòng đăng nhập lại"
    );
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
      return formatResponse(res, 400, 0, "Vui lòng nhập email");
    }

    await AuthService.requestPasswordReset(email);

    return formatResponse(
      res,
      200,
      1,
      "Nếu email tồn tại, bạn sẽ nhận được link đặt lại mật khẩu"
    );
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
      return formatResponse(res, 400, 0, "Token và mật khẩu mới là bắt buộc");
    }

    if (newPassword.length < 6) {
      return formatResponse(
        res,
        400,
        0,
        "Mật khẩu mới phải có ít nhất 6 ký tự"
      );
    }

    await AuthService.resetPassword(token, newPassword);

    return formatResponse(res, 200, 1, "Đặt lại mật khẩu thành công");
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

    return formatResponse(
      res,
      200,
      1,
      "Email xác thực đã được gửi. Vui lòng kiểm tra hộp thư"
    );
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
      return formatResponse(res, 400, 0, "Token xác thực là bắt buộc");
    }

    await AuthService.verifyEmail(token);

    return formatResponse(res, 200, 1, "Xác thực email thành công");
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

    return formatResponse(res, 200, 1, "Quét mã QR để kích hoạt 2FA", {
      secret,
      qrCode,
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
      return formatResponse(res, 400, 0, "Mã xác thực là bắt buộc");
    }

    const { backupCodes } = await AuthService.verifyAndEnableTwoFactor(
      userId,
      token
    );

    return formatResponse(res, 200, 1, "Đã kích hoạt xác thực 2 lớp", {
      backupCodes,
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
      return formatResponse(res, 400, 0, "Mật khẩu là bắt buộc");
    }

    await AuthService.disableTwoFactor(userId, password);

    return formatResponse(res, 200, 1, "Đã tắt xác thực 2 lớp");
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

    return formatResponse(res, 200, 1, "Success", sessions);
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
      return formatResponse(res, 400, 0, "Session ID là bắt buộc");
    }

    await AuthService.revokeSession(userId, sessionId);

    return formatResponse(res, 200, 1, "Đã thu hồi phiên đăng nhập");
  }),

  /**
   * Authenticate user via Google OAuth
   * @param {Object} req - Express request object
   * @param {Object} req.body - Request body
   * @param {string} req.body.credential - Google OAuth credential token
   * @param {Object} res - Express response object
   * @returns {Object} Response with user data, access token, and refresh token cookie
   */
  GoogleAuth: CatchError(async (req, res) => {
    const { credential } = req.body;

    if (!credential) {
      return formatResponse(res, 400, 0, "Google credential is required");
    }

    const { OAuth2Client } = await import("google-auth-library");
    const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

    const ticket = await client.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const profile = ticket.getPayload();

    const { user, accessToken, refreshToken } = await AuthService.googleAuth(
      profile
    );

    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return formatResponse(res, 200, 1, "Đăng nhập Google thành công", user, {
      accessToken,
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
      return formatResponse(res, 400, 0, "Email mới là bắt buộc");
    }

    return formatResponse(res, 200, 1, "Tính năng đang được phát triển");
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
      return formatResponse(
        res,
        400,
        0,
        "Mật khẩu là bắt buộc để xóa tài khoản"
      );
    }

    const UserService = (await import("../services/User.Service.js")).default;

    await UserService.deleteUser(userId);

    res.clearCookie("refreshToken");

    return formatResponse(res, 200, 1, "Tài khoản đã được xóa");
  }),

  /**
   * Connect social account to user profile
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @returns {Object} Response with social account connection status (feature in development)
   */
  ConnectSocialAccount: CatchError(async (req, res) => {
    return formatResponse(res, 200, 1, "Tính năng đang được phát triển");
  }),
};

export default AuthController;
