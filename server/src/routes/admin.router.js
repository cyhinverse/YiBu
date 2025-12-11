import express from 'express';
import { AdminController } from '../controllers/admin.controller.js';
import ReportController from '../controllers/report.controller.js';
import { verifyToken } from '../middlewares/auth.middleware.js';
import { adminMiddleware } from '../middlewares/admin.middleware.js';
import {
  validateBody,
  validateParams,
  validateQuery,
} from '../middlewares/validation.middleware.js';
import {
  getUsersQuery,
  userIdParam,
  updateUserBody,
  banUserBody,
  unbanUserBody,
  suspendUserBody,
  warnUserBody,
  getPostsQuery,
  postIdParam,
  moderatePostBody,
  commentIdParam,
  moderateCommentBody,
  getReportsQuery,
  reportIdParam,
  reviewReportBody,
  resolveReportBody,
  broadcastBody,
  getLogsQuery,
} from '../validations/admin.validation.js';

const router = express.Router();

// Health check endpoint (không cần xác thực)
router.get('/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    message: 'Admin API is running',
    timestamp: new Date(),
  });
});

// Apply authentication and admin middleware
router.use(verifyToken, adminMiddleware);

// ======================================
// Dashboard & Analytics
// ======================================
router.get('/dashboard/stats', AdminController.getDashboardStats);
router.get('/analytics/user-growth', AdminController.getUserGrowthStats);
router.get('/analytics/posts', AdminController.getPostStats);
router.get('/analytics/top-users', AdminController.getTopEngagedUsers);

// ======================================
// User Management
// ======================================
router.get('/users', validateQuery(getUsersQuery), AdminController.getAllUsers);
router.get('/users/banned', AdminController.getBannedUsers);
router.get(
  '/users/:userId',
  validateParams(userIdParam),
  AdminController.getUserDetails
);
router.put(
  '/users/:userId',
  validateParams(userIdParam),
  validateBody(updateUserBody),
  AdminController.updateUser
);
router.delete(
  '/users/:userId',
  validateParams(userIdParam),
  AdminController.deleteUser
);

// User Moderation
router.post('/users/ban', validateBody(banUserBody), AdminController.banUser);
router.post(
  '/users/unban',
  validateBody(unbanUserBody),
  AdminController.unbanUser
);
router.post(
  '/users/suspend',
  validateBody(suspendUserBody),
  AdminController.suspendUser
);
router.post(
  '/users/warn',
  validateBody(warnUserBody),
  AdminController.warnUser
);

// ======================================
// Content Moderation
// ======================================
router.get('/posts', validateQuery(getPostsQuery), AdminController.getAllPosts);
router.post(
  '/posts/:postId/moderate',
  validateParams(postIdParam),
  validateBody(moderatePostBody),
  AdminController.moderatePost
);
router.post(
  '/posts/:postId/approve',
  validateParams(postIdParam),
  AdminController.approvePost
);
router.delete(
  '/posts/:postId',
  validateParams(postIdParam),
  AdminController.deletePost
);

router.post(
  '/comments/:commentId/moderate',
  validateParams(commentIdParam),
  validateBody(moderateCommentBody),
  AdminController.moderateComment
);
router.delete(
  '/comments/:commentId',
  validateParams(commentIdParam),
  AdminController.deleteComment
);

// ======================================
// Reports Management
// ======================================
router.get(
  '/reports',
  validateQuery(getReportsQuery),
  AdminController.getReports
);
router.get('/reports/pending', ReportController.getPendingReports);
router.get(
  '/reports/user/:userId',
  validateParams(userIdParam),
  ReportController.getReportsAgainstUser
);
router.post(
  '/reports/:reportId/review',
  validateParams(reportIdParam),
  validateBody(reviewReportBody),
  AdminController.reviewReport
);
router.post(
  '/reports/:reportId/start-review',
  validateParams(reportIdParam),
  ReportController.startReview
);
router.put(
  '/reports/:reportId/resolve',
  validateParams(reportIdParam),
  validateBody(resolveReportBody),
  ReportController.resolveReport
);

// ======================================
// System Management
// ======================================
router.post(
  '/broadcast',
  validateBody(broadcastBody),
  AdminController.broadcastNotification
);
router.get('/system/health', AdminController.getSystemHealth);
router.get('/logs', validateQuery(getLogsQuery), AdminController.getAdminLogs);

export default router;
