import express from 'express';
import ReportController from '../controllers/report.controller.js';
import { verifyToken } from '../middlewares/auth.middleware.js';
import {
  validateBody,
  validateParams,
  validateQuery,
} from '../middlewares/validation.middleware.js';
import {
  createReportBody,
  reportPostParam,
  reportPostBody,
  reportCommentParam,
  reportCommentBody,
  reportUserParam,
  reportUserBody,
  reportMessageParam,
  reportMessageBody,
  myReportsQuery,
  reportIdParam,
  getAllReportsQuery,
  pendingReportsQuery,
  reportsAgainstUserParam,
  reportsAgainstUserQuery,
  startReviewParam,
  resolveReportParam,
  resolveReportBody,
  updateStatusParam,
  updateStatusBody,
} from '../validations/report.validation.js';

const router = express.Router();

router.use(verifyToken);

// ======================================
// Create Reports
// ======================================
router.post('/', validateBody(createReportBody), ReportController.createReport);
router.post(
  '/post/:postId',
  validateParams(reportPostParam),
  validateBody(reportPostBody),
  ReportController.reportPost
);
router.post(
  '/comment/:commentId',
  validateParams(reportCommentParam),
  validateBody(reportCommentBody),
  ReportController.reportComment
);
router.post(
  '/user/:userId',
  validateParams(reportUserParam),
  validateBody(reportUserBody),
  ReportController.reportUser
);
router.post(
  '/message/:messageId',
  validateParams(reportMessageParam),
  validateBody(reportMessageBody),
  ReportController.reportMessage
);

// ======================================
// User's Reports
// ======================================
router.get(
  '/my-reports',
  validateQuery(myReportsQuery),
  ReportController.getMyReports
);
router.get(
  '/:reportId',
  validateParams(reportIdParam),
  ReportController.getReportById
);

// ======================================
// Admin Routes (authorization in controller)
// ======================================
router.get(
  '/',
  validateQuery(getAllReportsQuery),
  ReportController.getAllReports
);
router.get(
  '/pending',
  validateQuery(pendingReportsQuery),
  ReportController.getPendingReports
);
router.get(
  '/user/:userId/against',
  validateParams(reportsAgainstUserParam),
  validateQuery(reportsAgainstUserQuery),
  ReportController.getReportsAgainstUser
);
router.post(
  '/:reportId/start-review',
  validateParams(startReviewParam),
  ReportController.startReview
);
router.put(
  '/:reportId/resolve',
  validateParams(resolveReportParam),
  validateBody(resolveReportBody),
  ReportController.resolveReport
);
router.put(
  '/:reportId/status',
  validateParams(updateStatusParam),
  validateBody(updateStatusBody),
  ReportController.updateReportStatus
);

export default router;
