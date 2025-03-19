import { LIKE_API_ENDPOINTS } from "../axios/apiEndpoint";
import api from "../axios/axiosConfig";

const Like = {
  CREATE_LIKE: async (data) => {
    try {
      if (!data || !data.postId) {
        throw new Error("Post ID is required for CREATE_LIKE");
      }

      const response = await api.post(LIKE_API_ENDPOINTS.CREATE_LIKE, data);
      return response;
    } catch (error) {
      console.error("[likeService] CREATE_LIKE error:", error);
      throw error;
    }
  },

  DELETE_LIKE: async (data) => {
    try {
      if (!data || !data.postId) {
        throw new Error("Post ID is required for DELETE_LIKE");
      }

      const response = await api.post(LIKE_API_ENDPOINTS.DELETE_LIKE, data);
      return response;
    } catch (error) {
      console.error("[likeService] DELETE_LIKE error:", error);
      throw error;
    }
  },

  GET_LIKE_STATUS: async (postId) => {
    try {
      if (!postId) {
        throw new Error("Post ID is required for GET_LIKE_STATUS");
      }

      const response = await api.get(
        `${LIKE_API_ENDPOINTS.GET_LIKE_STATUS}/${postId}`
      );
      return response;
    } catch (error) {
      console.error("[likeService] GET_LIKE_STATUS error:", error);
      throw error;
    }
  },

  GET_ALL_LIKES: async (postIds) => {
    try {
      if (!postIds || !Array.isArray(postIds) || postIds.length === 0) {
        throw new Error("Valid post IDs array is required for GET_ALL_LIKES");
      }

      const response = await api.post(LIKE_API_ENDPOINTS.GET_ALL_LIKES, {
        postIds,
      });
      return response;
    } catch (error) {
      console.error("[likeService] GET_ALL_LIKES error:", error);
      throw error;
    }
  },

  GET_COUNT_LIKE_POSTS: async () => {
    try {
      const response = await api.get(LIKE_API_ENDPOINTS.GET_SUM_COUNT_LIKE);
      return response;
    } catch (error) {
      console.error("[likeService] GET_COUNT_LIKE_POSTS error:", error);
      throw error;
    }
  },
};

export default Like;
