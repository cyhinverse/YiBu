import express from 'express';
import cookieParser from 'cookie-parser';
import errorMiddleware from '../../src/middlewares/error.middleware.js';

export const createRouterTestApp = router => {
  const app = express();
  app.use(cookieParser());
  app.use(express.json());
  app.use(router);
  app.use(errorMiddleware);
  return app;
};

export const startTestServer = app => {
  return new Promise(resolve => {
    const server = app.listen(0, () => resolve(server));
  });
};

export const stopTestServer = server => {
  if (!server) return Promise.resolve();

  return new Promise((resolve, reject) => {
    server.close(error => {
      if (error) {
        reject(error);
        return;
      }
      resolve();
    });
  });
};

const parseResponseBody = async response => {
  const text = await response.text();
  if (!text) return null;

  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
};

export const requestJson = async (server, options) => {
  const { method = 'GET', path = '/', headers = {}, body } = options;
  const port = server.address().port;
  const url = `http://127.0.0.1:${port}${path}`;

  const response = await fetch(url, {
    method,
    headers: {
      ...(body !== undefined ? { 'content-type': 'application/json' } : {}),
      ...headers,
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  const payload = await parseResponseBody(response);

  return {
    status: response.status,
    headers: response.headers,
    body: payload,
  };
};
