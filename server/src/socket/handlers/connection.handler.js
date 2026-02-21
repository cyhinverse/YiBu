import logger from "../../configs/logger.js";
import socketService from "../../modules/shared/socket/socket.service.js";
import { cleanupRateLimiter } from "../middlewares/socketRateLimit.middleware.js";

export const registerConnectionHandlers = (io, socket) => {
  // Legacy compatibility event. User identity now comes from socket auth middleware.
  socket.on("register_user", (data) => {
    try {
      if (!socket.user?.id) {
        socket.emit("error", { message: "Authentication required" });
        return;
      }

      const expectedUserId = socket.user.id;
      const providedUserId = data?.userId?.toString();
      if (providedUserId && providedUserId !== expectedUserId) {
        logger.warn("Socket register_user userId mismatch", {
          socketId: socket.id,
          expectedUserId,
          providedUserId,
        });
      }

      socket.emit("user_registered", {
        success: true,
        userId: expectedUserId,
      });
    } catch (error) {
      logger.error("Error registering user:", error);
    }
  });

  // Handle get_online_users request from client
  socket.on("get_online_users", () => {
    const onlineUsers = socketService.getOnlineUsers();
    socket.emit("get_users_online", onlineUsers);
  });

  // Disconnect
  socket.on("disconnect", () => {
    logger.info("Client disconnected:", socket.id);
    cleanupRateLimiter(socket.id);
    if (socket.user && socket.user.id) {
      const userId = socket.user.id;

      // Remove from SocketService
      socketService.removeUser(socket.id);

      if (!socketService.isUserOnline(userId)) {
        io.emit("user_status_change", {
          userId,
          status: "offline",
          timestamp: new Date(),
        });
        logger.info(`User ${userId} is now offline`);
      }
    }
  });
};

