import axios from "axios";
import Auth from "../services/authService";

const backendUrl = "http://localhost:9785";
const api = axios.create({
  baseURL: backendUrl,
  timeout: 10000,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("accessToken");
  console.log("Request URL:", config.url);
  console.log("Request headers:", config.headers);
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => {
    console.log("Response:", response);
    return response;
  },
  async (error) => {
    console.error("API Error:", error);
    console.error("Error response:", error.response);

    const originalRequest = error.config;

    if (
      (error.response?.status === 403 || error.response?.status === 401) &&
      !originalRequest._retry
    ) {
      originalRequest._retry = true;
      console.log("Access token expired or forbidden, refreshing...");

      try {
        const refreshResponse = await Auth.refreshToken();
        console.log("Refresh token response:", refreshResponse);
        const newAccessToken = refreshResponse.accessToken;

        localStorage.setItem("accessToken", newAccessToken);
        originalRequest.headers["Authorization"] = `Bearer ${newAccessToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        console.error("Refresh token error:", refreshError);

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
