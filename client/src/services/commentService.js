import { COMMENT_API_ENDPOINTS } from "../axios/apiEndpoint";
import api from "../axios/axiosConfig";
import { handleRequest } from "../customs/HandleErrorReq";

const COMMENT = {
  // Tạo comment mới
  CREATE_COMMENT: (data) => {
    return handleRequest(
      () => api.post(COMMENT_API_ENDPOINTS.CREATE_COMMENT, data),
      "Tạo comment thất bại!"
    );
  },

  // Lấy tất cả comments của một bài viết
  GET_COMMENTS_BY_POST: (postId) => {
    return handleRequest(
      () => api.get(`${COMMENT_API_ENDPOINTS.GET_COMMENTS_BY_POST}/${postId}`),
      "Lấy comments thất bại!"
    );
  },

  // Cập nhật comment
  UPDATE_COMMENT: (commentId, data) => {
    return handleRequest(
      () =>
        api.put(`${COMMENT_API_ENDPOINTS.UPDATE_COMMENT}/${commentId}`, data),
      "Cập nhật comment thất bại!"
    );
  },

  // Xóa comment
  DELETE_COMMENT: (commentId) => {
    return handleRequest(
      () => api.delete(`${COMMENT_API_ENDPOINTS.DELETE_COMMENT}/${commentId}`),
      "Xóa comment thất bại!"
    );
  },
};

export default COMMENT;
