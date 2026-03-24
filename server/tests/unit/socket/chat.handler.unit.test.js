import assert from 'node:assert/strict';
import { afterEach, describe, it } from 'node:test';
import Conversation from '../../../src/models/Conversation.js';
import rateLimiter, {
  shutdownRateLimiter,
} from '../../../src/socket/middlewares/socketRateLimit.middleware.js';
import { registerChatHandlers } from '../../../src/socket/handlers/chat.handler.js';
import { createMockIo, createMockSocket } from '../../shared/socketTestUtils.js';

const USER_ID = '507f191e810c19729de860ea';
const OTHER_USER_ID = '507f191e810c19729de860eb';
const THIRD_USER_ID = '507f191e810c19729de860ec';
const MESSAGE_ID = '507f191e810c19729de860ed';
const OTHER_MESSAGE_ID = '507f191e810c19729de860ee';
const GROUP_ID = '507f191e810c19729de860ef';

describe('socket/handlers/chat', () => {
  const originalConversationExists = Conversation.exists;

  afterEach(() => {
    Conversation.exists = originalConversationExists;
    shutdownRateLimiter();
    rateLimiter.clients.clear();
  });

  it('join_room should allow joining own user room and post rooms', async () => {
    const io = createMockIo();
    const socket = createMockSocket({
      id: 'socket-chat-1',
      user: { id: USER_ID },
    });

    registerChatHandlers(io, socket);

    await socket.handlers.join_room(USER_ID);
    await socket.handlers.join_room('post:post-1');

    assert.deepEqual(socket.joins, [USER_ID, 'post:post-1']);
    assert.deepEqual(
      socket.emissions.map(item => item.event),
      ['room_joined', 'room_joined']
    );
    assert.equal(socket.emissions[0].payload.roomId, USER_ID);
    assert.equal(socket.emissions[1].payload.roomId, 'post:post-1');
  });

  it('join_room should resolve direct and group conversations through Conversation.exists', async () => {
    const io = createMockIo();
    const socket = createMockSocket({
      id: 'socket-chat-2',
      user: { id: USER_ID },
    });
    const queries = [];

    Conversation.exists = async query => {
      queries.push(query);
      return { _id: 'conversation-1' };
    };

    registerChatHandlers(io, socket);

    await socket.handlers.join_room(`conversation:${USER_ID}_${OTHER_USER_ID}`);
    await socket.handlers.join_room(GROUP_ID);

    assert.equal(queries.length, 2);
    assert.deepEqual(queries[0], {
      directId: `${USER_ID}_${OTHER_USER_ID}`,
      members: USER_ID,
    });
    assert.deepEqual(queries[1], {
      _id: GROUP_ID,
      members: USER_ID,
    });
    assert.deepEqual(socket.joins, [
      `conversation:${USER_ID}_${OTHER_USER_ID}`,
      GROUP_ID,
    ]);
  });

  it('join_room should reject unauthenticated sockets and unauthorized rooms', async () => {
    const unauthSocket = createMockSocket({
      id: 'socket-chat-3',
      user: null,
    });
    registerChatHandlers(createMockIo(), unauthSocket);

    await unauthSocket.handlers.join_room('post:post-1');

    assert.deepEqual(unauthSocket.emissions, [
      {
        event: 'error',
        payload: { message: 'Authentication required' },
      },
    ]);

    const authSocket = createMockSocket({
      id: 'socket-chat-4',
      user: { id: USER_ID },
    });
    Conversation.exists = async () => null;
    registerChatHandlers(createMockIo(), authSocket);

    await authSocket.handlers.join_room(GROUP_ID);

    assert.deepEqual(authSocket.emissions, [
      {
        event: 'error',
        payload: { message: 'Not allowed to join this room' },
      },
    ]);
  });

  it('leave_room should leave the room and confirm success', () => {
    const socket = createMockSocket({ id: 'socket-chat-5', user: { id: USER_ID } });

    registerChatHandlers(createMockIo(), socket);
    socket.handlers.leave_room('room-1');

    assert.deepEqual(socket.leaves, ['room-1']);
    assert.deepEqual(socket.emissions, [
      {
        event: 'room_left',
        payload: { roomId: 'room-1', success: true },
      },
    ]);
  });

  it('send_message should validate authentication, payload, and sender identity', () => {
    const unauthSocket = createMockSocket({ id: 'socket-chat-6', user: null });
    registerChatHandlers(createMockIo(), unauthSocket);

    unauthSocket.handlers.send_message({
      message: { _id: MESSAGE_ID, content: 'hello' },
      receiverId: OTHER_USER_ID,
    });

    assert.equal(unauthSocket.emissions[0].payload.message, 'Authentication required');

    const invalidSocket = createMockSocket({ id: 'socket-chat-7', user: { id: USER_ID } });
    registerChatHandlers(createMockIo(), invalidSocket);

    invalidSocket.handlers.send_message({ receiverId: OTHER_USER_ID });
    invalidSocket.handlers.send_message({
      message: { _id: MESSAGE_ID, content: 'hello' },
      receiverId: OTHER_USER_ID,
      senderId: OTHER_USER_ID,
    });

    assert.equal(invalidSocket.emissions[0].payload.message, 'Invalid message data');
    assert.equal(invalidSocket.emissions[1].payload.message, 'Sender mismatch');
  });

  it('send_message should broadcast to receiver, sender, and direct-chat rooms', () => {
    const socket = createMockSocket({ id: 'socket-chat-8', user: { id: USER_ID } });

    registerChatHandlers(createMockIo(), socket);
    socket.handlers.send_message({
      message: { _id: MESSAGE_ID, content: 'hello' },
      receiverId: OTHER_USER_ID,
    });

    assert.deepEqual(socket.broadcasts.map(item => item.target), [
      OTHER_USER_ID,
      USER_ID,
      `chat_${USER_ID}_${OTHER_USER_ID}`,
      `chat_${OTHER_USER_ID}_${USER_ID}`,
    ]);
    assert.ok(
      socket.broadcasts.every(
        item => item.event === 'new_message' && item.payload.senderId === USER_ID
      )
    );
    assert.equal(socket.emissions.at(-1).event, 'message_sent');
    assert.equal(socket.emissions.at(-1).payload.senderId, USER_ID);
    assert.equal(socket.emissions.at(-1).payload.messageId, MESSAGE_ID);
  });

  it('mark_as_read should reject oversized batches and sender mismatches', () => {
    const socket = createMockSocket({ id: 'socket-chat-9', user: { id: USER_ID } });

    registerChatHandlers(createMockIo(), socket);
    socket.handlers.mark_as_read({
      messageIds: new Array(101).fill(MESSAGE_ID),
    });
    socket.handlers.mark_as_read({
      messageIds: [MESSAGE_ID],
      senderId: OTHER_USER_ID,
    });

    assert.equal(
      socket.emissions[0].payload.message,
      'Too many message IDs (max 100)'
    );
    assert.equal(socket.emissions[1].payload.message, 'Sender mismatch');
  });

  it('mark_as_read should filter valid ids and emit room, receiver, and sender updates', () => {
    const io = createMockIo();
    const socket = createMockSocket({
      id: 'socket-chat-10',
      user: { id: USER_ID },
    });

    registerChatHandlers(io, socket);
    socket.handlers.mark_as_read({
      messageIds: [MESSAGE_ID, 'bad-id', OTHER_MESSAGE_ID],
      receiverId: OTHER_USER_ID,
    });

    assert.equal(io.emissions.length, 4);
    assert.deepEqual(io.emissions.map(item => item.target), [
      `chat_${USER_ID}_${OTHER_USER_ID}`,
      `chat_${OTHER_USER_ID}_${USER_ID}`,
      OTHER_USER_ID,
      USER_ID,
    ]);
    assert.ok(
      io.emissions.every(
        item =>
          item.event === 'message_read' &&
          item.payload.senderId === USER_ID &&
          item.payload.messageIds.length === 2
      )
    );
    assert.deepEqual(socket.emissions.at(-1), {
      event: 'read_confirmed',
      payload: {
        success: true,
        messageIds: [MESSAGE_ID, OTHER_MESSAGE_ID],
      },
    });
  });

  it('typing handlers should emit typing states and reject sender mismatches', () => {
    const socket = createMockSocket({
      id: 'socket-chat-11',
      user: { id: USER_ID },
    });

    registerChatHandlers(createMockIo(), socket);

    socket.handlers.typing({ receiverId: OTHER_USER_ID });
    socket.handlers.stop_typing({ receiverId: OTHER_USER_ID });
    socket.handlers.user_typing({
      receiverId: OTHER_USER_ID,
      senderId: THIRD_USER_ID,
    });

    assert.deepEqual(socket.broadcasts.map(item => item.event), [
      'user_typing',
      'user_typing',
      'user_typing',
      'user_stop_typing',
      'user_stop_typing',
      'user_stop_typing',
    ]);
    assert.equal(socket.broadcasts[0].target, OTHER_USER_ID);
    assert.equal(socket.broadcasts[1].target, `chat_${USER_ID}_${OTHER_USER_ID}`);
    assert.equal(socket.broadcasts[2].target, `chat_${OTHER_USER_ID}_${USER_ID}`);
    assert.equal(socket.emissions.at(-1).payload.message, 'Sender mismatch');
  });
});
