import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  conversations: [],
  messages: {},
  unreadCount: 0,
  activeConversation: null,
  typingUsers: {},
  loading: false,
  error: null,
};

const messageSlice = createSlice({
  name: "messages",
  initialState,
  reducers: {
    startLoading: (state) => {
      state.loading = true;
      state.error = null;
    },

    hasError: (state, action) => {
      state.loading = false;
      state.error = action.payload;
    },

    setConversations: (state, action) => {
      state.conversations = action.payload;
      state.loading = false;

      // Đếm tổng số tin nhắn chưa đọc
      state.unreadCount = state.conversations.reduce(
        (total, conv) => total + (conv.unreadCount || 0),
        0
      );
    },

    setActiveConversation: (state, action) => {
      state.activeConversation = action.payload;
    },

    // Thêm một cuộc trò chuyện mới
    addConversation: (state, action) => {
      const newConv = action.payload;
      const exists = state.conversations.some((c) => c._id === newConv._id);

      if (!exists) {
        state.conversations = [newConv, ...state.conversations];
      }
    },

    // Cập nhật tin nhắn mới nhất của một cuộc trò chuyện
    updateLatestMessage: (state, action) => {
      const { conversationId, message, isRead } = action.payload;

      state.conversations = state.conversations.map((conv) => {
        if (conv._id === conversationId) {
          const newUnreadCount =
            !isRead && conv.user._id !== message.sender._id
              ? (conv.unreadCount || 0) + 1
              : conv.unreadCount;

          return {
            ...conv,
            latestMessage: message,
            unreadCount: newUnreadCount,
          };
        }
        return conv;
      });

      // Sắp xếp lại theo thời gian tin nhắn mới nhất
      state.conversations.sort(
        (a, b) =>
          new Date(b.latestMessage.createdAt) -
          new Date(a.latestMessage.createdAt)
      );

      // Cập nhật tổng số tin nhắn chưa đọc
      state.unreadCount = state.conversations.reduce(
        (total, conv) => total + (conv.unreadCount || 0),
        0
      );
    },

    // Thiết lập danh sách tin nhắn cho một cuộc trò chuyện
    setMessages: (state, action) => {
      const { conversationId, messages } = action.payload;
      state.messages[conversationId] = messages;
    },

    // Thêm một tin nhắn mới vào một cuộc trò chuyện
    addMessage: (state, action) => {
      const { conversationId, message } = action.payload;

      if (!state.messages[conversationId]) {
        state.messages[conversationId] = [];
      }

      // Kiểm tra xem tin nhắn đã tồn tại chưa
      const exists = state.messages[conversationId].some(
        (m) => m._id === message._id
      );

      if (!exists) {
        state.messages[conversationId].push(message);

        // Sắp xếp theo thời gian
        state.messages[conversationId].sort(
          (a, b) => new Date(a.createdAt) - new Date(b.createdAt)
        );
      }
    },

    // Đánh dấu tin nhắn đã đọc
    markMessagesAsRead: (state, action) => {
      const { conversationId, messageIds } = action.payload;

      // Cập nhật trạng thái đã đọc cho từng tin nhắn
      if (state.messages[conversationId]) {
        state.messages[conversationId] = state.messages[conversationId].map(
          (msg) =>
            messageIds.includes(msg._id) ? { ...msg, isRead: true } : msg
        );
      }

      // Cập nhật số tin nhắn chưa đọc của cuộc trò chuyện
      state.conversations = state.conversations.map((conv) => {
        if (conv._id === conversationId) {
          // Chỉ reset unreadCount nếu chúng ta đang xem cuộc trò chuyện này
          const isActive = state.activeConversation === conversationId;
          return {
            ...conv,
            unreadCount: isActive ? 0 : conv.unreadCount,
            latestMessage:
              conv.latestMessage && messageIds.includes(conv.latestMessage._id)
                ? { ...conv.latestMessage, isRead: true }
                : conv.latestMessage,
          };
        }
        return conv;
      });

      // Cập nhật tổng số tin nhắn chưa đọc
      state.unreadCount = state.conversations.reduce(
        (total, conv) => total + (conv.unreadCount || 0),
        0
      );
    },

    // Cập nhật trạng thái người dùng đang nhập
    setUserTyping: (state, action) => {
      const { userId, isTyping } = action.payload;
      state.typingUsers = {
        ...state.typingUsers,
        [userId]: isTyping,
      };

      // Xóa trạng thái typing nếu là false
      if (!isTyping) {
        const newTypingUsers = { ...state.typingUsers };
        delete newTypingUsers[userId];
        state.typingUsers = newTypingUsers;
      }
    },

    // Xóa tin nhắn
    deleteMessage: (state, action) => {
      const { conversationId, messageId } = action.payload;

      if (state.messages[conversationId]) {
        state.messages[conversationId] = state.messages[conversationId].filter(
          (msg) => msg._id !== messageId
        );
      }
    },

    // Reset state khi đăng xuất
    resetState: () => initialState,
  },
});

export const {
  startLoading,
  hasError,
  setConversations,
  setActiveConversation,
  addConversation,
  updateLatestMessage,
  setMessages,
  addMessage,
  markMessagesAsRead,
  setUserTyping,
  deleteMessage,
  resetState,
} = messageSlice.actions;

export default messageSlice.reducer;
