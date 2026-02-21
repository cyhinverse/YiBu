import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import config from './configs/config.js';
import { morganMiddleware } from './configs/logger.js';
import logger from './configs/logger.js';
import errorMiddleware from './middlewares/error.middleware.js';
import { sendOk } from './helpers/apiResponse.js';
import { buildErrorResponse } from './helpers/apiResponse.js';
import {
  helmetMiddleware,
  globalRateLimiter,
  mongoSanitizeMiddleware,
  hppMiddleware,
  xssClean,
} from './middlewares/security.middleware.js';


// Import Routes
import authRoutes from './routes/auth.router.js';
import userRoutes from './routes/user.router.js';
import postRoutes from './routes/post.router.js';
import commentRoutes from './routes/comment.router.js';
import adminRoutes from './routes/admin.router.js';
import reportRoutes from './routes/reports.router.js';
import likeRoutes from './routes/like.router.js';
import messageRoutes from './routes/message.router.js';
import savePostRoutes from './routes/savepost.router.js';
import notificationRoutes from './routes/notification.router.js';
import userSettingsRoutes from './routes/userSettings.router.js';

const app = express();

// If deployed behind a reverse proxy (common in production), trust X-Forwarded-* headers
// so req.ip / secure cookies / rate limiting behave correctly.
app.set('trust proxy', config.trustProxy);

// CORS Configuration - PHẢI ĐẶT TRƯỚC TẤT CẢ MIDDLEWARE KHÁC
const corsOptions = {
  origin: function (origin, callback) {
    const allowedOrigins = config.cors?.origins || [config.CLIENT_URL];

    // In production, reject requests with no origin (prevents null-origin attacks)
    // In development, allow no-origin for Postman/mobile
    if (!origin) {
      if (config.isProduction) {
        const err = new Error('Not allowed by CORS');
        err.statusCode = 403;
        err.errorCode = 'CORS_BLOCKED';
        return callback(err);
      }
      return callback(null, true);
    }

    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      logger.warn('CORS blocked origin', { origin });
      const err = new Error('Not allowed by CORS');
      err.statusCode = 403;
      err.errorCode = 'CORS_BLOCKED';
      err.details = { origin };
      callback(err);
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS', 'HEAD'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'X-Requested-With',
    'Accept',
    'Origin',
    'Access-Control-Request-Method',
    'Access-Control-Request-Headers',
  ],
  exposedHeaders: ['Content-Range', 'X-Content-Range'],
  maxAge: 86400, // 24 hours - cache preflight response
  optionsSuccessStatus: 200,
};

// Handle preflight requests FIRST
app.options('*', cors(corsOptions));

// Apply CORS to all routes
app.use(cors(corsOptions));

// Cookie Parser - Parse cookies from request headers
app.use(cookieParser());

// Helmet - HTTP Security Headers (sau CORS)
app.use(helmetMiddleware);

// Rate Limiting - Chống DDoS (không áp dụng cho OPTIONS requests)
app.use((req, res, next) => {
  if (req.method === 'OPTIONS') {
    return next(); // Skip rate limiting for preflight
  }
  globalRateLimiter(req, res, next);
});

// Body parsers
app.use(express.json({ limit: '10kb' })); // Giới hạn body size
app.use(express.urlencoded({ extended: true, limit: '10kb' }));



// Data Sanitization - Chống NoSQL Injection
app.use(mongoSanitizeMiddleware);

// XSS Clean - Chống XSS attacks
app.use(xssClean);

// HPP - Chống HTTP Parameter Pollution
app.use(hppMiddleware);

// Morgan + Winston Request Logger
app.use(morganMiddleware);

// Health Check
app.get('/api/health', (req, res) => {
  return sendOk(res, {
    message: 'API is running',
    data: {
      status: 'ok',
      timestamp: new Date(),
    },
  });
});


// Routes (v2)
app.use('/api/v2/auth', authRoutes);
app.use('/api/v2/user', userRoutes);

app.use('/api/v2/posts', postRoutes);

app.use('/api/v2/comments', commentRoutes);
app.use('/api/v2/admin', adminRoutes);
app.use('/api/v2/reports', reportRoutes); // check filename
app.use('/api/v2/like', likeRoutes);

app.use('/api/v2/messages', messageRoutes);
app.use('/api/v2/savepost', savePostRoutes);
app.use('/api/v2/notifications', notificationRoutes);
app.use('/api/v2/settings', userSettingsRoutes);


// 404 Handler
app.use((req, res) => {
  return res.status(404).json(
    buildErrorResponse({
      message: `Endpoint not found: ${req.method} ${req.path}`,
      errorCode: 'NOT_FOUND',
      details: { method: req.method, path: req.path },
    })
  );
});


// Global Error Handler
app.use(errorMiddleware);

export default app;
