import assert from 'node:assert/strict';
import { afterEach, beforeEach, describe, it } from 'node:test';
import socketService from '../../../../src/modules/shared/socket/socket.service.js';
import socketRepository from '../../../../src/modules/shared/socket/socket.repository.js';

const createIoMock = () => {
  const emissions = [];
  return {
    emissions,
    sockets: { sockets: new Map() },
    to(target) {
      return {
        emit(event, payload) {
          emissions.push({ target, event, payload });
        },
      };
    },
  };
};

describe('SocketService', () => {
  beforeEach(() => {
    socketService.shutdown();
  });

  afterEach(() => {
    socketService.shutdown();
  });

  it('_getPushSettings should support nested push settings and legacy shape', () => {
    assert.deepEqual(socketService._getPushSettings(null), {});
    assert.deepEqual(socketService._getPushSettings({ push: { likes: false } }), {
      likes: false,
    });
    assert.deepEqual(socketService._getPushSettings({ likes: true }), {
      likes: true,
    });
  });

  it('_isNotificationEnabled should respect global and type flags', () => {
    assert.equal(
      socketService._isNotificationEnabled({ push: { enabled: false } }, 'like'),
      false
    );
    assert.equal(
      socketService._isNotificationEnabled({ push: { likes: false } }, 'like'),
      false
    );
    assert.equal(
      socketService._isNotificationEnabled({ push: { likes: true } }, 'like'),
      true
    );
  });

  it('addUser/removeUser should manage maps and update activity when last socket disconnects', () => {
    const originalUserFindByIdAndUpdate = socketRepository.userFindByIdAndUpdate;
    const updates = [];

    socketRepository.userFindByIdAndUpdate = (...args) => {
      updates.push(args);
      return { exec: () => {} };
    };

    try {
      socketService.addUser('user-1', 'socket-1');
      socketService.addUser('user-1', 'socket-2');

      assert.equal(socketService.isUserOnline('user-1'), true);
      assert.equal(socketService.getUserSockets('user-1').size, 2);

      socketService.removeUser('socket-1');
      assert.equal(socketService.isUserOnline('user-1'), true);

      socketService.removeUser('socket-2');
      assert.equal(Boolean(socketService.isUserOnline('user-1')), false);

      socketService.removeUser('missing-socket');
      assert.equal(updates.length, 3);
    } finally {
      socketRepository.userFindByIdAndUpdate = originalUserFindByIdAndUpdate;
    }
  });

  it('getOnlineUsers should support offset/limit pagination', () => {
    const originalUserFindByIdAndUpdate = socketRepository.userFindByIdAndUpdate;
    socketRepository.userFindByIdAndUpdate = () => ({ exec: () => {} });

    try {
      socketService.addUser('user-1', 'socket-1');
      socketService.addUser('user-2', 'socket-2');
      socketService.addUser('user-3', 'socket-3');

      assert.deepEqual(socketService.getOnlineUsers(), ['user-1', 'user-2', 'user-3']);
      assert.deepEqual(socketService.getOnlineUsers({ limit: 2, offset: 1 }), [
        'user-2',
        'user-3',
      ]);
    } finally {
      socketRepository.userFindByIdAndUpdate = originalUserFindByIdAndUpdate;
    }
  });

  it('_cleanupStaleConnections should remove sockets not present in io server', () => {
    const io = createIoMock();
    io.sockets.sockets.set('alive-socket', {});
    socketService.io = io;

    socketService.onlineUsers.set('alive-socket', 'user-1');
    socketService.onlineUsers.set('stale-socket', 'user-2');
    socketService.userSockets.set('user-1', new Set(['alive-socket']));
    socketService.userSockets.set('user-2', new Set(['stale-socket']));

    socketService._cleanupStaleConnections();

    assert.equal(socketService.onlineUsers.has('stale-socket'), false);
    assert.equal(socketService.userSockets.has('user-2'), false);
    assert.equal(socketService.onlineUsers.has('alive-socket'), true);
  });

  it('sendMessage should return blocked when receiver has blocked sender', async () => {
    const originalUserSettingsFindOne = socketRepository.userSettingsFindOne;

    socketRepository.userSettingsFindOne = () => ({
      select: () => ({
        lean: async () => ({ blockedUsers: ['user-1'] }),
      }),
    });

    try {
      const result = await socketService.sendMessage('user-1', 'user-2', {
        _id: 'message-1',
      });
      assert.deepEqual(result, { delivered: false, reason: 'blocked' });
    } finally {
      socketRepository.userSettingsFindOne = originalUserSettingsFindOne;
    }
  });

  it('sendMessage should return offline when receiver has no active sockets', async () => {
    const originalUserSettingsFindOne = socketRepository.userSettingsFindOne;

    socketRepository.userSettingsFindOne = () => ({
      select: () => ({
        lean: async () => ({ blockedUsers: [] }),
      }),
    });

    try {
      const result = await socketService.sendMessage('user-1', 'user-2', {
        _id: 'message-1',
      });
      assert.deepEqual(result, { delivered: false, reason: 'offline' });
    } finally {
      socketRepository.userSettingsFindOne = originalUserSettingsFindOne;
    }
  });

  it('sendMessage should emit and update message status when receiver is online', async () => {
    const io = createIoMock();
    socketService.io = io;
    socketService.userSockets.set('user-2', new Set(['socket-a', 'socket-b']));

    const originalUserSettingsFindOne = socketRepository.userSettingsFindOne;
    const originalMessageFindByIdAndUpdate = socketRepository.messageFindByIdAndUpdate;
    let updatedArgs;

    socketRepository.userSettingsFindOne = () => ({
      select: () => ({
        lean: async () => ({ blockedUsers: [] }),
      }),
    });
    socketRepository.messageFindByIdAndUpdate = async (...args) => {
      updatedArgs = args;
      return { _id: args[0] };
    };

    try {
      const result = await socketService.sendMessage('user-1', 'user-2', {
        _id: 'message-1',
        content: 'hello',
      });

      assert.deepEqual(result, { delivered: true, socketCount: 2 });
      assert.equal(io.emissions.length, 2);
      assert.equal(io.emissions[0].event, 'new_message');
      assert.equal(updatedArgs[0], 'message-1');
      assert.equal(updatedArgs[1].status, 'delivered');
    } finally {
      socketRepository.userSettingsFindOne = originalUserSettingsFindOne;
      socketRepository.messageFindByIdAndUpdate = originalMessageFindByIdAndUpdate;
    }
  });

  it('sendMessageStatus and sendConversationRead should emit events to sender sockets', () => {
    const io = createIoMock();
    socketService.io = io;
    socketService.userSockets.set('user-1', new Set(['socket-a', 'socket-b']));

    socketService.sendMessageStatus('user-1', 'user-2', 'message-1', 'read');
    socketService.sendConversationRead('user-1', 'user-2', 'conversation-1');

    const events = io.emissions.map(item => item.event);
    assert.equal(events.filter(event => event === 'message_status').length, 2);
    assert.equal(events.filter(event => event === 'conversation_read').length, 2);
  });

  it('typing/group/post/room emit helpers should publish expected events', () => {
    const io = createIoMock();
    socketService.io = io;
    socketService.userSockets.set('user-1', new Set(['socket-a']));

    socketService.emitTyping('conversation-1', 'user-1', true);
    socketService.emitTyping('conversation-1', 'user-1', false);
    socketService.emitGroupCreated('user-1', { id: 1 });
    socketService.emitAddedToGroup('user-1', { id: 2 });
    socketService.emitRemovedFromGroup('user-1', { id: 3 });
    socketService.emitPostLike('user-1', { id: 4 });
    socketService.emitPostComment('user-1', { id: 5 });
    socketService.emitToRoom('room-1', 'custom_event', { ok: true });

    const events = io.emissions.map(item => item.event);
    assert.ok(events.includes('user_typing'));
    assert.ok(events.includes('user_stop_typing'));
    assert.ok(events.includes('group_created'));
    assert.ok(events.includes('added_to_group'));
    assert.ok(events.includes('removed_from_group'));
    assert.ok(events.includes('post_liked'));
    assert.ok(events.includes('post_commented'));
    assert.ok(events.includes('custom_event'));
  });

  it('sendNotification should handle disabled/offline/online states', async () => {
    const io = createIoMock();
    socketService.io = io;

    const originalUserSettingsFindOne = socketRepository.userSettingsFindOne;

    socketRepository.userSettingsFindOne = () => ({
      select: () => ({
        lean: async () => ({ notifications: { push: { enabled: false } } }),
      }),
    });

    try {
      const disabled = await socketService.sendNotification('user-1', {
        type: 'like',
      });
      assert.deepEqual(disabled, { sent: false, reason: 'disabled' });
    } finally {
      socketRepository.userSettingsFindOne = originalUserSettingsFindOne;
    }

    socketRepository.userSettingsFindOne = () => ({
      select: () => ({
        lean: async () => ({ notifications: { push: { likes: true } } }),
      }),
    });

    try {
      const offline = await socketService.sendNotification('user-1', {
        type: 'like',
      });
      assert.deepEqual(offline, { sent: false, reason: 'offline' });

      socketService.userSockets.set('user-1', new Set(['socket-a']));
      const online = await socketService.sendNotification('user-1', {
        type: 'like',
      });
      assert.deepEqual(online, { sent: true, socketCount: 1 });
      assert.equal(io.emissions.at(-1).event, 'new_notification');
    } finally {
      socketRepository.userSettingsFindOne = originalUserSettingsFindOne;
    }
  });

  it('broadcastNotification should aggregate sent/failed by settings and online state', async () => {
    const io = createIoMock();
    socketService.io = io;

    const originalUserSettingsFind = socketRepository.userSettingsFind;

    socketService.userSockets.set('user-1', new Set(['socket-a']));

    socketRepository.userSettingsFind = () => ({
      select: () => ({
        lean: async () => [
          { user: 'user-1', notifications: { push: { likes: true } } },
          { user: 'user-2', notifications: { push: { likes: false } } },
        ],
      }),
    });

    try {
      const result = await socketService.broadcastNotification(
        ['user-1', 'user-2', 'user-3'],
        { type: 'like', content: 'hello' }
      );

      assert.deepEqual(result, { sent: 1, failed: 2 });
      assert.equal(io.emissions.length, 1);
      assert.equal(io.emissions[0].target, 'socket-a');
      assert.equal(io.emissions[0].event, 'new_notification');
    } finally {
      socketRepository.userSettingsFind = originalUserSettingsFind;
    }
  });

  it('getUserPresence should return online status when sockets exist', async () => {
    socketService.userSockets.set('user-1', new Set(['socket-a']));

    const result = await socketService.getUserPresence('user-1');

    assert.equal(result.userId, 'user-1');
    assert.equal(result.status, 'online');
    assert.ok(result.lastActiveAt instanceof Date);
  });

  it('getUserPresence should return offline status with repository lastActiveAt', async () => {
    const originalUserFindById = socketRepository.userFindById;
    const lastActiveAt = new Date('2026-01-01T00:00:00.000Z');

    socketRepository.userFindById = () => ({
      select: () => ({
        lean: async () => ({ lastActiveAt }),
      }),
    });

    try {
      const result = await socketService.getUserPresence('user-1');
      assert.equal(result.status, 'offline');
      assert.equal(result.lastActiveAt, lastActiveAt);
    } finally {
      socketRepository.userFindById = originalUserFindById;
    }
  });

  it('getMultiplePresence should combine online users with offline lookup results', async () => {
    const originalUserFind = socketRepository.userFind;
    const offlineLastActiveAt = new Date('2026-02-01T00:00:00.000Z');

    socketService.userSockets.set('user-online', new Set(['socket-a']));

    socketRepository.userFind = () => ({
      select: () => ({
        lean: async () => [{ _id: 'user-offline', lastActiveAt: offlineLastActiveAt }],
      }),
    });

    try {
      const results = await socketService.getMultiplePresence([
        'user-online',
        'user-offline',
        'user-missing',
      ]);

      const byId = new Map(results.map(item => [item.userId, item]));
      assert.equal(byId.get('user-online').status, 'online');
      assert.equal(byId.get('user-offline').status, 'offline');
      assert.equal(byId.get('user-offline').lastActiveAt, offlineLastActiveAt);
      assert.equal(byId.get('user-missing').lastActiveAt, null);
    } finally {
      socketRepository.userFind = originalUserFind;
    }
  });

  it('init and shutdown should set io and cleanup internal state', () => {
    const io = createIoMock();
    const originalUserFindByIdAndUpdate = socketRepository.userFindByIdAndUpdate;

    socketRepository.userFindByIdAndUpdate = () => ({ exec: () => {} });

    try {
      socketService.init(io);
      socketService.addUser('user-1', 'socket-a');

      assert.equal(socketService.io, io);
      assert.equal(socketService.isUserOnline('user-1'), true);

      socketService.shutdown();

      assert.equal(socketService.io, null);
      assert.equal(socketService.onlineUsers.size, 0);
      assert.equal(socketService.userSockets.size, 0);
      assert.equal(socketService._cleanupInterval, null);
    } finally {
      socketRepository.userFindByIdAndUpdate = originalUserFindByIdAndUpdate;
    }
  });

  it('_startCleanupInterval should clear previous timer and invoke cleanup callback', () => {
    const originalSetInterval = global.setInterval;
    const originalClearInterval = global.clearInterval;
    const originalCleanup = socketService._cleanupStaleConnections;
    const originalTimer = socketService._cleanupInterval;
    let clearedTimer;
    let intervalMs;
    let cleanupCalls = 0;
    let scheduledCallback = null;

    socketService._cleanupInterval = 'old-timer';
    socketService._cleanupStaleConnections = () => {
      cleanupCalls += 1;
    };
    global.clearInterval = timer => {
      clearedTimer = timer;
    };
    global.setInterval = (cb, ms) => {
      scheduledCallback = cb;
      intervalMs = ms;
      return 'new-timer';
    };

    try {
      socketService._startCleanupInterval();
      assert.equal(clearedTimer, 'old-timer');
      assert.equal(intervalMs, socketService.constructor.CLEANUP_INTERVAL);
      assert.equal(socketService._cleanupInterval, 'new-timer');
      assert.equal(typeof scheduledCallback, 'function');

      scheduledCallback();
      assert.equal(cleanupCalls, 1);
    } finally {
      global.setInterval = originalSetInterval;
      global.clearInterval = originalClearInterval;
      socketService._cleanupStaleConnections = originalCleanup;
      socketService._cleanupInterval = originalTimer;
    }
  });
});

