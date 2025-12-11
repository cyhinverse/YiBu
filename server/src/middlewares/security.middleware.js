import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import mongoSanitize from 'express-mongo-sanitize';
import hpp from 'hpp';

/**
 * Security Middleware Configuration
 * Bao gồm: Helmet, Rate Limiting, Data Sanitization, HPP
 */

// Helmet - Thiết lập HTTP headers bảo mật
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
  crossOriginEmbedderPolicy: false, // Cho phép load resources từ origin khác
  crossOriginResourcePolicy: { policy: 'cross-origin' },
});

// Rate Limiter - Chống DDoS và spam request
// Global rate limit cho tất cả requests
export const globalRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 phút
  max: 100, // Giới hạn 100 requests mỗi IP trong 15 phút
  message: {
    code: 0,
    message: 'Quá nhiều request từ IP này, vui lòng thử lại sau 15 phút.',
  },
  standardHeaders: true, // Return rate limit info trong headers `RateLimit-*`
  legacyHeaders: false, // Disable `X-RateLimit-*` headers
  handler: (req, res, next, options) => {
    res.status(options.statusCode).json(options.message);
  },
});

// Strict rate limit cho auth routes (login, register, password reset)
export const authRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 giờ
  max: 5, // Giới hạn 5 requests mỗi IP
  message: {
    code: 0,
    message: 'Quá nhiều lần thử đăng nhập, vui lòng thử lại sau 1 giờ.',
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true, // Không đếm request thành công
});

// Rate limit cho API cần protect (upload, create post, etc.)
export const apiRateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 phút
  max: 30, // Giới hạn 30 requests mỗi IP mỗi phút
  message: {
    code: 0,
    message: 'Quá nhiều request, vui lòng chậm lại.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Data Sanitization - Chống NoSQL Injection
export const mongoSanitizeMiddleware = mongoSanitize({
  replaceWith: '_', // Thay thế ký tự $ và . bằng _
  onSanitize: ({ req, key }) => {
    console.warn(`NoSQL Injection attempt detected: ${key}`);
  },
});

// HPP - Chống HTTP Parameter Pollution
export const hppMiddleware = hpp({
  whitelist: [
    // Cho phép các params có thể trùng lặp
    'sort',
    'fields',
    'page',
    'limit',
    'tags',
  ],
});

/**
 * XSS Clean - Sanitize user input
 * Thay vì dùng xss-clean (deprecated), ta tự viết middleware đơn giản
 */
export const xssClean = (req, res, next) => {
  if (req.body) {
    req.body = sanitizeObject(req.body);
  }
  if (req.query) {
    req.query = sanitizeObject(req.query);
  }
  if (req.params) {
    req.params = sanitizeObject(req.params);
  }
  next();
};

// Helper function để sanitize object
const sanitizeObject = obj => {
  if (typeof obj !== 'object' || obj === null) {
    return sanitizeString(obj);
  }

  const sanitized = Array.isArray(obj) ? [] : {};

  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      const value = obj[key];
      if (typeof value === 'string') {
        sanitized[key] = sanitizeString(value);
      } else if (typeof value === 'object' && value !== null) {
        sanitized[key] = sanitizeObject(value);
      } else {
        sanitized[key] = value;
      }
    }
  }

  return sanitized;
};

// Sanitize string - escape HTML entities
const sanitizeString = str => {
  if (typeof str !== 'string') return str;

  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
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
