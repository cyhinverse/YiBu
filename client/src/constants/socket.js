// Socket configuration constants
//
// Prefer `VITE_SOCKET_URL` if you run Socket.IO on a dedicated host.
// Otherwise fall back to `VITE_API_BASE_URL` (same backend), and finally same-origin (Vite proxy / prod).
export const SOCKET_URL =
  import.meta.env.VITE_SOCKET_URL ||
  import.meta.env.VITE_API_BASE_URL ||
  (typeof window !== 'undefined' ? window.location.origin : '');
export const MAX_RECONNECT_ATTEMPTS = 3;
