import jwt from 'jsonwebtoken';
import config from '../configs/config.js';
import logger from '../configs/logger.js';
import ApiError from '../helpers/ApiError.js';
import { CatchError } from '../configs/CatchError.js';
import { clearAuthCookies } from '../configs/cookieOptions.js';
import { getAccessTokenFromRequest } from '../utils/authToken.js';
import {
  USER_ACCESS_SELECT_FIELDS,
  buildSuspensionResetUpdate,
  evaluateUserAccessState,
} from '../utils/userAccess.js';

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
  const userRecord = await User.findById(payload.id).select(USER_ACCESS_SELECT_FIELDS);
  const accessState = evaluateUserAccessState(userRecord);

  if (!accessState.ok) {
    if (accessState.reason === 'USER_INACTIVE') {
      throw ApiError.unauthorized('User not found or inactive', {
        errorCode: 'USER_INACTIVE',
      });
    }

    if (accessState.reason === 'ACCOUNT_BANNED') {
      throw ApiError.forbidden('Account is banned', {
        errorCode: 'ACCOUNT_BANNED',
      });
    }

    throw ApiError.forbidden(
      `Account is suspended (${accessState.remainingDays} days remaining)`,
      {
        errorCode: 'ACCOUNT_SUSPENDED',
        details: {
          suspendedUntil: accessState.suspendedUntil,
          remainingDays: accessState.remainingDays,
        },
      }
    );
  }

  if (accessState.shouldClearSuspension) {
    await User.findByIdAndUpdate(payload.id, buildSuspensionResetUpdate());
  }

  req.user = {
    ...payload,
    isAdmin: userRecord.isAdmin,
  };

  return next();
});

export default { verifyToken };
