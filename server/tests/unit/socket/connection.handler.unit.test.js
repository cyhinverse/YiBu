import assert from 'node:assert/strict';
import { afterEach, describe, it } from 'node:test';
import logger from '../../../src/configs/logger.js';
import socketService from '../../../src/modules/shared/socket/socket.service.js';
import rateLimiter from '../../../src/socket/middlewares/socketRateLimit.middleware.js';
import { registerConnectionHandlers } from '../../../src/socket/handlers/connection.handler.js';
import { createMockIo, createMockSocket } from '../../shared/socketTestUtils.js';

describe('socket/handlers/connection', () => {
  const originalWarn = logger.warn;
  const originalGetOnlineUsers = socketService.getOnlineUsers;
  const originalRemoveUser = socketService.removeUser;
  const originalIsUserOnline = socketService.isUserOnline;

  afterEach(() => {
    logger.warn = originalWarn;
    socketService.getOnlineUsers = originalGetOnlineUsers;
    socketService.removeUser = originalRemoveUser;
    socketService.isUserOnline = originalIsUserOnline;
    rateLimiter.clients.clear();
  });

  it('register_user should require an authenticated socket user', () => {
    const io = createMockIo();
    const socket = createMockSocket({ user: null });

    registerConnectionHandlers(io, socket);
    socket.handlers.register_user({ userId: 'user-2' });

    assert.deepEqual(socket.emissions, [
      {
        event: 'error',
        payload: { message: 'Authentication required' },
      },
    ]);
  });

  it('register_user should emit success and warn on mismatched userId payloads', () => {
    const io = createMockIo();
    const socket = createMockSocket({
      id: 'socket-connection-2',
      user: { id: 'user-1' },
    });
    let warnCall = null;

    logger.warn = (message, meta) => {
      warnCall = { message, meta };
    };

    registerConnectionHandlers(io, socket);
    socket.handlers.register_user({ userId: 'user-2' });

    assert.deepEqual(socket.emissions, [
      {
        event: 'user_registered',
        payload: { success: true, userId: 'user-1' },
      },
    ]);
    assert.equal(warnCall.message, 'Socket register_user userId mismatch');
    assert.equal(warnCall.meta.socketId, 'socket-connection-2');
    assert.equal(warnCall.meta.expectedUserId, 'user-1');
    assert.equal(warnCall.meta.providedUserId, 'user-2');
  });

  it('get_online_users should proxy the response from SocketService', () => {
    const io = createMockIo();
    const socket = createMockSocket();

    socketService.getOnlineUsers = () => ['user-1', 'user-2'];

    registerConnectionHandlers(io, socket);
    socket.handlers.get_online_users();

    assert.deepEqual(socket.emissions, [
      {
        event: 'get_users_online',
        payload: ['user-1', 'user-2'],
      },
    ]);
  });

  it('disconnect should cleanup rate-limit state, remove the user, and emit offline when last socket disconnects', () => {
    const io = createMockIo();
    const socket = createMockSocket({
      id: 'socket-connection-4',
      user: { id: 'user-1' },
    });
    let removedSocketId = null;

    rateLimiter.clients.set('socket-connection-4', {
      events: { typing: [Date.now()] },
      violations: 0,
    });

    socketService.removeUser = socketId => {
      removedSocketId = socketId;
    };
    socketService.isUserOnline = () => false;

    registerConnectionHandlers(io, socket);
    socket.handlers.disconnect();

    assert.equal(rateLimiter.clients.has('socket-connection-4'), false);
    assert.equal(removedSocketId, 'socket-connection-4');
    assert.equal(io.emissions.length, 1);
    assert.equal(io.emissions[0].event, 'user_status_change');
    assert.equal(io.emissions[0].payload.userId, 'user-1');
    assert.equal(io.emissions[0].payload.status, 'offline');
    assert.ok(io.emissions[0].payload.timestamp instanceof Date);
  });
});
