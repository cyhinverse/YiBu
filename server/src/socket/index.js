import { Server } from "socket.io";
import SocketService from "../services/Socket.Service.js";
import { registerConnectionHandlers } from "./handlers/connection.handler.js";
import { registerChatHandlers } from "./handlers/chat.handler.js";
import { registerNotificationHandlers } from "./handlers/notification.handler.js";
import { registerPostHandlers } from "./handlers/post.handler.js";
import config from "../configs/config.js";

let io;

export const initSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: [
        "http://localhost:9258",
        "http://localhost:5173",
        "http://localhost:3000",
        config.CLIENT_URL || "http://localhost:9258",
      ],
      methods: ["GET", "POST", "PUT", "DELETE"],
      credentials: true,
      allowedHeaders: ["Content-Type", "Authorization"],
    },
    path: "/socket.io/",
  });

  // Inject IO into Service
  SocketService.init(io);

  io.on("connection", (socket) => {
    // Client connected log handled by connection handler if needed
    
    // Default connection response
    socket.emit("connection_established", { message: "Kết nối thành công" });

    // Register Handlers
    registerConnectionHandlers(io, socket);
    registerChatHandlers(io, socket);
    registerNotificationHandlers(io, socket);
    registerPostHandlers(io, socket);
  });

  return io;
};

export { io };
