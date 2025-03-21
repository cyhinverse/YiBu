import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";
import useSocket from "./useSocket";
import MessageService from "../services/messageService";
import UserService from "../services/userService";
import {
  setLoading,
  setError,
  setConversations,
  setCurrentMessages,
  addMessage,
  setSelectedUser,
  markMessageAsRead,
  updatePagination,
  addConversation,
} from "../slices/MessageSlice";

const useMessages = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const currentUser = useSelector((state) => state.auth?.user);
  const userId = currentUser?.user?._id; // Lấy ID người dùng một cách nhất quán
  const messageState = useSelector((state) => state.message) || {};

  const {
    conversations = [],
    currentMessages = [],
    selectedUser = null,
    loading = {
      conversations: false,
      messages: false,
      sending: false,
    },
    pagination = {
      page: 1,
      limit: 20,
      hasMore: true,
    },
  } = messageState;

  const [allUsers, setAllUsers] = useState([]);

  const { socket, joinRoom, leaveRoom, sendMessage, isConnected } =
    useSocket(userId);

  // Fetch conversations on mount
  useEffect(() => {
    if (!userId) return;
    console.log("Fetching conversations for user:", userId);
    fetchConversations();
    fetchUsers();
  }, [userId]);

  // Handle socket events
  useEffect(() => {
    if (!socket || !selectedUser || !userId) return;

    // Tham gia cả hai hướng của phòng chat để đảm bảo nhận tin nhắn
    const roomId1 = `chat_${userId}_${selectedUser._id}`;
    const roomId2 = `chat_${selectedUser._id}_${userId}`;

    console.log("Joining chat rooms:", roomId1, roomId2);
    joinRoom(roomId1);
    joinRoom(roomId2);

    // Thiết lập handler cho tin nhắn mới
    const handleNewMessage = (message) => {
      console.log("New message received via socket:", message);
      if (!message || !message._id) return;

      // Thêm tin nhắn mới vào danh sách nếu liên quan đến người dùng hiện tại và người dùng đã chọn
      const isRelevantMessage =
        (message.sender._id === userId &&
          message.receiver._id === selectedUser._id) ||
        (message.sender._id === selectedUser._id &&
          message.receiver._id === userId);

      if (isRelevantMessage) {
        dispatch(addMessage(message));

        // Tự động đánh dấu tin nhắn đã đọc nếu người dùng hiện tại là người nhận
        if (message.receiver._id === userId && !message.isRead) {
          markMessagesAsRead([message._id]);
        }
      }
    };

    // Đăng ký handler
    socket.on("new_message", handleNewMessage);

    // Cleanup khi unmount hoặc khi selectedUser thay đổi
    return () => {
      leaveRoom(roomId1);
      leaveRoom(roomId2);
      socket.off("new_message", handleNewMessage);
    };
  }, [socket, selectedUser, userId, dispatch]);

  const fetchConversations = async () => {
    if (!userId) {
      console.warn("[DEBUG] fetchConversations called without userId");
      return;
    }

    try {
      dispatch(setLoading({ type: "conversations", value: true }));
      console.log("[DEBUG] Fetching conversations for userId:", userId);

      const response = await MessageService.getConversations();
      console.log("[DEBUG] Raw API response:", response);

      if (response?.success && Array.isArray(response.data)) {
        console.log(
          "[DEBUG] API returned",
          response.data.length,
          "conversations"
        );

        if (response.data.length > 0) {
          // Để debug, log mẫu conversation đầu tiên
          console.log(
            "[DEBUG] First conversation sample:",
            JSON.stringify(response.data[0], null, 2)
          );

          // Kiểm tra tính hợp lệ của mỗi cuộc trò chuyện
          const validConversations = response.data.filter(
            (conv) => conv && conv.otherUser && conv.otherUser._id
          );

          if (validConversations.length !== response.data.length) {
            console.warn(
              "[DEBUG] Filtered out",
              response.data.length - validConversations.length,
              "invalid conversations"
            );
          }

          // Log để debug otherUser
          if (validConversations.length > 0) {
            console.log(
              "[DEBUG] First valid otherUser:",
              validConversations[0].otherUser
            );
          }

          console.log(
            "[DEBUG] Valid conversations count:",
            validConversations.length
          );

          dispatch(setConversations(validConversations));
        } else {
          console.log("[DEBUG] No conversations found in API response");
          dispatch(setConversations([]));
        }
      } else {
        console.warn("[DEBUG] Invalid API response format:", response);
        dispatch(setConversations([]));
      }
    } catch (error) {
      console.error("[DEBUG] Error fetching conversations:", error);
      dispatch(setError(error.message));
      toast.error("Không thể tải danh sách cuộc trò chuyện");
      dispatch(setConversations([]));
    } finally {
      dispatch(setLoading({ type: "conversations", value: false }));
    }
  };

  const fetchUsers = async () => {
    if (!userId) return;

    try {
      console.log("[DEBUG] Fetching all users...");
      const response = await UserService.getAllUsers();
      console.log("[DEBUG] Users API response:", response);

      if (response?.success && response?.data) {
        console.log("[DEBUG] Found users:", response.data.length);
        setAllUsers(response.data);
      } else {
        console.warn("[DEBUG] No users found or invalid response:", response);
      }
    } catch (error) {
      console.error("[DEBUG] Error fetching users:", error);
    }
  };

  const fetchMessages = async (targetUserId, page = 1) => {
    if (!userId || !targetUserId) {
      console.warn(
        "[DEBUG] Missing user IDs for fetchMessages - currentUser:",
        userId,
        "targetUser:",
        targetUserId
      );
      return;
    }

    try {
      dispatch(setLoading({ type: "messages", value: true }));

      console.log(
        "[DEBUG] Fetching messages between users:",
        userId,
        "and",
        targetUserId,
        "page:",
        page
      );

      const response = await MessageService.getMessages(
        targetUserId,
        page,
        pagination.limit
      );
      console.log("[DEBUG] Raw Messages API response:", response);

      if (response?.success && response?.data?.messages) {
        const { messages, pagination: pagingInfo } = response.data;
        console.log(
          "[DEBUG] Messages API returned",
          messages.length,
          "messages"
        );

        // Log first message sample
        if (messages.length > 0) {
          console.log(
            "[DEBUG] First message sample:",
            JSON.stringify(messages[0], null, 2)
          );
        } else {
          console.log("[DEBUG] No messages found between users");
        }

        // Lọc tin nhắn trùng lặp nếu đang tải thêm (không phải trang đầu tiên)
        const filteredMessages =
          page === 1
            ? messages
            : messages.filter(
                (msg) => !currentMessages.some((m) => m._id === msg._id)
              );

        console.log(
          "[DEBUG] After filtering duplicates:",
          filteredMessages.length,
          "new messages"
        );

        // Cập nhật tin nhắn và phân trang
        if (page === 1) {
          dispatch(setCurrentMessages(messages));
        } else {
          dispatch(
            setCurrentMessages([...currentMessages, ...filteredMessages])
          );
        }

        dispatch(
          updatePagination({
            page: pagingInfo?.page || page,
            hasMore: pagingInfo?.hasMore || false,
          })
        );

        // Tìm các tin nhắn chưa đọc để đánh dấu
        const unreadMessages = messages.filter(
          (msg) =>
            msg.sender._id !== userId && // Tin nhắn từ người khác gửi cho mình
            !msg.isRead // Chưa đọc
        );

        console.log(
          "[DEBUG] Found",
          unreadMessages.length,
          "unread messages to mark as read"
        );

        if (unreadMessages.length > 0) {
          markMessagesAsRead(unreadMessages.map((msg) => msg._id));
        }
      } else {
        console.warn("[DEBUG] Invalid messages response format:", response);

        if (page === 1) {
          dispatch(setCurrentMessages([]));
        }
      }
    } catch (error) {
      console.error("[DEBUG] Error fetching messages:", error);
      toast.error("Không thể tải tin nhắn");
    } finally {
      dispatch(setLoading({ type: "messages", value: false }));
    }
  };

  const sendNewMessage = async (content) => {
    if (!selectedUser?._id || !content.trim() || !userId) {
      toast.error("Không thể gửi tin nhắn");
      return;
    }

    try {
      dispatch(setLoading({ type: "sending", value: true }));
      const messageData = {
        receiver: selectedUser._id,
        content: content.trim(),
      };

      const response = await MessageService.sendMessage(messageData);

      if (response?.success && response.data) {
        const newMessage = {
          ...response.data,
          sender: userId,
          receiver: selectedUser._id,
          createdAt: new Date().toISOString(),
          isRead: false,
        };

        dispatch(addMessage(newMessage));

        // Update conversation list
        const updatedConversation = {
          otherUser: selectedUser,
          lastMessage: {
            _id: newMessage._id,
            content: newMessage.content,
            createdAt: newMessage.createdAt,
            senderId: userId,
          },
          unreadCount: 0,
        };

        dispatch(addConversation(updatedConversation));

        // Emit socket event if socket is connected
        if (isConnected) {
          console.log("Emitting send_message via socket:", {
            message: newMessage,
            receiverId: selectedUser._id,
            senderId: userId,
          });

          sendMessage({
            message: newMessage,
            receiverId: selectedUser._id,
            senderId: userId,
          });
        } else {
          console.warn("Socket not connected, message sent via API only");
        }
      }
    } catch (error) {
      console.error("Error sending message:", error);
      toast.error("Không thể gửi tin nhắn");
    } finally {
      dispatch(setLoading({ type: "sending", value: false }));
    }
  };

  const selectUser = (user) => {
    if (!user || !user._id) {
      console.warn("[DEBUG] Invalid user object:", user);
      return;
    }

    const targetUserId = user._id;
    console.log("[DEBUG] Selecting user:", targetUserId, user.email);

    // Lưu người dùng đang chọn vào state
    dispatch(setSelectedUser(user));

    // Kiểm tra nếu đã chọn cùng một người dùng, không cần tải lại tin nhắn
    if (selectedUser && selectedUser._id === targetUserId) {
      console.log("[DEBUG] Same user already selected, not reloading messages");
      return;
    }

    // Khởi tạo phòng chat
    const roomId = [userId, targetUserId].sort().join("_");
    joinRoom(roomId);
    console.log("[DEBUG] Joined room:", roomId);

    // Reset và tải tin nhắn
    dispatch(setCurrentMessages([]));
    dispatch(updatePagination({ page: 1, hasMore: true }));
    fetchMessages(targetUserId, 1);

    // Lưu lại lịch sử trong URL
    navigate(`/messages/${targetUserId}`, {
      state: { selectedUser: user },
      replace: true,
    });
  };

  const markMessagesAsRead = async (messageIds) => {
    if (!messageIds?.length || !selectedUser?._id || !userId) {
      console.warn("Invalid parameters for marking messages as read");
      return;
    }

    try {
      console.log("Marking messages as read:", messageIds);
      const response = await MessageService.markAsRead(messageIds);

      if (response?.success && response.data?.modifiedCount > 0) {
        // Update local state for successfully marked messages
        messageIds.forEach((id) => dispatch(markMessageAsRead(id)));

        // Update conversation unread count
        const currentConversation = conversations.find(
          (c) => c.otherUser._id === selectedUser._id
        );

        if (currentConversation) {
          const updatedConversation = {
            ...currentConversation,
            unreadCount: Math.max(
              0,
              (currentConversation.unreadCount || 0) -
                response.data.modifiedCount
            ),
          };
          dispatch(addConversation(updatedConversation));
        }

        // Emit socket event for successfully marked messages if socket is connected
        if (isConnected) {
          console.log("Emitting mark_as_read via socket:", {
            messageIds,
            receiverId: selectedUser._id,
            senderId: userId,
            count: response.data.modifiedCount,
          });

          socket.emit("mark_as_read", {
            messageIds,
            receiverId: selectedUser._id,
            senderId: userId,
            count: response.data.modifiedCount,
          });
        }
      } else {
        console.warn("Failed to mark some or all messages as read:", response);
      }
    } catch (error) {
      console.error("Error marking messages as read:", error);
      toast.error("Không thể đánh dấu tin nhắn đã đọc");
    }
  };

  const loadMoreMessages = async () => {
    if (!selectedUser || !pagination.hasMore || loading.messages) return;

    const nextPage = pagination.page + 1;
    console.log("Loading more messages, page:", nextPage);
    fetchMessages(selectedUser._id, nextPage);
  };

  return {
    conversations,
    currentMessages,
    selectedUser,
    loading,
    pagination,
    sendNewMessage,
    selectUser,
    markMessagesAsRead,
    loadMoreMessages,
    allUsers,
    fetchUsers,
  };
};

export default useMessages;
