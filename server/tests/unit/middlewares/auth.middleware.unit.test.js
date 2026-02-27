import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import jwt from 'jsonwebtoken';
import { verifyToken } from '../../../src/middlewares/auth.middleware.js';
import config from '../../../src/configs/config.js';
import UserModel from '../../../src/models/User.js';
import {
  createAccessToken,
  TEST_ADMIN_ID,
  TEST_USER_ID,
  mockUserLookup,
} from '../../shared/authTestUtils.js';
import {
  runMiddleware,
  createMockResponse,
} from '../../shared/middlewareTestUtils.js';

describe('auth.middleware', () => {
  it('should return AUTH_REQUIRED when token is missing', async () => {
    const req = { headers: {}, cookies: {} };
    const res = createMockResponse();

    const error = await runMiddleware(verifyToken, req, res);

    assert.equal(error.statusCode, 401);
    assert.equal(error.errorCode, 'AUTH_REQUIRED');
  });

  it('should attach req.user for valid token and active user', async () => {
    const restore = mockUserLookup({
      [TEST_USER_ID]: {
        _id: TEST_USER_ID,
        isAdmin: false,
        isActive: true,
        moderation: { status: 'active' },
      },
    });

    try {
      const token = createAccessToken({ id: TEST_USER_ID });
      const req = {
        headers: { authorization: `Bearer ${token}` },
        cookies: {},
      };
      const res = createMockResponse();

      const error = await runMiddleware(verifyToken, req, res);

      assert.equal(error, undefined);
      assert.equal(req.user.id, TEST_USER_ID);
      assert.equal(req.user.isAdmin, false);
    } finally {
      restore();
    }
  });

  it('should return ACCOUNT_BANNED for banned user', async () => {
    const restore = mockUserLookup({
      [TEST_ADMIN_ID]: {
        _id: TEST_ADMIN_ID,
        isAdmin: true,
        isActive: true,
        moderation: { status: 'banned' },
      },
    });

    try {
      const token = createAccessToken({ id: TEST_ADMIN_ID });
      const req = {
        headers: { authorization: `Bearer ${token}` },
        cookies: {},
      };
      const res = createMockResponse();

      const error = await runMiddleware(verifyToken, req, res);

      assert.equal(error.statusCode, 403);
      assert.equal(error.errorCode, 'ACCOUNT_BANNED');
    } finally {
      restore();
    }
  });

  it('should return CONFIG_MISSING when access token secret is not configured', async () => {
    const originalSecret = config.jwt.accessSecret;
    config.jwt.accessSecret = '';

    try {
      const req = {
        headers: { authorization: 'Bearer any-token' },
        cookies: {},
      };
      const res = createMockResponse();

      const error = await runMiddleware(verifyToken, req, res);

      assert.equal(error.statusCode, 500);
      assert.equal(error.errorCode, 'CONFIG_MISSING');
    } finally {
      config.jwt.accessSecret = originalSecret;
    }
  });

  it('should clear auth cookies and return TOKEN_EXPIRED when JWT is expired', async () => {
    const originalSecret = config.jwt.accessSecret;
    const secret =
      originalSecret || 'test_access_token_secret_with_min_length_32';
    config.jwt.accessSecret = secret;

    try {
      const expiredToken = jwt.sign({ id: TEST_USER_ID }, secret, {
        expiresIn: -1,
      });
      const req = {
        headers: { authorization: `Bearer ${expiredToken}` },
        cookies: {},
      };
      const res = createMockResponse();

      const error = await runMiddleware(verifyToken, req, res);

      assert.equal(error.statusCode, 401);
      assert.equal(error.errorCode, 'TOKEN_EXPIRED');
      assert.equal(res.clearedCookies.length, 2);
      assert.deepEqual(
        res.clearedCookies.map(cookie => cookie.name).sort(),
        ['accessToken', 'refreshToken']
      );
    } finally {
      config.jwt.accessSecret = originalSecret;
    }
  });

  it('should return USER_INACTIVE when user does not exist', async () => {
    const restore = mockUserLookup({});

    try {
      const token = createAccessToken({ id: TEST_USER_ID });
      const req = {
        headers: { authorization: `Bearer ${token}` },
        cookies: {},
      };
      const res = createMockResponse();

      const error = await runMiddleware(verifyToken, req, res);

      assert.equal(error.statusCode, 401);
      assert.equal(error.errorCode, 'USER_INACTIVE');
    } finally {
      restore();
    }
  });

  it('should return ACCOUNT_SUSPENDED with details for suspended users', async () => {
    const suspendedUntil = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000);
    const restore = mockUserLookup({
      [TEST_USER_ID]: {
        _id: TEST_USER_ID,
        isAdmin: false,
        isActive: true,
        moderation: { status: 'suspended', suspendedUntil },
      },
    });

    try {
      const token = createAccessToken({ id: TEST_USER_ID });
      const req = {
        headers: { authorization: `Bearer ${token}` },
        cookies: {},
      };
      const res = createMockResponse();

      const error = await runMiddleware(verifyToken, req, res);

      assert.equal(error.statusCode, 403);
      assert.equal(error.errorCode, 'ACCOUNT_SUSPENDED');
      assert.equal(error.details.suspendedUntil, suspendedUntil);
      assert.ok(error.details.remainingDays >= 1);
    } finally {
      restore();
    }
  });

  it('should clear expired suspension and continue', async () => {
    const suspendedUntil = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const originalUpdate = UserModel.findByIdAndUpdate;
    let receivedUpdateArgs;

    const restore = mockUserLookup({
      [TEST_USER_ID]: {
        _id: TEST_USER_ID,
        isAdmin: false,
        isActive: true,
        moderation: { status: 'suspended', suspendedUntil },
      },
    });

    UserModel.findByIdAndUpdate = async (...args) => {
      receivedUpdateArgs = args;
      return null;
    };

    try {
      const token = createAccessToken({ id: TEST_USER_ID });
      const req = {
        headers: { authorization: `Bearer ${token}` },
        cookies: {},
      };
      const res = createMockResponse();

      const error = await runMiddleware(verifyToken, req, res);

      assert.equal(error, undefined);
      assert.equal(req.user.id, TEST_USER_ID);
      assert.equal(receivedUpdateArgs[0], TEST_USER_ID);
      assert.equal(
        receivedUpdateArgs[1].$set['moderation.status'],
        'active'
      );
    } finally {
      restore();
      UserModel.findByIdAndUpdate = originalUpdate;
    }
  });
});

