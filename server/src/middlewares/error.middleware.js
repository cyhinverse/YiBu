import logger from '../configs/logger.js';
import config from '../configs/config.js';
import { buildErrorResponse } from '../helpers/apiResponse.js';

const normalizeError = err => {
  let statusCode = err?.statusCode || 500;
  let message = err?.message || 'Internal Server Error';
  let errorCode =
    err?.errorCode || (typeof err?.code === 'string' ? err.code : null);
  let details = err?.details ?? null;

  // Mongoose: invalid ObjectId / cast errors
  if (err?.name === 'CastError') {
    statusCode = 400;
    message = 'Invalid value';
    errorCode = errorCode || 'CAST_ERROR';
    details = details || { path: err.path, value: err.value };
  }

  // Mongoose: schema validation
  if (err?.name === 'ValidationError' && err?.errors) {
    statusCode = 400;
    message = 'Validation error';
    errorCode = errorCode || 'VALIDATION_ERROR';
    details =
      details ||
      Object.values(err.errors).map(e => ({
        field: e.path,
        message: e.message,
      }));
  }

  // Mongo duplicate key
  if (err?.code === 11000) {
    statusCode = 409;
    message = 'Duplicate key';
    errorCode = 'DUPLICATE_KEY';
    details = details || err.keyValue || null;
  }

  // JWT
  if (err?.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Token expired';
    errorCode = errorCode || 'TOKEN_EXPIRED';
  }
  if (err?.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Invalid token';
    errorCode = errorCode || 'TOKEN_INVALID';
  }

  // Multer
  if (err?.name === 'MulterError') {
    statusCode = 400;
    message = err.message || 'Upload error';
    errorCode = errorCode || 'UPLOAD_ERROR';
  }

  return { statusCode, message, errorCode, details };
};

const errorMiddleware = (err, req, res, next) => {
  const { statusCode, message, errorCode, details } = normalizeError(err);

  const logPayload = {
    module: 'system',
    message,
    errorCode,
    statusCode,
    method: req.method,
    path: req.path,
  };

  if (statusCode >= 500) {
    logger.error('Error', { ...logPayload, stack: err?.stack });
  } else {
    logger.warn('Request error', logPayload);
  }

  const response = buildErrorResponse({ message, errorCode, details });

  return res.status(statusCode).json({
    ...response,
    ...(config.env === 'development' && statusCode >= 500 && { stack: err?.stack }),
  });
};

export default errorMiddleware;
