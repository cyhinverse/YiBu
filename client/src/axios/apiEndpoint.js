// In dev we usually run via Vite proxy (same-origin), so base URL can be empty.
export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || (import.meta.env.DEV ? '' : '');

export const AUTH_API = {
  LOGIN: '/api/v2/auth/login',
  REGISTER: '/api/v2/auth/register',
  GOOGLE_AUTH: '/api/v2/auth/google',
  REQUEST_PASSWORD_RESET: '/api/v2/auth/password/reset-request',
  RESET_PASSWORD: '/api/v2/auth/password/reset',
  REFRESH_TOKEN: '/api/v2/auth/refresh',
  ME: '/api/v2/auth/me',
  LOGOUT: '/api/v2/auth/logout',
  LOGOUT_ALL: '/api/v2/auth/logout-all',
  UPDATE_PASSWORD: '/api/v2/auth/password',
  ENABLE_2FA: '/api/v2/auth/2fa/enable',
  VERIFY_2FA: '/api/v2/auth/2fa/verify',
  DISABLE_2FA: '/api/v2/auth/2fa/disable',
  GET_SESSIONS: '/api/v2/auth/sessions',
  REVOKE_SESSION: sessionId => `/api/v2/auth/sessions/${sessionId}`,

};

export const USER_API = {
  SEARCH: '/api/v2/user/search',
  SUGGESTIONS: '/api/v2/user/suggestions',
  GET_PROFILE: id => `/api/v2/user/profile/${id}`,
  UPDATE_PROFILE: '/api/v2/user/profile',
  GET_BY_ID: id => `/api/v2/user/${id}`,
  CHECK_FOLLOW: targetUserId => `/api/v2/user/check-follow/${targetUserId}`,
  FOLLOW: '/api/v2/user/follow',
  UNFOLLOW: '/api/v2/user/unfollow',
  GET_FOLLOWERS: userId => `/api/v2/user/followers/${userId}`,
  GET_FOLLOWING: userId => `/api/v2/user/following/${userId}`,
  GET_FOLLOW_REQUESTS: '/api/v2/user/follow-requests',
  ACCEPT_FOLLOW_REQUEST: requestId =>
    `/api/v2/user/follow-requests/${requestId}/accept`,
  REJECT_FOLLOW_REQUEST: requestId =>
    `/api/v2/user/follow-requests/${requestId}/reject`,
  GET_BLOCKED: '/api/v2/user/blocked',
  BLOCK_USER: userId => `/api/v2/user/block/${userId}`,
  UNBLOCK_USER: userId => `/api/v2/user/block/${userId}`,
  GET_MUTED: '/api/v2/user/muted',
  MUTE_USER: userId => `/api/v2/user/mute/${userId}`,
  UNMUTE_USER: userId => `/api/v2/user/mute/${userId}`,
  GET_SETTINGS: '/api/v2/settings',
  UPDATE_PRIVACY: '/api/v2/settings/privacy',
  UPDATE_NOTIFICATIONS: '/api/v2/settings/notifications',
  UPDATE_SECURITY: '/api/v2/settings/security',
  UPDATE_CONTENT: '/api/v2/settings/content',
  UPDATE_THEME: '/api/v2/settings/theme',

};

export const POST_API = {
  GET_ALL: '/api/v2/posts',
  GET_EXPLORE: '/api/v2/posts/explore',
  GET_PERSONALIZED: '/api/v2/posts/personalized',
  GET_TRENDING: '/api/v2/posts/trending',
  SEARCH: '/api/v2/posts/search',
  GET_BY_HASHTAG: hashtag => `/api/v2/posts/hashtag/${hashtag}`,
  GET_HASHTAG_FEED: '/api/v2/posts/hashtags/feed',
  GET_TRENDING_HASHTAGS: '/api/v2/posts/hashtags/trending',
  CREATE: '/api/v2/posts',
  GET_BY_USER: userId => `/api/v2/posts/user/${userId}`,
  GET_SHARED_BY_USER: userId => `/api/v2/posts/user/${userId}/shared`,
  GET_BY_ID: id => `/api/v2/posts/${id}`,
  UPDATE: id => `/api/v2/posts/${id}`,
  DELETE: id => `/api/v2/posts/${id}`,
  SHARE: postId => `/api/v2/posts/${postId}/share`,
  REPORT: postId => `/api/v2/posts/${postId}/report`,
};


export const COMMENT_API = {
  CREATE: '/api/v2/comments',
  GET_BY_POST: postId => `/api/v2/comments/post/${postId}`,
  GET_REPLIES: commentId => `/api/v2/comments/${commentId}/replies`,
  UPDATE: id => `/api/v2/comments/${id}`,
  DELETE: id => `/api/v2/comments/${id}`,
  LIKE: commentId => `/api/v2/comments/${commentId}/like`,
  UNLIKE: commentId => `/api/v2/comments/${commentId}/like`,
};


export const LIKE_API = {
  CREATE: '/api/v2/like',
  DELETE: '/api/v2/like',
  TOGGLE: '/api/v2/like/toggle',
  GET_STATUS: postId => `/api/v2/like/status/${postId}`,
  GET_BATCH_STATUS: '/api/v2/like/batch-status',
  GET_POST_LIKES: postId => `/api/v2/like/post/${postId}/users`,
  GET_MY_LIKES: '/api/v2/like/my-likes',
};


export const MESSAGE_API = {
  GET_CONVERSATIONS: '/api/v2/messages/conversations',
  CREATE_CONVERSATION: '/api/v2/messages/conversations',
  GET_CONVERSATION: id => `/api/v2/messages/conversations/${id}`,
  DELETE_CONVERSATION: id => `/api/v2/messages/conversations/${id}`,
  CREATE_GROUP: '/api/v2/messages/groups',
  UPDATE_GROUP: id => `/api/v2/messages/groups/${id}`,
  ADD_MEMBERS: id => `/api/v2/messages/groups/${id}/members`,
  REMOVE_MEMBER: (id, memberId) =>
    `/api/v2/messages/groups/${id}/members/${memberId}`,
  LEAVE_GROUP: id => `/api/v2/messages/groups/${id}/leave`,
  GET_MESSAGES: conversationId =>
    `/api/v2/messages/conversations/${conversationId}/messages`,
  SEND: '/api/v2/messages/send',
  DELETE_MESSAGE: messageId => `/api/v2/messages/messages/${messageId}`,
  MARK_CONVERSATION_READ: id => `/api/v2/messages/conversations/${id}/read`,
  MARK_MESSAGE_READ: messageId => `/api/v2/messages/messages/${messageId}/read`,
  GET_UNREAD_COUNT: '/api/v2/messages/unread-count',
  ADD_REACTION: messageId => `/api/v2/messages/messages/${messageId}/reactions`,
  REMOVE_REACTION: messageId => `/api/v2/messages/messages/${messageId}/reactions`,
  TYPING: conversationId =>
    `/api/v2/messages/conversations/${conversationId}/typing`,
  SEARCH: '/api/v2/messages/search',
  GET_USERS: '/api/v2/messages/users',
};


export const NOTIFICATION_API = {
  GET_ALL: '/api/v2/notifications',
  GET_UNREAD_COUNT: '/api/v2/notifications/unread-count',
  GET_UNREAD_BY_TYPE: '/api/v2/notifications/unread-count-by-type',
  GET_BY_ID: id => `/api/v2/notifications/${id}`,
  CREATE: '/api/v2/notifications',
  MARK_READ: id => `/api/v2/notifications/${id}/read`,
  MARK_ALL_READ: '/api/v2/notifications/read-all',
  DELETE: id => `/api/v2/notifications/${id}`,
  DELETE_ALL: '/api/v2/notifications',
  GET_PREFERENCES: '/api/v2/notifications/preferences',
  UPDATE_PREFERENCES: '/api/v2/notifications/preferences',
};


export const SAVE_POST_API = {
  GET_ALL: '/api/v2/savepost',
  GET_COLLECTIONS: '/api/v2/savepost/collections',
  CHECK_STATUS: postId => `/api/v2/savepost/${postId}/status`,
  SAVE: postId => `/api/v2/savepost/${postId}`,
  UNSAVE: postId => `/api/v2/savepost/${postId}`,
};


export const REPORT_API = {
  CREATE: '/api/v2/reports',
  REPORT_POST: postId => `/api/v2/reports/post/${postId}`,
  REPORT_COMMENT: commentId => `/api/v2/reports/comment/${commentId}`,
  REPORT_USER: userId => `/api/v2/reports/user/${userId}`,
  REPORT_MESSAGE: messageId => `/api/v2/reports/message/${messageId}`,
  GET_MY_REPORTS: '/api/v2/reports/my-reports',
  GET_BY_ID: id => `/api/v2/reports/${id}`,
  GET_ALL: '/api/v2/reports',
  GET_PENDING: '/api/v2/reports/pending',
  GET_AGAINST_USER: userId => `/api/v2/reports/user/${userId}/against`,
  START_REVIEW: id => `/api/v2/reports/${id}/start-review`,
  RESOLVE: id => `/api/v2/reports/${id}/resolve`,
  UPDATE_STATUS: id => `/api/v2/reports/${id}/status`,
};


export const ADMIN_API = {
  HEALTH: '/api/v2/admin/health',
  GET_DASHBOARD_STATS: '/api/v2/admin/dashboard/stats',
  GET_USER_GROWTH: '/api/v2/admin/analytics/user-growth',
  GET_POST_STATS: '/api/v2/admin/analytics/posts',
  GET_TOP_USERS: '/api/v2/admin/analytics/top-users',
  GET_INTERACTIONS: '/api/v2/admin/analytics/interactions',
  GET_ALL_USERS: '/api/v2/admin/users',
  GET_BANNED_USERS: '/api/v2/admin/users/banned',
  GET_USER_DETAILS: id => `/api/v2/admin/users/${id}`,
  GET_USER_POSTS: userId => `/api/v2/admin/users/${userId}/posts`,
  GET_USER_REPORTS: userId => `/api/v2/admin/users/${userId}/reports`,
  UPDATE_USER: id => `/api/v2/admin/users/${id}`,
  DELETE_USER: id => `/api/v2/admin/users/${id}`,
  BAN_USER: '/api/v2/admin/users/ban',
  UNBAN_USER: '/api/v2/admin/users/unban',
  SUSPEND_USER: '/api/v2/admin/users/suspend',
  WARN_USER: '/api/v2/admin/users/warn',
  GET_ALL_POSTS: '/api/v2/admin/posts',
  GET_POST_REPORTS: postId => `/api/v2/admin/posts/${postId}/reports`,
  MODERATE_POST: id => `/api/v2/admin/posts/${id}/moderate`,
  APPROVE_POST: id => `/api/v2/admin/posts/${id}/approve`,
  DELETE_POST: id => `/api/v2/admin/posts/${id}`,
  GET_ALL_COMMENTS: '/api/v2/admin/comments',
  MODERATE_COMMENT: id => `/api/v2/admin/comments/${id}/moderate`,
  DELETE_COMMENT: id => `/api/v2/admin/comments/${id}`,
  GET_REPORTS: '/api/v2/admin/reports',
  GET_PENDING_REPORTS: '/api/v2/admin/reports/pending',
  GET_REPORTS_AGAINST_USER: userId => `/api/v2/admin/reports/user/${userId}`,
  REVIEW_REPORT: id => `/api/v2/admin/reports/${id}/review`,
  START_REPORT_REVIEW: id => `/api/v2/admin/reports/${id}/start-review`,
  RESOLVE_REPORT: id => `/api/v2/admin/reports/${id}/resolve`,
  BROADCAST: '/api/v2/admin/broadcast',
  GET_SYSTEM_HEALTH: '/api/v2/admin/system/health',
};
