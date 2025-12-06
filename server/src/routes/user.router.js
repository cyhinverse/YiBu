import express from "express";
import UserController from "../controllers/user.controller.js";
import { verifyToken } from "../middlewares/auth.middleware.js";
import upload from "../middlewares/multerUpload.js";

const router = express.Router();

router.use(verifyToken);

// General User Routes
router.get("/", UserController.getAllUsers);
router.get("/search", UserController.searchUsers);
router.get("/top/likes", UserController.GET_TOP_USERS_BY_LIKES);
router.get("/check-follow/:targetUserId", UserController.checkFollowStatus);

router.post("/follow", UserController.followUser);
router.post("/unfollow", UserController.unfollowUser);

// Profile Routes
router.get("/profile/:id", UserController.GET_PROFILE_BY_ID);
router.put("/profile", upload.fields([{ name: "avatar", maxCount: 1 }]), UserController.updateProfileSettings);

// Settings Routes
router.get("/settings", UserController.getUserSettings);
router.put("/settings/privacy", UserController.updatePrivacySettings);
router.put("/settings/notifications", UserController.updateNotificationSettings);
router.put("/settings/security", UserController.updateSecuritySettings);
router.put("/settings/content", UserController.updateContentSettings);
router.put("/settings/theme", UserController.updateThemeSettings);

// Device Management
router.post("/settings/devices", UserController.addTrustedDevice);
router.delete("/settings/devices/:deviceId", UserController.removeTrustedDevice);

// Block Management
router.get("/block/list", UserController.getBlockList);
router.post("/block", UserController.blockUser);
router.delete("/block/:blockedUserId", UserController.unblockUser);

// User Detail (keep last to avoid conflict)
router.get("/:id", UserController.Get_User_By_Id);

export default router;
