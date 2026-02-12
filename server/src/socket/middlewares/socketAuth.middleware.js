import jwt from 'jsonwebtoken';
import config from '../../configs/config.js';
import logger from '../../configs/logger.js';
import User from '../../models/User.js';

const parseCookieHeader = cookieHeader => {
  if (!cookieHeader || typeof cookieHeader !== 'string') return {};

  return cookieHeader.split(';').reduce((acc, item) => {
    const [rawKey, ...rest] = item.split('=');
    const key = rawKey?.trim();
    if (!key) return acc;

    const value = rest.join('=').trim();
    acc[key] = decodeURIComponent(value);
    return acc;
  }, {});
};

const stripBearer = token => {
  if (!token || typeof token !== 'string') return null;
  return token.startsWith('Bearer ') ? token.slice(7).trim() : token.trim();
};

const getTokenFromHandshake = socket => {
  const authToken =
    socket.handshake?.auth?.token || socket.handshake?.auth?.accessToken;
  if (authToken) {
    return stripBearer(authToken);
  }

  const authHeader = socket.handshake?.headers?.authorization;
  if (authHeader) {
    return stripBearer(authHeader);
  }

  const cookies = parseCookieHeader(socket.handshake?.headers?.cookie);
  if (cookies.accessToken) {
    return cookies.accessToken;
  }

  return null;
};

export const socketAuthMiddleware = async (socket, next) => {
  try {
    if (!config.jwt.accessSecret) {
      return next(new Error('Socket auth is not configured'));
    }

    const accessToken = getTokenFromHandshake(socket);
    if (!accessToken) {
      return next(new Error('Authentication required'));
    }

    const payload = jwt.verify(accessToken, config.jwt.accessSecret);
    const user = await User.findById(payload.id).select(
      '_id isAdmin isActive moderation.status moderation.suspendedUntil moderation.expiresAt'
    );

    if (!user || user.isActive === false) {
      return next(new Error('User is inactive'));
    }

    if (user.moderation?.status === 'banned') {
      return next(new Error('Account is banned'));
    }

    if (user.moderation?.status === 'suspended') {
      const suspendedUntil =
        user.moderation?.suspendedUntil || user.moderation?.expiresAt;
      if (suspendedUntil && suspendedUntil > new Date()) {
        return next(new Error('Account is suspended'));
      }
    }

    socket.user = {
      id: user._id.toString(),
      isAdmin: Boolean(user.isAdmin),
      email: payload.email,
    };

    return next();
  } catch (error) {
    logger.warn('Socket authentication failed', {
      message: error?.message,
      socketId: socket.id,
      ip: socket.handshake?.address,
    });
    return next(new Error('Authentication failed'));
  }
};

export default socketAuthMiddleware;
