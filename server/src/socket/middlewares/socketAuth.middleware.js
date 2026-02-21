import jwt from 'jsonwebtoken';
import config from '../../configs/config.js';
import logger from '../../configs/logger.js';
import User from '../../models/User.js';
import { getAccessTokenFromHandshake } from '../../utils/authToken.js';
import {
  USER_ACCESS_SELECT_FIELDS,
  evaluateUserAccessState,
} from '../../utils/userAccess.js';

export const socketAuthMiddleware = async (socket, next) => {
  try {
    if (!config.jwt.accessSecret) {
      return next(new Error('Socket auth is not configured'));
    }

    const accessToken = getAccessTokenFromHandshake(socket.handshake);
    if (!accessToken) {
      return next(new Error('Authentication required'));
    }

    const payload = jwt.verify(accessToken, config.jwt.accessSecret);
    const user = await User.findById(payload.id).select(USER_ACCESS_SELECT_FIELDS);
    const accessState = evaluateUserAccessState(user);

    if (!accessState.ok) {
      if (accessState.reason === 'USER_INACTIVE') {
        return next(new Error('User is inactive'));
      }
      if (accessState.reason === 'ACCOUNT_BANNED') {
        return next(new Error('Account is banned'));
      }
      return next(new Error('Account is suspended'));
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
