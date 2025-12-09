import axios from "axios";
// import Auth from "../services/authService";

const backendUrl = "http://localhost:9785";
const api = axios.create({
  baseURL: backendUrl,
  timeout: 10000,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("accessToken");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => {
    // console.log(`[AxiosConfig] Response from ${response.config.url}:`, {
    //   status: response.status,
    //   statusText: response.statusText,
    // });
    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    // Xử lý lỗi 401 - Unauthorized
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshResponse = await axios.post(
          `${backendUrl}/api/auth/refresh`,
          {},
          {
            withCredentials: true,
          }
        );
        const newAccessToken = refreshResponse.data.accessToken;

        localStorage.setItem("accessToken", newAccessToken);
        originalRequest.headers["Authorization"] = `Bearer ${newAccessToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        localStorage.removeItem("accessToken");

        const currentPath = window.location.pathname;
        if (!currentPath.includes("/auth/login")) {
          window.location.href = "/auth/login";
        }

        return Promise.reject(refreshError);
      }
    }

    // Xử lý lỗi 403 - Forbidden (không có quyền admin)
    if (error.response?.status === 403) {
      console.error("Access forbidden:", error.response.data.message);

      // Thêm thông báo cho người dùng biết họ không có quyền
      if (error.response.data.message.includes("Admin privileges required")) {
        // Có thể chuyển đến trang thông báo lỗi riêng thay vì đăng nhập lại
        const currentPath = window.location.pathname;
        if (currentPath.includes("/admin")) {
          window.location.href = "/access-denied";
          return Promise.reject(
            new Error("Bạn không có quyền truy cập trang quản trị")
          );
        }
      }
    }

    return Promise.reject(error);
  }
);

export default api;
