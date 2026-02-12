import logger from '../../configs/logger.js';
import Conversation from '../../models/Conversation.js';

const objectIdRegex = /^[a-fA-F0-9]{24}$/;
const directConversationRegex = /^[a-fA-F0-9]{24}_[a-fA-F0-9]{24}$/;

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
  // Join Room
  socket.on('join_room', async roomId => {
    try {
      if (!roomId) return;
      if (!socket.user?.id) {
        socket.emit('error', { message: 'Authentication required' });
        return;
      }

      const roomIdStr = roomId.toString();
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
        error: error.message,
      });
    }
  });

  // Leave Room
  socket.on('leave_room', roomId => {
    try {
      if (!roomId) return;
      const roomIdStr = roomId.toString();
      socket.leave(roomIdStr);
      logger.info(`User ${socket.id} left room: ${roomIdStr}`);
      socket.emit('room_left', { roomId: roomIdStr, success: true });
    } catch (error) {
      logger.error('Error leaving room:', error);
    }
  });

  // Send Message (Incoming from Client)
  socket.on('send_message', data => {
    // Note: Usually messages are sent via API (POST /messages) and then emitted via SocketService.
    // However, if client sends via socket directly:
    logger.info('Socket received direct message (legacy/chat-only):', data);

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
    const receiverIdStr = receiverId.toString();
    const normalizedMessage =
      typeof message === 'object' && message !== null
        ? { ...message, senderId: senderIdStr, sender: senderIdStr }
        : message;

    // Emitting to receiver
    socket.to(receiverIdStr).emit('new_message', normalizedMessage);

    // Sync to other sender devices
    socket.to(senderIdStr).emit('new_message', normalizedMessage);

    // Emit to Rooms
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
  });

  // Mark as Read
  socket.on('mark_as_read', data => {
    // Similar to send_message, usually done via API.
    // logic ...
    if (!socket.user?.id || !data?.messageIds) return;

    const senderId = socket.user.id;
    if (data?.senderId && data.senderId.toString() !== senderId) {
      socket.emit('error', { message: 'Sender mismatch' });
      return;
    }

    const payload = { ...data, senderId };

    if (payload.receiverId) {
      const receiverId = payload.receiverId.toString();
      const room1 = `chat_${senderId}_${receiverId}`;
      const room2 = `chat_${receiverId}_${senderId}`;
      io.to(room1).emit('message_read', payload);
      io.to(room2).emit('message_read', payload);

      io.to(receiverId).emit('message_read', payload);
    }

    io.to(senderId).emit('message_read', payload);

    socket.emit('read_confirmed', {
      success: true,
      messageIds: payload.messageIds,
    });
  });

  const emitTypingEvent = (eventName, data) => {
    if (!socket.user?.id || !data?.receiverId) return;

    const senderId = socket.user.id;
    if (data?.senderId && data.senderId.toString() !== senderId) {
      socket.emit('error', { message: 'Sender mismatch' });
      return;
    }

    const receiverId = data.receiverId.toString();
    const payload = { ...data, senderId };

    socket.to(receiverId).emit(eventName, payload);
    const room1 = `chat_${senderId}_${receiverId}`;
    const room2 = `chat_${receiverId}_${senderId}`;
    socket.to(room1).emit(eventName, payload);
    socket.to(room2).emit(eventName, payload);
  };

  // Typing - support both event names for compatibility
  socket.on('typing', data => {
    emitTypingEvent('user_typing', data);
  });

  socket.on('user_typing', data => {
    emitTypingEvent('user_typing', data);
  });

  socket.on('stop_typing', data => {
    emitTypingEvent('user_stop_typing', data);
  });

  socket.on('user_stop_typing', data => {
    emitTypingEvent('user_stop_typing', data);
  });
};
