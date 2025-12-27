import { CatchError } from "../configs/CatchError.js";
import AuthService from "../services/Auth.Service.js";
import { formatResponse } from "../helpers/formatResponse.js";
import logger from "../configs/logger.js";

const AuthController = {
  // ======================================
  // Registration & Login
  // ======================================

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

    // Set refresh token as httpOnly cookie
    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    return formatResponse(res, 200, 1, "Đăng nhập thành công", user, {
      accessToken,
    });
  }),

  // ======================================
  // Token Management
  // ======================================

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

    // Update refresh token cookie
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

  Logout: CatchError(async (req, res) => {
    const refreshToken = req.cookies?.refreshToken || req.body.refreshToken;

    await AuthService.logout(refreshToken);

    // Clear cookie
    res.clearCookie("refreshToken");

    return formatResponse(res, 200, 1, "Đăng xuất thành công");
  }),

  LogoutAllDevices: CatchError(async (req, res) => {
    const userId = req.user.id;

    await AuthService.logoutAllDevices(userId);

    res.clearCookie("refreshToken");

    return formatResponse(res, 200, 1, "Đã đăng xuất khỏi tất cả thiết bị");
  }),

  // ======================================
  // Password Management
  // ======================================

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

  // ======================================
  // Email Verification
  // ======================================

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

  VerifyEmail: CatchError(async (req, res) => {
    const { token } = req.body;

    if (!token) {
      return formatResponse(res, 400, 0, "Token xác thực là bắt buộc");
    }

    await AuthService.verifyEmail(token);

    return formatResponse(res, 200, 1, "Xác thực email thành công");
  }),

  // ======================================
  // Two-Factor Authentication
  // ======================================

  EnableTwoFactor: CatchError(async (req, res) => {
    const userId = req.user.id;

    const { secret, qrCode } = await AuthService.enableTwoFactor(userId);

    return formatResponse(res, 200, 1, "Quét mã QR để kích hoạt 2FA", {
      secret,
      qrCode,
    });
  }),

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

  DisableTwoFactor: CatchError(async (req, res) => {
    const userId = req.user.id;
    const { password } = req.body;

    if (!password) {
      return formatResponse(res, 400, 0, "Mật khẩu là bắt buộc");
    }

    await AuthService.disableTwoFactor(userId, password);

    return formatResponse(res, 200, 1, "Đã tắt xác thực 2 lớp");
  }),

  // ======================================
  // Session Management
  // ======================================

  GetActiveSessions: CatchError(async (req, res) => {
    const userId = req.user.id;

    const refreshToken = req.cookies?.refreshToken || req.body.refreshToken;
    const sessions = await AuthService.getActiveSessions(userId, refreshToken);

    return formatResponse(res, 200, 1, "Success", sessions);
  }),

  RevokeSession: CatchError(async (req, res) => {
    const userId = req.user.id;
    const { sessionId } = req.params;

    if (!sessionId) {
      return formatResponse(res, 400, 0, "Session ID là bắt buộc");
    }

    await AuthService.revokeSession(userId, sessionId);

    return formatResponse(res, 200, 1, "Đã thu hồi phiên đăng nhập");
  }),

  // ======================================
  // OAuth
  // ======================================

  GoogleAuth: CatchError(async (req, res) => {
    const { credential } = req.body;

    if (!credential) {
      return formatResponse(res, 400, 0, "Google credential is required");
    }

    // Decode Google JWT credential
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

  // ======================================
  // Account Management
  // ======================================

  UpdateEmail: CatchError(async (req, res) => {
    const { email, password } = req.body;
    const userId = req.user.id;

    if (!email) {
      return formatResponse(res, 400, 0, "Email mới là bắt buộc");
    }

    // For security, could require password verification here
    // This would need to be added to AuthService

    return formatResponse(res, 200, 1, "Tính năng đang được phát triển");
  }),

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

    // Verify password before deletion
    const UserService = (await import("../services/User.Service.js")).default;

    // This would need password verification logic
    await UserService.deleteUser(userId);

    res.clearCookie("refreshToken");

    return formatResponse(res, 200, 1, "Tài khoản đã được xóa");
  }),

  // Backward compatibility
  ConnectSocialAccount: CatchError(async (req, res) => {
    return formatResponse(res, 200, 1, "Tính năng đang được phát triển");
  }),
};

export default AuthController;
