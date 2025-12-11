import express from 'express';
import UserController from '../controllers/user.controller.js';
import { verifyToken } from '../middlewares/auth.middleware.js';
import {
  validateBody,
  validateParams,
} from '../middlewares/validation.middleware.js';
import {
  privacySettingsBody,
  notificationSettingsBody,
  securitySettingsBody,
  contentSettingsBody,
  themeSettingsBody,
  addDeviceBody,
  deviceIdParam,
} from '../validations/userSettings.validation.js';

const router = express.Router();

router.use(verifyToken);

// ======================================
// User Settings
// ======================================
router.get('/', UserController.getUserSettings);

router.put(
  '/privacy',
  validateBody(privacySettingsBody),
  UserController.updatePrivacySettings
);
router.put(
  '/notifications',
  validateBody(notificationSettingsBody),
  UserController.updateNotificationSettings
);
router.put(
  '/security',
  validateBody(securitySettingsBody),
  UserController.updateSecuritySettings
);
router.put(
  '/content',
  validateBody(contentSettingsBody),
  UserController.updateContentSettings
);
router.put(
  '/theme',
  validateBody(themeSettingsBody),
  UserController.updateThemeSettings
);

// ======================================
// Trusted Devices
// ======================================
router.post(
  '/devices',
  validateBody(addDeviceBody),
  UserController.addTrustedDevice
);
router.delete(
  '/devices/:deviceId',
  validateParams(deviceIdParam),
  UserController.removeTrustedDevice
);

export default router;
