import assert from 'node:assert/strict';
import { afterEach, describe, it } from 'node:test';
import jwt from 'jsonwebtoken';
import config from '../../../src/configs/config.js';
import logger from '../../../src/configs/logger.js';
import User from '../../../src/models/User.js';
import socketAuthMiddleware from '../../../src/socket/middlewares/socketAuth.middleware.js';
import { createMockSocket } from '../../shared/socketTestUtils.js';

const runSocketAuth = socket =>
  new Promise(resolve => {
    socketAuthMiddleware(socket, error => resolve(error));
  });

describe('socketAuth.middleware', () => {
  const originalSecret = config.jwt.accessSecret;
  const originalVerify = jwt.verify;
  const originalFindById = User.findById;
  const originalWarn = logger.warn;

  afterEach(() => {
    config.jwt.accessSecret = originalSecret;
    jwt.verify = originalVerify;
    User.findById = originalFindById;
    logger.warn = originalWarn;
  });

  it('should reject when socket auth secret is not configured', async () => {
    config.jwt.accessSecret = '';

    const error = await runSocketAuth(createMockSocket());

    assert.equal(error.message, 'Socket auth is not configured');
  });

  it('should reject when no access token is present in the handshake', async () => {
    config.jwt.accessSecret = 'socket-secret';

    const error = await runSocketAuth(
      createMockSocket({
        handshake: { address: '127.0.0.1', auth: {}, query: {}, headers: {} },
      })
    );

    assert.equal(error.message, 'Authentication required');
  });

  it('should attach socket.user for a valid active user', async () => {
    config.jwt.accessSecret = 'socket-secret';
    jwt.verify = () => ({ id: '507f191e810c19729de860ea', email: 'user@example.com' });
    User.findById = userId => {
      assert.equal(userId, '507f191e810c19729de860ea');
      return {
        select: async () => ({
          _id: { toString: () => '507f191e810c19729de860ea' },
          isAdmin: 1,
          isActive: true,
          moderation: { status: 'active' },
        }),
      };
    };

    const socket = createMockSocket({
      handshake: {
        address: '127.0.0.1',
        auth: { token: 'valid-token' },
        query: {},
        headers: {},
      },
    });

    const error = await runSocketAuth(socket);

    assert.equal(error, undefined);
    assert.deepEqual(socket.user, {
      id: '507f191e810c19729de860ea',
      isAdmin: true,
      email: 'user@example.com',
    });
  });

  it('should reject inactive, banned, and suspended users with specific messages', async () => {
    config.jwt.accessSecret = 'socket-secret';
    jwt.verify = () => ({ id: '507f191e810c19729de860ea', email: 'user@example.com' });

    const cases = [
      {
        user: null,
        expectedMessage: 'User is inactive',
      },
      {
        user: {
          _id: { toString: () => '507f191e810c19729de860ea' },
          isActive: true,
          moderation: { status: 'banned' },
        },
        expectedMessage: 'Account is banned',
      },
      {
        user: {
          _id: { toString: () => '507f191e810c19729de860ea' },
          isActive: true,
          moderation: {
            status: 'suspended',
            suspendedUntil: new Date(Date.now() + 60_000),
          },
        },
        expectedMessage: 'Account is suspended',
      },
    ];

    for (const testCase of cases) {
      User.findById = () => ({
        select: async () => testCase.user,
      });

      const error = await runSocketAuth(
        createMockSocket({
          handshake: {
            address: '127.0.0.1',
            auth: { token: 'valid-token' },
            query: {},
            headers: {},
          },
        })
      );

      assert.equal(error.message, testCase.expectedMessage);
    }
  });

  it('should log and mask unexpected auth errors', async () => {
    let warnCall = null;

    config.jwt.accessSecret = 'socket-secret';
    jwt.verify = () => {
      throw new Error('jwt malformed');
    };
    logger.warn = (message, meta) => {
      warnCall = { message, meta };
    };

    const error = await runSocketAuth(
      createMockSocket({
        id: 'socket-auth-1',
        handshake: {
          address: '203.0.113.10',
          auth: { token: 'bad-token' },
          query: {},
          headers: {},
        },
      })
    );

    assert.equal(error.message, 'Authentication failed');
    assert.equal(warnCall.message, 'Socket authentication failed');
    assert.equal(warnCall.meta.socketId, 'socket-auth-1');
    assert.equal(warnCall.meta.ip, '203.0.113.10');
  });
});
