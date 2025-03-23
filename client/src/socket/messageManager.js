import { socket } from "../socket";

class MessageManager {
  constructor() {
    this.callbacks = {
      onNewMessage: [],
      onMessageRead: [],
      onTyping: [],
      onStopTyping: [],
      onMessageDeleted: [],
      onError: [],
    };
    this.initialized = false;
    this.initialize();
  }

  initialize() {
    if (this.initialized || !socket) return;

    // Lắng nghe sự kiện tin nhắn mới
    socket.on("new_message", (data) => {
      console.log("messageManager received new_message:", data);
      this.callbacks.onNewMessage.forEach((callback) => callback(data));
    });

    // Lắng nghe sự kiện đánh dấu đã đọc
    socket.on("message_read", (data) => {
      console.log("messageManager received message_read:", data);
      this.callbacks.onMessageRead.forEach((callback) => callback(data));
    });

    // Lắng nghe sự kiện đang nhập
    socket.on("user_typing", (data) => {
      console.log("messageManager received user_typing:", data);
      this.callbacks.onTyping.forEach((callback) => callback(data));
    });

    // Lắng nghe sự kiện dừng nhập
    socket.on("user_stop_typing", (data) => {
      console.log("messageManager received user_stop_typing:", data);
      this.callbacks.onStopTyping.forEach((callback) => callback(data));
    });

    // Lắng nghe sự kiện xóa tin nhắn
    socket.on("message_deleted", (data) => {
      console.log("messageManager received message_deleted:", data);
      this.callbacks.onMessageDeleted.forEach((callback) => callback(data));
    });

    // Lắng nghe lỗi
    socket.on("error", (error) => {
      console.error("messageManager received error:", error);
      this.callbacks.onError.forEach((callback) => callback(error));
    });

    this.initialized = true;
    console.log("MessageManager initialized");
  }

  // Đăng ký callback cho các sự kiện
  onNewMessage(callback) {
    this.callbacks.onNewMessage.push(callback);
    return () => {
      this.callbacks.onNewMessage = this.callbacks.onNewMessage.filter(
        (cb) => cb !== callback
      );
    };
  }

  onMessageRead(callback) {
    this.callbacks.onMessageRead.push(callback);
    return () => {
      this.callbacks.onMessageRead = this.callbacks.onMessageRead.filter(
        (cb) => cb !== callback
      );
    };
  }

  onTyping(callback) {
    this.callbacks.onTyping.push(callback);
    return () => {
      this.callbacks.onTyping = this.callbacks.onTyping.filter(
        (cb) => cb !== callback
      );
    };
  }

  onStopTyping(callback) {
    this.callbacks.onStopTyping.push(callback);
    return () => {
      this.callbacks.onStopTyping = this.callbacks.onStopTyping.filter(
        (cb) => cb !== callback
      );
    };
  }

  onMessageDeleted(callback) {
    this.callbacks.onMessageDeleted.push(callback);
    return () => {
      this.callbacks.onMessageDeleted = this.callbacks.onMessageDeleted.filter(
        (cb) => cb !== callback
      );
    };
  }

  onError(callback) {
    this.callbacks.onError.push(callback);
    return () => {
      this.callbacks.onError = this.callbacks.onError.filter(
        (cb) => cb !== callback
      );
    };
  }

  // Gửi tin nhắn
  sendMessage(message) {
    if (!socket || !socket.connected) {
      console.error("Socket disconnected, cannot send message");
      return false;
    }

    console.log("Emitting send_message:", message);
    socket.emit("send_message", message);
    return true;
  }

  // Thông báo đang nhập
  sendTyping(data) {
    if (!socket || !socket.connected) return false;
    console.log("Emitting typing:", data);
    socket.emit("typing", data);
    return true;
  }

  // Thông báo dừng nhập
  sendStopTyping(data) {
    if (!socket || !socket.connected) return false;
    console.log("Emitting stop_typing:", data);
    socket.emit("stop_typing", data);
    return true;
  }

  // Đánh dấu tin nhắn đã đọc
  markAsRead(data) {
    if (!socket || !socket.connected) return false;
    console.log("Emitting mark_as_read:", data);
    socket.emit("mark_as_read", data);
    return true;
  }

  // Tham gia phòng chat
  joinRoom(roomId) {
    if (!socket || !socket.connected) return false;
    console.log("Joining room:", roomId);
    socket.emit("join_room", roomId);
    return true;
  }

  // Rời phòng chat
  leaveRoom(roomId) {
    if (!socket || !socket.connected) return false;
    console.log("Leaving room:", roomId);
    socket.emit("leave_room", roomId);
    return true;
  }
}

// Export singleton instance
export const messageManager = new MessageManager();
