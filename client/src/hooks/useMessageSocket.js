import { useEffect, useState } from "react";
import { messageManager } from "../socket/messageManager";
import { useSelector } from "react-redux";

/**
 * Hook tiện ích để quản lý kết nối socket cho tin nhắn
 * @param {string} chatPartnerId - ID của người nhận tin nhắn (không bắt buộc)
 * @param {object} options - Các tùy chọn bổ sung
 * @returns {object} - Các hàm và trạng thái liên quan đến tin nhắn
 */
export const useMessageSocket = (chatPartnerId = null, options = {}) => {
  const { user } = useSelector((state) => state.auth);
  const [isTyping, setIsTyping] = useState(false);
  const [connected, setConnected] = useState(false);
  const [roomId, setRoomId] = useState(null);

  // Tạo ID phòng duy nhất nếu có chatPartnerId
  useEffect(() => {
    if (user && user._id && chatPartnerId) {
      const newRoomId = [user._id, chatPartnerId].sort().join("-");
      setRoomId(newRoomId);

      // Tham gia phòng chat
      messageManager.joinRoom(newRoomId);
      messageManager.joinRoom(user._id); // Luôn tham gia phòng cá nhân

      setConnected(true);

      return () => {
        // Rời khỏi phòng chat khi unmount
        messageManager.leaveRoom(newRoomId);
      };
    }
  }, [user, chatPartnerId]);

  // Lắng nghe trạng thái gõ chữ
  useEffect(() => {
    if (!chatPartnerId) return;

    const unsubscribeTyping = messageManager.onTyping((data) => {
      if (data.senderId === chatPartnerId) {
        setIsTyping(true);
      }
    });

    const unsubscribeStopTyping = messageManager.onStopTyping((data) => {
      if (data.senderId === chatPartnerId) {
        setIsTyping(false);
      }
    });

    return () => {
      unsubscribeTyping();
      unsubscribeStopTyping();
    };
  }, [chatPartnerId]);

  // Gửi tin nhắn
  const sendMessage = (content, media = null) => {
    if (!user || !user._id || !chatPartnerId) return false;

    const messageData = {
      receiverId: chatPartnerId,
      senderId: user._id,
      content,
      media,
    };

    return messageManager.sendMessage(messageData);
  };

  // Bắt đầu gõ
  const startTyping = () => {
    if (!user || !user._id || !chatPartnerId) return false;

    return messageManager.sendTyping({
      senderId: user._id,
      receiverId: chatPartnerId,
      isTyping: true,
    });
  };

  // Dừng gõ
  const stopTyping = () => {
    if (!user || !user._id || !chatPartnerId) return false;

    return messageManager.sendStopTyping({
      senderId: user._id,
      receiverId: chatPartnerId,
      isTyping: false,
    });
  };

  // Đánh dấu đã đọc
  const markAsRead = (messageIds) => {
    if (!user || !user._id || !chatPartnerId || !messageIds.length)
      return false;

    console.log(`Marking messages as read in socket: ${messageIds.join(", ")}`);

    // Đảm bảo roomId đã được thiết lập
    if (!roomId) {
      console.warn("Room ID not set when trying to mark messages as read");
      const newRoomId = [user._id, chatPartnerId].sort().join("-");
      setRoomId(newRoomId);

      // Đảm bảo đã tham gia phòng
      messageManager.joinRoom(newRoomId);
    }

    // Gửi yêu cầu đánh dấu tin nhắn đã đọc
    const success = messageManager.markAsRead({
      messageIds,
      senderId: chatPartnerId,
      receiverId: user._id,
    });

    if (!success) {
      console.error("Failed to send markAsRead message via socket");
    }

    return success;
  };

  return {
    isTyping,
    connected,
    roomId,
    sendMessage,
    startTyping,
    stopTyping,
    markAsRead,
    onNewMessage: messageManager.onNewMessage.bind(messageManager),
    onMessageRead: messageManager.onMessageRead.bind(messageManager),
    onMessageDeleted: messageManager.onMessageDeleted.bind(messageManager),
  };
};

export default useMessageSocket;
