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
const MAX_REFRESH_ATTEMPTS = 3;

// Proactive refresh timer
let refreshTimer = null;
const TOKEN_REFRESH_MARGIN = 60 * 1000; // Refresh 1 minute before expiry

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

// Parse JWT to get expiry time
const parseJwt = (token) => {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch (e) {
    return null;
  }
};

// Schedule proactive token refresh
const scheduleTokenRefresh = (token) => {
  if (refreshTimer) {
    clearTimeout(refreshTimer);
    refreshTimer = null;
  }

  if (!token) return;

  const payload = parseJwt(token);
  if (!payload || !payload.exp) return;

  const expiresAt = payload.exp * 1000; // Convert to milliseconds
  const now = Date.now();
  const timeUntilExpiry = expiresAt - now;
  const refreshTime = timeUntilExpiry - TOKEN_REFRESH_MARGIN;

  if (refreshTime > 0) {
    refreshTimer = setTimeout(() => {
      console.log('Proactive token refresh triggered');
      performTokenRefresh();
    }, refreshTime);
    console.log(`Token refresh scheduled in ${Math.round(refreshTime / 1000)}s`);
  } else if (timeUntilExpiry > 0) {
    // Token about to expire, refresh immediately
    performTokenRefresh();
  }
};

// Perform token refresh
const performTokenRefresh = async () => {
  if (isRefreshing) return;

  isRefreshing = true;
  refreshAttempts++;

  try {
    const res = await axios.post(
      `${backendUrl}/api/auth/refresh`,
      {},
      {
        withCredentials: true,
        headers: { 'Content-Type': 'application/json' },
      }
    );

    const newAccessToken = res.data?.accessToken || res.data?.data?.accessToken;

    if (newAccessToken) {
      setAccessToken(newAccessToken);
      refreshAttempts = 0;
      onTokenRefreshed(newAccessToken);
      scheduleTokenRefresh(newAccessToken);
      console.log('Token refreshed successfully');
    }
  } catch (error) {
    console.error('Proactive token refresh failed:', error);
    // Don't logout on proactive refresh failure, let the request interceptor handle it
  } finally {
    isRefreshing = false;
  }
};

// Initialize token refresh schedule on load
const initTokenRefresh = () => {
  const token = getAccessToken();
  if (token) {
    scheduleTokenRefresh(token);
  }
};

// Call on module load
initTokenRefresh();

// Redirect về login - only when refresh completely fails
const redirectToLogin = () => {
  setAccessToken(null);
  refreshAttempts = 0;
  
  if (refreshTimer) {
    clearTimeout(refreshTimer);
    refreshTimer = null;
  }

  if (store) {
    store.dispatch({ type: 'auth/resetAuthState' });
  }

  const currentPath = window.location.pathname;
  if (
    !currentPath.includes('/auth/login') &&
    !currentPath.includes('/auth/register')
  ) {
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
      // Prevent infinite loop on login/register pages
      if (
        window.location.pathname.includes('/auth/login') ||
        window.location.pathname.includes('/auth/register')
      ) {
        return Promise.reject(error);
      }

      // Nếu đây là request refresh token bị lỗi -> chỉ logout khi đã thử nhiều lần
      if (originalRequest.url?.includes('/auth/refresh')) {
        console.error('Refresh token request failed');
        isRefreshing = false;
        onRefreshError(error);
        
        // Chỉ logout nếu đã thử quá nhiều lần
        if (refreshAttempts >= MAX_REFRESH_ATTEMPTS) {
          console.error('Max refresh attempts reached, logging out');
          redirectToLogin();
        }
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
            resolve(axios(originalRequest));
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
        console.log(`Attempting token refresh (attempt ${refreshAttempts}/${MAX_REFRESH_ATTEMPTS})`);
        
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

        // Schedule next proactive refresh
        scheduleTokenRefresh(newAccessToken);

        // Notify các request đang đợi
        onTokenRefreshed(newAccessToken);

        console.log('Token refresh successful, retrying original request');

        // Retry request gốc với axios thuần (không qua interceptor)
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        return axios(originalRequest);
      } catch (refreshError) {
        console.error('Token refresh failed:', refreshError.message);
        isRefreshing = false;
        onRefreshError(refreshError);
        
        // Chỉ logout nếu đã thử hết số lần cho phép
        if (refreshAttempts >= MAX_REFRESH_ATTEMPTS) {
          console.error('All refresh attempts failed, logging out');
          redirectToLogin();
        }
        
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
  // Schedule proactive refresh for new token
  if (token) {
    scheduleTokenRefresh(token);
  }
};

// Export để clear refresh timer khi logout
export const clearTokenRefresh = () => {
  if (refreshTimer) {
    clearTimeout(refreshTimer);
    refreshTimer = null;
  }
  refreshAttempts = 0;
};

export default api;
