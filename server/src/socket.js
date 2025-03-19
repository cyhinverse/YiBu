import { Server } from "socket.io";

let io;

export const initSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: "http://localhost:9258",
      methods: ["GET", "POST"],
      credentials: true,
      allowedHeaders: ["Content-Type", "Authorization"],
    },
  });

  io.on("connection", (socket) => {
    console.log("Client connected:", socket.id);


    socket.on("join_room", (roomId) => {
      socket.join(roomId);
      console.log(`User joined room: ${roomId}`);
    });


    socket.on("send_message", (data) => {
      io.to(data.roomId).emit("receive_message", data);
    });


    socket.on("mark_as_read", (data) => {
      io.to(data.roomId).emit("message_read", data);
    });


    socket.on("typing", (data) => {
      socket.to(data.roomId).emit("user_typing", data);
    });

    socket.on("stop_typing", (data) => {
      socket.to(data.roomId).emit("user_stop_typing", data);
    });

    socket.on("disconnect", () => {
      console.log("Client disconnected:", socket.id);
    });
  });
};

export const getIO = () => {
  if (!io) {
    throw new Error("Socket.io not initialized!");
  }
  return io;
};
