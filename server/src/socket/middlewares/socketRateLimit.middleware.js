import logger from '../../configs/logger.js';

const RATE_LIMITS = {
  joinRoom: { windowMs: 60000, max: 50 },
  sendMessage: { windowMs: 60000, max: 100 },
  markAsRead: { windowMs: 60000, max: 50 },
  typing: { windowMs: 10000, max: 20 },
  default: { windowMs: 60000, max: 200 },
};

const VIOLATION_THRESHOLDS = {
  warn: 5,
  disconnect: 10,
};

class SocketRateLimiter {
  constructor() {
    this.clients = new Map();
    this._cleanupInterval = setInterval(() => this._cleanup(), 60000);
  }

  _cleanup() {
    const now = Date.now();
    for (const [socketId, data] of this.clients) {
      for (const [event, timestamps] of Object.entries(data.events)) {
        const windowMs = RATE_LIMITS[event]?.windowMs || RATE_LIMITS.default.windowMs;
        const validTimestamps = timestamps.filter(t => now - t < windowMs);
        if (validTimestamps.length === 0) {
          delete data.events[event];
        } else {
          data.events[event] = validTimestamps;
        }
      }
      if (Object.keys(data.events).length === 0) {
        this.clients.delete(socketId);
      }
    }
  }

  checkLimit(socket, event) {
    const socketId = socket.id;
    const limit = RATE_LIMITS[event] || RATE_LIMITS.default;
    const now = Date.now();

    if (!this.clients.has(socketId)) {
      this.clients.set(socketId, { events: {}, violations: 0 });
    }

    const clientData = this.clients.get(socketId);

    if (!clientData.events[event]) {
      clientData.events[event] = [];
    }

    const timestamps = clientData.events[event];
    const validTimestamps = timestamps.filter(t => now - t < limit.windowMs);
    clientData.events[event] = validTimestamps;

    if (validTimestamps.length >= limit.max) {
      clientData.violations++;
      
      if (clientData.violations >= VIOLATION_THRESHOLDS.disconnect) {
        logger.warn('Socket rate limit exceeded - disconnecting', {
          socketId,
          event,
          violations: clientData.violations,
        });
        socket.emit('error', { message: 'Rate limit exceeded. Connection closed.' });
        socket.disconnect(true);
        this.clients.delete(socketId);
        return false;
      }

      if (clientData.violations >= VIOLATION_THRESHOLDS.warn) {
        logger.warn('Socket rate limit warning', {
          socketId,
          event,
          violations: clientData.violations,
        });
        socket.emit('rate_limit_warning', {
          event,
          retryAfter: Math.ceil(limit.windowMs / 1000),
        });
      }

      return false;
    }

    clientData.events[event].push(now);
    return true;
  }

  removeClient(socketId) {
    this.clients.delete(socketId);
  }

  shutdown() {
    if (this._cleanupInterval) {
      clearInterval(this._cleanupInterval);
      this._cleanupInterval = null;
    }
    this.clients.clear();
  }

  getStats() {
    return {
      totalClients: this.clients.size,
      timestamp: new Date(),
    };
  }
}

const rateLimiter = new SocketRateLimiter();

export const socketRateLimitMiddleware = (event) => {
  return (socket, next) => {
    if (rateLimiter.checkLimit(socket, event)) {
      next();
    }
  };
};

export const createRateLimitedHandler = (event, handler, socket) => {
  return async (...args) => {
    if (!rateLimiter.checkLimit(socket, event)) {
      return;
    }
    return handler(...args);
  };
};

export const cleanupRateLimiter = (socketId) => {
  rateLimiter.removeClient(socketId);
};

export const shutdownRateLimiter = () => {
  rateLimiter.shutdown();
};

export const getRateLimiterStats = () => {
  return rateLimiter.getStats();
};

export default rateLimiter;