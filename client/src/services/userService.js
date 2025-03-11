import { USER_API_ENDPOINTS } from "../axios/apiEndpoint";
import api from "../axios/axiosConfig";
import { handleRequest } from "../customs/HandleErrorReq";

const User = {
  GET_ALL_USER: () =>
    handleRequest(
      () => api.get(USER_API_ENDPOINTS.GET_ALL_USER),
      "Get all user failed!"
    ),

  GET_USER_BY_ID: async (data) =>
    handleRequest(
      () => api.post(USER_API_ENDPOINTS.GET_USER_BY_ID, data),
      `Get user by id failed !`
    ),

  CREATE_USER: (data) =>
    handleRequest(
      () => api.post(USER_API_ENDPOINTS.CREATE_USER, data),
      "Create user failed!"
    ),
  UPDATE_USER: (data) =>
    handleRequest(
      () => api.put(USER_API_ENDPOINTS.UPDATE_USER, data),
      "Update user failed!"
    ),
  DELETE_USER: (data) =>
    handleRequest(
      () => api.delete(USER_API_ENDPOINTS.DELETE_USER, { data }),
      "Delete user failed!"
    ),
  GET_FOLLOWER_BY_USER_ID: (data) =>
    handleRequest(
      () => api.post(USER_API_ENDPOINTS.GET_FOLLOWER_BY_USERID, data),
      "Get follower by user ID failed!"
    ),
  ADD_FOLLOWER: (data) =>
    handleRequest(
      () => api.post(USER_API_ENDPOINTS.ADD_FOLLOWER, data),
      "Add follower failed!"
    ),
  REMOVE_FOLLOWER: (data) =>
    handleRequest(
      () => api.post(USER_API_ENDPOINTS.REMOVE_FOLLOWER, data),
      "Remove follower failed!"
    ),
};

export default User;
