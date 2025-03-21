import io from "socket.io-client";

// Tạo socket connection
let socket;
let connectedSockets = new Set();

try {
  console.log("Initializing socket connection from socket.js");

  // Lấy server URL từ biến môi trường hoặc sử dụng địa chỉ mặc định
  const serverUrl =
    import.meta.env.VITE_API_BASE_URL || "http://localhost:9785";
  console.log("Socket connecting to server:", serverUrl);

  socket = io(serverUrl, {
    withCredentials: true,
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
    reconnectionAttempts: 5,
    autoConnect: true,
    extraHeaders: {
      Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
    },
  });

  // Xử lý các sự kiện socket cơ bản
  socket.on("connect", () => {
    console.log(
      "Socket connected successfully from socket.js with ID:",
      socket.id
    );
    connectedSockets.add(socket.id);
  });

  socket.on("disconnect", (reason) => {
    console.log("Socket disconnected:", reason);
    connectedSockets.delete(socket.id);

    if (reason === "io server disconnect") {
      // Máy chủ đã ngắt kết nối có chủ ý, cần kết nối lại thủ công
      setTimeout(() => {
        socket.connect();
      }, 1000);
    }
  });

  socket.on("connect_error", (error) => {
    console.error("Socket connection error:", error.message);
    // Thử kết nối lại sau 2 giây nếu thất bại
    setTimeout(() => {
      if (!socket.connected) {
        console.log("Attempting to reconnect socket...");
        socket.connect();
      }
    }, 2000);
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

  // Kiểm tra kết nối định kỳ
  setInterval(() => {
    if (socket && !socket.connected) {
      console.log("Socket disconnected, attempting to reconnect...");
      socket.connect();
    }
  }, 10000);
} catch (error) {
  console.error("Failed to initialize socket:", error.message);
  // Tạo dummy socket để tránh lỗi khi socket không khởi tạo được
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

// Hàm tiện ích để kiểm tra socket
const isSocketConnected = () => socket && socket.connected;

// Hàm tiện ích để emit event với kiểm tra trước
const emitSocketEvent = (event, data) => {
  if (!isSocketConnected()) {
    console.warn(`Socket not connected, cannot emit ${event}`);
    return false;
  }

  console.log(`Emitting socket event: ${event}`, data);
  socket.emit(event, data);
  return true;
};

export { socket, isSocketConnected, emitSocketEvent };
