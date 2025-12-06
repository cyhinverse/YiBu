import logger from "../../configs/logger.js";

export const registerChatHandlers = (io, socket) => {
  // Join Room
  socket.on("join_room", (roomId) => {
    try {
      if (!roomId) return;
      
      const roomIdStr = roomId.toString();
      socket.join(roomIdStr);
      logger.info(`User ${socket.id} joined room: ${roomIdStr}`);

      // If generic room join, check if it's user room or something else?
      // Legacy logic preserved:
      if (!roomId.includes(":") && roomIdStr === socket.user?.id) {
         // Already handled in register_user usually, but okay
      }

      socket.emit("room_joined", { roomId: roomIdStr, success: true });
    } catch (error) {
      logger.error("Error joining room:", error);
      socket.emit("error", { message: "Failed to join room", error: error.message });
    }
  });

  // Leave Room
  socket.on("leave_room", (roomId) => {
    try {
      if (!roomId) return;
      const roomIdStr = roomId.toString();
      socket.leave(roomIdStr);
      logger.info(`User ${socket.id} left room: ${roomIdStr}`);
      socket.emit("room_left", { roomId: roomIdStr, success: true });
    } catch (error) {
      logger.error("Error leaving room:", error);
    }
  });

  // Send Message (Incoming from Client)
  socket.on("send_message", (data) => {
    // Note: Usually messages are sent via API (POST /messages) and then emitted via SocketService.
    // However, if client sends via socket directly:
    logger.info("Socket received direct message (legacy/chat-only):", data);
    
    if (!data.message || !data.receiverId || !data.senderId) {
      socket.emit("error", { message: "Invalid message data" });
      return;
    }

    const { message, receiverId, senderId } = data;
    const receiverIdStr = receiverId.toString();
    const senderIdStr = senderId.toString();

    // Emitting to receiver
    socket.to(receiverIdStr).emit("new_message", message);
    
    // Sync to other sender devices
    if (senderIdStr !== socket.id) {
      socket.to(senderIdStr).emit("new_message", message);
    }

    // Emit to Rooms
    const room1 = `chat_${senderIdStr}_${receiverIdStr}`;
    const room2 = `chat_${receiverIdStr}_${senderIdStr}`;
    socket.to(room1).emit("new_message", message);
    socket.to(room2).emit("new_message", message);

    socket.emit("message_sent", { success: true, messageId: message._id, timestamp: new Date() });
  });

  // Mark as Read
  socket.on("mark_as_read", (data) => {
    // Similar to send_message, usually done via API.
    // logic ...
    if (!data.messageIds) return;

    if (data.receiverId && data.senderId) {
       const room1 = `chat_${data.senderId}_${data.receiverId}`;
       const room2 = `chat_${data.receiverId}_${data.senderId}`;
       io.to(room1).emit("message_read", data);
       io.to(room2).emit("message_read", data);
       
       io.to(data.receiverId.toString()).emit("message_read", data);
       io.to(data.senderId.toString()).emit("message_read", data);
    }
    socket.emit("read_confirmed", { success: true, messageIds: data.messageIds });
  });

  // Typing
  socket.on("typing", (data) => {
      if (!data.senderId) return;
      if (data.receiverId) {
         socket.to(data.receiverId.toString()).emit("user_typing", data);
         // Also rooms
          const room1 = `chat_${data.senderId}_${data.receiverId}`;
          const room2 = `chat_${data.receiverId}_${data.senderId}`;
          socket.to(room1).emit("user_typing", data);
          socket.to(room2).emit("user_typing", data);
      }
  });

  socket.on("stop_typing", (data) => {
      if (!data.senderId) return;
      if (data.receiverId) {
         socket.to(data.receiverId.toString()).emit("user_stop_typing", data);
         // Also rooms
          const room1 = `chat_${data.senderId}_${data.receiverId}`;
          const room2 = `chat_${data.receiverId}_${data.senderId}`;
          socket.to(room1).emit("user_stop_typing", data);
          socket.to(room2).emit("user_stop_typing", data);
      }
  });
};
