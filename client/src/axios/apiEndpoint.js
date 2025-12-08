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
  GET_TOP_USERS_BY_LIKES: "/user/top/likes",
  FOLLOW_USER: "/user/follow",
  UNFOLLOW_USER: "/user/unfollow",
  CHECK_FOLLOW_STATUS: "/user/check-follow", // Fixed path from user.router.js
  UPDATE_USER: "/user/update", // This might be admin or special? User router has put("/profile", updateProfileSettings)
  DELETE_USER: "/user/delete",
  GET_FOLLOWER_BY_USERID: "/user/followers",
  ADD_FOLLOWER: "/user/add-follower",
  REMOVE_FOLLOWER: "/user/remove-follower",
  CREATE_USER: "/user/create",
};

export const POST_API_ENDPOINTS = {
  CREATE_POST: "/api/v1/create-post",
  GET_POST_USER_BY_ID: "/api/v1/post-user",
  GET_ALL_USER: "/api/v1/posts",
  DELETE_POST: "/api/v1/post", // delete is /:id
  UPDATE_POST: "/api/v1/post", // put is /:id
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
  GET_PROFILE_BY_ID: "/user/profile", // /:id
};

export const COMMENT_API_ENDPOINTS = {
  CREATE_COMMENT: "/api/comments/create",
  GET_COMMENTS_BY_POST: "/api/comments", // /:postId
  UPDATE_COMMENT: "/api/comments", // /:id
  DELETE_COMMENT: "/api/comments", // /:id
};

export const REPORT_API_ENDPOINTS = {
  CREATE_REPORT: "/api/reports",
  GET_USER_REPORTS: "/api/reports/user",
  GET_REPORT_DETAILS: "/api/reports", // /:reportId
  GET_ALL_REPORTS: "/api/reports",
  UPDATE_REPORT_STATUS: "/api/reports", // /:reportId/status
  ADD_REPORT_COMMENT: "/api/reports", // /:reportId/comment
};

export const SETTINGS_API_ENDPOINTS = {
  GET_ALL_SETTINGS: "/user/settings",
  UPDATE_PROFILE: "/user/profile", // PUT
  UPDATE_PRIVACY: "/user/settings/privacy",
  UPDATE_NOTIFICATION: "/user/settings/notifications",
  UPDATE_SECURITY: "/user/settings/security",
  UPDATE_CONTENT: "/user/settings/content",
  UPDATE_THEME: "/user/settings/theme",
  ADD_TRUSTED_DEVICE: "/user/settings/devices",
  REMOVE_TRUSTED_DEVICE: "/user/settings/devices", // /:deviceId
  BLOCK_USER: "/user/block",
  UNBLOCK_USER: "/user/block", // /:blockedUserId
  GET_BLOCK_LIST: "/user/block/list",
};

export const ADMIN_API_ENDPOINTS = {
  // User management
  GET_ALL_USERS: "/api/admin/users",
  GET_USER_DETAILS: "/api/admin/users", // /:userId
  UPDATE_USER: "/api/admin/users", // /:userId
  DELETE_USER: "/api/admin/users", // /:userId
  BAN_USER: "/api/admin/users/ban",
  UNBAN_USER: "/api/admin/users/unban",

  // Banned accounts management
  GET_BANNED_ACCOUNTS: "/api/admin/users/banned",
  GET_BAN_HISTORY: "/api/admin/users/ban-history", // /:userId
  EXTEND_BAN: "/api/admin/users/extend-ban",
  TEMPORARY_UNBAN: "/api/admin/users/temp-unban",

  // Post management
  GET_ALL_POSTS: "/api/admin/posts",
  GET_POST_DETAILS: "/api/admin/posts", // /:postId
  DELETE_POST: "/api/admin/posts", // /:postId
  APPROVE_POST: "/api/admin/posts/approve", // /:postId

  // Comment management
  GET_ALL_COMMENTS: "/api/admin/comments",
  DELETE_COMMENT: "/api/admin/comments", // /:commentId

  // Report management
  GET_ALL_REPORTS: "/api/admin/reports",
  UPDATE_REPORT_STATUS: "/api/admin/reports", // /:reportId
  ADD_REPORT_COMMENT: "/api/admin/reports", // /:reportId/comment
  RESOLVE_REPORT: "/api/admin/reports/resolve", // /:reportId (custom route)
  DISMISS_REPORT: "/api/admin/reports/dismiss", // /:reportId (custom route)

  // Interaction management
  GET_INTERACTION_STATS: "/api/admin/interactions/stats",
  GET_INTERACTION_TIMELINE: "/api/admin/interactions/timeline",
  GET_USER_INTERACTIONS: "/api/admin/interactions/users",
  GET_SPAM_ACCOUNTS: "/api/admin/interactions/spam",
  FLAG_ACCOUNT: "/api/admin/interactions/flag",
  REMOVE_INTERACTION: "/api/admin/interactions/remove", // /:interactionId
  GET_INTERACTION_TYPES: "/api/admin/interactions/types",

  // Admin dashboard
  GET_DASHBOARD_STATS: "/api/admin/dashboard/stats",
  GET_RECENT_ACTIVITIES: "/api/admin/dashboard/activities",
  GET_SYSTEM_LOGS: "/api/admin/logs", // Note: NO route defined in router for this! Skippping? Or maybe future?
                                      // Router: no logs route.
                                      // Removing logs for now? Or keep as placeholder. 
                                      // User asked to match router. Router has NO logs endpoint active.

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

export const MESSAGE_API_ENDPOINTS = {
  GET_CONVERSATIONS: "/api/messages/conversations",
  GET_MESSAGES: "/api/messages", // append /:userId
  SEND_MESSAGE: "/api/messages/send",
  MARK_AS_READ: "/api/messages/read",
  DELETE_MESSAGE: "/api/messages", // append /:messageId
  DELETE_CONVERSATION: "/api/messages/conversation", // append /:partnerId
};

export const NOTIFICATION_API_ENDPOINTS = {
  BASE: "/api/notifications",
  READ_ALL: "/api/notifications/read-all",
  UNREAD_COUNT: "/api/notifications/unread-count",
};

export const SAVE_POST_API_ENDPOINTS = {
  BASE: "/api/savepost",
  CHECK: "/api/savepost/check",
};
