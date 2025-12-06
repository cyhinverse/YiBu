import express from "express";
import UserController from "../controllers/user.controller.js";
import { verifyToken } from "../middlewares/auth.middleware.js";

// This router is kept for backward compatibility if app.js uses it separately, 
// but Logic is merged into user.router.js. 
// Ideally app.js should use user.router.js for /settings path or we delegate.

const router = express.Router();

router.use(verifyToken);

router.get("/", UserController.getUserSettings);

router.put("/privacy", UserController.updatePrivacySettings);
router.put("/notifications", UserController.updateNotificationSettings);
router.put("/security", UserController.updateSecuritySettings);
router.put("/content", UserController.updateContentSettings);
router.put("/theme", UserController.updateThemeSettings);
router.post("/devices", UserController.addTrustedDevice);
router.delete("/devices/:deviceId", UserController.removeTrustedDevice);

export default router;
