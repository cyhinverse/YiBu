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
  DELETE_POST: (postId) => {
    return handleRequest(
      () => api.delete(`${POST_API_ENDPOINTS.DELETE_POST}/${postId}`),
      "Xóa bài viết thất bại!"
    );
  },
  REPORT_POST: (postId, reason) => {
    return handleRequest(
      () => api.post(`${POST_API_ENDPOINTS.REPORT_POST}/${postId}`, { reason }),
      "Báo cáo bài viết thất bại!"
    );
  },
  // Các hàm client-side để lưu trữ bài viết đã ẩn
  getHiddenPosts: () => {
    try {
      const hiddenPosts = localStorage.getItem("hiddenPosts");
      return hiddenPosts ? JSON.parse(hiddenPosts) : [];
    } catch (error) {
      console.error("Lỗi khi lấy danh sách bài viết đã ẩn:", error);
      return [];
    }
  },
  saveHiddenPost: (postId) => {
    try {
      const hiddenPosts = POST.getHiddenPosts();
      if (!hiddenPosts.includes(postId)) {
        hiddenPosts.push(postId);
        localStorage.setItem("hiddenPosts", JSON.stringify(hiddenPosts));
      }
      return true;
    } catch (error) {
      console.error("Lỗi khi lưu bài viết đã ẩn:", error);
      return false;
    }
  },
  removeHiddenPost: (postId) => {
    try {
      let hiddenPosts = POST.getHiddenPosts();
      hiddenPosts = hiddenPosts.filter((id) => id !== postId);
      localStorage.setItem("hiddenPosts", JSON.stringify(hiddenPosts));
      return true;
    } catch (error) {
      console.error("Lỗi khi xóa bài viết đã ẩn:", error);
      return false;
    }
  },
};

export default POST;
