import { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import io from 'socket.io-client';
import { toast } from 'react-hot-toast';

const SOCKET_URL = 'http://localhost:5000';
const MAX_RECONNECT_ATTEMPTS = 3;

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
      extraHeaders: {
        Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
      },
      path: '/socket.io/',
    });

    socketRef.current = socket;

    // Connection events
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

      // Unread counts and notifications handled by React Query cache invalidation
      queryClient.invalidateQueries(['messages', 'unreadCount']);
      queryClient.invalidateQueries(['notifications', 'unreadCount']);
    });

    socket.on('disconnect', reason => {
      setIsConnected(false);
      if (reason === 'io server disconnect') {
        setTimeout(() => socket.connect(), 1000);
      }
    });

    socket.on('connect_error', err => {
      setIsConnected(false);
      reconnectAttempts.current++;
      if (reconnectAttempts.current >= MAX_RECONNECT_ATTEMPTS) {
        toast.error('Không thể kết nối tới server chat');
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

  const joinRoom = useCallback(roomId => {
    if (!roomId) return;
    // Skip if already in room
    if (activeRooms.current.has(roomId)) return;

    if (socketRef.current?.connected) {
      socketRef.current.emit('join_room', roomId);
    }
    activeRooms.current.add(roomId);
  }, []);

  const leaveRoom = useCallback(roomId => {
    if (!roomId) return;
    // Skip if not in room
    if (!activeRooms.current.has(roomId)) return;

    activeRooms.current.delete(roomId);
    if (socketRef.current?.connected) {
      socketRef.current.emit('leave_room', roomId);
    }
  }, []);

  const sendMessage = useCallback(data => {
    if (!socketRef.current?.connected) return false;
    socketRef.current.emit('send_message', data);
    return true;
  }, []);

  const emitEvent = useCallback((event, data) => {
    if (!socketRef.current?.connected) return false;
    socketRef.current.emit(event, data);
    return true;
  }, []);

  const joinPostRoom = useCallback(
    postId => {
      if (!postId) return;
      joinRoom(`post:${postId}`);
      emitEvent('post:like:listen', postId);
    },
    [joinRoom, emitEvent]
  );

  const emitLikeAction = useCallback(
    (postId, action) => {
      emitEvent('post:like', { postId, userId, action });
    },
    [emitEvent, userId]
  );

  const isUserOnline = useCallback(
    uid => {
      if (!uid) return false;
      return !!onlineUsers[uid.toString()];
    },
    [onlineUsers]
  );

  // Memoize return value to prevent context unnecessary re-renders
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

/* --- Event Handlers Helpers --- */

const registerMessageHandlers = (socket, userId, queryClient) => {
  socket.on('new_message', message => {
    if (!message?._id) return;

    const senderId = message.sender?._id || message.sender;
    const isMine =
      senderId && userId && senderId.toString() === userId.toString();

    // Support React Query invalidation
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
        message.sender?.firstName || message.sender?.name || 'Người dùng';
      toast.success(`Tin nhắn mới từ ${senderName}`);
    }
  });

  socket.on('message_read', data => {
    if (data?.messageId) {
      queryClient.invalidateQueries(['messages']);
    }
  });

  socket.on('user_typing', () => {}); // No-op instead of log
  socket.on('user_stop_typing', () => {}); // No-op
};

const registerNotificationHandlers = (socket, queryClient) => {
  const handleNotification = notification => {
    if (!notification?._id) {
      queryClient.invalidateQueries(['notifications', 'unreadCount']);
      return;
    }

    // Invalidate queries to refresh lists and counts
    queryClient.invalidateQueries(['notifications']);

    // Also invalidate unread count specifically if not covered by 'notifications' key structure
    queryClient.invalidateQueries(['notifications', 'unreadCount']);

    let msg = notification.content || 'Bạn có thông báo mới';
    if (notification.type === 'like' && notification.post?.caption) {
      msg += ` - "${notification.post.caption.substring(0, 20)}..."`;
    }
    toast.success(msg, { icon: '🔔' });
  };

  socket.on('notification:new', handleNotification);
  socket.on('new_notification', handleNotification);
};

const registerLikeHandlers = (socket, currentUserId, queryClient) => {
  socket.on('post:like:update', ({ postId, userId }) => {
    if (userId === currentUserId) return;

    // Invalidate relevant queries to fetch fresh data
    queryClient.invalidateQueries(['feed']);
    queryClient.invalidateQueries(['posts']);
    queryClient.invalidateQueries(['post', postId]);
    queryClient.invalidateQueries(['likeStatus', postId]);
  });
};

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

const registerCommentHandlers = (socket, currentUserId, queryClient) => {
  socket.on('new_comment', data => {
    // data: { postId, comment, userId }
    const { postId, userId } = data;
    if (userId === currentUserId) return; // Already handled by mutation optimistic update or invalidation

    queryClient.invalidateQueries(['post', postId]);
    queryClient.invalidateQueries(['comments', postId]);
    queryClient.invalidateQueries(['posts']);
    queryClient.invalidateQueries(['feed']);
  });

  socket.on('delete_comment', data => {
    // data: { postId, commentId, isReply }
    const { postId, userId } = data;
    if (userId === currentUserId) return;

    queryClient.invalidateQueries(['post', postId]);
    queryClient.invalidateQueries(['comments', postId]);
    queryClient.invalidateQueries(['posts']);
    queryClient.invalidateQueries(['feed']);
  });
};

export default useSocket;
