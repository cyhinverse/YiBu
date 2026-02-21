import { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import io from 'socket.io-client';
import { notify } from '@/utils/notify';
import { SOCKET_URL, MAX_RECONNECT_ATTEMPTS } from '@/constants/socket';
import { invalidateQueryKeys } from './queryClientUtils';

const useSocket = userId => {
  const socketRef = useRef(null);
  const queryClient = useQueryClient();
  const reconnectAttempts = useRef(0);
  const [isConnected, setIsConnected] = useState(false);
  const activeRooms = useRef(new Set());
  const [onlineUsers, setOnlineUsers] = useState({});
  const handlersRef = useRef([]);
  const isCleaningUp = useRef(false);
  const mountedRef = useRef(true);

  const cleanupHandlers = useCallback(socket => {
    if (!socket || isCleaningUp.current) return;
    isCleaningUp.current = true;
    try {
      handlersRef.current.forEach(({ event, handler }) => {
        socket.off(event, handler);
      });
      handlersRef.current = [];
    } finally {
      isCleaningUp.current = false;
    }
  }, []);

  const registerHandler = useCallback((socket, event, handler) => {
    if (!socket || isCleaningUp.current) return;
    socket.on(event, handler);
    handlersRef.current.push({ event, handler });
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    if (!userId) return;

    const socket = io(SOCKET_URL, {
      withCredentials: true,
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: MAX_RECONNECT_ATTEMPTS,
      path: '/socket.io/',
    });

    socketRef.current = socket;
    const rooms = activeRooms.current;

    const handleConnect = () => {
      if (!mountedRef.current) return;
      reconnectAttempts.current = 0;
      setIsConnected(true);

      socket.emit('register_user', { userId });
      socket.emit('join_room', userId);
      rooms.add(userId);
      rooms.forEach(room => {
        if (room !== userId) socket.emit('join_room', room);
      });

      socket.emit('get_online_users');
      invalidateQueryKeys(queryClient, [
        ['messages', 'unreadCount'],
        ['notifications', 'unreadCount'],
      ]);
    };

    const handleDisconnect = reason => {
      if (!mountedRef.current) return;
      setIsConnected(false);
      if (reason === 'io server disconnect') {
        setTimeout(() => {
          if (socketRef.current === socket && !socket.connected && mountedRef.current) {
            socket.connect();
          }
        }, 1000);
      }
    };

    const handleConnectError = () => {
      if (!mountedRef.current) return;
      setIsConnected(false);
      reconnectAttempts.current++;
      if (reconnectAttempts.current >= MAX_RECONNECT_ATTEMPTS) {
        notify.error('Unable to connect to chat server');
      }
    };

    registerHandler(socket, 'connect', handleConnect);
    registerHandler(socket, 'disconnect', handleDisconnect);
    registerHandler(socket, 'connect_error', handleConnectError);

    const messageHandlers = createMessageHandlers(userId, queryClient, mountedRef);
    const notificationHandlers = createNotificationHandlers(queryClient, mountedRef);
    const likeHandlers = createLikeHandlers(userId, queryClient, mountedRef);
    const commentHandlers = createCommentHandlers(userId, queryClient, mountedRef);
    const userStatusHandlers = createUserStatusHandlers(setOnlineUsers, mountedRef);

    Object.entries(messageHandlers).forEach(([event, handler]) => {
      registerHandler(socket, event, handler);
    });
    Object.entries(notificationHandlers).forEach(([event, handler]) => {
      registerHandler(socket, event, handler);
    });
    Object.entries(likeHandlers).forEach(([event, handler]) => {
      registerHandler(socket, event, handler);
    });
    Object.entries(commentHandlers).forEach(([event, handler]) => {
      registerHandler(socket, event, handler);
    });
    Object.entries(userStatusHandlers).forEach(([event, handler]) => {
      registerHandler(socket, event, handler);
    });

    return () => {
      cleanupHandlers(socket);
      if (socket) {
        socket.disconnect();
        socketRef.current = null;
      }
      setIsConnected(false);
      rooms.clear();
      handlersRef.current = [];
    };
  }, [userId, queryClient, registerHandler, cleanupHandlers]);

  /**
   * Join a room
   * @param {string} roomId - Room ID
   */
  const joinRoom = useCallback(roomId => {
    if (!roomId) return;
    if (activeRooms.current.has(roomId)) return;

    if (socketRef.current?.connected) {
      socketRef.current.emit('join_room', roomId);
    }
    activeRooms.current.add(roomId);
  }, []);

  /**
   * Leave a room
   * @param {string} roomId - Room ID
   */
  const leaveRoom = useCallback(roomId => {
    if (!roomId) return;
    if (!activeRooms.current.has(roomId)) return;

    activeRooms.current.delete(roomId);
    if (socketRef.current?.connected) {
      socketRef.current.emit('leave_room', roomId);
    }
  }, []);

  /**
   * Send message via socket
   * @param {Object} data - Message data
   * @returns {boolean} Send result
   */
  const sendMessage = useCallback(data => {
    if (!socketRef.current?.connected) return false;
    socketRef.current.emit('send_message', data);
    return true;
  }, []);

  /**
   * Emit custom event
   * @param {string} event - Event name
   * @param {*} data - Event data
   * @returns {boolean} Emit result
   */
  const emitEvent = useCallback((event, data) => {
    if (!socketRef.current?.connected) return false;
    socketRef.current.emit(event, data);
    return true;
  }, []);

  /**
   * Join post room to receive updates
   * @param {string} postId - Post ID
   */
  const joinPostRoom = useCallback(
    postId => {
      if (!postId) return;
      joinRoom(`post:${postId}`);
      emitEvent('post:like:listen', postId);
    },
    [joinRoom, emitEvent]
  );

  /**
   * Emit like action for post
   * @param {string} postId - Post ID
   * @param {string} action - Action ('like' | 'unlike')
   */
  const emitLikeAction = useCallback(
    (postId, action) => {
      emitEvent('post:like', { postId, userId, action });
    },
    [emitEvent, userId]
  );

  /**
   * Check if user is online
   * @param {string} uid - User ID to check
   * @returns {boolean} Online status
   */
  const isUserOnline = useCallback(
    uid => {
      if (!uid) return false;
      return !!onlineUsers[uid.toString()];
    },
    [onlineUsers]
  );

  return useMemo(
    () => ({
      socket: socketRef.current,
      joinRoom,
      leaveRoom,
      sendMessage,
      emitEvent,
      joinPostRoom,
      emitLikeAction,
      isConnected,
      onlineUsers,
      isUserOnline,
    }),
    [
      joinRoom,
      leaveRoom,
      sendMessage,
      emitEvent,
      joinPostRoom,
      emitLikeAction,
      isConnected,
      onlineUsers,
      isUserOnline,
    ]
  );
};

const createMessageHandlers = (userId, queryClient, mountedRef) => ({
  new_message: message => {
    if (!mountedRef?.current || !message?._id) return;

    const senderId = message.sender?._id || message.sender;
    const isMine =
      senderId && userId && senderId.toString() === userId.toString();

    invalidateQueryKeys(queryClient, [
      ['messages', 'list', message.conversationId],
      ['messages', 'infinite', message.conversationId],
      ['messages', 'conversations'],
      ['messages', 'unreadCount'],
    ]);

    if (!isMine) {
      const senderName =
        message.sender?.firstName || message.sender?.name || 'User';
      notify.success(`New message from ${senderName}`);
    }
  },
  message_read: data => {
    if (!mountedRef?.current) return;
    if (data?.messageId) {
      invalidateQueryKeys(queryClient, [['messages']]);
    }
  },
  user_typing: () => {},
  user_stop_typing: () => {},
});

const createNotificationHandlers = (queryClient, mountedRef) => {
  const handleNotification = notification => {
    if (!mountedRef?.current) return;
    if (!notification?._id) {
      invalidateQueryKeys(queryClient, [['notifications', 'unreadCount']]);
      return;
    }

    invalidateQueryKeys(queryClient, [
      ['notifications'],
      ['notifications', 'unreadCount'],
    ]);

    let msg = notification.content || 'You have a new notification';
    if (notification.type === 'like' && notification.post?.caption) {
      msg += ` - "${notification.post.caption.substring(0, 20)}..."`;
    }
    notify.success(msg, { icon: '🔔' });
  };

  return {
    'notification:new': handleNotification,
    new_notification: handleNotification,
  };
};

const createLikeHandlers = (currentUserId, queryClient, mountedRef) => ({
  'post:like:update': ({ postId, userId }) => {
    if (!mountedRef?.current || userId === currentUserId) return;

    invalidateQueryKeys(queryClient, [
      ['feed'],
      ['posts'],
      ['post', postId],
      ['likeStatus', postId],
    ]);
  },
});

const createCommentHandlers = (currentUserId, queryClient, mountedRef) => ({
  new_comment: data => {
    if (!mountedRef?.current) return;
    const { postId, userId } = data;
    if (userId === currentUserId) return;

    invalidateQueryKeys(queryClient, [
      ['post', postId],
      ['comments', postId],
      ['posts'],
      ['feed'],
    ]);
  },
  delete_comment: data => {
    if (!mountedRef?.current) return;
    const { postId, userId } = data;
    if (userId === currentUserId) return;

    invalidateQueryKeys(queryClient, [
      ['post', postId],
      ['comments', postId],
      ['posts'],
      ['feed'],
    ]);
  },
});

const createUserStatusHandlers = (setOnlineUsers, mountedRef) => ({
  get_users_online: users => {
    if (!mountedRef?.current) return;
    const map = {};
    if (Array.isArray(users)) users.forEach(id => (map[id] = true));
    else Object.assign(map, users || {});
    setOnlineUsers(map);
  },
  user_status_change: ({ userId, status }) => {
    if (!mountedRef?.current) return;
    setOnlineUsers(prev => ({ ...prev, [userId]: status === 'online' }));
  },
});

export default useSocket;

