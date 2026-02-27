import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import NotificationModel from '../../../src/models/Notification.js';
import { createSystemNotification } from '../../../src/utils/systemNotification.js';

describe('utils/systemNotification', () => {
  it('should call Notification.create with single payload when no session is provided', async () => {
    const originalCreate = NotificationModel.create;
    const calls = [];

    NotificationModel.create = async (...args) => {
      calls.push(args);
      return null;
    };

    try {
      await createSystemNotification({
        recipient: '507f191e810c19729de860ea',
        sender: '507f191e810c19729de860eb',
        content: 'System message',
      });

      assert.equal(calls.length, 1);
      assert.deepEqual(calls[0][0], {
        recipient: '507f191e810c19729de860ea',
        sender: '507f191e810c19729de860eb',
        type: 'system',
        content: 'System message',
      });
    } finally {
      NotificationModel.create = originalCreate;
    }
  });

  it('should call Notification.create with array payload when session is provided', async () => {
    const originalCreate = NotificationModel.create;
    const calls = [];
    const session = { id: 'session-1' };

    NotificationModel.create = async (...args) => {
      calls.push(args);
      return null;
    };

    try {
      await createSystemNotification({
        recipient: '507f191e810c19729de860ea',
        sender: '507f191e810c19729de860eb',
        content: 'System message',
        session,
      });

      assert.equal(calls.length, 1);
      assert.deepEqual(calls[0][0], [
        {
          recipient: '507f191e810c19729de860ea',
          sender: '507f191e810c19729de860eb',
          type: 'system',
          content: 'System message',
        },
      ]);
      assert.deepEqual(calls[0][1], { session });
    } finally {
      NotificationModel.create = originalCreate;
    }
  });
});
