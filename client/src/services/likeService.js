import { LIKE_API_ENDPOINTS } from "../axios/apiEndpoint";
import api from "../axios/axiosConfig";
import { handleRequest } from "../customs/HandleErrorReq";

const Like = {
  CREATE_LIKE: async (data) => {
    return handleRequest(
      () => api.post(LIKE_API_ENDPOINTS.CREATE_LIKE, data),
      "Create like failed!"
    );
  },

  DELETE_LIKE: async (data) => {
    return handleRequest(
      () => api.delete(LIKE_API_ENDPOINTS.DELETE_LIKE, { data }),
      "Delete like failed!"
    );
  },

  GET_LIKE_STATUS: async (postId) => {
    return handleRequest(
      () => api.get(`${LIKE_API_ENDPOINTS.GET_LIKE_STATUS}/${postId}`),
      "Get like status failed!"
    );
  },

  GET_ALL_LIKES: async (postIds) => {
    return handleRequest(
      () => api.post(LIKE_API_ENDPOINTS.GET_ALL_LIKES, { postIds }),
      "Get all likes failed!"
    );
  },

  GET_COUNT_LIKE_POSTS: async () => {
    return handleRequest(
      () => api.get(LIKE_API_ENDPOINTS.GET_SUM_COUNT_LIKE),
      "Get all sum count like failed!"
    );
  },
};

export default Like;
