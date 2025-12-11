import Joi from 'joi';
import { objectId } from './common.validation.js';

/**
 * UserSettings Validation Schemas
 * Validation cho tất cả endpoints trong userSettings.router.js
 */

// ======================================
// PUT /privacy (updatePrivacySettings)
// Body: { isPrivate?, showEmail?, showPhone?, allowTagging?, etc. }
// ======================================
export const privacySettingsBody = Joi.object({
  isPrivate: Joi.boolean(),
  showEmail: Joi.boolean(),
  showPhone: Joi.boolean(),
  showBirthday: Joi.boolean(),
  allowTagging: Joi.boolean(),
  allowMentions: Joi.boolean(),
  whoCanMessage: Joi.string().valid(
    'everyone',
    'followers',
    'following',
    'none'
  ),
  whoCanSeeFollowers: Joi.string().valid('everyone', 'followers', 'only_me'),
  whoCanSeeFollowing: Joi.string().valid('everyone', 'followers', 'only_me'),
  whoCanSeeLikes: Joi.string().valid('everyone', 'followers', 'only_me'),
  activityStatus: Joi.boolean(),
})
  .min(1)
  .messages({
    'object.min': 'Cần ít nhất một cài đặt để cập nhật',
  });

// ======================================
// PUT /notifications (updateNotificationSettings)
// Body: { likes?, comments?, follows?, messages?, etc. }
// ======================================
export const notificationSettingsBody = Joi.object({
  likes: Joi.boolean(),
  comments: Joi.boolean(),
  follows: Joi.boolean(),
  messages: Joi.boolean(),
  mentions: Joi.boolean(),
  replies: Joi.boolean(),
  shares: Joi.boolean(),
  email: Joi.boolean(),
  push: Joi.boolean(),
  sound: Joi.boolean(),
  vibration: Joi.boolean(),
})
  .min(1)
  .messages({
    'object.min': 'Cần ít nhất một cài đặt để cập nhật',
  });

// ======================================
// PUT /security (updateSecuritySettings)
// Body: { twoFactorEnabled?, loginAlerts?, etc. }
// ======================================
export const securitySettingsBody = Joi.object({
  twoFactorEnabled: Joi.boolean(),
  loginAlerts: Joi.boolean(),
  loginApproval: Joi.boolean(),
  trustedDevicesOnly: Joi.boolean(),
  sessionTimeout: Joi.number().integer().min(5).max(1440), // 5 phút - 24 giờ
})
  .min(1)
  .messages({
    'object.min': 'Cần ít nhất một cài đặt để cập nhật',
  });

// ======================================
// PUT /content (updateContentSettings)
// Body: { sensitiveContent?, autoplayVideos?, etc. }
// ======================================
export const contentSettingsBody = Joi.object({
  sensitiveContent: Joi.boolean(),
  autoplayVideos: Joi.boolean(),
  dataUsage: Joi.string().valid('low', 'medium', 'high', 'auto'),
  videoQuality: Joi.string().valid('auto', 'low', 'medium', 'high', 'hd'),
  imageQuality: Joi.string().valid('auto', 'low', 'medium', 'high'),
  muteVideos: Joi.boolean(),
})
  .min(1)
  .messages({
    'object.min': 'Cần ít nhất một cài đặt để cập nhật',
  });

// ======================================
// PUT /theme (updateThemeSettings)
// Body: { theme?, fontSize?, language?, etc. }
// ======================================
export const themeSettingsBody = Joi.object({
  theme: Joi.string().valid('light', 'dark', 'system'),
  fontSize: Joi.string().valid('small', 'medium', 'large'),
  language: Joi.string().valid('vi', 'en', 'ja', 'ko', 'zh'),
  reducedMotion: Joi.boolean(),
  highContrast: Joi.boolean(),
})
  .min(1)
  .messages({
    'object.min': 'Cần ít nhất một cài đặt để cập nhật',
  });

// ======================================
// POST /devices (addTrustedDevice)
// Body: { deviceName, deviceType, etc. }
// ======================================
export const addDeviceBody = Joi.object({
  deviceName: Joi.string().trim().max(100).required().messages({
    'string.max': 'Tên thiết bị không được quá 100 ký tự',
    'any.required': 'Tên thiết bị là bắt buộc',
  }),
  deviceType: Joi.string()
    .valid('desktop', 'mobile', 'tablet', 'other')
    .default('other'),
  browser: Joi.string().trim().max(50),
  os: Joi.string().trim().max(50),
});

// ======================================
// DELETE /devices/:deviceId (removeTrustedDevice)
// Params: { deviceId }
// ======================================
export const deviceIdParam = Joi.object({
  deviceId: objectId.required().messages({
    'any.required': 'Device ID là bắt buộc',
    'string.pattern.base': 'Device ID không hợp lệ',
  }),
});

export default {
  privacySettingsBody,
  notificationSettingsBody,
  securitySettingsBody,
  contentSettingsBody,
  themeSettingsBody,
  addDeviceBody,
  deviceIdParam,
};
