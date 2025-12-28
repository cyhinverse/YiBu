import React from 'react';
import ReactDOM from 'react-dom/client';
import './globals.css';
import 'leaflet/dist/leaflet.css';
import App from './App.jsx';
import { BrowserRouter } from 'react-router-dom';
import { Provider } from 'react-redux';
import { store, persistor } from './redux/store.js';
import { PersistGate } from 'redux-persist/integration/react';
import { injectStore } from './axios/axiosConfig';

// Inject store into axios interceptors
injectStore(store);

// Kiểm tra dark mode từ localStorage khi trang tải

const initializeDarkMode = () => {
  try {
    const savedTheme = localStorage.getItem('theme');

    if (savedTheme) {
      if (savedTheme === 'dark') {
        document.documentElement.classList.add('dark');
      } else if (savedTheme === 'system') {
        const prefersDark = window.matchMedia(
          '(prefers-color-scheme: dark)'
        ).matches;
        if (prefersDark) {
          document.documentElement.classList.add('dark');
        }
      }
      return;
    }

    // Fallback: Check redux persist
    const persistedRoot = localStorage.getItem('persist:root');
    if (persistedRoot) {
      const parsedRoot = JSON.parse(persistedRoot);
      if (parsedRoot.user) {
        const userData = JSON.parse(parsedRoot.user);
        const themeAppearance = userData?.settings?.theme?.appearance;

        if (themeAppearance === 'dark') {
          document.documentElement.classList.add('dark');
        } else if (themeAppearance === 'system') {
          const prefersDark = window.matchMedia(
            '(prefers-color-scheme: dark)'
          ).matches;
          if (prefersDark) {
            document.documentElement.classList.add('dark');
          }
        }
      }
    }

    // Default: Check system preference
    if (!savedTheme && !localStorage.getItem('persist:root')) {
      const prefersDark = window.matchMedia(
        '(prefers-color-scheme: dark)'
      ).matches;
      if (prefersDark) {
        document.documentElement.classList.add('dark');
      }
    }
  } catch (error) {
    console.error('Error initializing dark mode:', error);
  }
};

// Thực thi ngay khi tải trang
initializeDarkMode();

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      refetchOnWindowFocus: false,
    },
  },
});

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <Provider store={store}>
      <PersistGate loading={null} persistor={persistor}>
        <QueryClientProvider client={queryClient}>
          <BrowserRouter>
            <App />
          </BrowserRouter>
        </QueryClientProvider>
      </PersistGate>
    </Provider>
  </React.StrictMode>
);
