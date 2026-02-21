import { CatchError } from '../configs/CatchError.js';
import ApiError from '../helpers/ApiError.js';

/**
 * Requires verifyToken to run first and attach req.user.
 */
export const adminMiddleware = CatchError(async (req, _res, next) => {
  if (!req.user?.id) {
    throw ApiError.unauthorized('Unauthorized. Authentication required.');
  }

  if (!req.user.isAdmin) {
    throw ApiError.forbidden('Forbidden. Admin privileges required.');
  }

  return next();
});
