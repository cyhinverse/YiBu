import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import UserInteraction from '../../../src/models/UserInteraction.js';

describe('models/UserInteraction.record', () => {
  it('should create a single interaction doc when no session is provided', async () => {
    const originalCreate = UserInteraction.create;
    const originalDeleteOne = UserInteraction.deleteOne;

    let createArgs = null;
    let deleteArgs = null;

    try {
      UserInteraction.deleteOne = async (...args) => {
        deleteArgs = args;
      };

      UserInteraction.create = async (...args) => {
        createArgs = args;
        return [{ _id: 'interaction-1', ...args[0][0] }];
      };

      const result = await UserInteraction.record({
        user: 'user-1',
        targetType: 'post',
        targetId: 'post-1',
        interactionType: 'like',
      });

      assert.ok(Array.isArray(createArgs[0]));
      assert.equal(createArgs[0].length, 1);
      assert.equal(createArgs[0][0].interactionType, 'like');
      assert.deepEqual(createArgs[1], {});
      assert.equal(deleteArgs[0].interactionType, 'unlike');
      assert.equal(result._id, 'interaction-1');
    } finally {
      UserInteraction.create = originalCreate;
      UserInteraction.deleteOne = originalDeleteOne;
    }
  });

  it('should forward session to create when session is provided', async () => {
    const originalCreate = UserInteraction.create;
    const originalDeleteOne = UserInteraction.deleteOne;

    let createArgs = null;
    let deleteCalled = false;

    try {
      UserInteraction.deleteOne = async () => {
        deleteCalled = true;
      };

      UserInteraction.create = async (...args) => {
        createArgs = args;
        return [{ _id: 'interaction-2', ...args[0][0] }];
      };

      const session = { id: 'session-1' };
      await UserInteraction.record(
        {
          user: 'user-1',
          targetType: 'post',
          targetId: 'post-1',
          interactionType: 'view',
        },
        { session }
      );

      assert.equal(deleteCalled, false);
      assert.equal(createArgs[1].session, session);
    } finally {
      UserInteraction.create = originalCreate;
      UserInteraction.deleteOne = originalDeleteOne;
    }
  });
});

