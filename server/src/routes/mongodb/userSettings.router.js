import express from "express";
import UserSettingsController from "../../controllers/mongodb/userSettings.controller.js";
import { verifyToken } from "../../middlewares/auth.middleware.js";
import upload from "../../middlewares/multerUpload.js";

const router = express.Router();

// Apply authentication middleware to all routes
router.use(verifyToken);

// Lấy tất cả cài đặt
router.get("/", UserSettingsController.getUserSettings);

// Cập nhật thông tin hồ sơ - hỗ trợ cả hai cách upload: multer và express-fileupload
router.put(
  "/profile",
  upload.single("avatar"),
  UserSettingsController.updateProfileSettings
);

// Cập nhật cài đặt quyền riêng tư
router.put("/privacy", UserSettingsController.updatePrivacySettings);

// Cập nhật cài đặt thông báo
router.put("/notifications", UserSettingsController.updateNotificationSettings);

// Cập nhật cài đặt bảo mật
router.put("/security", UserSettingsController.updateSecuritySettings);

// Cập nhật cài đặt nội dung
router.put("/content", UserSettingsController.updateContentSettings);

// Cập nhật cài đặt giao diện
router.put("/theme", UserSettingsController.updateThemeSettings);

// API quản lý thiết bị được tin cậy
router.post(
  "/security/trusted-device",
  UserSettingsController.addTrustedDevice
);
router.delete(
  "/security/trusted-device/:deviceId",
  UserSettingsController.removeTrustedDevice
);

// API quản lý danh sách chặn
router.post("/privacy/block", UserSettingsController.blockUser);
router.delete(
  "/privacy/block/:blockedUserId",
  UserSettingsController.unblockUser
);
router.get("/privacy/block", UserSettingsController.getBlockList);

export default router;
