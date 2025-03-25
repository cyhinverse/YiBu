export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:9785";

export const AUTH_API_ENDPOINTS = {
  LOGIN: "/api/auth/login",
  REGISTER: "/api/auth/register",
  LOGOUT: "/api/auth/logout",
  REFRESH_TOKEN: "/api/auth/refresh-token",
  UPDATE_EMAIL: "/api/auth/update-email",
  UPDATE_PASSWORD: "/api/auth/update-password",
  CONNECT_SOCIAL: "/api/auth/connect-social",
  VERIFY_ACCOUNT: "/api/auth/verify-account",
  DELETE_ACCOUNT: "/api/auth/delete-account",
};

export const USER_API_ENDPOINTS = {
  GET_ALL_USER: "/user/list",
  GET_USER_BY_ID: "/user",
  SEARCH_USERS: "/user/search",
  FOLLOW_USER: "/user/follow",
  UNFOLLOW_USER: "/user/unfollow",
  CHECK_FOLLOW_STATUS: "/user/follow-status",
};

export const POST_API_ENDPOINTS = {
  CREATE_POST: "/api/v1/create-post",
  GET_POST_USER_BY_ID: "/api/v1/post-user",
  GET_ALL_USER: "/api/v1/posts",
  DELETE_POST: "/api/v1/post",
  REPORT_POST: "/api/v1/report-post",
};

export const LIKE_API_ENDPOINTS = {
  CREATE_LIKE: "/api/like/create",
  DELETE_LIKE: "/api/like/delete",
  GET_LIKE_STATUS: "/api/like/status",
  GET_ALL_LIKES: "/api/like/get-all",
  TOGGLE_LIKE: "/api/like/toggle",
  GET_LIKED_POSTS: "/api/like/liked-posts",
};

export const PROFILE_API_ENDPOINTS = {
  GET_PROFILE_BY_ID: "/profile/:id",
};

export const COMMENT_API_ENDPOINTS = {
  CREATE_COMMENT: "/api/comments",
  GET_COMMENTS_BY_POST: "/api/comments/post",
  UPDATE_COMMENT: "/api/comments",
  DELETE_COMMENT: "/api/comments",
};

export const REPORT_API_ENDPOINTS = {
  CREATE_REPORT: "/api/reports",
  GET_USER_REPORTS: "/api/reports/user",
  GET_REPORT_DETAILS: "/api/reports/details",
  GET_ALL_REPORTS: "/api/reports",
  UPDATE_REPORT_STATUS: "/api/reports/status",
  RESOLVE_REPORT: "/api/reports/resolve",
  DISMISS_REPORT: "/api/reports/dismiss",
  ADD_REPORT_COMMENT: "/api/reports/comment",
};

export const SETTINGS_API_ENDPOINTS = {
  GET_ALL_SETTINGS: "/api/settings",
  UPDATE_PROFILE: "/api/settings/profile",
  UPDATE_PRIVACY: "/api/settings/privacy",
  UPDATE_NOTIFICATION: "/api/settings/notifications",
  UPDATE_SECURITY: "/api/settings/security",
  UPDATE_CONTENT: "/api/settings/content",
  UPDATE_THEME: "/api/settings/theme",
  ADD_TRUSTED_DEVICE: "/api/settings/security/trusted-device",
  REMOVE_TRUSTED_DEVICE: "/api/settings/security/trusted-device",
  BLOCK_USER: "/api/settings/privacy/block",
  UNBLOCK_USER: "/api/settings/privacy/block",
  GET_BLOCK_LIST: "/api/settings/privacy/block",
};

export const ADMIN_API_ENDPOINTS = {
  // User management
  GET_ALL_USERS: "/api/admin/users",
  GET_USER_DETAILS: "/api/admin/users",
  UPDATE_USER: "/api/admin/users",
  DELETE_USER: "/api/admin/users",
  BAN_USER: "/api/admin/users/ban",
  UNBAN_USER: "/api/admin/users/unban",

  // Banned accounts management
  GET_BANNED_ACCOUNTS: "/api/admin/users/banned",
  GET_BAN_HISTORY: "/api/admin/users/ban-history",
  EXTEND_BAN: "/api/admin/users/extend-ban",
  TEMPORARY_UNBAN: "/api/admin/users/temp-unban",

  // Post management
  GET_ALL_POSTS: "/api/admin/posts",
  GET_POST_DETAILS: "/api/admin/posts",
  DELETE_POST: "/api/admin/posts",
  APPROVE_POST: "/api/admin/posts/approve",

  // Comment management
  GET_ALL_COMMENTS: "/api/admin/comments",
  DELETE_COMMENT: "/api/admin/comments",

  // Report management
  GET_ALL_REPORTS: "/api/admin/reports",
  RESOLVE_REPORT: "/api/admin/reports/resolve",
  DISMISS_REPORT: "/api/admin/reports/dismiss",

  // Interaction management
  GET_INTERACTION_STATS: "/api/admin/interactions/stats",
  GET_INTERACTION_TIMELINE: "/api/admin/interactions/timeline",
  GET_USER_INTERACTIONS: "/api/admin/interactions/users",
  GET_SPAM_ACCOUNTS: "/api/admin/interactions/spam",
  FLAG_ACCOUNT: "/api/admin/interactions/flag",
  REMOVE_INTERACTION: "/api/admin/interactions/remove",
  GET_INTERACTION_TYPES: "/api/admin/interactions/types",

  // Admin dashboard
  GET_DASHBOARD_STATS: "/api/admin/dashboard/stats",
  GET_RECENT_ACTIVITIES: "/api/admin/dashboard/activities",
  GET_SYSTEM_LOGS: "/api/admin/logs",

  // Admin settings
  GET_ADMIN_SETTINGS: "/api/admin/settings",
  UPDATE_ADMIN_SETTINGS: "/api/admin/settings",

  // System settings
  UPDATE_SECURITY_SETTINGS: "/api/admin/settings/security",
  UPDATE_CONTENT_POLICY: "/api/admin/settings/content-policy",
  UPDATE_USER_PERMISSIONS: "/api/admin/settings/user-permissions",
  UPDATE_NOTIFICATION_SETTINGS: "/api/admin/settings/notifications",
  GET_SYSTEM_HEALTH: "/api/admin/settings/system-health",
  UPDATE_SYSTEM_CONFIG: "/api/admin/settings/system-config",
};
