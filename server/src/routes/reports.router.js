import express from "express";
import ReportController from "../controllers/report.controller.js";
import { verifyToken } from "../middlewares/auth.middleware.js";

const router = express.Router();

router.use(verifyToken);

// ======================================
// Create Reports
// ======================================
router.post("/", ReportController.createReport);
router.post("/post/:postId", ReportController.reportPost);
router.post("/comment/:commentId", ReportController.reportComment);
router.post("/user/:userId", ReportController.reportUser);
router.post("/message/:messageId", ReportController.reportMessage);

// ======================================
// User's Reports
// ======================================
router.get("/my-reports", ReportController.getMyReports);
router.get("/:reportId", ReportController.getReportById);

// ======================================
// Admin Routes (authorization in controller)
// ======================================
router.get("/", ReportController.getAllReports);
router.get("/pending", ReportController.getPendingReports);
router.get("/user/:userId/against", ReportController.getReportsAgainstUser);
router.post("/:reportId/start-review", ReportController.startReview);
router.put("/:reportId/resolve", ReportController.resolveReport);
router.put("/:reportId/status", ReportController.updateReportStatus);

export default router;
