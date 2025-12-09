import User from "../models/User.js";
import RefreshToken from "../models/RefreshToken.js";
import UserSettings from "../models/UserSettings.js";
import { hashPassword, comparePassword } from "../helpers/HashPassword.js";
import {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
} from "../helpers/GenerateTokens.js";
import crypto from "crypto";
import logger from "../configs/logger.js";

/**
 * Auth Service - Refactored for new model structure
 *
 * Key Changes:
 * 1. Uses new RefreshToken model (single token per device, not array)
 * 2. Implements token families for rotation detection
 * 3. Better security with device tracking
 * 4. Creates UserSettings on registration
 */
class AuthService {
  // ======================================
  // Registration
  // ======================================

  static async register(userData) {
    const { email, username, password, name } = userData;

    const existingUser = await User.findOne({
      $or: [
        { email: email.toLowerCase() },
        { username: username.toLowerCase() },
      ],
    });

    if (existingUser) {
      if (existingUser.email === email.toLowerCase()) {
        const error = new Error("Email đã được sử dụng");
        error.statusCode = 400;
        throw error;
      }
      const error = new Error("Username đã được sử dụng");
      error.statusCode = 400;
      throw error;
    }

    const hashedPassword = await hashPassword(password);

    const user = await User.create({
      name,
      email: email.toLowerCase(),
      username: username.toLowerCase(),
      password: hashedPassword,
    });

    await UserSettings.create({ user: user._id });

    const accessToken = generateAccessToken({
      id: user._id,
      email: user.email,
      isAdmin: user.isAdmin,
    });

    const userResponse = {
      _id: user._id,
      name: user.name,
      email: user.email,
      username: user.username,
      avatar: user.avatar,
      verified: user.verified,
      isAdmin: user.isAdmin,
    };

    return { user: userResponse, accessToken };
  }

  // ======================================
  // Login
  // ======================================

  static async login(credentials, deviceInfo = {}) {
    const { email, password } = credentials;

    const user = await User.findOne({ email: email.toLowerCase() }).select(
      "+password +loginAttempts"
    );

    if (!user) {
      throw new Error("Email hoặc mật khẩu không đúng");
    }

    if (user.moderation?.status === "banned") {
      throw new Error("Tài khoản đã bị khóa vĩnh viễn");
    }

    if (user.moderation?.status === "suspended") {
      const suspendedUntil = user.moderation.suspendedUntil;
      if (suspendedUntil && suspendedUntil > new Date()) {
        const remainingDays = Math.ceil(
          (suspendedUntil - new Date()) / (1000 * 60 * 60 * 24)
        );
        throw new Error(`Tài khoản bị tạm khóa, còn ${remainingDays} ngày`);
      }
      user.moderation.status = "active";
      user.moderation.suspendedUntil = null;
    }

    if (
      user.loginAttempts?.lockUntil &&
      user.loginAttempts.lockUntil > new Date()
    ) {
      const remainingMinutes = Math.ceil(
        (user.loginAttempts.lockUntil - new Date()) / (1000 * 60)
      );
      throw new Error(
        `Tài khoản bị khóa tạm thời, thử lại sau ${remainingMinutes} phút`
      );
    }

    const isPasswordValid = await comparePassword(password, user.password);

    if (!isPasswordValid) {
      await this._handleFailedLogin(user);
      throw new Error("Email hoặc mật khẩu không đúng");
    }

    await this._resetLoginAttempts(user);

    const accessToken = generateAccessToken({
      id: user._id,
      email: user.email,
      isAdmin: user.isAdmin,
    });
    const refreshTokenData = await this._createRefreshToken(
      user._id,
      deviceInfo
    );

    await User.findByIdAndUpdate(user._id, { lastActiveAt: new Date() });

    const userResponse = {
      _id: user._id,
      name: user.name,
      email: user.email,
      username: user.username,
      avatar: user.avatar,
      verified: user.verified,
      isAdmin: user.isAdmin,
      bio: user.bio,
      followersCount: user.followersCount,
      followingCount: user.followingCount,
      postsCount: user.postsCount,
    };

    return {
      user: userResponse,
      accessToken,
      refreshToken: refreshTokenData.token,
    };
  }

  static async _handleFailedLogin(user) {
    const maxAttempts = 5;
    const lockDurationMinutes = 15;

    const attempts = (user.loginAttempts?.count || 0) + 1;
    const update = {
      "loginAttempts.count": attempts,
      "loginAttempts.lastAttempt": new Date(),
    };

    if (attempts >= maxAttempts) {
      update["loginAttempts.lockUntil"] = new Date(
        Date.now() + lockDurationMinutes * 60 * 1000
      );
      logger.warn(
        `User ${user._id} locked after ${maxAttempts} failed attempts`
      );
    }

    await User.findByIdAndUpdate(user._id, { $set: update });
  }

  static async _resetLoginAttempts(user) {
    if (user.loginAttempts?.count > 0) {
      await User.findByIdAndUpdate(user._id, {
        $set: {
          "loginAttempts.count": 0,
          "loginAttempts.lockUntil": null,
        },
      });
    }
  }

  static async _createRefreshToken(userId, deviceInfo = {}) {
    const family = crypto.randomBytes(16).toString("hex");
    const token = crypto.randomBytes(40).toString("hex");

    const refreshToken = await RefreshToken.create({
      user: userId,
      token,
      family,
      device: {
        userAgent: deviceInfo.userAgent || "unknown",
        ip: deviceInfo.ip || "unknown",
        platform: deviceInfo.platform || "unknown",
      },
    });

    return { token, family, id: refreshToken._id };
  }

  // ======================================
  // Token Refresh
  // ======================================

  static async refreshToken(token, deviceInfo = {}) {
    const refreshTokenDoc = await RefreshToken.findOne({
      token,
      isRevoked: false,
    });

    if (!refreshTokenDoc) {
      const compromisedToken = await RefreshToken.findOne({ token });

      if (compromisedToken) {
        await RefreshToken.updateMany(
          { family: compromisedToken.family },
          { isRevoked: true, revokedReason: "token_reuse_detected" }
        );
        logger.warn(
          `Token reuse detected for user ${compromisedToken.user}, family revoked`
        );
      }

      throw new Error("Invalid refresh token");
    }

    if (refreshTokenDoc.expiresAt < new Date()) {
      refreshTokenDoc.isRevoked = true;
      refreshTokenDoc.revokedReason = "expired";
      await refreshTokenDoc.save();
      throw new Error("Refresh token expired");
    }

    const user = await User.findById(refreshTokenDoc.user);
    if (!user || user.moderation?.status === "banned") {
      throw new Error("User not found or banned");
    }

    refreshTokenDoc.isRevoked = true;
    refreshTokenDoc.revokedReason = "rotated";
    await refreshTokenDoc.save();

    const newToken = crypto.randomBytes(40).toString("hex");
    await RefreshToken.create({
      user: user._id,
      token: newToken,
      family: refreshTokenDoc.family,
      device: {
        userAgent:
          deviceInfo.userAgent ||
          refreshTokenDoc.device?.userAgent ||
          "unknown",
        ip: deviceInfo.ip || refreshTokenDoc.device?.ip || "unknown",
        platform:
          deviceInfo.platform || refreshTokenDoc.device?.platform || "unknown",
      },
    });

    const accessToken = generateAccessToken({
      id: user._id,
      email: user.email,
      isAdmin: user.isAdmin,
    });

    return { accessToken, refreshToken: newToken };
  }

  // ======================================
  // Logout
  // ======================================

  static async logout(refreshToken) {
    if (!refreshToken) {
      return { success: true };
    }

    const tokenDoc = await RefreshToken.findOne({ token: refreshToken });

    if (tokenDoc) {
      tokenDoc.isRevoked = true;
      tokenDoc.revokedReason = "logout";
      await tokenDoc.save();
    }

    return { success: true };
  }

  static async logoutAllDevices(userId) {
    await RefreshToken.updateMany(
      { user: userId, isRevoked: false },
      { isRevoked: true, revokedReason: "logout_all" }
    );

    return { success: true };
  }

  // ======================================
  // Password Management
  // ======================================

  static async changePassword(userId, currentPassword, newPassword) {
    const user = await User.findById(userId).select("+password");

    if (!user) {
      throw new Error("User not found");
    }

    const isPasswordValid = await comparePassword(
      currentPassword,
      user.password
    );
    if (!isPasswordValid) {
      throw new Error("Mật khẩu hiện tại không đúng");
    }

    if (currentPassword === newPassword) {
      throw new Error("Mật khẩu mới phải khác mật khẩu cũ");
    }

    user.password = await hashPassword(newPassword);
    await user.save();

    await RefreshToken.updateMany(
      { user: userId, isRevoked: false },
      { isRevoked: true, revokedReason: "password_changed" }
    );

    return { success: true };
  }

  static async requestPasswordReset(email) {
    const user = await User.findOne({ email: email.toLowerCase() });

    if (!user) {
      return { success: true };
    }

    const resetToken = crypto.randomBytes(32).toString("hex");
    const resetTokenHash = crypto
      .createHash("sha256")
      .update(resetToken)
      .digest("hex");

    await User.findByIdAndUpdate(user._id, {
      "security.passwordResetToken": resetTokenHash,
      "security.passwordResetExpires": new Date(Date.now() + 60 * 60 * 1000),
    });

    // TODO: Send email with resetToken
    logger.info(`Password reset requested for ${email}`);

    return { success: true, resetToken };
  }

  static async resetPassword(resetToken, newPassword) {
    const resetTokenHash = crypto
      .createHash("sha256")
      .update(resetToken)
      .digest("hex");

    const user = await User.findOne({
      "security.passwordResetToken": resetTokenHash,
      "security.passwordResetExpires": { $gt: new Date() },
    });

    if (!user) {
      throw new Error("Token không hợp lệ hoặc đã hết hạn");
    }

    user.password = await hashPassword(newPassword);
    user.security.passwordResetToken = undefined;
    user.security.passwordResetExpires = undefined;
    await user.save();

    await RefreshToken.updateMany(
      { user: user._id, isRevoked: false },
      { isRevoked: true, revokedReason: "password_reset" }
    );

    return { success: true };
  }

  // ======================================
  // Email Verification
  // ======================================

  static async requestEmailVerification(userId) {
    const user = await User.findById(userId);

    if (!user) {
      throw new Error("User not found");
    }

    if (user.verified) {
      throw new Error("Email đã được xác thực");
    }

    const verificationToken = crypto.randomBytes(32).toString("hex");
    const verificationTokenHash = crypto
      .createHash("sha256")
      .update(verificationToken)
      .digest("hex");

    await User.findByIdAndUpdate(userId, {
      "security.emailVerificationToken": verificationTokenHash,
      "security.emailVerificationExpires": new Date(
        Date.now() + 24 * 60 * 60 * 1000
      ),
    });

    // TODO: Send verification email
    logger.info(`Email verification requested for user ${userId}`);

    return { success: true, verificationToken };
  }

  static async verifyEmail(verificationToken) {
    const verificationTokenHash = crypto
      .createHash("sha256")
      .update(verificationToken)
      .digest("hex");

    const user = await User.findOne({
      "security.emailVerificationToken": verificationTokenHash,
      "security.emailVerificationExpires": { $gt: new Date() },
    });

    if (!user) {
      throw new Error("Token không hợp lệ hoặc đã hết hạn");
    }

    user.verified = true;
    user.security.emailVerificationToken = undefined;
    user.security.emailVerificationExpires = undefined;
    await user.save();

    return { success: true };
  }

  // ======================================
  // Two-Factor Authentication
  // ======================================

  static async enableTwoFactor(userId) {
    const speakeasy = (await import("speakeasy")).default;
    const QRCode = (await import("qrcode")).default;

    const secret = speakeasy.generateSecret({
      name: `YiBu:${userId}`,
      length: 20,
    });

    await User.findByIdAndUpdate(userId, {
      "security.twoFactorSecret": secret.base32,
      "security.twoFactorEnabled": false,
    });

    const qrCodeUrl = await QRCode.toDataURL(secret.otpauth_url);

    return { secret: secret.base32, qrCode: qrCodeUrl };
  }

  static async verifyAndEnableTwoFactor(userId, token) {
    const speakeasy = (await import("speakeasy")).default;

    const user = await User.findById(userId).select(
      "+security.twoFactorSecret"
    );

    if (!user || !user.security?.twoFactorSecret) {
      throw new Error("Two-factor setup not initiated");
    }

    const verified = speakeasy.totp.verify({
      secret: user.security.twoFactorSecret,
      encoding: "base32",
      token,
      window: 1,
    });

    if (!verified) {
      throw new Error("Invalid verification code");
    }

    const backupCodes = Array.from({ length: 10 }, () =>
      crypto.randomBytes(4).toString("hex")
    );

    const hashedBackupCodes = await Promise.all(
      backupCodes.map((code) => hashPassword(code))
    );

    await User.findByIdAndUpdate(userId, {
      "security.twoFactorEnabled": true,
      "security.twoFactorBackupCodes": hashedBackupCodes,
    });

    await UserSettings.findOneAndUpdate(
      { user: userId },
      { "security.twoFactorEnabled": true },
      { upsert: true }
    );

    return { success: true, backupCodes };
  }

  static async disableTwoFactor(userId, password) {
    const user = await User.findById(userId).select("+password");

    if (!user) {
      throw new Error("User not found");
    }

    const isPasswordValid = await comparePassword(password, user.password);
    if (!isPasswordValid) {
      throw new Error("Mật khẩu không đúng");
    }

    await User.findByIdAndUpdate(userId, {
      "security.twoFactorEnabled": false,
      "security.twoFactorSecret": null,
      "security.twoFactorBackupCodes": [],
    });

    await UserSettings.findOneAndUpdate(
      { user: userId },
      { "security.twoFactorEnabled": false }
    );

    return { success: true };
  }

  static async verifyTwoFactorToken(userId, token) {
    const speakeasy = (await import("speakeasy")).default;

    const user = await User.findById(userId).select(
      "+security.twoFactorSecret"
    );

    if (!user || !user.security?.twoFactorSecret) {
      throw new Error("Two-factor not enabled");
    }

    const verified = speakeasy.totp.verify({
      secret: user.security.twoFactorSecret,
      encoding: "base32",
      token,
      window: 1,
    });

    return verified;
  }

  // ======================================
  // Session Management
  // ======================================

  static async getActiveSessions(userId) {
    const sessions = await RefreshToken.find({
      user: userId,
      isRevoked: false,
      expiresAt: { $gt: new Date() },
    })
      .select("device createdAt lastUsedAt")
      .sort({ lastUsedAt: -1 })
      .lean();

    return sessions.map((session) => ({
      id: session._id,
      device: session.device,
      createdAt: session.createdAt,
      lastUsedAt: session.lastUsedAt,
    }));
  }

  static async revokeSession(userId, sessionId) {
    const result = await RefreshToken.findOneAndUpdate(
      { _id: sessionId, user: userId },
      { isRevoked: true, revokedReason: "manual_revoke" }
    );

    if (!result) {
      throw new Error("Session not found");
    }

    return { success: true };
  }

  // ======================================
  // OAuth (Placeholder)
  // ======================================

  static async googleAuth(profile) {
    let user = await User.findOne({ email: profile.email.toLowerCase() });

    if (!user) {
      user = await User.create({
        name: profile.name,
        email: profile.email.toLowerCase(),
        username: `user_${crypto.randomBytes(4).toString("hex")}`,
        avatar: profile.picture,
        verified: true,
        "oauth.google": {
          id: profile.sub,
          email: profile.email,
        },
      });

      await UserSettings.create({ user: user._id });
    }

    const accessToken = generateAccessToken({
      id: user._id,
      email: user.email,
      isAdmin: user.isAdmin,
    });
    const refreshTokenData = await this._createRefreshToken(user._id, {
      platform: "google_oauth",
    });

    return {
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        username: user.username,
        avatar: user.avatar,
        verified: user.verified,
      },
      accessToken,
      refreshToken: refreshTokenData.token,
    };
  }
}

export default AuthService;
