import jwt from 'jsonwebtoken';
import config from '../configs/config.js';
import logger from '../configs/logger.js';
import ApiError from '../helpers/ApiError.js';
import { CatchError } from '../configs/CatchError.js';
import { clearAuthCookies } from '../configs/cookieOptions.js';

const getAccessTokenFromRequest = req => {
  const cookieToken = req.cookies?.accessToken;
  if (cookieToken) return cookieToken;

  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.split(' ')[1];
  }

  return null;
};

export const verifyToken = CatchError(async (req, res, next) => {
  const accessToken = getAccessTokenFromRequest(req);
  if (!accessToken) {
    throw ApiError.unauthorized('You are not authenticated', {
      errorCode: 'AUTH_REQUIRED',
    });
  }

  if (!config.jwt.accessSecret) {
    throw ApiError.internal('ACCESS_TOKEN_SECRET is not configured', {
      errorCode: 'CONFIG_MISSING',
      details: { key: 'ACCESS_TOKEN_SECRET' },
    });
  }

  let payload;
  try {
    payload = jwt.verify(accessToken, config.jwt.accessSecret);
  } catch (err) {
    logger.warn('JWT verification failed', { message: err?.message });

    // If the token is invalid (e.g. after changing secrets / switching DB env),
    // clear auth cookies to avoid repeated failing requests in the client.
    clearAuthCookies(res);

    throw ApiError.unauthorized('Token is not valid', {
      errorCode: err?.name === 'TokenExpiredError' ? 'TOKEN_EXPIRED' : 'TOKEN_INVALID',
    });
  }

  const User = (await import('../models/User.js')).default;
  const userRecord = await User.findById(payload.id).select(
    'isAdmin moderation.status moderation.suspendedUntil isActive'
  );

  if (!userRecord || userRecord.isActive === false) {
    throw ApiError.unauthorized('User not found or inactive', {
      errorCode: 'USER_INACTIVE',
    });
  }

  if (userRecord.moderation?.status === 'banned') {
    throw ApiError.forbidden('Account is banned', {
      errorCode: 'ACCOUNT_BANNED',
    });
  }

  if (userRecord.moderation?.status === 'suspended') {
    const suspendedUntil = userRecord.moderation?.suspendedUntil;
    if (suspendedUntil && suspendedUntil > new Date()) {
      const remainingDays = Math.ceil(
        (suspendedUntil - new Date()) / (1000 * 60 * 60 * 24)
      );
      throw ApiError.forbidden(`Account is suspended (${remainingDays} days remaining)`, {
        errorCode: 'ACCOUNT_SUSPENDED',
        details: { suspendedUntil, remainingDays },
      });
    }
  }

  req.user = {
    ...payload,
    isAdmin: userRecord.isAdmin,
  };

  return next();
});

export default { verifyToken };
