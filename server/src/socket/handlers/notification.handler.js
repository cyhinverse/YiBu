import logger from "../../configs/logger.js";

export const registerNotificationHandlers = (io, socket) => {
  // Send Notification (Direct from client - rare but supported)
  socket.on("send_notification", (data) => {
    try {
      // Disable client-originated direct notifications to prevent spoof/spam.
      socket.emit("error", {
        message: "Direct client notifications are disabled",
      });
      logger.warn("Blocked direct socket notification event", {
        socketId: socket.id,
        senderId: socket.user?.id,
        recipient: data?.recipient,
      });
    } catch (error) {
      logger.error("Error sending notification:", error);
    }
  });

  // Register for notifications
  socket.on("notification:register", userId => {
    try {
      if (!socket.user?.id) {
        socket.emit("error", { message: "Authentication required" });
        return;
      }

      const expectedUserId = socket.user.id;
      const providedUserId = userId?.toString();
      if (providedUserId && providedUserId !== expectedUserId) {
        logger.warn("Socket notification:register userId mismatch", {
          socketId: socket.id,
          expectedUserId,
          providedUserId,
        });
      }

      socket.join(expectedUserId);
      socket.emit("notification:registered", {
        userId: expectedUserId,
        success: true,
      });
    } catch (error) {
      logger.error("Notification register error", error);
    }
  });
};
