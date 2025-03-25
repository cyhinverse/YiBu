import io from "socket.io-client";
import { addNotification } from "./slices/NotificationSlice";
import { store } from "./utils/configureStore";

// Tạo socket connection
let socket;
let connectedSockets = new Set();
let reconnectAttempts = 0;
const MAX_RECONNECT_ATTEMPTS = 10;
const RECONNECT_DELAY = 3000; // 3 giây

try {
  console.log("Initializing socket connection from socket.js");

  const serverUrl =
    import.meta.env.VITE_API_BASE_URL || "http://localhost:9785";
  console.log("Socket connecting to server:", serverUrl);

  socket = io(serverUrl, {
    withCredentials: true,
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
    reconnectionAttempts: MAX_RECONNECT_ATTEMPTS,
    autoConnect: true,
    path: "/socket.io/",
    extraHeaders: {
      Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
    },
  });

  socket.on("connect", () => {
    console.log(
      "Socket connected successfully from socket.js with ID:",
      socket.id
    );
    connectedSockets.add(socket.id);
    reconnectAttempts = 0; // Reset reconnect attempts on successful connection
  });

  socket.on("disconnect", (reason) => {
    console.log("Socket disconnected:", reason);
    connectedSockets.delete(socket.id);

    if (reason === "io server disconnect") {
      // Máy chủ đã ngắt kết nối có chủ ý, cần kết nối lại thủ công
      setTimeout(() => {
        if (reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
          reconnectAttempts++;
          console.log(
            `Reconnect attempt ${reconnectAttempts}/${MAX_RECONNECT_ATTEMPTS}`
          );
          socket.connect();
        } else {
          console.log(
            "Max reconnect attempts reached. Please refresh the page."
          );
        }
      }, RECONNECT_DELAY);
    }
  });

  socket.on("connect_error", (error) => {
    console.error("Socket connection error:", error.message);
    // Thử kết nối lại sau một khoảng thời gian nếu thất bại
    setTimeout(() => {
      if (!socket.connected && reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
        reconnectAttempts++;
        console.log(
          `Reconnect attempt ${reconnectAttempts}/${MAX_RECONNECT_ATTEMPTS}`
        );
        socket.connect();
      } else if (reconnectAttempts >= MAX_RECONNECT_ATTEMPTS) {
        console.log("Max reconnect attempts reached. Please refresh the page.");
      }
    }, RECONNECT_DELAY);
  });

  // Xử lý lỗi để tránh crash ứng dụng
  socket.on("error", (error) => {
    console.error("Socket error:", error);
  });

  // Sự kiện tin nhắn mới
  socket.on("new_message", (message) => {
    console.log("New message received via socket:", message);
    // Xử lý tin nhắn mới sẽ được thực hiện trong các components
  });

  // Sự kiện đánh dấu tin nhắn đã đọc
  socket.on("message_read", (data) => {
    console.log("Messages marked as read:", data);
    // Xử lý đánh dấu đã đọc sẽ được thực hiện trong các components
  });

  // Sự kiện người dùng đang nhập
  socket.on("user_typing", (data) => {
    console.log("User typing:", data);
    // Xử lý người dùng đang nhập sẽ được thực hiện trong các components
  });

  // Sự kiện người dùng dừng nhập
  socket.on("user_stop_typing", (data) => {
    console.log("User stopped typing:", data);
    // Xử lý người dùng dừng nhập sẽ được thực hiện trong các components
  });

  // Sự kiện trạng thái online của người dùng
  socket.on("user_status_update", (data) => {
    console.log("User status update:", data);
    if (data && data.userId && data.status) {
      // Phát sự kiện để các component có thể lắng nghe
      const onlineStatusEvent = new CustomEvent("user_online_status", {
        detail: { userId: data.userId, status: data.status },
      });
      window.dispatchEvent(onlineStatusEvent);
    }
  });

  // Thêm sự kiện lắng nghe xóa tin nhắn
  socket.on("message_deleted", (data) => {
    console.log("Message deleted received via socket:", data);
    // Xử lý tin nhắn bị xóa sẽ được thực hiện trong các components
  });

  socket.on("notification:new", (notification) => {
    console.log("New notification received via socket:", notification);
    store.dispatch(addNotification(notification));
  });

  setInterval(() => {
    if (
      socket &&
      !socket.connected &&
      reconnectAttempts < MAX_RECONNECT_ATTEMPTS
    ) {
      reconnectAttempts++;
      console.log(
        `Reconnect attempt ${reconnectAttempts}/${MAX_RECONNECT_ATTEMPTS} from interval`
      );
      socket.connect();
    } else if (reconnectAttempts >= MAX_RECONNECT_ATTEMPTS) {
      console.log("Max reconnect attempts reached. Please refresh the page.");
    }
  }, 10000);
} catch (error) {
  console.error("Failed to initialize socket:", error.message);

  socket = {
    on: (event, callback) => {},
    off: (event, callback) => {},
    emit: (event, data) => {
      console.warn(`Socket not connected, cannot emit ${event}`);
      return false;
    },
    connected: false,
    id: null,
  };
}

const isSocketConnected = () => socket && socket.connected;

const emitSocketEvent = (event, data) => {
  if (!isSocketConnected()) {
    return false;
  }

  console.log(`Emitting socket event: ${event}`, data);
  socket.emit(event, data);
  return true;
};

export { socket, isSocketConnected, emitSocketEvent };
