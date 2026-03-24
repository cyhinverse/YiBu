import assert from 'node:assert/strict';
import http from 'http';
import { afterEach, describe, it } from 'node:test';
import socketService from '../../../src/modules/shared/socket/socket.service.js';
import { initSocket, io as sharedIo } from '../../../src/socket/index.js';
import { shutdownRateLimiter } from '../../../src/socket/middlewares/socketRateLimit.middleware.js';
import { createMockSocket } from '../../shared/socketTestUtils.js';

describe('socket/index', () => {
  const originalInit = socketService.init;
  const originalAddUser = socketService.addUser;
  const originalIsUserOnline = socketService.isUserOnline;

  afterEach(() => {
    socketService.init = originalInit;
    socketService.addUser = originalAddUser;
    socketService.isUserOnline = originalIsUserOnline;
    shutdownRateLimiter();
  });

  it('initSocket should initialize Socket.IO and register handlers for authenticated connections', async () => {
    const server = http.createServer();
    let initArg = null;
    let addUserArgs = null;

    socketService.init = io => {
      initArg = io;
    };
    socketService.addUser = (userId, socketId) => {
      addUserArgs = { userId, socketId };
    };
    socketService.isUserOnline = () => false;

    const io = initSocket(server);
    const originalEmit = io.emit.bind(io);
    const ioEmissions = [];
    io.emit = (event, payload) => {
      ioEmissions.push({ event, payload });
      return originalEmit(event, payload);
    };

    const socket = createMockSocket({
      id: 'socket-index-1',
      user: { id: 'user-1' },
    });

    try {
      const connectionHandler = io.listeners('connection')[0];
      connectionHandler(socket);

      assert.equal(initArg, io);
      assert.equal(sharedIo, io);
      assert.equal(io._path, '/socket.io');
      assert.deepEqual(socket.joins, ['user-1']);
      assert.deepEqual(addUserArgs, {
        userId: 'user-1',
        socketId: 'socket-index-1',
      });
      assert.equal(socket.emissions[0].event, 'connection_established');
      assert.equal(socket.emissions[0].payload.userId, 'user-1');
      assert.ok(ioEmissions.some(item => item.event === 'user_status_change'));
      assert.ok('register_user' in socket.handlers);
      assert.ok('join_room' in socket.handlers);
      assert.ok('notification:register' in socket.handlers);
      assert.ok('post:like' in socket.handlers);
    } finally {
      await new Promise(resolve => io.close(() => resolve()));
    }
  });

  it('authenticated connection bootstrap should skip online registration for anonymous sockets', async () => {
    const server = http.createServer();
    let addUserCalled = false;

    socketService.init = () => {};
    socketService.addUser = () => {
      addUserCalled = true;
    };
    socketService.isUserOnline = () => {
      throw new Error('isUserOnline should not be called for anonymous sockets');
    };

    const io = initSocket(server);
    const socket = createMockSocket({
      id: 'socket-index-2',
      user: null,
    });

    try {
      const connectionHandler = io.listeners('connection')[0];
      connectionHandler(socket);

      assert.equal(addUserCalled, false);
      assert.deepEqual(socket.joins, []);
      assert.deepEqual(socket.emissions, [
        {
          event: 'connection_established',
          payload: {
            message: 'Kết nối thành công',
            userId: undefined,
          },
        },
      ]);
    } finally {
      await new Promise(resolve => io.close(() => resolve()));
    }
  });
});
