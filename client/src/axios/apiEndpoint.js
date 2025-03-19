export const API_BASE_URL = "http://localhost:9785";

export const AUTH_API_ENDPOINTS = {
  LOGIN: "/api/auth/login",
  REGISTER: "/api/auth/register",
  LOGOUT: "/api/auth/logout",
  REFRESH_TOKEN: "/api/auth/refresh-token",
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
};

export const LIKE_API_ENDPOINTS = {
  CREATE_LIKE: "/api/like/create",
  DELETE_LIKE: "/api/like/delete",
  GET_LIKE_STATUS: "/api/like/status",
  GET_ALL_LIKES: "/api/like/get-all",
};

export const PROFILE_API_ENDPOINTS = {
  GET_PROFILE_BY_ID: "/profile/:id",
};
