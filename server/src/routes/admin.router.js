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
  getStatsQuery,
  getTopUsersQuery,
  getInteractionsQuery,
  getBannedUsersQuery,
} from '../validations/admin.validation.js';

const router = express.Router();

/* GET /health - Health check endpoint */
router.get('/health', AdminController.getSystemHealth);

router.use(verifyToken, adminMiddleware);

/* GET /dashboard/stats - Get dashboard statistics */
router.get(
  '/dashboard/stats',
  validateQuery(getStatsQuery),
  AdminController.getDashboardStats
);
/* GET /analytics/user-growth - Get user growth analytics */
router.get(
  '/analytics/user-growth',
  validateQuery(getStatsQuery),
  AdminController.getUserGrowthStats
);
/* GET /analytics/posts - Get post analytics */
router.get(
  '/analytics/posts',
  validateQuery(getStatsQuery),
  AdminController.getPostStats
);
/* GET /analytics/top-users - Get top engaged users */
router.get(
  '/analytics/top-users',
  validateQuery(getTopUsersQuery),
  AdminController.getTopEngagedUsers
);
/* GET /analytics/interactions - Get user interactions */
router.get(
  '/analytics/interactions',
  validateQuery(getInteractionsQuery),
  AdminController.getInteractions
);

/* GET /users - Get all users with pagination */
router.get('/users', validateQuery(getUsersQuery), AdminController.getAllUsers);
/* GET /users/banned - Get list of banned users */
router.get(
  '/users/banned',
  validateQuery(getBannedUsersQuery),
  AdminController.getBannedUsers
);
/* GET /users/:userId/posts - Get posts by user ID */
router.get(
  '/users/:userId/posts',
  validateParams(userIdParam),
  AdminController.getUserPosts
);
/* GET /users/:userId/reports - Get reports by user ID */
router.get(
  '/users/:userId/reports',
  validateParams(userIdParam),
  AdminController.getUserReports
);
/* GET /users/:userId - Get user details by ID */
router.get(
  '/users/:userId',
  validateParams(userIdParam),
  AdminController.getUserDetails
);
/* PUT /users/:userId - Update user information */
router.put(
  '/users/:userId',
  validateParams(userIdParam),
  validateBody(updateUserBody),
  AdminController.updateUser
);
/* DELETE /users/:userId - Delete a user */
router.delete(
  '/users/:userId',
  validateParams(userIdParam),
  AdminController.deleteUser
);

/* POST /users/ban - Ban a user */
router.post('/users/ban', validateBody(banUserBody), AdminController.banUser);
/* POST /users/unban - Unban a user */
router.post(
  '/users/unban',
  validateBody(unbanUserBody),
  AdminController.unbanUser
);
/* POST /users/suspend - Suspend a user temporarily */
router.post(
  '/users/suspend',
  validateBody(suspendUserBody),
  AdminController.suspendUser
);
/* POST /users/warn - Issue a warning to a user */
router.post(
  '/users/warn',
  validateBody(warnUserBody),
  AdminController.warnUser
);

/* GET /posts - Get all posts with pagination */
router.get('/posts', validateQuery(getPostsQuery), AdminController.getAllPosts);
/* GET /posts/:postId/reports - Get reports for a specific post */
router.get(
  '/posts/:postId/reports',
  validateParams(postIdParam),
  AdminController.getPostReports
);
/* POST /posts/:postId/moderate - Moderate a post */
router.post(
  '/posts/:postId/moderate',
  validateParams(postIdParam),
  validateBody(moderatePostBody),
  AdminController.moderatePost
);
/* POST /posts/:postId/approve - Approve a post */
router.post(
  '/posts/:postId/approve',
  validateParams(postIdParam),
  AdminController.approvePost
);
/* DELETE /posts/:postId - Delete a post */
router.delete(
  '/posts/:postId',
  validateParams(postIdParam),
  AdminController.deletePost
);

/* GET /comments - Get all comments with pagination */
router.get(
  '/comments',
  validateQuery(getPostsQuery),
  AdminController.getAllComments
);

/* POST /comments/:commentId/moderate - Moderate a comment */
router.post(
  '/comments/:commentId/moderate',
  validateParams(commentIdParam),
  validateBody(moderateCommentBody),
  AdminController.moderateComment
);
/* DELETE /comments/:commentId - Delete a comment */
router.delete(
  '/comments/:commentId',
  validateParams(commentIdParam),
  AdminController.deleteComment
);

/* GET /reports - Get all reports with pagination */
router.get(
  '/reports',
  validateQuery(getReportsQuery),
  AdminController.getReports
);
/* GET /reports/pending - Get pending reports */
router.get('/reports/pending', ReportController.getPendingReports);
/* GET /reports/user/:userId - Get reports against a user */
router.get(
  '/reports/user/:userId',
  validateParams(userIdParam),
  ReportController.getReportsAgainstUser
);
/* POST /reports/:reportId/review - Review a report */
router.post(
  '/reports/:reportId/review',
  validateParams(reportIdParam),
  validateBody(reviewReportBody),
  AdminController.reviewReport
);
/* POST /reports/:reportId/start-review - Start reviewing a report */
router.post(
  '/reports/:reportId/start-review',
  validateParams(reportIdParam),
  ReportController.startReview
);
/* PUT /reports/:reportId/resolve - Resolve a report */
router.put(
  '/reports/:reportId/resolve',
  validateParams(reportIdParam),
  validateBody(resolveReportBody),
  ReportController.resolveReport
);
/* POST /broadcast - Broadcast notification to users */
router.post(
  '/broadcast',
  validateBody(broadcastBody),
  AdminController.broadcastNotification
);
/* GET /system/health - Get system health status */
router.get('/system/health', AdminController.getSystemHealth);

export default router;
