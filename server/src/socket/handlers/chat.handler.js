import logger from '../../configs/logger.js';
import Conversation from '../../models/Conversation.js';
import { createRateLimitedHandler } from '../middlewares/socketRateLimit.middleware.js';

const objectIdRegex = /^[a-fA-F0-9]{24}$/;
const directConversationRegex = /^[a-fA-F0-9]{24}_[a-fA-F0-9]{24}$/;
const MAX_MESSAGE_IDS = 100;

const normalizeConversationRoomId = roomIdStr => {
  if (roomIdStr.startsWith('conversation:')) {
    return roomIdStr.slice('conversation:'.length);
  }
  return roomIdStr;
};

const canJoinRoom = async (roomIdStr, userId) => {
  if (!roomIdStr || !userId) return false;

  if (roomIdStr === userId) return true;
  if (roomIdStr.startsWith('post:')) return true;

  if (roomIdStr.startsWith('chat_')) {
    const parts = roomIdStr.split('_');
    return parts.length === 3 && (parts[1] === userId || parts[2] === userId);
  }

  const conversationRoomId = normalizeConversationRoomId(roomIdStr);

  if (directConversationRegex.test(conversationRoomId)) {
    const exists = await Conversation.exists({
      directId: conversationRoomId,
      members: userId,
    });
    return Boolean(exists);
  }

  if (objectIdRegex.test(conversationRoomId)) {
    const exists = await Conversation.exists({
      _id: conversationRoomId,
      members: userId,
    });
    return Boolean(exists);
  }

  return false;
};

export const registerChatHandlers = (io, socket) => {
  const rateLimitedJoinRoom = createRateLimitedHandler('joinRoom', async (roomId) => {
    try {
      if (!roomId) return;
      if (!socket.user?.id) {
        socket.emit('error', { message: 'Authentication required' });
        return;
      }

      const roomIdStr = roomId.toString().slice(0, 100);
      const allowed = await canJoinRoom(roomIdStr, socket.user.id);
      if (!allowed) {
        socket.emit('error', { message: 'Not allowed to join this room' });
        return;
      }

      socket.join(roomIdStr);
      logger.info(`User ${socket.id} joined room: ${roomIdStr}`);

      socket.emit('room_joined', { roomId: roomIdStr, success: true });
    } catch (error) {
      logger.error('Error joining room:', error);
      socket.emit('error', {
        message: 'Failed to join room',
      });
    }
  }, socket);

  socket.on('join_room', rateLimitedJoinRoom);

  socket.on('leave_room', roomId => {
    try {
      if (!roomId) return;
      const roomIdStr = roomId.toString().slice(0, 100);
      socket.leave(roomIdStr);
      logger.info(`User ${socket.id} left room: ${roomIdStr}`);
      socket.emit('room_left', { roomId: roomIdStr, success: true });
    } catch (error) {
      logger.error('Error leaving room:', error);
    }
  });

  const rateLimitedSendMessage = createRateLimitedHandler('sendMessage', (data) => {
    logger.debug('Socket received direct message (legacy/chat-only)');

    if (!socket.user?.id) {
      socket.emit('error', { message: 'Authentication required' });
      return;
    }

    if (!data?.message || !data?.receiverId) {
      socket.emit('error', { message: 'Invalid message data' });
      return;
    }

    const senderIdStr = socket.user.id;
    if (data?.senderId && data.senderId.toString() !== senderIdStr) {
      socket.emit('error', { message: 'Sender mismatch' });
      return;
    }

    const { message, receiverId } = data;
    const receiverIdStr = receiverId.toString().slice(0, 24);
    const normalizedMessage =
      typeof message === 'object' && message !== null
        ? { ...message, senderId: senderIdStr, sender: senderIdStr }
        : message;

    socket.to(receiverIdStr).emit('new_message', normalizedMessage);
    socket.to(senderIdStr).emit('new_message', normalizedMessage);

    const room1 = `chat_${senderIdStr}_${receiverIdStr}`;
    const room2 = `chat_${receiverIdStr}_${senderIdStr}`;
    socket.to(room1).emit('new_message', normalizedMessage);
    socket.to(room2).emit('new_message', normalizedMessage);

    socket.emit('message_sent', {
      success: true,
      senderId: senderIdStr,
      messageId: normalizedMessage?._id,
      timestamp: new Date(),
    });
  }, socket);

  socket.on('send_message', rateLimitedSendMessage);

  const rateLimitedMarkAsRead = createRateLimitedHandler('markAsRead', (data) => {
    if (!socket.user?.id || !data?.messageIds) return;

    const messageIds = Array.isArray(data.messageIds) ? data.messageIds : [data.messageIds];
    if (messageIds.length > MAX_MESSAGE_IDS) {
      socket.emit('error', { message: `Too many message IDs (max ${MAX_MESSAGE_IDS})` });
      return;
    }

    const validMessageIds = messageIds
      .filter(id => typeof id === 'string' && objectIdRegex.test(id))
      .slice(0, MAX_MESSAGE_IDS);

    if (validMessageIds.length === 0) return;

    const senderId = socket.user.id;
    if (data?.senderId && data.senderId.toString() !== senderId) {
      socket.emit('error', { message: 'Sender mismatch' });
      return;
    }

    const payload = { ...data, messageIds: validMessageIds, senderId };

    if (payload.receiverId) {
      const receiverId = payload.receiverId.toString().slice(0, 24);
      const room1 = `chat_${senderId}_${receiverId}`;
      const room2 = `chat_${receiverId}_${senderId}`;
      io.to(room1).emit('message_read', payload);
      io.to(room2).emit('message_read', payload);

      io.to(receiverId).emit('message_read', payload);
    }

    io.to(senderId).emit('message_read', payload);

    socket.emit('read_confirmed', {
      success: true,
      messageIds: validMessageIds,
    });
  }, socket);

  socket.on('mark_as_read', rateLimitedMarkAsRead);

  const rateLimitedTyping = createRateLimitedHandler('typing', (eventName, data) => {
    if (!socket.user?.id || !data?.receiverId) return;

    const senderId = socket.user.id;
    if (data?.senderId && data.senderId.toString() !== senderId) {
      socket.emit('error', { message: 'Sender mismatch' });
      return;
    }

    const receiverId = data.receiverId.toString().slice(0, 24);
    const payload = { ...data, senderId };

    socket.to(receiverId).emit(eventName, payload);
    const room1 = `chat_${senderId}_${receiverId}`;
    const room2 = `chat_${receiverId}_${senderId}`;
    socket.to(room1).emit(eventName, payload);
    socket.to(room2).emit(eventName, payload);
  }, socket);

  socket.on('typing', data => rateLimitedTyping('user_typing', data));
  socket.on('user_typing', data => rateLimitedTyping('user_typing', data));
  socket.on('stop_typing', data => rateLimitedTyping('user_stop_typing', data));
  socket.on('user_stop_typing', data => rateLimitedTyping('user_stop_typing', data));
};
