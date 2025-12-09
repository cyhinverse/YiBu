import express from "express";
import { AdminController } from "../controllers/admin.controller.js";
import ReportController from "../controllers/report.controller.js";
import { verifyToken } from "../middlewares/auth.middleware.js";
import { adminMiddleware } from "../middlewares/admin.middleware.js";

const router = express.Router();

// Health check endpoint (không cần xác thực)
router.get("/health", (req, res) => {
  res.status(200).json({
    status: "ok",
    message: "Admin API is running",
    timestamp: new Date(),
  });
});

// Apply authentication and admin middleware
router.use(verifyToken, adminMiddleware);

// ======================================
// Dashboard & Analytics
// ======================================
router.get("/dashboard/stats", AdminController.getDashboardStats);
router.get("/analytics/user-growth", AdminController.getUserGrowthStats);
router.get("/analytics/posts", AdminController.getPostStats);
router.get("/analytics/top-users", AdminController.getTopEngagedUsers);

// ======================================
// User Management
// ======================================
router.get("/users", AdminController.getAllUsers);
router.get("/users/banned", AdminController.getBannedUsers);
router.get("/users/:userId", AdminController.getUserDetails);
router.put("/users/:userId", AdminController.updateUser);
router.delete("/users/:userId", AdminController.deleteUser);

// User Moderation
router.post("/users/ban", AdminController.banUser);
router.post("/users/unban", AdminController.unbanUser);
router.post("/users/suspend", AdminController.suspendUser);
router.post("/users/warn", AdminController.warnUser);

// ======================================
// Content Moderation
// ======================================
router.get("/posts", AdminController.getAllPosts);
router.post("/posts/:postId/moderate", AdminController.moderatePost);
router.post("/posts/:postId/approve", AdminController.approvePost);
router.delete("/posts/:postId", AdminController.deletePost);

router.post("/comments/:commentId/moderate", AdminController.moderateComment);
router.delete("/comments/:commentId", AdminController.deleteComment);

// ======================================
// Reports Management
// ======================================
router.get("/reports", AdminController.getReports);
router.get("/reports/pending", ReportController.getPendingReports);
router.get("/reports/user/:userId", ReportController.getReportsAgainstUser);
router.post("/reports/:reportId/review", AdminController.reviewReport);
router.post("/reports/:reportId/start-review", ReportController.startReview);
router.put("/reports/:reportId/resolve", ReportController.resolveReport);

// ======================================
// System Management
// ======================================
router.post("/broadcast", AdminController.broadcastNotification);
router.get("/system/health", AdminController.getSystemHealth);
router.get("/logs", AdminController.getAdminLogs);

export default router;
