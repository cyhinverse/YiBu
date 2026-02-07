import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    sourcemap: false,
    cssCodeSplit: true,
    target: 'es2018',
    esbuild: {
      drop: ['console', 'debugger'],
    },
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) return;

          if (
            id.includes('/react-dom') ||
            id.includes('/react/') ||
            id.includes('react-router-dom')
          ) {
            return 'react-vendor';
          }

          if (id.includes('@reduxjs/toolkit') || id.includes('react-redux')) {
            return 'state-vendor';
          }

          if (
            id.includes('@tanstack/react-query') ||
            id.includes('@tanstack/react-virtual')
          ) {
            return 'tanstack-vendor';
          }

          if (id.includes('socket.io-client')) {
            return 'realtime-vendor';
          }

          if (id.includes('framer-motion') || id.includes('lucide-react')) {
            return 'ui-vendor';
          }

          if (
            id.includes('leaflet') ||
            id.includes('react-leaflet')
          ) {
            return 'map-vendor';
          }

          if (id.includes('recharts') || id.includes('@nivo')) {
            return 'chart-vendor';
          }

          if (id.includes('emoji-picker-react')) {
            return 'emoji-vendor';
          }

          if (id.includes('axios') || id.includes('date-fns')) {
            return 'utils-vendor';
          }
        },
      },
    },
  },
  server: {
    port: 9258,
    // Fix Google OAuth popup/postMessage warnings when COOP is set too strict.
    headers: {
      'Cross-Origin-Opener-Policy': 'same-origin-allow-popups',
    },
    // Proxy API + Socket.IO in dev so HttpOnly cookies work without SameSite=None.
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
      '/socket.io': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        ws: true,
      },
    },
  },
});
