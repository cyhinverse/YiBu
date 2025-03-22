import { Server } from "socket.io";

let io;

export const initSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: [
        "http://localhost:9258",
        "http://localhost:5173",
        "http://localhost:3000",
      ],
      methods: ["GET", "POST", "PUT", "DELETE"],
      credentials: true,
      allowedHeaders: ["Content-Type", "Authorization"],
    },
    path: "/socket.io/",
  });

  io.on("connection", (socket) => {
    console.log("Client connected:", socket.id);
    socket.emit("connection_established", { message: "Kết nối thành công" });

    socket.on("join_room", (roomId) => {
      try {
        if (!roomId) {
          console.error("Invalid roomId received in join_room event");
          return;
        }

        const roomIdStr = roomId.toString();

        if (roomId.startsWith("post:")) {
          socket.join(roomIdStr);
          console.log(`User ${socket.id} joined post room: ${roomIdStr}`);
        } else {
          socket.join(roomIdStr);
          console.log(`User ${socket.id} joined room: ${roomIdStr}`);

          if (socket.user && socket.user.id) {
            const userIdRoom = socket.user.id.toString();
            socket.join(userIdRoom);
            console.log(`User also joined their own user room: ${userIdRoom}`);
          }

          socket.emit("room_joined", { roomId: roomIdStr, success: true });
        }
      } catch (error) {
        console.error("Error joining room:", error);
        socket.emit("error", {
          message: "Failed to join room",
          error: error.message,
          roomId,
        });
      }
    });

    socket.on("leave_room", (roomId) => {
      try {
        if (!roomId) {
          console.error("Invalid roomId received in leave_room event");
          return;
        }

        const roomIdStr = roomId.toString();
        socket.leave(roomIdStr);
        console.log(`User ${socket.id} left room: ${roomIdStr}`);

        socket.emit("room_left", { roomId: roomIdStr, success: true });
      } catch (error) {
        console.error("Error leaving room:", error);
        socket.emit("error", {
          message: "Failed to leave room",
          error: error.message,
          roomId,
        });
      }
    });

    socket.on("send_message", (data) => {
      console.log("Socket server received message:", data);

      if (!data.message || !data.receiverId || !data.senderId) {
        console.error("Invalid message data:", data);
        socket.emit("error", { message: "Invalid message data", data });
        return;
      }

      const { message, receiverId, senderId } = data;

      try {
        const receiverIdStr = receiverId.toString();
        const senderIdStr = senderId.toString();

        console.log(`Emitting new_message to user: ${receiverIdStr}`);
        socket.to(receiverIdStr).emit("new_message", message);

        if (senderIdStr !== socket.id) {
          console.log(
            `Emitting new_message to sender's other devices: ${senderIdStr}`
          );
          socket.to(senderIdStr).emit("new_message", message);
        }

        const room1 = `chat_${senderIdStr}_${receiverIdStr}`;
        const room2 = `chat_${receiverIdStr}_${senderIdStr}`;

        console.log(`Emitting new_message to rooms: ${room1} and ${room2}`);
        socket.to(room1).emit("new_message", message);
        socket.to(room2).emit("new_message", message);

        console.log(
          `Message sent from ${senderIdStr} to ${receiverIdStr}`,
          message
        );

        socket.emit("message_sent", {
          success: true,
          messageId: message._id || message.id,
          timestamp: new Date(),
        });
      } catch (error) {
        console.error("Error sending message via socket:", error);
        socket.emit("error", {
          message: "Failed to send message",
          error: error.message,
          originalData: data,
        });
      }
    });

    socket.on("mark_as_read", (data) => {
      console.log("Marking message as read:", data);
      try {
        if (!data.messageIds) {
          console.error(
            "Invalid mark_as_read data - missing messageIds:",
            data
          );
          socket.emit("error", { message: "Invalid mark_as_read data", data });
          return;
        }

        if (data.roomId) {
          io.to(data.roomId).emit("message_read", data);
        } else if (data.receiverId && data.senderId) {
          const room1 = `chat_${data.senderId}_${data.receiverId}`;
          const room2 = `chat_${data.receiverId}_${data.senderId}`;

          io.to(room1).emit("message_read", data);
          io.to(room2).emit("message_read", data);

          io.to(data.receiverId.toString()).emit("message_read", data);
          io.to(data.senderId.toString()).emit("message_read", data);
        }

        socket.emit("read_confirmed", {
          success: true,
          messageIds: data.messageIds,
          timestamp: new Date(),
        });
      } catch (error) {
        console.error("Error marking message as read:", error);
        socket.emit("error", {
          message: "Failed to mark message as read",
          error: error.message,
          originalData: data,
        });
      }
    });

    socket.on("typing", (data) => {
      console.log("User typing:", data);
      try {
        if (!data.senderId) {
          console.error("Invalid typing data - missing senderId:", data);
          return;
        }

        if (data.roomId) {
          socket.to(data.roomId).emit("user_typing", data);
        } else if (data.receiverId) {
          const room1 = `chat_${data.senderId}_${data.receiverId}`;
          const room2 = `chat_${data.receiverId}_${data.senderId}`;

          socket.to(room1).emit("user_typing", data);
          socket.to(room2).emit("user_typing", data);

          socket.to(data.receiverId.toString()).emit("user_typing", data);
        }
      } catch (error) {
        console.error("Error handling typing event:", error);
        socket.emit("error", {
          message: "Failed to process typing event",
          error: error.message,
          originalData: data,
        });
      }
    });

    socket.on("stop_typing", (data) => {
      console.log("User stopped typing:", data);
      try {
        if (!data.senderId) {
          console.error("Invalid stop_typing data - missing senderId:", data);
          return;
        }

        if (data.roomId) {
          socket.to(data.roomId).emit("user_stop_typing", data);
        } else if (data.receiverId) {
          const room1 = `chat_${data.senderId}_${data.receiverId}`;
          const room2 = `chat_${data.receiverId}_${data.senderId}`;

          socket.to(room1).emit("user_stop_typing", data);
          socket.to(room2).emit("user_stop_typing", data);

          socket.to(data.receiverId.toString()).emit("user_stop_typing", data);
        }
      } catch (error) {
        console.error("Error handling stop typing event:", error);
        socket.emit("error", {
          message: "Failed to process stop typing event",
          error: error.message,
          originalData: data,
        });
      }
    });

    socket.on("post:like", (data) => {
      try {
        const { postId, userId, action } = data;
        console.log(
          `Received post like event - Post: ${postId}, User: ${userId}, Action: ${action}`
        );

        if (!postId) {
          console.error("Invalid post:like data - missing postId", data);
          socket.emit("error", {
            message: "Invalid post:like data - missing postId",
            originalData: data,
          });
          return;
        }

        const roomId = `post:${postId}`;
        io.to(roomId).emit(`post:${postId}:like`, {
          postId,
          userId,
          action,
          timestamp: new Date(),
        });

        console.log(`Broadcast like event to room ${roomId}`);
      } catch (error) {
        console.error("Error handling post:like event:", error);
        socket.emit("error", {
          message: "Failed to process post:like event",
          error: error.message,
          originalData: data,
        });
      }
    });

    socket.on("error", (error) => {
      console.error("Socket error from client:", error);
    });

    socket.on("disconnect", () => {
      console.log("Client disconnected:", socket.id);
    });
  });

  return io;
};

export { io };
