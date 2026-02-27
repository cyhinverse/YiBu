export const runMiddleware = (middleware, req = {}, res = {}) => {
  return new Promise((resolve, reject) => {
    let settled = false;
    const done = error => {
      if (settled) return;
      settled = true;
      resolve(error);
    };

    const originalJson = res.json;
    res.json = function (...args) {
      if (typeof originalJson === 'function') {
        originalJson.apply(this, args);
      }
      done(undefined);
      return this;
    };

    const originalSend = res.send;
    res.send = function (...args) {
      if (typeof originalSend === 'function') {
        originalSend.apply(this, args);
      }
      done(undefined);
      return this;
    };

    const originalEnd = res.end;
    res.end = function (...args) {
      if (typeof originalEnd === 'function') {
        originalEnd.apply(this, args);
      }
      done(undefined);
      return this;
    };

    try {
      middleware(req, res, done);
    } catch (error) {
      reject(error);
    }
  });
};

export const createMockResponse = () => {
  const response = {
    statusCode: null,
    jsonPayload: null,
    cookies: [],
    clearedCookies: [],
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(payload) {
      this.jsonPayload = payload;
      return this;
    },
    cookie(name, value, options) {
      this.cookies.push({ name, value, options });
      return this;
    },
    clearCookie(name, options) {
      this.clearedCookies.push({ name, options });
      return this;
    },
  };

  return response;
};
