import Joi from 'joi';

/**
 * UserSettings Validation Schemas
 * Validation for all endpoints in userSettings.router.js
 */

// ======================================
// PUT /privacy (updatePrivacySettings)
// Body: { isPrivate?, showEmail?, showPhone?, allowTagging?, etc. }
// ======================================
export const privacySettingsBody = Joi.object({
  profileVisibility: Joi.string().valid('public', 'followers', 'private'),
  postVisibility: Joi.string().valid('public', 'followers', 'private'),
  allowMessages: Joi.string().valid(
    'everyone',
    'followers',
    'following',
    'nobody',
    'none'
  ),
  messagePermission: Joi.string().valid(
    'everyone',
    'followers',
    'following',
    'nobody',
    'none'
  ),
  searchable: Joi.boolean(),
  searchVisibility: Joi.boolean(),
  showActivity: Joi.boolean(),
  activityStatus: Joi.boolean(),
  showOnlineStatus: Joi.boolean(),
  // Legacy support
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
})
  .min(1)
  .rename('messagePermission', 'allowMessages', {
    ignoreUndefined: true,
    override: false,
  })
  .rename('whoCanMessage', 'allowMessages', {
    ignoreUndefined: true,
    override: false,
  })
  .rename('searchVisibility', 'searchable', {
    ignoreUndefined: true,
    override: false,
  })
  .rename('activityStatus', 'showActivity', {
    ignoreUndefined: true,
    override: false,
  })
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
  newFollower: Joi.boolean(),
  messages: Joi.boolean(),
  directMessages: Joi.boolean(),
  mentions: Joi.boolean(),
  replies: Joi.boolean(),
  shares: Joi.boolean(),
  saves: Joi.boolean(),
  tags: Joi.boolean(),
  email: Joi.alternatives().try(
    Joi.boolean(),
    Joi.object({
      enabled: Joi.boolean(),
      accountUpdates: Joi.boolean(),
      newFeatures: Joi.boolean(),
      marketing: Joi.boolean(),
      digest: Joi.string().valid('none', 'daily', 'weekly'),
    })
  ),
  push: Joi.alternatives().try(
    Joi.boolean(),
    Joi.object({
      enabled: Joi.boolean(),
      likes: Joi.boolean(),
      comments: Joi.boolean(),
      follows: Joi.boolean(),
      messages: Joi.boolean(),
      mentions: Joi.boolean(),
      shares: Joi.boolean(),
      replies: Joi.boolean(),
      saves: Joi.boolean(),
      tags: Joi.boolean(),
      systemUpdates: Joi.boolean(),
      sound: Joi.boolean(),
      vibration: Joi.boolean(),
    })
  ),
  sound: Joi.boolean(),
  vibration: Joi.boolean(),
  systemUpdates: Joi.boolean(),
})
  .min(1)
  .rename('newFollower', 'follows', { ignoreUndefined: true, override: false })
  .rename('directMessages', 'messages', {
    ignoreUndefined: true,
    override: false,
  })
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
  language: Joi.string().valid('vi', 'en', 'ja', 'ko', 'zh'),
  contentFilter: Joi.string().valid('all', 'moderate', 'strict'),
  autoplayVideos: Joi.boolean(),
  showSensitiveContent: Joi.boolean(),
  sensitiveContent: Joi.boolean(),
  autoplay: Joi.boolean(),
  autoplayEnabled: Joi.boolean(),
  dataUsage: Joi.string().valid('low', 'medium', 'high', 'auto'),
  videoQuality: Joi.string().valid('auto', 'low', 'medium', 'high', 'hd'),
  imageQuality: Joi.string().valid('auto', 'low', 'medium', 'high'),
  muteVideos: Joi.boolean(),
})
  .min(1)
  .rename('sensitiveContent', 'showSensitiveContent', {
    ignoreUndefined: true,
    override: false,
  })
  .rename('autoplay', 'autoplayVideos', { ignoreUndefined: true, override: false })
  .rename('autoplayEnabled', 'autoplayVideos', {
    ignoreUndefined: true,
    override: false,
  })
  .messages({
    'object.min': 'Cần ít nhất một cài đặt để cập nhật',
  });

// ======================================
// PUT /theme (updateThemeSettings)
// Body: { theme?, fontSize?, language?, etc. }
// ======================================
export const themeSettingsBody = Joi.object({
  theme: Joi.string().valid('light', 'dark', 'system'),
  appearance: Joi.string().valid('light', 'dark', 'system'),
  fontSize: Joi.string().valid('small', 'medium', 'large'),
  language: Joi.string().valid('vi', 'en', 'ja', 'ko', 'zh'),
  compactMode: Joi.boolean(),
  reducedMotion: Joi.boolean(),
  highContrast: Joi.boolean(),
  colorScheme: Joi.string().valid('default', 'blue', 'green', 'orange', 'red'),
  primaryColor: Joi.string().valid('default', 'blue', 'green', 'orange', 'red'),
})
  .min(1)
  .rename('appearance', 'theme', { ignoreUndefined: true, override: false })
  .messages({
    'object.min': 'Cần ít nhất một cài đặt để cập nhật',
  });


export default {
  privacySettingsBody,
  notificationSettingsBody,
  securitySettingsBody,
  contentSettingsBody,
  themeSettingsBody,
};
