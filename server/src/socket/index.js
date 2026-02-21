import { Server } from "socket.io";
import SocketService from "../modules/shared/socket/socket.service.js";
import { registerConnectionHandlers } from "./handlers/connection.handler.js";
import { registerChatHandlers } from "./handlers/chat.handler.js";
import { registerNotificationHandlers } from "./handlers/notification.handler.js";
import { registerPostHandlers } from "./handlers/post.handler.js";
import config from "../configs/config.js";
import socketAuthMiddleware from "./middlewares/socketAuth.middleware.js";

let io;

export const initSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: config.cors?.origins || [config.CLIENT_URL],
      methods: ["GET", "POST", "PUT", "DELETE"],
      credentials: true,
      allowedHeaders: ["Content-Type", "Authorization"],
    },
    path: "/socket.io/",
    maxHttpBufferSize: 1e6,
    pingTimeout: 30000,
    pingInterval: 25000,
    connectTimeout: 10000,
  });

  // Inject IO into Service
  SocketService.init(io);
  io.use(socketAuthMiddleware);

  io.on("connection", (socket) => {
    const userId = socket.user?.id;
    const wasOnline = userId ? SocketService.isUserOnline(userId) : false;
    if (userId) {
      socket.join(userId);
      SocketService.addUser(userId, socket.id);

      if (!wasOnline) {
        io.emit("user_status_change", {
          userId,
          status: "online",
          timestamp: new Date(),
        });
      }
    }

    // Client connected log handled by connection handler if needed

    // Default connection response
    socket.emit("connection_established", {
      message: "Kết nối thành công",
      userId,
    });

    // Register Handlers
    registerConnectionHandlers(io, socket);
    registerChatHandlers(io, socket);
    registerNotificationHandlers(io, socket);
    registerPostHandlers(io, socket);
  });

  return io;
};

export { io };
