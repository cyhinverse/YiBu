const express = require("express");
const router = express.Router();
const { authMiddleware } = require("../../middleware/authMiddleware");
const reportController = require("../../controllers/reportController");

// Create a new report
router.post("/", authMiddleware, reportController.createReport);

// Get all reports (for admin)
router.get("/", authMiddleware, reportController.getAllReports);

// Get report details by ID
router.get(
  "/details/:reportId",
  authMiddleware,
  reportController.getReportById
);

// Get reports submitted by a user
router.get("/user/:userId", authMiddleware, reportController.getReportsByUser);

// Update report status
router.patch(
  "/:reportId/status",
  authMiddleware,
  reportController.updateReportStatus
);

// Add admin comment to a report
router.post(
  "/:reportId/comment",
  authMiddleware,
  reportController.addReportComment
);

module.exports = router;
