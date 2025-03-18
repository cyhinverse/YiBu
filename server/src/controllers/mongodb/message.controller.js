import { Message } from "../../models/mongodb/Messages.js";
import { CatchError } from "../../configs/CatchError.js";
import { getIO } from "../../socket.js";

const MessageController = {
  // Tạo tin nhắn mới
  createMessage: CatchError(async (req, res) => {
    const { receiver, content, media } = req.body;
    const sender = req.user.id;

    const newMessage = await Message.create({
      sender,
      receiver,
      content,
      media,
    });

    const populatedMessage = await Message.findById(newMessage._id)
      .populate("sender", "username avatar")
      .populate("receiver", "username avatar");

    // Emit socket event
    const io = getIO();
    io.to(`chat_${sender}_${receiver}`).emit("new_message", populatedMessage);
    io.to(`chat_${receiver}_${sender}`).emit("new_message", populatedMessage);

    res.status(201).json({
      success: true,
      message: "Message sent successfully",
      data: populatedMessage,
    });
  }),

  // Lấy tin nhắn giữa 2 người dùng
  getMessages: CatchError(async (req, res) => {
    const { userId } = req.params;
    const currentUser = req.user.id;

    const messages = await Message.find({
      $or: [
        { sender: currentUser, receiver: userId },
        { sender: userId, receiver: currentUser },
      ],
    })
      .populate("sender", "username avatar")
      .populate("receiver", "username avatar")
      .sort({ createdAt: 1 });

    res.status(200).json({
      success: true,
      data: messages,
    });
  }),

  // Đánh dấu tin nhắn đã đọc
  markAsRead: CatchError(async (req, res) => {
    const { messageId } = req.params;

    const message = await Message.findByIdAndUpdate(
      messageId,
      { isRead: true },
      { new: true }
    );

    const io = getIO();
    io.emit("message_read", { messageId });

    res.status(200).json({
      success: true,
      data: message,
    });
  }),

  // Xóa tin nhắn
  deleteMessage: CatchError(async (req, res) => {
    const { messageId } = req.params;
    await Message.findByIdAndDelete(messageId);

    res.status(200).json({
      success: true,
      message: "Message deleted successfully",
    });
  }),
};

export default MessageController;
