import logger from "../../configs/logger.js";

export const registerNotificationHandlers = (io, socket) => {
  // Send Notification (Direct from client - rare but supported)
  socket.on("send_notification", (data) => {
    try {
      if (!data || !data.recipient) return;
      
      const recipientStr = data.recipient.toString();
      socket.to(recipientStr).emit("notification:new", { ...data, timestamp: new Date() });
      io.emit(`user:${recipientStr}:notification`, { ...data, timestamp: new Date() }); // Legacy emit
      
      socket.emit("notification_sent", { success: true, recipient: recipientStr });
    } catch (error) {
      logger.error("Error sending notification:", error);
    }
  });

  // Register for notifications
  socket.on("notification:register", (userId) => {
    try {
      if (!userId) return;
      const userIdStr = userId.toString();
      socket.join(userIdStr);
      socket.user = { id: userIdStr }; // Ensure user attached
      logger.info(`User ${socket.id} registered for notifications: ${userIdStr}`);
      socket.emit("notification:registered", { userId: userIdStr, success: true });
    } catch (error) {
        logger.error("Notification register error", error);
    }
  });
};
