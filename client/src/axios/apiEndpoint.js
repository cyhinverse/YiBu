export const API_BASE_URL = "http://localhost:9785";

export const AUTH_API_ENDPOINTS = {
  LOGIN: "/api/auth/login",
  REGISTER: "/api/auth/register",
  LOGOUT: "/api/auth/logout",
  REFRESH_TOKEN: "/api/auth/refresh-token",
};

export const USER_API_ENDPOINTS = {
  GET_ALL_USER: "/api/v1/",
  GET_USER_BY_ID: "/user/",
  CREATE_USER: "/api/v1",
  UPDATE_USER: "api/v1",
  DELETE_USER: "/api/v1",
  GET_FOLLOWER_BY_USERID: "/api/v1",
  ADD_FOLLOWER: "/api/v1",
  REMOVE_FOLLOWER: "/api/v1",
};

export const POST_API_ENDPOINTS = {
  CREATE_POST: "/api/v1/create-post",
  GET_POST_USER_BY_ID: "/api/v1/post-user",
  GET_ALL_USER: "/api/v1/posts",
};

export const LIKE_API_ENDPOINTS = {
  CREATE_LIKE: "/like/create-like",
  DELETE_LIKE: "/like/delete-like",
  GET_LIKE_STATUS: "/like/post",
  GET_ALL_LIKES: "/like/getAllLikes",
};

export const PROFILE_API_ENDPOINTS = {
  GET_PROFILE_BY_ID: "/profile/:id",
};
