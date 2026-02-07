import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import mongoSanitize from 'express-mongo-sanitize';
import hpp from 'hpp';
import sanitizeHtml from 'sanitize-html';
import logger from '../configs/logger.js';
import config from '../configs/config.js';

/**
 * Security Middleware Configuration
 * Includes: Helmet, Rate Limiting, Data Sanitization, HPP, basic XSS sanitize
 */

export const helmetMiddleware = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", 'data:', 'https:', 'blob:'],
      connectSrc: ["'self'", 'wss:', 'ws:'],
      fontSrc: ["'self'", 'https:', 'data:'],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'", 'https:'],
      frameSrc: ["'none'"],
    },
  },

  // Prevent COOP from breaking OAuth popup flows / DevTools postMessage in dev.
  crossOriginOpenerPolicy:
    config.env === 'production'
      ? { policy: 'same-origin-allow-popups' }
      : false,

  crossOriginEmbedderPolicy: false,
  crossOriginResourcePolicy: { policy: 'cross-origin' },
});

export const globalRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 1000,
  message: {
    success: false,
    code: 0,
    message:
      'Quá nhiều request từ IP này, vui lòng thử lại sau 15 phút.',
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res, next, options) => {
    res.status(options.statusCode).json(options.message);
  },
  skip: req => req.path === '/api/health',
});

export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: {
    success: false,
    code: 0,
    message:
      'Quá nhiều lần thử đăng nhập, vui lòng thử lại sau 15 phút.',
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true,
});

export const apiRateLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 100,
  message: {
    success: false,
    code: 0,
    message: 'Quá nhiều request, vui lòng chậm lại.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

export const mongoSanitizeMiddleware = mongoSanitize({
  replaceWith: '_',
  onSanitize: ({ req, key }) => {
    logger.warn('NoSQL Injection attempt detected', { key, path: req?.path });
  },
});

export const hppMiddleware = hpp({
  whitelist: ['sort', 'fields', 'page', 'limit', 'tags'],
});

const SANITIZE_SKIP_FIELDS = new Set([
  'password',
  'newPassword',
  'confirmPassword',
  'confirmNewPassword',
  'currentPassword',
  'token',
  'refreshToken',
  'accessToken',
  'twoFactorToken',
]);

export const xssClean = (req, res, next) => {
  if (req.body) req.body = sanitizeObject(req.body);
  if (req.query) req.query = sanitizeObject(req.query);
  if (req.params) req.params = sanitizeObject(req.params);
  next();
};

const sanitizeObject = obj => {
  if (typeof obj !== 'object' || obj === null) return sanitizeString(obj);

  const sanitized = Array.isArray(obj) ? [] : {};
  for (const key in obj) {
    if (!Object.prototype.hasOwnProperty.call(obj, key)) continue;

    const value = obj[key];
    if (typeof value === 'string') {
      sanitized[key] = SANITIZE_SKIP_FIELDS.has(key) ? value : sanitizeString(value);
      continue;
    }

    if (typeof value === 'object' && value !== null) {
      sanitized[key] = sanitizeObject(value);
      continue;
    }

    sanitized[key] = value;
  }

  return sanitized;
};

const sanitizeString = str => {
  if (typeof str !== 'string') return str;

  return sanitizeHtml(str, {
    allowedTags: sanitizeHtml.defaults.allowedTags.concat(['img']),
    allowedAttributes: {
      ...sanitizeHtml.defaults.allowedAttributes,
      img: ['src', 'alt'],
    },
    allowedIframeHostnames: ['www.youtube.com'],
  });
};

export default {
  helmetMiddleware,
  globalRateLimiter,
  authRateLimiter,
  apiRateLimiter,
  mongoSanitizeMiddleware,
  hppMiddleware,
  xssClean,
};

