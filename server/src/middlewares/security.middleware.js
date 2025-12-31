import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import mongoSanitize from 'express-mongo-sanitize';
import hpp from 'hpp';
import sanitizeHtml from 'sanitize-html';

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
  max: 1000, // 1000 requests per 15 min (production-ready)
  message: {
    code: 0,
    message: 'Quá nhiều request từ IP này, vui lòng thử lại sau 15 phút.',
  },
  standardHeaders: true, // Return rate limit info trong headers `RateLimit-*`
  legacyHeaders: false, // Disable `X-RateLimit-*` headers
  handler: (req, res, next, options) => {
    res.status(options.statusCode).json(options.message);
  },
  skip: (req) => {
    // Skip rate limiting for health check
    return req.path === '/api/health';
  },
});

// Strict rate limit cho auth routes (login, register, password reset)
export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 phút
  max: 10, // 10 attempts per 15 min
  message: {
    code: 0,
    message: 'Quá nhiều lần thử đăng nhập, vui lòng thử lại sau 15 phút.',
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true, // Không đếm request thành công
});

// Rate limit cho API cần protect (upload, create post, etc.)
export const apiRateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 phút
  max: 100, // Increased from 30 to 100 requests per minute
  message: {
    code: 0,
    message: 'Quá nhiều request, vui lòng chậm lại.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Data Sanitization - Chống NoSQL Injection
export const mongoSanitizeMiddleware = mongoSanitize({
  replaceWith: '_',
  onSanitize: ({ req, key }) => {
    console.warn(`NoSQL Injection attempt detected: ${key}`);
  },
});

// HPP - Chống HTTP Parameter Pollution
export const hppMiddleware = hpp({
  whitelist: ['sort', 'fields', 'page', 'limit', 'tags'],
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
// Sanitize string - use sanitize-html
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
