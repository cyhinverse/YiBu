import express from "express";
import { verifyToken } from "../middlewares/auth.middleware.js";
import userSettingsController from "../controllers/mongodb/userSettings.controller.js";

const router = express.Router();

// Get all user settings
router.get("/", verifyToken, userSettingsController.getUserSettings);

// Profile Settings Routes
router.put(
  "/profile",
  verifyToken,
  userSettingsController.updateProfileSettings
);

// Privacy Settings Routes
router.put(
  "/privacy",
  verifyToken,
  userSettingsController.updatePrivacySettings
);

// Notification Settings Routes
router.put(
  "/notifications",
  verifyToken,
  userSettingsController.updateNotificationSettings
);

// Security Settings Routes
router.put(
  "/security",
  verifyToken,
  userSettingsController.updateSecuritySettings
);

// Content Settings Routes
router.put(
  "/content",
  verifyToken,
  userSettingsController.updateContentSettings
);

// Theme Settings Routes
router.put("/theme", verifyToken, userSettingsController.updateThemeSettings);

// Trusted Device Routes
router.post(
  "/security/trusted-device",
  verifyToken,
  userSettingsController.addTrustedDevice
);
router.delete(
  "/security/trusted-device/:deviceId",
  verifyToken,
  userSettingsController.removeTrustedDevice
);

export default router;
