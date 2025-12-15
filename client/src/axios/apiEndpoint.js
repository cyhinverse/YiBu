export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || 'http://localhost:9785';

// ======================================
// Auth API Endpoints
// ======================================
export const AUTH_API = {
  // Public
  LOGIN: '/api/auth/login',
  REGISTER: '/api/auth/register',
  GOOGLE_AUTH: '/api/auth/google',
  REQUEST_PASSWORD_RESET: '/api/auth/password/reset-request',
  RESET_PASSWORD: '/api/auth/password/reset',
  // Protected
  REFRESH_TOKEN: '/api/auth/refresh',
  LOGOUT: '/api/auth/logout',
  LOGOUT_ALL: '/api/auth/logout-all',
  UPDATE_PASSWORD: '/api/auth/password',
  // 2FA
  ENABLE_2FA: '/api/auth/2fa/enable',
  VERIFY_2FA: '/api/auth/2fa/verify',
  DISABLE_2FA: '/api/auth/2fa/disable',
  // Sessions
  GET_SESSIONS: '/api/auth/sessions',
  REVOKE_SESSION: sessionId => `/api/auth/sessions/${sessionId}`,
};

export const USER_API = {
  // Search & Discovery
  SEARCH: '/api/user/search',
  SUGGESTIONS: '/api/user/suggestions',
  // Profile
  GET_PROFILE: id => `/api/user/profile/${id}`,
  UPDATE_PROFILE: '/api/user/profile',
  GET_BY_ID: id => `/api/user/${id}`,
  // Follow System
  CHECK_FOLLOW: targetUserId => `/api/user/check-follow/${targetUserId}`,
  FOLLOW: '/api/user/follow',
  UNFOLLOW: '/api/user/unfollow',
  GET_FOLLOWERS: userId => `/api/user/followers/${userId}`,
  GET_FOLLOWING: userId => `/api/user/following/${userId}`,
  // Follow Requests
  GET_FOLLOW_REQUESTS: '/api/user/follow-requests',
  ACCEPT_FOLLOW_REQUEST: requestId =>
    `/api/user/follow-requests/${requestId}/accept`,
  REJECT_FOLLOW_REQUEST: requestId =>
    `/api/user/follow-requests/${requestId}/reject`,
  // Block & Mute
  GET_BLOCKED: '/api/user/blocked',
  BLOCK_USER: userId => `/api/user/block/${userId}`,
  UNBLOCK_USER: userId => `/api/user/block/${userId}`,
  GET_MUTED: '/api/user/muted',
  MUTE_USER: userId => `/api/user/mute/${userId}`,
  UNMUTE_USER: userId => `/api/user/mute/${userId}`,
  // Settings
  GET_SETTINGS: '/api/user/settings',
  UPDATE_PRIVACY: '/api/user/settings/privacy',
  UPDATE_NOTIFICATIONS: '/api/user/settings/notifications',
  UPDATE_SECURITY: '/api/user/settings/security',
  UPDATE_CONTENT: '/api/user/settings/content',
  UPDATE_THEME: '/api/user/settings/theme',
  // Trusted Devices
  ADD_DEVICE: '/api/user/settings/devices',
  REMOVE_DEVICE: deviceId => `/api/user/settings/devices/${deviceId}`,
};

// ======================================
// Post API Endpoints
// ======================================
export const POST_API = {
  // Feeds
  GET_ALL: '/api/posts',
  GET_EXPLORE: '/api/posts/explore',
  GET_PERSONALIZED: '/api/posts/personalized',
  GET_TRENDING: '/api/posts/trending',
  // Search
  SEARCH: '/api/posts/search',
  GET_BY_HASHTAG: hashtag => `/api/posts/hashtag/${hashtag}`,
  GET_TRENDING_HASHTAGS: '/api/posts/hashtags/trending',
  // CRUD
  CREATE: '/api/posts',
  GET_BY_USER: userId => `/api/posts/user/${userId}`,
  GET_BY_ID: id => `/api/posts/${id}`,
  UPDATE: id => `/api/posts/${id}`,
  DELETE: id => `/api/posts/${id}`,
  // Interactions
  SHARE: postId => `/api/posts/${postId}/share`,
  REPORT: postId => `/api/posts/${postId}/report`,
};

// ======================================
// Comment API Endpoints
// ======================================
export const COMMENT_API = {
  CREATE: '/api/comments',
  GET_BY_POST: postId => `/api/comments/post/${postId}`,
  GET_REPLIES: commentId => `/api/comments/${commentId}/replies`,
  UPDATE: id => `/api/comments/${id}`,
  DELETE: id => `/api/comments/${id}`,
  LIKE: commentId => `/api/comments/${commentId}/like`,
  UNLIKE: commentId => `/api/comments/${commentId}/like`,
};

// ======================================
// Like API Endpoints
// ======================================
export const LIKE_API = {
  CREATE: '/api/like',
  DELETE: '/api/like',
  TOGGLE: '/api/like/toggle',
  GET_STATUS: postId => `/api/like/status/${postId}`,
  GET_BATCH_STATUS: '/api/like/batch-status',
  GET_POST_LIKES: postId => `/api/like/post/${postId}/users`,
  GET_MY_LIKES: '/api/like/my-likes',
};

// ======================================
// Message API Endpoints
// ======================================
export const MESSAGE_API = {
  // Conversations
  GET_CONVERSATIONS: '/api/messages/conversations',
  CREATE_CONVERSATION: '/api/messages/conversations',
  GET_CONVERSATION: id => `/api/messages/conversations/${id}`,
  DELETE_CONVERSATION: id => `/api/messages/conversations/${id}`,
  // Group Conversations
  CREATE_GROUP: '/api/messages/groups',
  UPDATE_GROUP: id => `/api/messages/groups/${id}`,
  ADD_MEMBERS: id => `/api/messages/groups/${id}/members`,
  REMOVE_MEMBER: (id, memberId) =>
    `/api/messages/groups/${id}/members/${memberId}`,
  LEAVE_GROUP: id => `/api/messages/groups/${id}/leave`,
  // Messages
  GET_MESSAGES: conversationId =>
    `/api/messages/conversations/${conversationId}/messages`,
  SEND: '/api/messages/send',
  DELETE_MESSAGE: messageId => `/api/messages/messages/${messageId}`,
  // Status
  MARK_CONVERSATION_READ: id => `/api/messages/conversations/${id}/read`,
  MARK_MESSAGE_READ: messageId => `/api/messages/messages/${messageId}/read`,
  GET_UNREAD_COUNT: '/api/messages/unread-count',
  // Reactions
  ADD_REACTION: messageId => `/api/messages/messages/${messageId}/reactions`,
  REMOVE_REACTION: messageId => `/api/messages/messages/${messageId}/reactions`,
  // Other
  TYPING: conversationId =>
    `/api/messages/conversations/${conversationId}/typing`,
  SEARCH: '/api/messages/search',
  GET_USERS: '/api/messages/users',
  MUTE: id => `/api/messages/conversations/${id}/mute`,
  UNMUTE: id => `/api/messages/conversations/${id}/mute`,
  GET_MEDIA: id => `/api/messages/conversations/${id}/media`,
};

// ======================================
// Notification API Endpoints
// ======================================
export const NOTIFICATION_API = {
  GET_ALL: '/api/notifications',
  GET_UNREAD_COUNT: '/api/notifications/unread-count',
  GET_UNREAD_BY_TYPE: '/api/notifications/unread-count-by-type',
  GET_BY_ID: id => `/api/notifications/${id}`,
  CREATE: '/api/notifications',
  MARK_READ: id => `/api/notifications/${id}/read`,
  MARK_ALL_READ: '/api/notifications/read-all',
  DELETE: id => `/api/notifications/${id}`,
  DELETE_ALL: '/api/notifications',
  GET_PREFERENCES: '/api/notifications/preferences',
  UPDATE_PREFERENCES: '/api/notifications/preferences',
};

// ======================================
// Save Post API Endpoints
// ======================================
export const SAVE_POST_API = {
  GET_ALL: '/api/savepost',
  GET_COLLECTIONS: '/api/savepost/collections',
  CHECK_STATUS: postId => `/api/savepost/${postId}/status`,
  SAVE: postId => `/api/savepost/${postId}`,
  UNSAVE: postId => `/api/savepost/${postId}`,
};

// ======================================
// Report API Endpoints
// ======================================
export const REPORT_API = {
  CREATE: '/api/reports',
  REPORT_POST: postId => `/api/reports/post/${postId}`,
  REPORT_COMMENT: commentId => `/api/reports/comment/${commentId}`,
  REPORT_USER: userId => `/api/reports/user/${userId}`,
  REPORT_MESSAGE: messageId => `/api/reports/message/${messageId}`,
  GET_MY_REPORTS: '/api/reports/my-reports',
  GET_BY_ID: id => `/api/reports/${id}`,
  // Admin
  GET_ALL: '/api/reports',
  GET_PENDING: '/api/reports/pending',
  GET_AGAINST_USER: userId => `/api/reports/user/${userId}/against`,
  START_REVIEW: id => `/api/reports/${id}/start-review`,
  RESOLVE: id => `/api/reports/${id}/resolve`,
  UPDATE_STATUS: id => `/api/reports/${id}/status`,
};

// ======================================
// Admin API Endpoints
// ======================================
export const ADMIN_API = {
  // Health
  HEALTH: '/api/admin/health',
  // Dashboard & Analytics
  GET_DASHBOARD_STATS: '/api/admin/dashboard/stats',
  GET_USER_GROWTH: '/api/admin/analytics/user-growth',
  GET_POST_STATS: '/api/admin/analytics/posts',
  GET_TOP_USERS: '/api/admin/analytics/top-users',
  // User Management
  GET_ALL_USERS: '/api/admin/users',
  GET_BANNED_USERS: '/api/admin/users/banned',
  GET_USER_DETAILS: id => `/api/admin/users/${id}`,
  UPDATE_USER: id => `/api/admin/users/${id}`,
  DELETE_USER: id => `/api/admin/users/${id}`,
  // User Moderation
  BAN_USER: '/api/admin/users/ban',
  UNBAN_USER: '/api/admin/users/unban',
  SUSPEND_USER: '/api/admin/users/suspend',
  WARN_USER: '/api/admin/users/warn',
  // Content Moderation
  GET_ALL_POSTS: '/api/admin/posts',
  MODERATE_POST: id => `/api/admin/posts/${id}/moderate`,
  APPROVE_POST: id => `/api/admin/posts/${id}/approve`,
  DELETE_POST: id => `/api/admin/posts/${id}`,
  MODERATE_COMMENT: id => `/api/admin/comments/${id}/moderate`,
  DELETE_COMMENT: id => `/api/admin/comments/${id}`,
  // Reports
  GET_REPORTS: '/api/admin/reports',
  GET_PENDING_REPORTS: '/api/admin/reports/pending',
  GET_USER_REPORTS: userId => `/api/admin/reports/user/${userId}`,
  REVIEW_REPORT: id => `/api/admin/reports/${id}/review`,
  START_REPORT_REVIEW: id => `/api/admin/reports/${id}/start-review`,
  RESOLVE_REPORT: id => `/api/admin/reports/${id}/resolve`,
  // System
  BROADCAST: '/api/admin/broadcast',
  GET_SYSTEM_HEALTH: '/api/admin/system/health',
  GET_LOGS: '/api/admin/logs',
};
