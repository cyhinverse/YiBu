import express from 'express';
import cors from 'cors';
import config from './configs/config.js';
import { morganMiddleware } from './configs/logger.js';
import errorMiddleware from './middlewares/error.middleware.js';
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
import profileRoutes from './routes/profile.router.js';
import messageRoutes from './routes/message.router.js';
import savePostRoutes from './routes/savepost.router.js';
import notificationRoutes from './routes/notification.router.js';
import userSettingsRoutes from './routes/userSettings.router.js';

const app = express();

// CORS Configuration - PHẢI ĐẶT TRƯỚC TẤT CẢ MIDDLEWARE KHÁC
const corsOptions = {
  origin: function (origin, callback) {
    // Cho phép requests không có origin (mobile apps, Postman, etc.)
    const allowedOrigins = [
      process.env.CLIENT_URL || 'http://localhost:3000',
      'http://localhost:9258',
      'http://localhost:9259',
      'http://localhost:5173',
      'http://127.0.0.1:9258',
      'http://127.0.0.1:9259',
    ];

    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.log('CORS blocked origin:', origin);
      callback(null, true); // Tạm thời cho phép tất cả để debug
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
  res.status(200).json({
    status: 'ok',
    message: 'API is running',
    timestamp: new Date(),
    env: config.env,
  });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/user', userRoutes);

app.use('/api/posts', postRoutes); // server.js had /api/v1 for posts.
app.use('/api/v1', postRoutes); // Alias for legacy support

app.use('/api/comments', commentRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/reports', reportRoutes); // check filename
app.use('/api/like', likeRoutes);
app.use('/profile', profileRoutes); // Legacy path?
app.use('/api/profile', profileRoutes); // New standard path

app.use('/api/messages', messageRoutes);
app.use('/api/savepost', savePostRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/settings', userSettingsRoutes);

// 404 Handler
app.use((req, res) => {
  res.status(404).json({
    code: 0,
    message: `Endpoint not found: ${req.method} ${req.path}`,
  });
});

// Global Error Handler
app.use(errorMiddleware);

export default app;
