import express from "express";
import UserController from "../controllers/user.controller.js";
import { verifyToken } from "../middlewares/auth.middleware.js";

const router = express.Router();

router.use(verifyToken);

// ======================================
// User Settings
// ======================================
router.get("/", UserController.getUserSettings);

router.put("/privacy", UserController.updatePrivacySettings);
router.put("/notifications", UserController.updateNotificationSettings);
router.put("/security", UserController.updateSecuritySettings);
router.put("/content", UserController.updateContentSettings);
router.put("/theme", UserController.updateThemeSettings);

// ======================================
// Trusted Devices
// ======================================
router.post("/devices", UserController.addTrustedDevice);
router.delete("/devices/:deviceId", UserController.removeTrustedDevice);

export default router;
