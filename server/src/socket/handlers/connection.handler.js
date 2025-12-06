import logger from "../../configs/logger.js";

export const registerConnectionHandlers = (io, socket) => {
  // Register User (make online)
  socket.on("register_user", (data) => {
    try {
      if (!data || !data.userId) {
        logger.error("Invalid user registration data:", data);
        socket.emit("error", { message: "Invalid user registration data" });
        return;
      }

      const userId = data.userId.toString();
      socket.join(userId);
      socket.user = { id: userId }; // Attach user to socket

      // Broadcast user online status
      io.emit("user_status_update", {
        userId,
        status: "online",
        timestamp: new Date(),
      });

      logger.info(`User ${userId} is now online with socket ${socket.id}`);
    } catch (error) {
      logger.error("Error registering user:", error);
    }
  });

  // Disconnect
  socket.on("disconnect", () => {
    logger.info("Client disconnected:", socket.id);
    if (socket.user && socket.user.id) {
      const userId = socket.user.id;
      io.emit("user_status_update", {
        userId,
        status: "offline",
        timestamp: new Date(),
      });
      logger.info(`User ${userId} is now offline`);
    }
  });
};
