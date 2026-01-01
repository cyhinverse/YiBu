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

/* GET / - Get all user settings */
router.get('/', UserController.getUserSettings);

/* PUT /privacy - Update privacy settings */
router.put(
  '/privacy',
  validateBody(privacySettingsBody),
  UserController.updatePrivacySettings
);
/* PUT /notifications - Update notification settings */
router.put(
  '/notifications',
  validateBody(notificationSettingsBody),
  UserController.updateNotificationSettings
);
/* PUT /security - Update security settings */
router.put(
  '/security',
  validateBody(securitySettingsBody),
  UserController.updateSecuritySettings
);
/* PUT /content - Update content settings */
router.put(
  '/content',
  validateBody(contentSettingsBody),
  UserController.updateContentSettings
);
/* PUT /theme - Update theme/appearance settings */
router.put(
  '/theme',
  validateBody(themeSettingsBody),
  UserController.updateThemeSettings
);

/* POST /devices - Add trusted device (deprecated) */
router.post(
  '/devices',
  validateBody(addDeviceBody),
  UserController.addTrustedDevice
);
/* DELETE /devices/:deviceId - Remove trusted device (deprecated) */
router.delete(
  '/devices/:deviceId',
  validateParams(deviceIdParam),
  UserController.removeTrustedDevice
);

export default router;
