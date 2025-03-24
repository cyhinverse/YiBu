import axios from "axios";
import Auth from "../services/authService";

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

    if (
      (error.response?.status === 403 || error.response?.status === 401) &&
      !originalRequest._retry
    ) {
      originalRequest._retry = true;

      try {
        const refreshResponse = await Auth.refreshToken();
        const newAccessToken = refreshResponse.accessToken;

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

    return Promise.reject(error);
  }
);

export default api;
