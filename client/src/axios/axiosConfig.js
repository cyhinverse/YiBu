import axios from 'axios';

const backendUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

const api = axios.create({
  baseURL: backendUrl,
  timeout: 15000,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Token management
const getAccessToken = () => localStorage.getItem('accessToken');
const setAccessToken = token => {
  if (token) {
    localStorage.setItem('accessToken', token);
  } else {
    localStorage.removeItem('accessToken');
  }
};

// Refresh state management
let isRefreshing = false;
let refreshSubscribers = [];
let refreshAttempts = 0;
const MAX_REFRESH_ATTEMPTS = 2;

// Subscribe để nhận token mới khi refresh xong
const subscribeTokenRefresh = callback => {
  refreshSubscribers.push(callback);
};

// Notify tất cả subscribers với token mới
const onTokenRefreshed = token => {
  refreshSubscribers.forEach(callback => callback(token));
  refreshSubscribers = [];
};

// Notify tất cả subscribers về lỗi
const onRefreshError = error => {
  refreshSubscribers.forEach(callback => callback(null, error));
  refreshSubscribers = [];
};

let store;

export const injectStore = _store => {
  store = _store;
};

// Redirect về login
const redirectToLogin = () => {
  setAccessToken(null);
  refreshAttempts = 0;

  if (store) {
    store.dispatch({ type: 'auth/resetAuthState' });
  }

  const currentPath = window.location.pathname;
  if (
    !currentPath.includes('/auth/login') &&
    !currentPath.includes('/auth/register')
  ) {
    // Only force reload if store is not available (fallback)
    if (!store) {
      window.location.href = '/auth/login';
    }
  }
};

// Request interceptor
api.interceptors.request.use(
  config => {
    // Skip nếu đã có _skipAuth flag
    if (config._skipAuth) {
      return config;
    }

    const token = getAccessToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  error => Promise.reject(error)
);

// Response interceptor
api.interceptors.response.use(
  response => response,
  async error => {
    const originalRequest = error.config;

    // Network error
    if (!error.response) {
      console.error('Network/CORS error:', error.message);
      return Promise.reject(error);
    }

    const status = error.response.status;

    if (status === 401) {
      // Prevent infinite loop on login page
      if (window.location.pathname.includes('/auth/login')) {
        return Promise.reject(error);
      }

      // Nếu đây là request refresh token bị lỗi -> logout
      if (originalRequest.url?.includes('/auth/refresh')) {
        console.error('Refresh token failed, redirecting to login');
        isRefreshing = false;
        onRefreshError(error);
        // Clean up server-side cookies
        try {
          await axios.post(`${backendUrl}/api/auth/logout`);
        } catch {
          // Ignore logout error
        }
        redirectToLogin();
        return Promise.reject(error);
      }

      // Nếu request đã được retry rồi -> không retry nữa
      if (originalRequest._retry) {
        console.error('Request already retried, rejecting');
        return Promise.reject(error);
      }

      // Đánh dấu request này đã retry
      originalRequest._retry = true;

      // Nếu đang refresh, subscribe để đợi token mới
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          subscribeTokenRefresh((token, err) => {
            if (err || !token) {
              reject(err || new Error('Refresh failed'));
              return;
            }
            originalRequest.headers.Authorization = `Bearer ${token}`;
            resolve(axios(originalRequest)); // Dùng axios thuần để tránh interceptor
          });
        });
      }

      // Bắt đầu refresh
      isRefreshing = true;
      refreshAttempts++;

      // Kiểm tra số lần refresh
      if (refreshAttempts > MAX_REFRESH_ATTEMPTS) {
        console.error('Max refresh attempts reached');
        isRefreshing = false;
        refreshAttempts = 0;
        redirectToLogin();
        return Promise.reject(new Error('Max refresh attempts reached'));
      }

      try {
        // Dùng axios thuần để gọi refresh, tránh interceptor loop
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

        // Server trả về accessToken trong response root hoặc data
        const newAccessToken =
          res.data?.accessToken || res.data?.data?.accessToken;

        if (!newAccessToken) {
          throw new Error('No access token in refresh response');
        }

        // Lưu token mới
        setAccessToken(newAccessToken);

        // Reset refresh attempts khi thành công
        refreshAttempts = 0;
        isRefreshing = false;

        // Notify các request đang đợi
        onTokenRefreshed(newAccessToken);

        // Retry request gốc với axios thuần (không qua interceptor)
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        return axios(originalRequest);
      } catch (refreshError) {
        console.error('Token refresh failed:', refreshError);
        isRefreshing = false;
        onRefreshError(refreshError);
        // Clean up server-side cookies
        try {
          await axios.post(`${backendUrl}/api/auth/logout`);
        } catch {
          // Ignore logout error
        }
        redirectToLogin();
        return Promise.reject(refreshError);
      }
    }

    // Xử lý 403 - Forbidden
    if (status === 403) {
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
