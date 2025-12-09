import { createSlice } from "@reduxjs/toolkit";
import {
  getConversations,
  getConversationById,
  createConversation,
  deleteConversation,
  createGroup,
  updateGroup,
  addGroupMember,
  removeGroupMember,
  leaveGroup,
  getMessages,
  sendMessage,
  deleteMessage,
  markMessagesAsRead,
  markMessageAsRead,
  getUnreadCount,
  addReaction,
  removeReaction,
  searchMessages,
  getUsersForChat,
  muteConversation,
  unmuteConversation,
  getConversationMedia,
} from "../actions/messageActions";

const initialState = {
  conversations: [],
  currentConversation: null,
  messages: {},
  usersForChat: [],
  conversationMedia: {},
  unreadCount: 0,
  loading: false,
  sendingMessage: false,
  error: null,
};

const messageSlice = createSlice({
  name: "message",
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    setCurrentConversation: (state, action) => {
      state.currentConversation = action.payload;
    },
    addMessageOptimistic: (state, action) => {
      const { conversationId, message } = action.payload;
      if (!state.messages[conversationId]) {
        state.messages[conversationId] = [];
      }
      state.messages[conversationId].push(message);
    },
    updateMessageStatus: (state, action) => {
      const { conversationId, messageId, status } = action.payload;
      if (state.messages[conversationId]) {
        const message = state.messages[conversationId].find(
          (m) => m.id === messageId
        );
        if (message) {
          message.status = status;
        }
      }
    },
    receiveMessage: (state, action) => {
      const message = action.payload;
      const conversationId = message.conversationId;
      if (!state.messages[conversationId]) {
        state.messages[conversationId] = [];
      }
      const exists = state.messages[conversationId].some(
        (m) => m.id === message.id
      );
      if (!exists) {
        state.messages[conversationId].push(message);
      }
      // Update conversation last message
      const convIndex = state.conversations.findIndex(
        (c) => c.id === conversationId
      );
      if (convIndex !== -1) {
        state.conversations[convIndex].lastMessage = message;
        state.conversations[convIndex].updatedAt = message.createdAt;
        // Move to top
        const [conv] = state.conversations.splice(convIndex, 1);
        state.conversations.unshift(conv);
      }
    },
    setTyping: (state, action) => {
      const { conversationId, userId, isTyping } = action.payload;
      const conv = state.conversations.find((c) => c.id === conversationId);
      if (conv) {
        if (!conv.typingUsers) conv.typingUsers = [];
        if (isTyping && !conv.typingUsers.includes(userId)) {
          conv.typingUsers.push(userId);
        } else if (!isTyping) {
          conv.typingUsers = conv.typingUsers.filter((id) => id !== userId);
        }
      }
    },
    resetMessageState: () => initialState,
  },
  extraReducers: (builder) => {
    builder
      // Get Conversations
      .addCase(getConversations.pending, (state) => {
        state.loading = true;
      })
      .addCase(getConversations.fulfilled, (state, action) => {
        state.loading = false;
        state.conversations = action.payload;
      })
      .addCase(getConversations.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Create Conversation
      .addCase(createConversation.fulfilled, (state, action) => {
        const exists = state.conversations.some(
          (c) => c.id === action.payload.id
        );
        if (!exists) {
          state.conversations.unshift(action.payload);
        }
        state.currentConversation = action.payload;
      })
      // Get Conversation by ID
      .addCase(getConversationById.fulfilled, (state, action) => {
        state.currentConversation = action.payload;
      })
      // Delete Conversation
      .addCase(deleteConversation.fulfilled, (state, action) => {
        state.conversations = state.conversations.filter(
          (c) => c.id !== action.payload.conversationId
        );
        if (state.currentConversation?.id === action.payload.conversationId) {
          state.currentConversation = null;
        }
        delete state.messages[action.payload.conversationId];
      })
      // Create Group
      .addCase(createGroup.fulfilled, (state, action) => {
        state.conversations.unshift(action.payload);
        state.currentConversation = action.payload;
      })
      // Update Group
      .addCase(updateGroup.fulfilled, (state, action) => {
        const index = state.conversations.findIndex(
          (c) => c.id === action.payload.id
        );
        if (index !== -1) {
          state.conversations[index] = action.payload;
        }
        if (state.currentConversation?.id === action.payload.id) {
          state.currentConversation = action.payload;
        }
      })
      // Add Group Member
      .addCase(addGroupMember.fulfilled, (state, action) => {
        const { conversationId, member } = action.payload;
        const conv = state.conversations.find((c) => c.id === conversationId);
        if (conv) {
          if (!conv.members) conv.members = [];
          conv.members.push(member);
        }
      })
      // Remove Group Member
      .addCase(removeGroupMember.fulfilled, (state, action) => {
        const { conversationId, memberId } = action.payload;
        const conv = state.conversations.find((c) => c.id === conversationId);
        if (conv && conv.members) {
          conv.members = conv.members.filter((m) => m.id !== memberId);
        }
      })
      // Leave Group
      .addCase(leaveGroup.fulfilled, (state, action) => {
        state.conversations = state.conversations.filter(
          (c) => c.id !== action.payload.conversationId
        );
        if (state.currentConversation?.id === action.payload.conversationId) {
          state.currentConversation = null;
        }
      })
      // Get Messages
      .addCase(getMessages.pending, (state) => {
        state.loading = true;
      })
      .addCase(getMessages.fulfilled, (state, action) => {
        state.loading = false;
        const { conversationId, messages, isLoadMore } = action.payload;
        if (isLoadMore) {
          state.messages[conversationId] = [
            ...messages,
            ...(state.messages[conversationId] || []),
          ];
        } else {
          state.messages[conversationId] = messages;
        }
      })
      .addCase(getMessages.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Send Message
      .addCase(sendMessage.pending, (state) => {
        state.sendingMessage = true;
      })
      .addCase(sendMessage.fulfilled, (state, action) => {
        state.sendingMessage = false;
        const message = action.payload;
        const conversationId = message.conversationId;
        if (!state.messages[conversationId]) {
          state.messages[conversationId] = [];
        }
        // Replace optimistic message or add new
        const tempIndex = state.messages[conversationId].findIndex(
          (m) => m.tempId === message.tempId
        );
        if (tempIndex !== -1) {
          state.messages[conversationId][tempIndex] = message;
        } else {
          state.messages[conversationId].push(message);
        }
        // Update conversation
        const convIndex = state.conversations.findIndex(
          (c) => c.id === conversationId
        );
        if (convIndex !== -1) {
          state.conversations[convIndex].lastMessage = message;
          const [conv] = state.conversations.splice(convIndex, 1);
          state.conversations.unshift(conv);
        }
      })
      .addCase(sendMessage.rejected, (state, action) => {
        state.sendingMessage = false;
        state.error = action.payload;
      })
      // Delete Message
      .addCase(deleteMessage.fulfilled, (state, action) => {
        const { conversationId, messageId } = action.payload;
        if (state.messages[conversationId]) {
          state.messages[conversationId] = state.messages[
            conversationId
          ].filter((m) => m.id !== messageId);
        }
      })
      // Mark Messages As Read
      .addCase(markMessagesAsRead.fulfilled, (state, action) => {
        const { conversationId } = action.payload;
        const conv = state.conversations.find((c) => c.id === conversationId);
        if (conv) {
          conv.unreadCount = 0;
        }
      })
      // Mark Message As Read
      .addCase(markMessageAsRead.fulfilled, (state, action) => {
        const { conversationId, messageId } = action.payload;
        if (state.messages[conversationId]) {
          const message = state.messages[conversationId].find(
            (m) => m.id === messageId
          );
          if (message) {
            message.isRead = true;
          }
        }
      })
      // Get Unread Count
      .addCase(getUnreadCount.fulfilled, (state, action) => {
        state.unreadCount = action.payload;
      })
      // Add Reaction
      .addCase(addReaction.fulfilled, (state, action) => {
        const { conversationId, messageId, reaction } = action.payload;
        if (state.messages[conversationId]) {
          const message = state.messages[conversationId].find(
            (m) => m.id === messageId
          );
          if (message) {
            if (!message.reactions) message.reactions = [];
            message.reactions.push(reaction);
          }
        }
      })
      // Remove Reaction
      .addCase(removeReaction.fulfilled, (state, action) => {
        const { conversationId, messageId, userId } = action.payload;
        if (state.messages[conversationId]) {
          const message = state.messages[conversationId].find(
            (m) => m.id === messageId
          );
          if (message && message.reactions) {
            message.reactions = message.reactions.filter(
              (r) => r.userId !== userId
            );
          }
        }
      })
      // Search Messages
      .addCase(searchMessages.fulfilled, (state, action) => {
        // Handle search results
      })
      // Get Users for Chat
      .addCase(getUsersForChat.fulfilled, (state, action) => {
        state.usersForChat = action.payload;
      })
      // Mute Conversation
      .addCase(muteConversation.fulfilled, (state, action) => {
        const conv = state.conversations.find(
          (c) => c.id === action.payload.conversationId
        );
        if (conv) {
          conv.isMuted = true;
        }
      })
      // Unmute Conversation
      .addCase(unmuteConversation.fulfilled, (state, action) => {
        const conv = state.conversations.find(
          (c) => c.id === action.payload.conversationId
        );
        if (conv) {
          conv.isMuted = false;
        }
      })
      // Get Conversation Media
      .addCase(getConversationMedia.fulfilled, (state, action) => {
        const { conversationId, media } = action.payload;
        state.conversationMedia[conversationId] = media;
      });
  },
});

export const {
  clearError,
  setCurrentConversation,
  addMessageOptimistic,
  updateMessageStatus,
  receiveMessage,
  setTyping,
  resetMessageState,
} = messageSlice.actions;
export default messageSlice.reducer;
