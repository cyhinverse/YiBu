import axios from "axios";

const backendUrl = "http://localhost:9785";

const api = axios.create({
  baseURL: backendUrl,
  timeout: 10000,
  withCredentials: true, // để gửi cookie refresh
});

let accessToken = localStorage.getItem("accessToken");

let isRefreshing = false;
let refreshQueue = [];

const processQueue = (error, token = null) => {
  refreshQueue.forEach(({ resolve, reject }) => {
    if (error) reject(error);
    else resolve(token);
  });
  refreshQueue = [];
};


api.interceptors.request.use(
  (config) => {
    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (!error.response) {
      return Promise.reject(error);
    }

    if (error.response.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          refreshQueue.push({ resolve, reject });
        }).then((token) => {
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return api(originalRequest);
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const res = await axios.post(
          `${backendUrl}/api/auth/refresh`,
          {},
          { withCredentials: true }
        );

        const newAccessToken = res.data.accessToken;

        // update token
        accessToken = newAccessToken;
        localStorage.setItem("accessToken", newAccessToken);

        api.defaults.headers.Authorization = `Bearer ${newAccessToken}`;

        processQueue(null, newAccessToken);

        return api(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);

        accessToken = null;
        localStorage.removeItem("accessToken");

        const currentPath = window.location.pathname;
        if (!currentPath.includes("/auth/login")) {
          window.location.href = "/auth/login";
        }

        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    if (error.response.status === 403) {
      const message = error.response.data?.message || "";

      if (
        message.includes("Admin") &&
        window.location.pathname.startsWith("/admin")
      ) {
        window.location.href = "/access-denied";
        return Promise.reject(
          new Error("Bạn không có quyền truy cập trang quản trị")
        );
      }
    }

    return Promise.reject(error);
  }
);

export default api;
