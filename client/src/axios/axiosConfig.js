import axios from 'axios';
import { AUTH_API } from './apiEndpoint';

const backendUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:9785';

// Type for queued promise handlers
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

let store = null;

export const injectStore = (_store) => {
  store = _store;
};

const api = axios.create({
  baseURL: backendUrl,
  timeout: 15000,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle token expiration
api.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    // Network error
    if (!error.response) {
      console.error('Network/CORS error:', error.message);
      return Promise.reject(error);
    }

    const status = error.response.status;

    // If error is 401 and it's not a retry and not the refresh token call itself
    if (
      status === 401 &&
      !originalRequest._retry &&
      !originalRequest.url?.includes('/auth/refresh')
    ) {
      // Prevent infinite loop on login/register pages
      if (
        window.location.pathname.includes('/auth/login') ||
        window.location.pathname.includes('/auth/register')
      ) {
        return Promise.reject(error);
      }

      if (isRefreshing) {
        // If already refreshing, add request to queue
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then(() => {
            return api(originalRequest);
          })
          .catch((err) => {
            return Promise.reject(err);
          });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        // Attempt to refresh token via cookie
        await api.post(AUTH_API.REFRESH_TOKEN);

        // If successful, the server has set a new access token cookie
        // We just need to retry the original request
        // Sync with Redux if store is injected (optional, mostly for IsAuthenticated state)
        if (store) {
          // We might not have the new token text to put in store because it is HttpOnly
          // But we can ensure state knows we are authenticated
          store.dispatch({ type: 'auth/setIsAuthenticated', payload: true });
        }

        processQueue(null);
        return api(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);

        // If refresh fails, clear everything
        if (typeof window !== 'undefined') {
          // Send event to let app know to redirect to login
          window.dispatchEvent(new Event('auth-logout'));
        }

        if (store) {
          store.dispatch({ type: 'auth/resetAuthState' });
        }

        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    // Handle 403 - Forbidden
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

export const clearTokenRefresh = () => {
  // Reset any pending refresh state
  isRefreshing = false;
  failedQueue = [];
};

export default api;