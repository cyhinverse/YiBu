import { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import io from 'socket.io-client';
import { toast } from 'react-hot-toast';
import { SOCKET_URL, MAX_RECONNECT_ATTEMPTS } from '@/constants/socket';

/**
 * Hook to manage Socket.IO connection
 * @param {string} userId - Current user ID
 * @returns {Object} Socket instance and utility functions
 * @returns {Object|null} returns.socket - Socket.IO instance
 * @returns {Function} returns.joinRoom - Join room function
 * @returns {Function} returns.leaveRoom - Leave room function
 * @returns {Function} returns.sendMessage - Send message function
 * @returns {Function} returns.emitEvent - Emit custom event function
 * @returns {Function} returns.joinPostRoom - Join post room function
 * @returns {Function} returns.emitLikeAction - Emit like action function
 * @returns {boolean} returns.isConnected - Connection status
 * @returns {Object} returns.onlineUsers - Online users map
 * @returns {Function} returns.isUserOnline - Check user online function
 */
const useSocket = userId => {
  const socketRef = useRef(null);
  const queryClient = useQueryClient();
  const reconnectAttempts = useRef(0);
  const [isConnected, setIsConnected] = useState(false);
  const activeRooms = useRef(new Set());
  const [onlineUsers, setOnlineUsers] = useState({});

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

    socket.on('connect', () => {
      reconnectAttempts.current = 0;
      setIsConnected(true);

      socket.emit('register_user', { userId });
      socket.emit('join_room', userId);
      activeRooms.current.add(userId);
      activeRooms.current.forEach(room => {
        if (room !== userId) socket.emit('join_room', room);
      });

      socket.emit('get_online_users');
      queryClient.invalidateQueries(['messages', 'unreadCount']);
      queryClient.invalidateQueries(['notifications', 'unreadCount']);
    });

    socket.on('disconnect', reason => {
      setIsConnected(false);
      if (reason === 'io server disconnect') {
        setTimeout(() => socket.connect(), 1000);
      }
    });

    socket.on('connect_error', () => {
      setIsConnected(false);
      reconnectAttempts.current++;
      if (reconnectAttempts.current >= MAX_RECONNECT_ATTEMPTS) {
        toast.error('Unable to connect to chat server');
      }
    });

    registerMessageHandlers(socket, userId, queryClient);
    registerNotificationHandlers(socket, queryClient);
    registerLikeHandlers(socket, userId, queryClient);
    registerCommentHandlers(socket, userId, queryClient);
    registerUserStatusHandlers(socket, setOnlineUsers);

    return () => {
      if (socket) {
        socket.disconnect();
        socketRef.current = null;
        setIsConnected(false);
        activeRooms.current.clear();
      }
    };
  }, [userId, queryClient]);

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

/**
 * Register message handlers
 * @param {Object} socket - Socket instance
 * @param {string} userId - Current user ID
 * @param {Object} queryClient - React Query client
 */
const registerMessageHandlers = (socket, userId, queryClient) => {
  socket.on('new_message', message => {
    if (!message?._id) return;

    const senderId = message.sender?._id || message.sender;
    const isMine =
      senderId && userId && senderId.toString() === userId.toString();

    queryClient.invalidateQueries(['messages', 'list', message.conversationId]);
    queryClient.invalidateQueries([
      'messages',
      'infinite',
      message.conversationId,
    ]);
    queryClient.invalidateQueries(['messages', 'conversations']);
    queryClient.invalidateQueries(['messages', 'unreadCount']);

    if (!isMine) {
      const senderName =
        message.sender?.firstName || message.sender?.name || 'User';
      toast.success(`New message from ${senderName}`);
    }
  });

  socket.on('message_read', data => {
    if (data?.messageId) {
      queryClient.invalidateQueries(['messages']);
    }
  });

  socket.on('user_typing', () => {});
  socket.on('user_stop_typing', () => {});
};

/**
 * Register notification handlers
 * @param {Object} socket - Socket instance
 * @param {Object} queryClient - React Query client
 */
const registerNotificationHandlers = (socket, queryClient) => {
  const handleNotification = notification => {
    if (!notification?._id) {
      queryClient.invalidateQueries(['notifications', 'unreadCount']);
      return;
    }

    queryClient.invalidateQueries(['notifications']);
    queryClient.invalidateQueries(['notifications', 'unreadCount']);

    let msg = notification.content || 'You have a new notification';
    if (notification.type === 'like' && notification.post?.caption) {
      msg += ` - "${notification.post.caption.substring(0, 20)}..."`;
    }
    toast.success(msg, { icon: '🔔' });
  };

  socket.on('notification:new', handleNotification);
  socket.on('new_notification', handleNotification);
};

/**
 * Register like handlers
 * @param {Object} socket - Socket instance
 * @param {string} currentUserId - Current user ID
 * @param {Object} queryClient - React Query client
 */
const registerLikeHandlers = (socket, currentUserId, queryClient) => {
  socket.on('post:like:update', ({ postId, userId }) => {
    if (userId === currentUserId) return;

    queryClient.invalidateQueries(['feed']);
    queryClient.invalidateQueries(['posts']);
    queryClient.invalidateQueries(['post', postId]);
    queryClient.invalidateQueries(['likeStatus', postId]);
  });
};

/**
 * Register user status handlers
 * @param {Object} socket - Socket instance
 * @param {Function} setOnlineUsers - Online users state setter
 */
const registerUserStatusHandlers = (socket, setOnlineUsers) => {
  socket.on('get_users_online', users => {
    const map = {};
    if (Array.isArray(users)) users.forEach(id => (map[id] = true));
    else Object.assign(map, users || {});
    setOnlineUsers(map);
  });

  socket.on('user_status_change', ({ userId, status }) => {
    setOnlineUsers(prev => ({ ...prev, [userId]: status === 'online' }));
  });
};

/**
 * Register comment handlers
 * @param {Object} socket - Socket instance
 * @param {string} currentUserId - Current user ID
 * @param {Object} queryClient - React Query client
 */
const registerCommentHandlers = (socket, currentUserId, queryClient) => {
  socket.on('new_comment', data => {
    const { postId, userId } = data;
    if (userId === currentUserId) return;

    queryClient.invalidateQueries(['post', postId]);
    queryClient.invalidateQueries(['comments', postId]);
    queryClient.invalidateQueries(['posts']);
    queryClient.invalidateQueries(['feed']);
  });

  socket.on('delete_comment', data => {
    const { postId, userId } = data;
    if (userId === currentUserId) return;

    queryClient.invalidateQueries(['post', postId]);
    queryClient.invalidateQueries(['comments', postId]);
    queryClient.invalidateQueries(['posts']);
    queryClient.invalidateQueries(['feed']);
  });
};

export default useSocket;
