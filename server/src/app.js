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

// ============================================
// SECURITY MIDDLEWARES
// ============================================

// Helmet - HTTP Security Headers
app.use(helmetMiddleware);

// Rate Limiting - Chống DDoS
app.use(globalRateLimiter);

// Body parsers
app.use(express.json({ limit: '10kb' })); // Giới hạn body size
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

// Data Sanitization - Chống NoSQL Injection
app.use(mongoSanitizeMiddleware);

// XSS Clean - Chống XSS attacks
app.use(xssClean);

// HPP - Chống HTTP Parameter Pollution
app.use(hppMiddleware);

// CORS
app.use(
  cors({
    origin: [
      'http://localhost:9258',
      'http://localhost:5173',
      'http://localhost:3000',
      config.CLIENT_URL,
    ],
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
    optionsSuccessStatus: 200,
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

// ============================================
// LOGGING
// ============================================

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
