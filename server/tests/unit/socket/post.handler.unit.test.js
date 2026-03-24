import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { registerPostHandlers } from '../../../src/socket/handlers/post.handler.js';
import { createMockIo, createMockSocket } from '../../shared/socketTestUtils.js';

describe('socket/handlers/post', () => {
  it('post:like:listen should join the post room and confirm listening state', () => {
    const socket = createMockSocket({ id: 'socket-post-1' });

    registerPostHandlers(createMockIo(), socket);
    socket.handlers['post:like:listen']('post-1');

    assert.deepEqual(socket.joins, ['post:post-1']);
    assert.deepEqual(socket.emissions, [
      {
        event: 'post:like:listening',
        payload: { postId: 'post-1', success: true },
      },
    ]);
  });

  it('join_post and leave_post should manage post room membership', () => {
    const socket = createMockSocket({ id: 'socket-post-2' });

    registerPostHandlers(createMockIo(), socket);
    socket.handlers.join_post('post-2');
    socket.handlers.leave_post('post-2');

    assert.deepEqual(socket.joins, ['post:post-2']);
    assert.deepEqual(socket.leaves, ['post:post-2']);
  });

  it('post:like should ignore unauthenticated sockets and missing post ids', () => {
    const io = createMockIo();
    const socket = createMockSocket({ id: 'socket-post-3', user: null });

    registerPostHandlers(io, socket);
    socket.handlers['post:like']({ postId: 'post-3', action: 'like' });
    socket.user = { id: 'user-1' };
    socket.handlers['post:like']({ action: 'like' });

    assert.equal(io.emissions.length, 0);
  });

  it('post:like should emit realtime updates to the post room and global fallback channel', () => {
    const io = createMockIo();
    const socket = createMockSocket({
      id: 'socket-post-4',
      user: { id: 'user-1' },
    });

    registerPostHandlers(io, socket);
    socket.handlers['post:like']({ postId: 'post-4', action: 'unlike' });

    assert.equal(io.emissions.length, 2);
    assert.equal(io.emissions[0].target, 'post:post-4');
    assert.equal(io.emissions[0].event, 'post:like:update');
    assert.equal(io.emissions[1].target, null);
    assert.equal(io.emissions[1].event, 'post:post-4:like:update');
    assert.equal(io.emissions[0].payload.postId, 'post-4');
    assert.equal(io.emissions[0].payload.userId, 'user-1');
    assert.equal(io.emissions[0].payload.action, 'unlike');
    assert.ok(io.emissions[0].payload.timestamp instanceof Date);
  });
});
