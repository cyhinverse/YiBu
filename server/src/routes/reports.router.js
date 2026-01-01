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

/* POST / - Create a new report */
router.post('/', validateBody(createReportBody), ReportController.createReport);
/* POST /post/:postId - Report a post */
router.post(
  '/post/:postId',
  validateParams(reportPostParam),
  validateBody(reportPostBody),
  ReportController.reportPost
);
/* POST /comment/:commentId - Report a comment */
router.post(
  '/comment/:commentId',
  validateParams(reportCommentParam),
  validateBody(reportCommentBody),
  ReportController.reportComment
);
/* POST /user/:userId - Report a user */
router.post(
  '/user/:userId',
  validateParams(reportUserParam),
  validateBody(reportUserBody),
  ReportController.reportUser
);
/* POST /message/:messageId - Report a message */
router.post(
  '/message/:messageId',
  validateParams(reportMessageParam),
  validateBody(reportMessageBody),
  ReportController.reportMessage
);

/* GET /my-reports - Get current user's reports */
router.get(
  '/my-reports',
  validateQuery(myReportsQuery),
  ReportController.getMyReports
);
/* GET /:reportId - Get report by ID */
router.get(
  '/:reportId',
  validateParams(reportIdParam),
  ReportController.getReportById
);

/* GET / - Get all reports (admin only) */
router.get(
  '/',
  validateQuery(getAllReportsQuery),
  ReportController.getAllReports
);
/* GET /pending - Get pending reports (admin only) */
router.get(
  '/pending',
  validateQuery(pendingReportsQuery),
  ReportController.getPendingReports
);
/* GET /user/:userId/against - Get reports against a user (admin only) */
router.get(
  '/user/:userId/against',
  validateParams(reportsAgainstUserParam),
  validateQuery(reportsAgainstUserQuery),
  ReportController.getReportsAgainstUser
);
/* POST /:reportId/start-review - Start reviewing a report (admin only) */
router.post(
  '/:reportId/start-review',
  validateParams(startReviewParam),
  ReportController.startReview
);
/* PUT /:reportId/resolve - Resolve a report (admin only) */
router.put(
  '/:reportId/resolve',
  validateParams(resolveReportParam),
  validateBody(resolveReportBody),
  ReportController.resolveReport
);
/* PUT /:reportId/status - Update report status (admin only) */
router.put(
  '/:reportId/status',
  validateParams(updateStatusParam),
  validateBody(updateStatusBody),
  ReportController.updateReportStatus
);

export default router;
