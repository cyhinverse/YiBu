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

export default router;
