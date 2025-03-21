import { USER_API_ENDPOINTS } from "../axios/apiEndpoint";
import api from "../axios/axiosConfig";
import { handleRequest } from "../customs/HandleErrorReq";

const User = {
  GET_ALL_USER: () =>
    handleRequest(
      () => api.get(USER_API_ENDPOINTS.GET_ALL_USER),
      "Get all user failed!"
    ),

  getAllUsers: async () => {
    try {
      console.log("[userService] Fetching all users");
      const response = await api.get(USER_API_ENDPOINTS.GET_ALL_USER);

      if (response && response.data) {
        return {
          success: true,
          data: response.data.data || [],
        };
      }

      return {
        success: false,
        error: "Không thể lấy danh sách người dùng",
        data: [],
      };
    } catch (error) {
      console.error("[userService] Error fetching users:", error);
      return {
        success: false,
        error:
          error.response?.data?.message || "Không thể lấy danh sách người dùng",
        data: [],
      };
    }
  },

  GET_USER_BY_ID: (id) => {
    if (!id) {
      return Promise.reject(new Error("User ID is required"));
    }
    return handleRequest(
      () => api.get(`${USER_API_ENDPOINTS.GET_USER_BY_ID}/${id}`),
      "Get user failed!"
    );
  },

  SEARCH_USERS: (query) => {
    return handleRequest(
      () =>
        api.get(
          `${USER_API_ENDPOINTS.SEARCH_USERS}?query=${encodeURIComponent(
            query
          )}`
        ),
      "Search users failed!"
    );
  },

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
  followUser: (targetUserId) =>
    handleRequest(
      () =>
        api.post(USER_API_ENDPOINTS.FOLLOW_USER, {
          targetUserId,
        }),
      "Không thể theo dõi người dùng"
    ),
  unfollowUser: (targetUserId) =>
    handleRequest(
      () =>
        api.post(USER_API_ENDPOINTS.UNFOLLOW_USER, {
          targetUserId,
        }),
      "Không thể hủy theo dõi người dùng"
    ),
  checkFollowStatus: (targetUserId) =>
    handleRequest(
      () =>
        api.get(`${USER_API_ENDPOINTS.CHECK_FOLLOW_STATUS}/${targetUserId}`),
      "Không thể kiểm tra trạng thái theo dõi"
    ),
};

export default User;
