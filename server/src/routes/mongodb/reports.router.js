import express from "express";
import { verifyToken } from "../../middlewares/auth.middleware.js";
import { adminMiddleware } from "../../middlewares/admin.middleware.js";
import {
  createReport,
  getAllReports,
  getReportById,
  getReportsByUser,
  updateReportStatus,
  addReportComment,
} from "../../controllers/mongodb/report.controller.js";

const router = express.Router();

// Create a new report - all authenticated users can create reports
router.post("/", verifyToken, createReport);

// Get all reports - admin only
router.get("/", verifyToken, adminMiddleware, getAllReports);

// Get reports by user ID - admin or the user themselves
router.get("/user/:userId", verifyToken, getReportsByUser);

// Get report details by ID - admin or the reporter
router.get("/details/:reportId", verifyToken, getReportById);

// Update report status - admin only
router.post(
  "/status/:reportId",
  verifyToken,
  adminMiddleware,
  updateReportStatus
);

// Resolve a report - admin only
router.post("/resolve/:reportId", verifyToken, adminMiddleware, (req, res) => {
  req.body.status = "resolved";
  updateReportStatus(req, res);
});

// Dismiss a report - admin only
router.post("/dismiss/:reportId", verifyToken, adminMiddleware, (req, res) => {
  req.body.status = "dismissed";
  updateReportStatus(req, res);
});

// Add a comment to a report - admin only
router.post(
  "/comment/:reportId",
  verifyToken,
  adminMiddleware,
  addReportComment
);

export default router;
