import axios from 'axios';

const backendUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

const api = axios.create({
  baseURL: backendUrl,
  timeout: 15000, // Tăng timeout lên 15s
  withCredentials: true, // để gửi cookie refresh
  headers: {
    'Content-Type': 'application/json',
  },
});

// Getter để luôn lấy token mới nhất từ localStorage
const getAccessToken = () => localStorage.getItem('accessToken');
const setAccessToken = token => {
  if (token) {
    localStorage.setItem('accessToken', token);
  } else {
    localStorage.removeItem('accessToken');
  }
};

let isRefreshing = false;
let refreshQueue = [];

const processQueue = (error, token = null) => {
  refreshQueue.forEach(({ resolve, reject }) => {
    if (error) reject(error);
    else resolve(token);
  });
  refreshQueue = [];
};

// Request interceptor - luôn lấy token mới nhất
api.interceptors.request.use(
  config => {
    const token = getAccessToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  error => Promise.reject(error)
);

// Response interceptor - xử lý token refresh
api.interceptors.response.use(
  response => response,
  async error => {
    const originalRequest = error.config;

    // Nếu không có response (network error, CORS error, etc.)
    if (!error.response) {
      console.error('Network/CORS error:', error.message);
      return Promise.reject(error);
    }

    // Xử lý 401 - Token expired
    if (error.response.status === 401 && !originalRequest._retry) {
      // Không retry nếu đây là request refresh token
      if (originalRequest.url?.includes('/auth/refresh')) {
        setAccessToken(null);
        const currentPath = window.location.pathname;
        if (
          !currentPath.includes('/auth/login') &&
          !currentPath.includes('/auth/register')
        ) {
          window.location.href = '/auth/login';
        }
        return Promise.reject(error);
      }

      // Nếu đang refresh, thêm vào queue
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          refreshQueue.push({ resolve, reject });
        }).then(token => {
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return api(originalRequest);
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        // Tạo axios instance mới để tránh interceptor loop
        const res = await axios.post(
          `${backendUrl}/api/auth/refresh`,
          {},
          {
            withCredentials: true,
            headers: {
              'Content-Type': 'application/json',
            },
          }
        );

        const newAccessToken =
          res.data?.accessToken || res.data?.data?.accessToken;

        if (!newAccessToken) {
          throw new Error('No access token in refresh response');
        }

        // Cập nhật token
        setAccessToken(newAccessToken);

        // Process các request đang chờ
        processQueue(null, newAccessToken);

        // Retry request gốc với token mới
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        console.error('Token refresh failed:', refreshError);
        processQueue(refreshError, null);

        setAccessToken(null);

        const currentPath = window.location.pathname;
        if (
          !currentPath.includes('/auth/login') &&
          !currentPath.includes('/auth/register')
        ) {
          window.location.href = '/auth/login';
        }

        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    // Xử lý 403 - Forbidden (không có quyền admin)
    if (error.response.status === 403) {
      const message = error.response.data?.message || '';

      if (
        message.includes('Admin') &&
        window.location.pathname.startsWith('/admin')
      ) {
        window.location.href = '/access-denied';
        return Promise.reject(
          new Error('Bạn không có quyền truy cập trang quản trị')
        );
      }
    }

    return Promise.reject(error);
  }
);

// Export helper để cập nhật token từ bên ngoài (sau khi login)
export const updateAccessToken = token => {
  setAccessToken(token);
};

export default api;
