import User from '../../models/User.js';
import RefreshToken from '../../models/RefreshToken.js';
import UserSettings from '../../models/UserSettings.js';
import { hashPassword, comparePassword } from '../../utils/HashPassword.js';
import { generateAccessToken } from '../../utils/GenerateTokens.js';
import crypto from 'crypto';
import logger from '../../configs/logger.js';
import EmailService from '../shared/email/email.service.js';
import ApiError from '../../helpers/ApiError.js';
import { hashRefreshToken } from '../../utils/refreshTokenHash.js';

const hashPII = value => {
  if (!value) return null;
  return crypto.createHash('sha256').update(String(value).toLowerCase()).digest('hex').slice(0, 12);
};


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
        throw ApiError.conflict('Email đã được sử dụng');
      }
      throw ApiError.conflict('Username đã được sử dụng');
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

    const refreshTokenData = await this._createRefreshToken(user._id, {
      platform: 'web',
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

    return {
      user: userResponse,
      accessToken,
      refreshToken: refreshTokenData.token,
    };

  }

  static async login(credentials, deviceInfo = {}) {
    const { email, password, twoFactorToken } = credentials;

    const user = await User.findOne({ email: email.toLowerCase() }).select(
      '+password +loginAttempts'
    );

    if (!user) {
      throw ApiError.unauthorized('Email hoặc mật khẩu không đúng');
    }

    if (user.moderation?.status === 'banned') {
      throw ApiError.forbidden('Tài khoản đã bị khóa vĩnh viễn');
    }

    if (user.moderation?.status === 'suspended') {
      const suspendedUntil = user.moderation.suspendedUntil;
      if (suspendedUntil && suspendedUntil > new Date()) {
        const remainingDays = Math.ceil(
          (suspendedUntil - new Date()) / (1000 * 60 * 60 * 24)
        );
        throw ApiError.forbidden(
          `Tài khoản bị tạm khóa, còn ${remainingDays} ngày`
        );
      }
      user.moderation.status = 'active';
      user.moderation.suspendedUntil = null;
    }


    const lockUntil =
      typeof user.loginAttempts === 'object'
        ? user.loginAttempts?.lockUntil
        : null;

    if (lockUntil && lockUntil > new Date()) {
      const remainingMinutes = Math.ceil(
        (lockUntil - new Date()) / (1000 * 60)
      );
      throw ApiError.forbidden(
        `Tài khoản bị khóa tạm thời, thử lại sau ${remainingMinutes} phút`
      );
    }

    const isPasswordValid = await comparePassword(password, user.password);

    if (!isPasswordValid) {
      await this._handleFailedLogin(user);
      throw ApiError.unauthorized('Email hoặc mật khẩu không đúng');
    }


    const userSettings = await UserSettings.findOne({ user: user._id }).select(
      '+security.twoFactorSecret +security.twoFactorEnabled'
    );

    if (userSettings?.security?.twoFactorEnabled) {
      if (!twoFactorToken) {
        throw ApiError.unauthorized('Two-factor token required', {
          errorCode: '2FA_REQUIRED',
        });
      }

      const verified = await this.verifyTwoFactorToken(user._id, twoFactorToken);
      if (!verified) {
        throw ApiError.unauthorized('Invalid verification code', {
          errorCode: '2FA_INVALID',
        });
      }
    }

    await this._resetLoginAttempts(user);

    const accessToken = generateAccessToken({
      id: user._id,
      email: user.email,
      isAdmin: user.isAdmin,
    });

    const [refreshTokenData] = await Promise.all([
      this._createRefreshToken(user._id, deviceInfo),
      User.findByIdAndUpdate(user._id, {
        lastActiveAt: new Date(),
        lastLoginAt: new Date(),
      })
    ]);


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

    const currentCount =
      typeof user.loginAttempts === 'object'
        ? user.loginAttempts?.count || 0
        : 0;
    const attempts = currentCount + 1;

    if (typeof user.loginAttempts === 'number') {
      await User.findByIdAndUpdate(user._id, {
        $set: {
          loginAttempts: {
            count: attempts,
            lastAttempt: new Date(),
            lockUntil:
              attempts >= maxAttempts
                ? new Date(Date.now() + lockDurationMinutes * 60 * 1000)
                : null,
          },
        },
      });
      if (attempts >= maxAttempts) {
        logger.warn(
          `User ${user._id} locked after ${maxAttempts} failed attempts`
        );
      }
      return;
    }

    const update = {
      'loginAttempts.count': attempts,
      'loginAttempts.lastAttempt': new Date(),
    };

    if (attempts >= maxAttempts) {
      update['loginAttempts.lockUntil'] = new Date(
        Date.now() + lockDurationMinutes * 60 * 1000
      );
      logger.warn(
        `User ${user._id} locked after ${maxAttempts} failed attempts`
      );
    }

    await User.findByIdAndUpdate(user._id, { $set: update });
  }

  static async _resetLoginAttempts(user) {
    if (typeof user.loginAttempts === 'number' && user.loginAttempts > 0) {
      await User.findByIdAndUpdate(user._id, {
        $set: {
          loginAttempts: { count: 0, lockUntil: null },
        },
      });
      return;
    }

    if (user.loginAttempts?.count > 0) {
      await User.findByIdAndUpdate(user._id, {
        $set: {
          'loginAttempts.count': 0,
          'loginAttempts.lockUntil': null,
        },
      });
    }
  }

  static async _createRefreshToken(userId, deviceInfo = {}) {
    const family = crypto.randomBytes(16).toString('hex');
    const token = crypto.randomBytes(40).toString('hex'); // raw token for client
    const tokenHash = hashRefreshToken(token);

    const refreshToken = await RefreshToken.create({
      user: userId,
      // Persist only the hash so DB leaks don't immediately grant session access.
      token: tokenHash,
      family,
      device: {
        userAgent: deviceInfo.userAgent || 'unknown',
        ip: deviceInfo.ip || 'unknown',
        platform: deviceInfo.platform || 'unknown',
      },
    });

    return { token, family, id: refreshToken._id };
  }

  static async refreshToken(token, deviceInfo = {}) {
    const tokenHash = hashRefreshToken(token);

    // Prefer hashed lookup; fall back to legacy plaintext tokens for backward compatibility.
    let refreshTokenDoc = await RefreshToken.findOne({ token: tokenHash, isRevoked: false });
    const matchedLegacyPlaintext = !refreshTokenDoc;
    if (!refreshTokenDoc) {
      refreshTokenDoc = await RefreshToken.findOne({ token, isRevoked: false });
    }

    if (!refreshTokenDoc) {
      const compromisedToken =
        (await RefreshToken.findOne({ token: tokenHash })) ||
        (await RefreshToken.findOne({ token }));

      if (compromisedToken) {
        await RefreshToken.updateMany(
          { family: compromisedToken.family },
          { isRevoked: true, revokedReason: 'token_reuse_detected' }
        );
        logger.warn(
          `Token reuse detected for user ${compromisedToken.user}, family revoked`
        );
      }

      throw ApiError.unauthorized('Invalid refresh token');

    }

    if (refreshTokenDoc.expiresAt < new Date()) {
      if (matchedLegacyPlaintext && refreshTokenDoc.token === token) {
        // Scrub legacy plaintext token before persisting revocation state.
        refreshTokenDoc.token = tokenHash;
      }
      refreshTokenDoc.isRevoked = true;
      refreshTokenDoc.revokedReason = 'expired';
      await refreshTokenDoc.save();
      throw ApiError.unauthorized('Refresh token expired');

    }

    const user = await User.findById(refreshTokenDoc.user);
    if (!user || user.moderation?.status === 'banned') {
      throw ApiError.forbidden('User not found or banned');
    }


    refreshTokenDoc.isRevoked = true;
    refreshTokenDoc.revokedReason = 'rotated';
    if (matchedLegacyPlaintext && refreshTokenDoc.token === token) {
      // Scrub legacy plaintext token before persisting revocation state.
      refreshTokenDoc.token = tokenHash;
    }
    await refreshTokenDoc.save();

    const newToken = crypto.randomBytes(40).toString('hex');
    const newTokenHash = hashRefreshToken(newToken);
    await RefreshToken.create({
      user: user._id,
      token: newTokenHash,
      family: refreshTokenDoc.family,
      device: {
        userAgent:
          deviceInfo.userAgent ||
          refreshTokenDoc.device?.userAgent ||
          'unknown',
        ip: deviceInfo.ip || refreshTokenDoc.device?.ip || 'unknown',
        platform:
          deviceInfo.platform || refreshTokenDoc.device?.platform || 'unknown',
      },
    });

    const accessToken = generateAccessToken({
      id: user._id,
      email: user.email,
      isAdmin: user.isAdmin,
    });

    return { accessToken, refreshToken: newToken };
  }

  static async logout(refreshToken) {
    if (!refreshToken) {
      return { success: true };
    }

    const refreshTokenHash = hashRefreshToken(refreshToken);
    let tokenDoc = await RefreshToken.findOne({ token: refreshTokenHash });
    const matchedLegacyPlaintext = !tokenDoc;
    if (!tokenDoc) {
      tokenDoc = await RefreshToken.findOne({ token: refreshToken });
    }

    if (tokenDoc) {
      tokenDoc.isRevoked = true;
      tokenDoc.revokedReason = 'logout';
      if (matchedLegacyPlaintext && tokenDoc.token === refreshToken) {
        tokenDoc.token = refreshTokenHash;
      }
      await tokenDoc.save();
    }

    return { success: true };
  }

  static async logoutAllDevices(userId) {
    await RefreshToken.updateMany(
      { user: userId, isRevoked: false },
      { isRevoked: true, revokedReason: 'logout_all' }
    );

    return { success: true };
  }

  static async changePassword(userId, currentPassword, newPassword) {
    const user = await User.findById(userId).select('+password');

    if (!user) {
      throw ApiError.notFound('User not found');
    }


    const isPasswordValid = await comparePassword(
      currentPassword,
      user.password
    );
    if (!isPasswordValid) {
      throw ApiError.badRequest('Mật khẩu hiện tại không đúng');
    }

    if (currentPassword === newPassword) {
      throw ApiError.badRequest('Mật khẩu mới phải khác mật khẩu cũ');
    }


    user.password = await hashPassword(newPassword);
    await user.save();

    await RefreshToken.updateMany(
      { user: userId, isRevoked: false },
      { isRevoked: true, revokedReason: 'password_changed' }
    );

    return { success: true };
  }

  static async requestPasswordReset(email) {
    logger.info('Password reset requested', { module: 'auth', emailHash: hashPII(email) });

    const user = await User.findOne({ email: email.toLowerCase() });

    if (!user) {
      return { success: true };
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenHash = crypto
      .createHash('sha256')
      .update(resetToken)
      .digest('hex');

    await User.findByIdAndUpdate(user._id, {
      'security.passwordResetToken': resetTokenHash,
      'security.passwordResetExpires': new Date(Date.now() + 60 * 60 * 1000),
    });

    const resetLink = `${process.env.CLIENT_URL}/reset-password?token=${resetToken}`;

    const emailResult = await EmailService.sendPasswordReset(email, resetLink);
    logger.info('Password reset email sent', {
      module: 'auth',
      emailHash: hashPII(email),
      ok: Boolean(emailResult),
    });

    return { success: true };
  }

  static async resetPassword(resetToken, newPassword) {
    const resetTokenHash = crypto
      .createHash('sha256')
      .update(resetToken)
      .digest('hex');

    const user = await User.findOne({
      'security.passwordResetToken': resetTokenHash,
      'security.passwordResetExpires': { $gt: new Date() },
    });

    if (!user) {
      throw ApiError.badRequest('Token không hợp lệ hoặc đã hết hạn');
    }


    user.password = await hashPassword(newPassword);
    user.security.passwordResetToken = undefined;
    user.security.passwordResetExpires = undefined;
    await user.save();

    await RefreshToken.updateMany(
      { user: user._id, isRevoked: false },
      { isRevoked: true, revokedReason: 'password_reset' }
    );

    return { success: true };
  }

  static async requestEmailVerification(userId) {
    const user = await User.findById(userId);

    if (!user) {
      throw ApiError.notFound('User not found');
    }

    if (user.verified) {
      throw ApiError.badRequest('Email đã được xác thực');
    }


    const verificationToken = crypto.randomBytes(32).toString('hex');
    const verificationTokenHash = crypto
      .createHash('sha256')
      .update(verificationToken)
      .digest('hex');

    await User.findByIdAndUpdate(userId, {
      'security.emailVerificationToken': verificationTokenHash,
      'security.emailVerificationExpires': new Date(
        Date.now() + 24 * 60 * 60 * 1000
      ),
    });

    const verificationLink = `${process.env.CLIENT_URL}/verify-email?token=${verificationToken}`;
    await EmailService.sendVerificationEmail(user.email, verificationLink);
    logger.info(`Email verification requested for user ${userId}`);

    return { success: true, verificationToken };
  }

  static async verifyEmail(verificationToken) {
    const verificationTokenHash = crypto
      .createHash('sha256')
      .update(verificationToken)
      .digest('hex');

    const user = await User.findOne({
      'security.emailVerificationToken': verificationTokenHash,
      'security.emailVerificationExpires': { $gt: new Date() },
    });

    if (!user) {
      throw ApiError.badRequest('Token không hợp lệ hoặc đã hết hạn');
    }


    user.verified = true;
    user.security.emailVerificationToken = undefined;
    user.security.emailVerificationExpires = undefined;
    await user.save();

    return { success: true };
  }

  static async enableTwoFactor(userId) {
    const speakeasy = (await import('speakeasy')).default;
    const QRCode = (await import('qrcode')).default;

    const secret = speakeasy.generateSecret({
      name: `YiBu:${userId}`,
      length: 20,
    });

    await UserSettings.findOneAndUpdate(
      { user: userId },
      {
        'security.twoFactorSecret': secret.base32,
        'security.twoFactorEnabled': false,
      },
      { upsert: true }
    );

    const qrCodeUrl = await QRCode.toDataURL(secret.otpauth_url);

    return { secret: secret.base32, qrCode: qrCodeUrl };
  }

  static async verifyAndEnableTwoFactor(userId, token) {
    const speakeasy = (await import('speakeasy')).default;

    const userSettings = await UserSettings.findOne({ user: userId }).select(
      '+security.twoFactorSecret'
    );

    if (!userSettings || !userSettings.security?.twoFactorSecret) {
      throw ApiError.badRequest('Two-factor setup not initiated');
    }


    const verified = speakeasy.totp.verify({
      secret: userSettings.security.twoFactorSecret,
      encoding: 'base32',
      token,
      window: 1,
    });

    if (!verified) {
      throw ApiError.badRequest('Invalid verification code');
    }


    const backupCodes = Array.from({ length: 10 }, () =>
      crypto.randomBytes(4).toString('hex')
    );

    const hashedBackupCodes = await Promise.all(
      backupCodes.map(code => hashPassword(code))
    );

    await UserSettings.findOneAndUpdate(
      { user: userId },
      {
        'security.twoFactorEnabled': true,
        'security.twoFactorBackupCodes': hashedBackupCodes,
      },
      { upsert: true }
    );

    return { success: true, backupCodes };
  }

  static async disableTwoFactor(userId, password) {
    const user = await User.findById(userId).select('+password');

    if (!user) {
      throw ApiError.notFound('User not found');
    }

    const isPasswordValid = await comparePassword(password, user.password);
    if (!isPasswordValid) {
      throw ApiError.badRequest('Mật khẩu không đúng');
    }


    await UserSettings.findOneAndUpdate(
      { user: userId },
      {
        'security.twoFactorEnabled': false,
        'security.twoFactorSecret': null,
        'security.twoFactorBackupCodes': [],
      }
    );

    return { success: true };
  }

  static async verifyTwoFactorToken(userId, token) {
    const speakeasy = (await import('speakeasy')).default;

    const userSettings = await UserSettings.findOne({ user: userId }).select(
      '+security.twoFactorSecret'
    );

    if (!userSettings || !userSettings.security?.twoFactorSecret) {
      throw ApiError.badRequest('Two-factor not enabled');
    }


    const verified = speakeasy.totp.verify({
      secret: userSettings.security.twoFactorSecret,
      encoding: 'base32',
      token,
      window: 1,
    });

    return verified;
  }

  static async getActiveSessions(userId, currentRefreshToken = null) {
    const currentHash = currentRefreshToken ? hashRefreshToken(currentRefreshToken) : null;
    const sessions = await RefreshToken.find({
      user: userId,
      isRevoked: false,
      expiresAt: { $gt: new Date() },
    })
      .select('device createdAt lastUsedAt token')
      .sort({ lastUsedAt: -1 })
      .lean();

    return sessions.map(session => {
      const isCurrent =
        Boolean(currentRefreshToken) &&
        (session.token === currentRefreshToken || (currentHash && session.token === currentHash));
      return {
        id: session._id,
        deviceType: session.device?.type || 'unknown',
        browser: session.device?.browser || 'Unknown Browser',
        os: session.device?.os || 'Unknown OS',
        ip: session.device?.ip || 'Unknown IP',
        isCurrent,
        lastActive: isCurrent
          ? 'Vừa xong'
          : new Date(session.lastUsedAt).toLocaleString('vi-VN'),
        lastUsedAt: session.lastUsedAt,
      };
    });
  }

  static async revokeSession(userId, sessionId) {
    const result = await RefreshToken.findOneAndUpdate(
      { _id: sessionId, user: userId },
      { isRevoked: true, revokedReason: 'manual_revoke' }
    );

    if (!result) {
      throw ApiError.notFound('Session not found');
    }


    return { success: true };
  }

  static async googleAuth(profile) {
    let user = await User.findOne({ email: profile.email.toLowerCase() });

    if (!user) {
      user = await User.create({
        name: profile.name,
        email: profile.email.toLowerCase(),
        username: `user_${crypto.randomBytes(4).toString('hex')}`,
        avatar: profile.picture,
        verified: true,
        'oauth.google': {
          id: profile.sub,
          email: profile.email,
        },
      });

      await UserSettings.create({ user: user._id });
    }

    if (user.moderation?.status === 'banned') {
      throw ApiError.forbidden('Tài khoản đã bị khóa vĩnh viễn');
    }

    const accessToken = generateAccessToken({
      id: user._id,
      email: user.email,
      isAdmin: user.isAdmin,
    });
    const refreshTokenData = await this._createRefreshToken(user._id, {
      platform: 'google_oauth',
    });

    await User.findByIdAndUpdate(user._id, { lastLoginAt: new Date() });

    return {
      user: {
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
      },
      accessToken,
      refreshToken: refreshTokenData.token,
    };
  }

}

export default AuthService;



