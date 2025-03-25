import express from "express";
import { AdminController } from "../../controllers/mongodb/admin.controller.js";
import { verifyToken } from "../../middlewares/auth.middleware.js";
import { adminMiddleware } from "../../middlewares/admin.middleware.js";

const router = express.Router();

// Health check endpoint (không cần xác thực)
router.get("/health", (req, res) => {
  res.status(200).json({
    status: "ok",
    message: "Admin API is running",
    timestamp: new Date(),
  });
});

// Apply authentication and admin middleware to all routes except health check
router.use(verifyToken, adminMiddleware);

// Dashboard routes
router.get("/dashboard/stats", AdminController.getDashboardStats);
router.get("/dashboard/activities", AdminController.getRecentActivities);

// User management routes
router.get("/users", AdminController.getAllUsers);

// Banned accounts management - đặt trước các route với :userId
router.get("/users/banned", AdminController.getBannedAccounts);
router.get("/users/ban-history/:userId", AdminController.getBanHistory);
router.put("/users/extend-ban", AdminController.extendBan);
router.post("/users/temp-unban", AdminController.temporaryUnban);

// Các route với userId động - đặt sau các route tĩnh
router.get("/users/:userId", AdminController.getUserDetails);
router.put("/users/:userId", AdminController.updateUser);
router.delete("/users/:userId", AdminController.deleteUser);
router.post("/users/ban", AdminController.banUser);
router.post("/users/unban", AdminController.unbanUser);

// Post management routes
router.get("/posts", AdminController.getAllPosts);
router.get("/posts/:postId", AdminController.getPostDetails);
router.delete("/posts/:postId", AdminController.deletePost);
router.post("/posts/approve/:postId", AdminController.approvePost);

// Comment management routes
router.get("/comments", AdminController.getAllComments);
router.delete("/comments/:commentId", AdminController.deleteComment);

// Report management routes
router.get("/reports", AdminController.getAllReports);
router.post("/reports/resolve/:reportId", AdminController.resolveReport);
router.post("/reports/dismiss/:reportId", AdminController.dismissReport);

// Interaction management routes
router.get("/interactions/stats", AdminController.getInteractionStats);
router.get("/interactions/timeline", AdminController.getInteractionTimeline);
router.get("/interactions/users", AdminController.getUserInteractions);
router.get("/interactions/spam", AdminController.getSpamAccounts);
router.post("/interactions/flag", AdminController.flagAccount);
router.delete(
  "/interactions/remove/:interactionId",
  AdminController.removeInteraction
);
router.get("/interactions/types", AdminController.getInteractionTypes);

// Admin logs
router.get("/logs", AdminController.getSystemLogs);

// Admin settings
router.get("/settings", AdminController.getAdminSettings);
router.put("/settings", AdminController.updateAdminSettings);

// System settings
router.put("/settings/security", AdminController.updateSecuritySettings);
router.put("/settings/content-policy", AdminController.updateContentPolicy);
router.put("/settings/user-permissions", AdminController.updateUserPermissions);
router.put(
  "/settings/notifications",
  AdminController.updateNotificationSettings
);
router.get("/settings/system-health", AdminController.getSystemHealth);
router.put("/settings/system-config", AdminController.updateSystemConfig);

export default router;
