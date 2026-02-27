import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import errorMiddleware from '../../../src/middlewares/error.middleware.js';
import config from '../../../src/configs/config.js';
import { createMockResponse } from '../../shared/middlewareTestUtils.js';

describe('error.middleware', () => {
  it('should map Mongo duplicate key error to 409 response', () => {
    const error = {
      code: 11000,
      keyValue: { email: 'dup@example.com' },
    };
    const req = { method: 'POST', path: '/users' };
    const res = createMockResponse();

    errorMiddleware(error, req, res, () => {});

    assert.equal(res.statusCode, 409);
    assert.equal(res.jsonPayload.success, false);
    assert.equal(res.jsonPayload.errorCode, 'DUPLICATE_KEY');
    assert.deepEqual(res.jsonPayload.details, { email: 'dup@example.com' });
  });

  it('should map CastError to 400 response', () => {
    const error = {
      name: 'CastError',
      path: '_id',
      value: 'invalid-object-id',
    };
    const req = { method: 'GET', path: '/posts/invalid-object-id' };
    const res = createMockResponse();

    errorMiddleware(error, req, res, () => {});

    assert.equal(res.statusCode, 400);
    assert.equal(res.jsonPayload.message, 'Invalid value');
    assert.equal(res.jsonPayload.errorCode, 'CAST_ERROR');
    assert.deepEqual(res.jsonPayload.details, {
      path: '_id',
      value: 'invalid-object-id',
    });
  });

  it('should map ValidationError to 400 response with field-level details', () => {
    const error = {
      name: 'ValidationError',
      errors: {
        email: { path: 'email', message: 'Email is invalid' },
        username: { path: 'username', message: 'Username is required' },
      },
    };
    const req = { method: 'POST', path: '/auth/register' };
    const res = createMockResponse();

    errorMiddleware(error, req, res, () => {});

    assert.equal(res.statusCode, 400);
    assert.equal(res.jsonPayload.message, 'Validation error');
    assert.equal(res.jsonPayload.errorCode, 'VALIDATION_ERROR');
    assert.deepEqual(res.jsonPayload.details, [
      { field: 'email', message: 'Email is invalid' },
      { field: 'username', message: 'Username is required' },
    ]);
  });

  it('should map TokenExpiredError to 401 response', () => {
    const error = { name: 'TokenExpiredError', message: 'jwt expired' };
    const req = { method: 'GET', path: '/auth/refresh-token' };
    const res = createMockResponse();

    errorMiddleware(error, req, res, () => {});

    assert.equal(res.statusCode, 401);
    assert.equal(res.jsonPayload.message, 'Token expired');
    assert.equal(res.jsonPayload.errorCode, 'TOKEN_EXPIRED');
  });

  it('should map JsonWebTokenError to 401 response', () => {
    const error = { name: 'JsonWebTokenError', message: 'invalid token' };
    const req = { method: 'GET', path: '/auth/refresh-token' };
    const res = createMockResponse();

    errorMiddleware(error, req, res, () => {});

    assert.equal(res.statusCode, 401);
    assert.equal(res.jsonPayload.message, 'Invalid token');
    assert.equal(res.jsonPayload.errorCode, 'TOKEN_INVALID');
  });

  it('should map MulterError to 400 response', () => {
    const error = { name: 'MulterError', message: 'File too large' };
    const req = { method: 'POST', path: '/upload' };
    const res = createMockResponse();

    errorMiddleware(error, req, res, () => {});

    assert.equal(res.statusCode, 400);
    assert.equal(res.jsonPayload.message, 'File too large');
    assert.equal(res.jsonPayload.errorCode, 'UPLOAD_ERROR');
  });

  it('should use string err.code as fallback errorCode when provided', () => {
    const error = {
      statusCode: 422,
      message: 'Custom validation',
      code: 'CUSTOM_VALIDATION',
    };
    const req = { method: 'POST', path: '/custom' };
    const res = createMockResponse();

    errorMiddleware(error, req, res, () => {});

    assert.equal(res.statusCode, 422);
    assert.equal(res.jsonPayload.message, 'Custom validation');
    assert.equal(res.jsonPayload.errorCode, 'CUSTOM_VALIDATION');
  });

  it('should include stack trace for 500 errors in development', () => {
    const originalEnv = config.env;
    config.env = 'development';

    try {
      const error = new Error('Boom');
      error.stack = 'custom-stack';
      const req = { method: 'GET', path: '/internal' };
      const res = createMockResponse();

      errorMiddleware(error, req, res, () => {});

      assert.equal(res.statusCode, 500);
      assert.equal(res.jsonPayload.message, 'Boom');
      assert.equal(res.jsonPayload.stack, 'custom-stack');
    } finally {
      config.env = originalEnv;
    }
  });

  it('should hide stack trace for 500 errors outside development', () => {
    const originalEnv = config.env;
    config.env = 'production';

    try {
      const error = new Error('Boom');
      error.stack = 'custom-stack';
      const req = { method: 'GET', path: '/internal' };
      const res = createMockResponse();

      errorMiddleware(error, req, res, () => {});

      assert.equal(res.statusCode, 500);
      assert.equal(res.jsonPayload.message, 'Boom');
      assert.equal(res.jsonPayload.stack, undefined);
    } finally {
      config.env = originalEnv;
    }
  });
});

