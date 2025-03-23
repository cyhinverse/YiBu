import { socket, emitSocketEvent } from "../socket";

let commentManager = null;

class CommentManager {
  constructor() {
    this.handlers = {
      onNewComment: new Set(),
      onUpdateComment: new Set(),
      onDeleteComment: new Set(),
    };
    this.postRooms = new Set();
    this.initialized = false;
    this.initialize();
  }

  initialize() {
    if (this.initialized) return;

    // Lắng nghe sự kiện comment mới
    socket.on("new_comment", (data) => {
      console.log("New comment received via socket:", data);
      this.notifyHandlers("onNewComment", data);
    });

    // Lắng nghe sự kiện cập nhật comment
    socket.on("update_comment", (data) => {
      console.log("Comment updated via socket:", data);
      this.notifyHandlers("onUpdateComment", data);
    });

    // Lắng nghe sự kiện xóa comment
    socket.on("delete_comment", (data) => {
      console.log("Comment deleted via socket:", data);
      this.notifyHandlers("onDeleteComment", data);
    });

    this.initialized = true;
    console.log("Comment manager initialized");
  }

  // Tham gia room của bài viết để nhận thông báo comment
  joinPostRoom(postId) {
    if (!postId) return;

    const roomId = `post:${postId}`;
    if (this.postRooms.has(roomId)) return;

    emitSocketEvent("join_room", roomId);
    this.postRooms.add(roomId);
    console.log(`Joined post room: ${roomId}`);
  }

  // Rời khỏi room của bài viết
  leavePostRoom(postId) {
    if (!postId) return;

    const roomId = `post:${postId}`;
    if (!this.postRooms.has(roomId)) return;

    emitSocketEvent("leave_room", roomId);
    this.postRooms.delete(roomId);
    console.log(`Left post room: ${roomId}`);
  }

  // Đăng ký handler để nhận thông báo về sự kiện comment
  registerNewCommentHandler(handler) {
    this.handlers.onNewComment.add(handler);
    return () => this.handlers.onNewComment.delete(handler);
  }

  registerUpdateCommentHandler(handler) {
    this.handlers.onUpdateComment.add(handler);
    return () => this.handlers.onUpdateComment.delete(handler);
  }

  registerDeleteCommentHandler(handler) {
    this.handlers.onDeleteComment.add(handler);
    return () => this.handlers.onDeleteComment.delete(handler);
  }

  // Thông báo đến tất cả các handler đã đăng ký
  notifyHandlers(handlerType, data) {
    if (!this.handlers[handlerType]) return;

    this.handlers[handlerType].forEach((handler) => {
      try {
        handler(data);
      } catch (error) {
        console.error(`Error in comment handler (${handlerType}):`, error);
      }
    });
  }

  // Hủy đăng ký tất cả handler
  cleanup() {
    this.handlers.onNewComment.clear();
    this.handlers.onUpdateComment.clear();
    this.handlers.onDeleteComment.clear();

    // Rời khỏi tất cả các phòng
    this.postRooms.forEach((roomId) => {
      emitSocketEvent("leave_room", roomId);
    });
    this.postRooms.clear();
  }
}

// Singleton pattern
export const getCommentManager = () => {
  if (!commentManager) {
    commentManager = new CommentManager();
  }
  return commentManager;
};
