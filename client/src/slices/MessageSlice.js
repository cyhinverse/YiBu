import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  conversations: [],
  currentConversation: null,
  messages: [],
  loading: false,
  error: null,
  unreadCount: 0,
};

const messageSlice = createSlice({
  name: "message",
  initialState,
  reducers: {
    // Set all conversations
    setConversations: (state, action) => {
      state.conversations = action.payload;
      // Calculate total unread count
      state.unreadCount = action.payload.reduce(
        (count, conv) => count + (conv.unreadCount || 0),
        0
      );
    },

    // Add a new conversation or update existing one
    updateConversation: (state, action) => {
      const { conversationId, data } = action.payload;
      const index = state.conversations.findIndex(
        (conv) => conv._id === conversationId
      );

      if (index !== -1) {
        state.conversations[index] = { ...state.conversations[index], ...data };
      } else {
        state.conversations.unshift(data);
      }

      // Recalculate unread count
      state.unreadCount = state.conversations.reduce(
        (count, conv) => count + (conv.unreadCount || 0),
        0
      );
    },

    // Set current conversation
    setCurrentConversation: (state, action) => {
      state.currentConversation = action.payload;
    },

    // Set messages for current conversation
    setMessages: (state, action) => {
      state.messages = action.payload;
    },

    // Add a new message
    addMessage: (state, action) => {
      const message = action.payload;
      state.messages.push(message);

      // Update conversation with latest message if needed
      if (state.currentConversation) {
        const conversationId =
          message.sender._id === state.currentConversation._id
            ? message.sender._id
            : message.receiver._id;

        const index = state.conversations.findIndex(
          (conv) => conv._id === conversationId
        );

        if (index !== -1) {
          state.conversations[index].latestMessage = message;
        }
      }
    },

    // Mark messages as read
    markAsRead: (state, action) => {
      const { messageIds, conversationId } = action.payload;

      // Update messages
      state.messages = state.messages.map((msg) =>
        messageIds.includes(msg._id) ? { ...msg, isRead: true } : msg
      );

      // Update conversation unread count
      if (conversationId) {
        const index = state.conversations.findIndex(
          (conv) => conv._id === conversationId
        );

        if (index !== -1) {
          state.conversations[index].unreadCount = 0;
          if (state.conversations[index].latestMessage) {
            state.conversations[index].latestMessage.isRead = true;
          }
        }

        // Recalculate total unread count
        state.unreadCount = state.conversations.reduce(
          (count, conv) => count + (conv.unreadCount || 0),
          0
        );
      }
    },

    // Set loading state
    setLoading: (state, action) => {
      state.loading = action.payload;
    },

    // Set error state
    setError: (state, action) => {
      state.error = action.payload;
    },

    // Reset message state
    resetMessages: (state) => {
      Object.assign(state, initialState);
    },
  },
});

export const {
  setConversations,
  updateConversation,
  setCurrentConversation,
  setMessages,
  addMessage,
  markAsRead,
  setLoading,
  setError,
  resetMessages,
} = messageSlice.actions;

export default messageSlice.reducer;
