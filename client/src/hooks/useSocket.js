import { useEffect, useRef, useState } from "react";
import { useDispatch } from "react-redux";
import io from "socket.io-client";
import { toast } from "react-hot-toast";
import { addMessage, markMessageAsRead } from "../slices/MessageSlice";

const useSocket = (userId) => {
  const socketRef = useRef(null);
  const dispatch = useDispatch();
  const reconnectAttempts = useRef(0);
  const maxReconnectAttempts = 3;
  const [isConnected, setIsConnected] = useState(false);
  const activeRooms = useRef(new Set());

  useEffect(() => {
    if (!userId) {
      console.warn("No userId provided for socket connection");
      return;
    }

    const connectSocket = () => {
      try {
        console.log("Initializing socket connection for user:", userId);

        socketRef.current = io("http://localhost:9785", {
          withCredentials: true,
          reconnection: true,
          reconnectionDelay: 1000,
          reconnectionDelayMax: 5000,
          reconnectionAttempts: maxReconnectAttempts,
          extraHeaders: {
            Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
          },
        });

        socketRef.current.on("connect", () => {
          console.log(
            "Socket connected successfully with ID:",
            socketRef.current.id
          );
          reconnectAttempts.current = 0;
          setIsConnected(true);

          // Tự động tham gia vào phòng cá nhân
          socketRef.current.emit("join_room", userId);
          activeRooms.current.add(userId);

          // Tham gia lại các phòng đã tham gia trước đó
          if (activeRooms.current.size > 1) {
            console.log(
              "Rejoining previous rooms:",
              Array.from(activeRooms.current)
            );
            activeRooms.current.forEach((roomId) => {
              if (roomId !== userId) {
                socketRef.current.emit("join_room", roomId);
              }
            });
          }
        });

        socketRef.current.on("disconnect", (reason) => {
          console.log("Socket disconnected:", reason);
          setIsConnected(false);

          if (reason === "io server disconnect") {
            // Máy chủ đã ngắt kết nối có chủ ý, cần kết nối lại thủ công
            setTimeout(() => {
              socketRef.current.connect();
            }, 1000);
          }
        });

        socketRef.current.on("connect_error", (error) => {
          console.error("Socket connection error:", error);
          setIsConnected(false);
          reconnectAttempts.current++;

          if (reconnectAttempts.current >= maxReconnectAttempts) {
            toast.error("Không thể kết nối tới server chat");
          }
        });

        socketRef.current.on("new_message", (message) => {
          console.log("New message received via socket:", message);
          if (message && message._id) {
            dispatch(addMessage(message));

            if (message.sender !== userId) {
              // Lấy tên người gửi nếu có
              const senderName =
                message.sender?.firstName ||
                message.sender?.name ||
                "Người dùng";
              toast.success(`Tin nhắn mới từ ${senderName}`);
            }
          }
        });

        socketRef.current.on("message_read", (data) => {
          console.log("Message read event received:", data);
          if (data && data.messageId) {
            dispatch(markMessageAsRead(data.messageId));
          }
        });

        socketRef.current.on("user_typing", (data) => {
          console.log("User typing event received:", data);
        });

        socketRef.current.on("user_stop_typing", (data) => {
          console.log("User stop typing event received:", data);
        });

        socketRef.current.on("error", (error) => {
          console.error("Socket error:", error);
          toast.error("Lỗi kết nối chat");
        });
      } catch (error) {
        console.error("Error initializing socket:", error);
        setIsConnected(false);
      }
    };

    connectSocket();

    return () => {
      if (socketRef.current) {
        console.log("Cleaning up socket connection");
        // Rời khỏi tất cả các phòng đã tham gia
        activeRooms.current.forEach((roomId) => {
          if (socketRef.current.connected) {
            socketRef.current.emit("leave_room", roomId);
          }
        });
        activeRooms.current.clear();

        socketRef.current.disconnect();
        socketRef.current = null;
        setIsConnected(false);
      }
    };
  }, [userId, dispatch]);

  const joinRoom = (roomId) => {
    if (!roomId) return;

    if (!socketRef.current?.connected) {
      console.warn("Socket not connected, cannot join room:", roomId);
      // Lưu trữ phòng để tham gia sau khi kết nối lại
      activeRooms.current.add(roomId);
      return;
    }

    console.log("Joining room:", roomId);
    socketRef.current.emit("join_room", roomId);
    activeRooms.current.add(roomId);
  };

  const leaveRoom = (roomId) => {
    if (!roomId) return;

    activeRooms.current.delete(roomId);

    if (!socketRef.current?.connected) {
      console.warn("Socket not connected, room will be left when reconnected");
      return;
    }

    console.log("Leaving room:", roomId);
    socketRef.current.emit("leave_room", roomId);
  };

  const sendMessage = (messageData) => {
    if (!socketRef.current?.connected) {
      console.warn("Socket not connected, cannot send message via socket");
      return false;
    }

    if (!messageData) {
      console.warn("No message data provided");
      return false;
    }

    console.log("Sending message via socket:", messageData);
    socketRef.current.emit("send_message", messageData);
    return true;
  };

  const emitEvent = (eventName, data) => {
    if (!socketRef.current?.connected) {
      console.warn(`Socket not connected, cannot emit event: ${eventName}`);
      return false;
    }

    console.log(`Emitting ${eventName} event:`, data);
    socketRef.current.emit(eventName, data);
    return true;
  };

  return {
    socket: socketRef.current,
    joinRoom,
    leaveRoom,
    sendMessage,
    emitEvent,
    isConnected,
  };
};

export default useSocket;
