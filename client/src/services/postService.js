import { POST_API_ENDPOINTS } from "../axios/apiEndpoint";
import api from "../axios/axiosConfig";
import { handleRequest } from "../customs/HandleErrorReq";

const POST = {
  CREATE_POST: (data) => {
    return handleRequest(
      () =>
        api.post(POST_API_ENDPOINTS.CREATE_POST, data, {
          headers: { "Content-Type": "multipart/form-data" },
        }),
      "Create post failed!"
    );
  },
  GET_POST_USER_BY_ID: (userId) => {
    return handleRequest(
      () => api.get(`${POST_API_ENDPOINTS.GET_POST_USER_BY_ID}/${userId}`),
      "Get posts failed!"
    );
  },
  GET_ALL_USER: (page = 1, limit = 10) => {
    return handleRequest(
      () =>
        api.get(
          `${POST_API_ENDPOINTS.GET_ALL_USER}?page=${page}&limit=${limit}`
        ),
      "Get list user failed"
    );
  },
};

export default POST;
