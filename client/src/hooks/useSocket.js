import { useEffect, useRef, useState, useCallback } from "react";
import { useDispatch } from "react-redux";
import io from "socket.io-client";
import { toast } from "react-hot-toast";
import { receiveMessage } from "../redux/slices/MessageSlice";
import { markMessageAsRead } from "../redux/actions/messageActions";
import { addNotification } from "../redux/slices/NotificationSlice";
import { setLikeStatusOptimistic } from "../redux/slices/LikeSlice";

const SOCKET_URL = "http://localhost:9785";
const MAX_RECONNECT_ATTEMPTS = 3;

const useSocket = (userId) => {
  const socketRef = useRef(null);
  const dispatch = useDispatch();
  const reconnectAttempts = useRef(0);
  const [isConnected, setIsConnected] = useState(false);
  const activeRooms = useRef(new Set());
  const [onlineUsers, setOnlineUsers] = useState({});

  useEffect(() => {
    if (!userId) return;

    console.log("Initializing socket connection for user:", userId);

    const socket = io(SOCKET_URL, {
      withCredentials: true,
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: MAX_RECONNECT_ATTEMPTS,
      extraHeaders: {
        Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
      },
    });

    socketRef.current = socket;

    // Connection events
    socket.on("connect", () => {
      console.log("Socket connected:", socket.id);
      reconnectAttempts.current = 0;
      setIsConnected(true);

      // Join self room and rejoin active rooms
      socket.emit("join_room", userId);
      activeRooms.current.add(userId);
      activeRooms.current.forEach((room) => {
        if (room !== userId) socket.emit("join_room", room);
      });
    });

    socket.on("disconnect", (reason) => {
      console.log("Socket disconnected:", reason);
      setIsConnected(false);
      if (reason === "io server disconnect") {
        setTimeout(() => socket.connect(), 1000);
      }
    });

    socket.on("connect_error", (err) => {
      console.error("Socket error:", err);
      setIsConnected(false);
      reconnectAttempts.current++;
      if (reconnectAttempts.current >= MAX_RECONNECT_ATTEMPTS) {
        toast.error("Không thể kết nối tới server chat");
      }
    });

    // Register Business Logic Handlers
    registerMessageHandlers(socket, dispatch, userId);
    registerNotificationHandlers(socket, dispatch);
    registerLikeHandlers(socket, dispatch, userId);
    registerUserStatusHandlers(socket, setOnlineUsers);

    return () => {
      if (socket) {
        activeRooms.current.forEach((room) => {
          if (socket.connected) socket.emit("leave_room", room);
        });
        activeRooms.current.clear();
        socket.disconnect();
        socketRef.current = null;
        setIsConnected(false);
      }
    };
  }, [userId, dispatch]);

  const joinRoom = useCallback((roomId) => {
    if (!roomId) return;
    if (socketRef.current?.connected) {
      console.log("Joining room:", roomId);
      socketRef.current.emit("join_room", roomId);
    }
    activeRooms.current.add(roomId);
  }, []);

  const leaveRoom = useCallback((roomId) => {
    if (!roomId) return;
    activeRooms.current.delete(roomId);
    if (socketRef.current?.connected) {
      console.log("Leaving room:", roomId);
      socketRef.current.emit("leave_room", roomId);
    }
  }, []);

  const sendMessage = useCallback((data) => {
    if (!socketRef.current?.connected) return false;
    socketRef.current.emit("send_message", data);
    return true;
  }, []);

  const emitEvent = useCallback((event, data) => {
    if (!socketRef.current?.connected) return false;
    socketRef.current.emit(event, data);
    return true;
  }, []);

  const joinPostRoom = useCallback(
    (postId) => {
      if (!postId) return;
      joinRoom(`post:${postId}`);
      emitEvent("post:like:listen", postId);
    },
    [joinRoom, emitEvent]
  );

  const emitLikeAction = useCallback(
    (postId, action) => {
      emitEvent("post:like", { postId, userId, action });
    },
    [emitEvent, userId]
  );

  const isUserOnline = useCallback((uid) => !!onlineUsers[uid], [onlineUsers]);

  return {
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
  };
};

/* --- Event Handlers Helpers --- */

const registerMessageHandlers = (socket, dispatch, userId) => {
  socket.on("new_message", (message) => {
    if (!message?._id) return;
    console.log("New message:", message);
    dispatch(receiveMessage(message));
    if (message.sender !== userId) {
      const senderName =
        message.sender?.firstName || message.sender?.name || "Người dùng";
      toast.success(`Tin nhắn mới từ ${senderName}`);
    }
  });

  socket.on("message_read", (data) => {
    if (data?.messageId) {
      dispatch(markMessageAsRead({ messageId: data.messageId }));
    }
  });

  socket.on("user_typing", (data) => console.log("User typing:", data));
  socket.on("user_stop_typing", (data) =>
    console.log("User stop typing:", data)
  );
};

const registerNotificationHandlers = (socket, dispatch) => {
  socket.on("notification:new", (notification) => {
    if (!notification?._id) return;

    const hasFullData =
      notification.sender?._id &&
      (notification.type !== "like" || notification.post?._id);
    if (hasFullData) {
      dispatch(addNotification(notification));
    } else {
      document.dispatchEvent(new CustomEvent("refresh:notifications"));
    }

    let msg = notification.content || "Bạn có thông báo mới";
    if (notification.type === "like" && notification.post?.caption) {
      msg += ` - "${notification.post.caption.substring(0, 20)}..."`;
    }
    toast.success(msg, { icon: "🔔" });
  });
};

const registerLikeHandlers = (socket, dispatch, currentUserId) => {
  socket.on("post:like:update", ({ postId, count, userId }) => {
    if (userId === currentUserId) return;
    dispatch(
      setLikeStatusOptimistic({ postId, likesCount: count, isLiked: undefined })
    );
  });
};

const registerUserStatusHandlers = (socket, setOnlineUsers) => {
  socket.on("get_users_online", (users) => {
    console.log("Online users:", users);
    const map = {};
    if (Array.isArray(users)) users.forEach((id) => (map[id] = true));
    else Object.assign(map, users || {});
    setOnlineUsers(map);
  });

  socket.on("user_status_change", ({ userId, status }) => {
    setOnlineUsers((prev) => ({ ...prev, [userId]: status === "online" }));
  });

  // Initial Request
  socket.emit("get_online_users");
};

export default useSocket;
