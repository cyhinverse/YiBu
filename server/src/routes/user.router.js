import express from "express";
import UserController from "../controllers/user.controller.js";
import { verifyToken } from "../middlewares/auth.middleware.js";
import upload from "../middlewares/multerUpload.js";

const router = express.Router();

router.use(verifyToken);

// ======================================
// Search & Discovery
// ======================================
router.get("/search", UserController.searchUsers);
router.get("/suggestions", UserController.getRecommendedUsers);

// ======================================
// User Profile
// ======================================
router.get("/profile/:id", UserController.GET_PROFILE_BY_ID);
router.put(
  "/profile",
  upload.fields([{ name: "avatar", maxCount: 1 }]),
  UserController.updateProfileSettings
);

// ======================================
// Follow System
// ======================================
router.get("/check-follow/:targetUserId", UserController.checkFollowStatus);
router.post("/follow", UserController.followUser);
router.post("/unfollow", UserController.unfollowUser);
router.get("/followers/:userId", UserController.getFollowers);
router.get("/following/:userId", UserController.getFollowing);

// Follow Requests (for private accounts)
router.get("/follow-requests", UserController.getPendingFollowRequests);
router.post(
  "/follow-requests/:requestId/accept",
  UserController.acceptFollowRequest
);
router.post(
  "/follow-requests/:requestId/reject",
  UserController.rejectFollowRequest
);

// ======================================
// Block & Mute
// ======================================
router.get("/blocked", UserController.getBlockList);
router.post("/block/:userId", UserController.blockUser);
router.delete("/block/:userId", UserController.unblockUser);

router.get("/muted", UserController.getMuteList);
router.post("/mute/:userId", UserController.muteUser);
router.delete("/mute/:userId", UserController.unmuteUser);

// ======================================
// User Settings
// ======================================
router.get("/settings", UserController.getUserSettings);
router.put("/settings/privacy", UserController.updatePrivacySettings);
router.put(
  "/settings/notifications",
  UserController.updateNotificationSettings
);
router.put("/settings/security", UserController.updateSecuritySettings);
router.put("/settings/content", UserController.updateContentSettings);
router.put("/settings/theme", UserController.updateThemeSettings);

// Trusted Devices
router.post("/settings/devices", UserController.addTrustedDevice);
router.delete(
  "/settings/devices/:deviceId",
  UserController.removeTrustedDevice
);

// ======================================
// User Detail (keep last)
// ======================================
router.get("/:id", UserController.Get_User_By_Id);

export default router;
