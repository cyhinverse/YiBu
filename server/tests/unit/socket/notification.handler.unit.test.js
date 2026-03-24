import assert from 'node:assert/strict';
import { afterEach, describe, it } from 'node:test';
import logger from '../../../src/configs/logger.js';
import { registerNotificationHandlers } from '../../../src/socket/handlers/notification.handler.js';
import { createMockIo, createMockSocket } from '../../shared/socketTestUtils.js';

describe('socket/handlers/notification', () => {
  const originalWarn = logger.warn;

  afterEach(() => {
    logger.warn = originalWarn;
  });

  it('send_notification should be blocked and warn with sender metadata', () => {
    const io = createMockIo();
    const socket = createMockSocket({
      id: 'socket-notification-1',
      user: { id: 'user-1' },
    });
    let warnCall = null;

    logger.warn = (message, meta) => {
      warnCall = { message, meta };
    };

    registerNotificationHandlers(io, socket);
    socket.handlers.send_notification({ recipient: 'user-2' });

    assert.deepEqual(socket.emissions, [
      {
        event: 'error',
        payload: { message: 'Direct client notifications are disabled' },
      },
    ]);
    assert.equal(warnCall.message, 'Blocked direct socket notification event');
    assert.equal(warnCall.meta.socketId, 'socket-notification-1');
    assert.equal(warnCall.meta.senderId, 'user-1');
    assert.equal(warnCall.meta.recipient, 'user-2');
  });

  it('notification:register should require authentication', () => {
    const socket = createMockSocket({ user: null });

    registerNotificationHandlers(createMockIo(), socket);
    socket.handlers['notification:register']('user-1');

    assert.deepEqual(socket.emissions, [
      {
        event: 'error',
        payload: { message: 'Authentication required' },
      },
    ]);
  });

  it('notification:register should join the authenticated user room and warn on mismatches', () => {
    const socket = createMockSocket({
      id: 'socket-notification-3',
      user: { id: 'user-1' },
    });
    let warnCall = null;

    logger.warn = (message, meta) => {
      warnCall = { message, meta };
    };

    registerNotificationHandlers(createMockIo(), socket);
    socket.handlers['notification:register']('user-2');

    assert.deepEqual(socket.joins, ['user-1']);
    assert.deepEqual(socket.emissions, [
      {
        event: 'notification:registered',
        payload: { userId: 'user-1', success: true },
      },
    ]);
    assert.equal(warnCall.message, 'Socket notification:register userId mismatch');
    assert.equal(warnCall.meta.expectedUserId, 'user-1');
    assert.equal(warnCall.meta.providedUserId, 'user-2');
  });
});
