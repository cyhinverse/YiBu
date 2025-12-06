class SocketService {
  constructor() {
    this.io = null;
  }

  init(io) {
    this.io = io;
  }

  // --- Helper Methods ---
  emitToUser(userId, event, data) {
    if (!this.io) return;
    this.io.to(userId.toString()).emit(event, data);
  }

  emitToRoom(roomId, event, data) {
    if (!this.io) return;
    this.io.to(roomId).emit(event, data);
  }

  emit(event, data) {
    if (!this.io) return;
    this.io.emit(event, data);
  }

  // --- Specific Business Events ---

  // Chat
  emitNewMessage(receiverId, message) {
    if (!this.io) return;
    const receiverIdStr = receiverId.toString();
    const senderIdStr = message.sender._id ? message.sender._id.toString() : message.sender.toString();

    // To Receiver
    this.emitToUser(receiverIdStr, "new_message", message);

    // To Sender (sync across devices)
    this.emitToUser(senderIdStr, "new_message", message);

    // To Chat Rooms (redundancy/legacy support)
    const room1 = `chat_${senderIdStr}_${receiverIdStr}`;
    const room2 = `chat_${receiverIdStr}_${senderIdStr}`;
    this.emitToRoom(room1, "new_message", message);
    this.emitToRoom(room2, "new_message", message);
  }

  emitMessageRead(messageIds, readerId, senderId) {
    if (!this.io) return;
    const data = { messageIds, readerId, senderId };
    
    // Notify Sender
    this.emitToUser(senderId, "message_read", data);
    
    // Notify Reader (sync)
    this.emitToUser(readerId, "message_read", data);

    // Notify Rooms
    const room1 = `chat_${senderId}_${readerId}`;
    const room2 = `chat_${readerId}_${senderId}`;
    this.emitToRoom(room1, "message_read", data);
    this.emitToRoom(room2, "message_read", data);
  }

  emitMessageDeleted(recipientId, messageId, deletedBy) {
    this.emitToUser(recipientId, "message_deleted", { messageId, deletedBy });
  }

  emitConversationDeleted(partnerId, userId) {
      this.emitToUser(partnerId, "conversation_deleted", {
        conversationPartner: userId,
        deletedBy: userId,
      });
  }

  // Notifications
  emitNotification(recipientId, notification) {
    const recipientStr = recipientId.toString();
    
    // Emit to specific user room
    this.emitToUser(recipientStr, "notification:new", notification);
    
    // Emit to global user notification channel (legacy?)
    this.emit(`user:${recipientStr}:notification`, notification);
  }

  // Posts
  emitPostLikeUpdate(postId, userId, action) {
    const roomId = `post:${postId}`;
    const data = { postId, userId, action, timestamp: new Date() };

    this.emitToRoom(roomId, "post:like:update", data);
    this.emit(`post:${postId}:like:update`, data);
  }

  emitSaveNotification(recipientId, notificationPayload) {
      // Re-use emitNotification or specific?
      // Controller used: io.to(post.user.toString()).emit("notification:new", notificationPayload);
      this.emitNotification(recipientId, notificationPayload);
  }

  // User Status
  emitUserStatus(userId, status) {
    this.emit("user_status_update", {
      userId,
      status, // 'online' | 'offline'
      timestamp: new Date(),
    });
  }
}

export default new SocketService();
