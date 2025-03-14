import { LIKE_API_ENDPOINTS } from "../axios/apiEndpoint";
import api from "../axios/axiosConfig";
import { handleRequest } from "../customs/HandleErrorReq";

const Like = {
  CREATE_LIKE: async (data) => {
    console.log("Gửi request CREATE_LIKE với data:", data);
    return handleRequest(
      () => api.post(LIKE_API_ENDPOINTS.CREATE_LIKE, data),
      "Create like failed !"
    );
  },
  DELETE_LIKE: async (data) => {
    console.log("Gửi request DELETE_LIKE với data:", data);
    return handleRequest(
      () => api.delete(LIKE_API_ENDPOINTS.DELETE_LIKE, { data }),
      "Delete like failed !"
    );
  },
};

export default Like;
