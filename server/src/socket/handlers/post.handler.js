import logger from "../../configs/logger.js";

export const registerPostHandlers = (io, socket) => {
    // Listen for post likes
    socket.on("post:like:listen", (postId) => {
        try {
            if (!postId) return;
            const roomId = `post:${postId}`;
            socket.join(roomId);
            logger.info(`User ${socket.id} listening to post: ${postId}`);
            socket.emit("post:like:listening", { postId, success: true });
        } catch (error) {
            logger.error("Error listening to post:", error);
        }
    });

    // Client emitting like (usually done via API, but for immediate feedback/optimistic UI)
    socket.on("post:like", (data) => {
        try {
            const { postId, userId, action } = data;
            if (!postId) return;

            const roomId = `post:${postId}`;
            const payload = { postId, userId, action, timestamp: new Date() };
            
            io.to(roomId).emit("post:like:update", payload);
            io.emit(`post:${postId}:like:update`, payload); // Global fallback
        } catch (error) {
             logger.error("Error handling post:like:", error);
        }
    });
}
