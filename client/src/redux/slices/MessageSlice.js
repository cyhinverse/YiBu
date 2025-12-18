import { createSlice } from '@reduxjs/toolkit';
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
  searchMessages,
  getUsersForChat,
  getConversationForList,
} from '../actions/messageActions';

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
  name: 'message',
  initialState,
  reducers: {
    clearError: state => {
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
          m => m.id === messageId
        );
        if (message) {
          message.status = status;
        }
      }
    },
    conversationRead: (state, action) => {
      const { conversationId } = action.payload;
      if (state.messages[conversationId]) {
        state.messages[conversationId].forEach(m => {
          if (!m.isMine) return; // Only update own messages
          m.status = 'read';
          m.isRead = true; // Support both flags
        });
      }
    },
    receiveMessage: (state, action) => {
      const message = action.payload;
      const conversationId = message.conversationId;

      // Find the conversation to get its _id (may differ from conversationId in message)
      const conv = state.conversations.find(
        c =>
          (c._id || c.id || c.conversationId) === conversationId ||
          c.directId === conversationId
      );

      // Use conversation._id as primary key if available, fallback to message.conversationId
      const messageKey = conv?._id || conv?.id || conversationId;

      if (!state.messages[messageKey]) {
        state.messages[messageKey] = [];
      }
      const exists = state.messages[messageKey].some(
        m => (m._id || m.id) === (message._id || message.id)
      );
      if (!exists) {
        state.messages[messageKey].push(message);
      }

      // Update conversation last message and unread count
      if (conv) {
        const convIndex = state.conversations.indexOf(conv);
        conv.lastMessage = message;
        conv.updatedAt = message.createdAt;

        // Increment unread count if it's not the current conversation and not our own message
        const currentConvId =
          state.currentConversation?._id ||
          state.currentConversation?.id ||
          state.currentConversation?.conversationId;
        const isCurrentConv =
          currentConvId &&
          (currentConvId === conversationId ||
            currentConvId === conv._id ||
            currentConvId === conv.id);

        if (!isCurrentConv && !message.isMine) {
          conv.unreadCount = (conv.unreadCount || 0) + 1;
          state.unreadCount = (state.unreadCount || 0) + 1;
        }

        // Move to top
        if (convIndex !== -1) {
          state.conversations.splice(convIndex, 1);
          state.conversations.unshift(conv);
        }
      } else if (!message.isMine) {
        // If conversation is not in list but we received a message, increment global unread
        state.unreadCount = (state.unreadCount || 0) + 1;
      }
    },
    setTyping: (state, action) => {
      const { conversationId, userId, isTyping } = action.payload;
      const conv = state.conversations.find(c => c.id === conversationId);
      if (conv) {
        if (!conv.typingUsers) conv.typingUsers = [];
        if (isTyping && !conv.typingUsers.includes(userId)) {
          conv.typingUsers.push(userId);
        } else if (!isTyping) {
          conv.typingUsers = conv.typingUsers.filter(id => id !== userId);
        }
      }
    },
    resetMessageState: () => initialState,
  },
  extraReducers: builder => {
    builder
      // Get Conversations
      .addCase(getConversations.pending, state => {
        state.loading = true;
      })
      .addCase(getConversations.fulfilled, (state, action) => {
        state.loading = false;
        // Data is already extracted
        const fetchedConversations =
          action.payload.conversations || action.payload || [];

        // If we have a currentConversation (e.g. from deep link) that isn't in the fetched list, add it
        if (
          state.currentConversation &&
          !fetchedConversations.find(
            c =>
              (c._id || c.id) ===
              (state.currentConversation._id || state.currentConversation.id)
          )
        ) {
          fetchedConversations.unshift(state.currentConversation);
        }

        state.conversations = fetchedConversations;
      })
      .addCase(getConversations.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Create Conversation
      .addCase(createConversation.fulfilled, (state, action) => {
        // Data is already extracted
        const conversation = action.payload.conversation || action.payload;
        const convId =
          conversation._id || conversation.id || conversation.conversationId;
        const exists = state.conversations.some(
          c => (c._id || c.id || c.conversationId) === convId
        );
        if (!exists) {
          state.conversations.unshift(conversation);
        }
        state.currentConversation = conversation;
      })
      // Get Conversation by ID
      .addCase(getConversationById.fulfilled, (state, action) => {
        // Data is already extracted
        const conversation = action.payload.conversation || action.payload;
        state.currentConversation = conversation;

        // Add to conversations list if not exists (for sidebar)
        const convId =
          conversation._id || conversation.id || conversation.conversationId;
        const exists = state.conversations.some(
          c => (c._id || c.id || c.conversationId) === convId
        );
        if (!exists) {
          state.conversations.unshift(conversation);
        }
      })
      // Get Conversation for List (Background)
      .addCase(getConversationForList.fulfilled, (state, action) => {
        const conversation = action.payload.conversation || action.payload;
        const convId =
          conversation._id || conversation.id || conversation.conversationId;
        const exists = state.conversations.some(
          c => (c._id || c.id || c.conversationId) === convId
        );
        if (!exists) {
          state.conversations.unshift(conversation);
        }
      })
      // Delete Conversation
      .addCase(deleteConversation.fulfilled, (state, action) => {
        state.conversations = state.conversations.filter(
          c => c.id !== action.payload.conversationId
        );
        if (state.currentConversation?.id === action.payload.conversationId) {
          state.currentConversation = null;
        }
        delete state.messages[action.payload.conversationId];
      })
      // Create Group
      .addCase(createGroup.fulfilled, (state, action) => {
        // Data is already extracted
        const group = action.payload.group || action.payload;
        state.conversations.unshift(group);
        state.currentConversation = group;
      })
      // Update Group
      .addCase(updateGroup.fulfilled, (state, action) => {
        // Data is already extracted
        const updatedGroup = action.payload.group || action.payload;
        const index = state.conversations.findIndex(
          c => c._id === updatedGroup._id || c.id === updatedGroup.id
        );
        if (index !== -1) {
          state.conversations[index] = updatedGroup;
        }
        if (
          state.currentConversation?._id === updatedGroup._id ||
          state.currentConversation?.id === updatedGroup.id
        ) {
          state.currentConversation = updatedGroup;
        }
      })
      // Add Group Member
      .addCase(addGroupMember.fulfilled, (state, action) => {
        const { conversationId, member } = action.payload;
        const conv = state.conversations.find(c => c.id === conversationId);
        if (conv) {
          if (!conv.members) conv.members = [];
          conv.members.push(member);
        }
      })
      // Remove Group Member
      .addCase(removeGroupMember.fulfilled, (state, action) => {
        const { conversationId, memberId } = action.payload;
        const conv = state.conversations.find(c => c.id === conversationId);
        if (conv && conv.members) {
          conv.members = conv.members.filter(m => m.id !== memberId);
        }
      })
      // Leave Group
      .addCase(leaveGroup.fulfilled, (state, action) => {
        state.conversations = state.conversations.filter(
          c => c.id !== action.payload.conversationId
        );
        if (state.currentConversation?.id === action.payload.conversationId) {
          state.currentConversation = null;
        }
      })
      // Get Messages
      .addCase(getMessages.pending, state => {
        state.loading = true;
      })
      .addCase(getMessages.fulfilled, (state, action) => {
        state.loading = false;
        const { conversationId, isLoadMore } = action.payload;
        // Data is already extracted
        const messages = action.payload.messages || [];
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
      .addCase(sendMessage.pending, state => {
        state.sendingMessage = true;
      })
      .addCase(sendMessage.fulfilled, (state, action) => {
        state.sendingMessage = false;
        // Data is already extracted
        const message = action.payload.message || action.payload;
        // ALWAYS use the conversationId from URL (originalConversationId)
        const conversationId = action.payload.conversationId;

        console.log('sendMessage.fulfilled - conversationId:', conversationId);
        console.log('sendMessage.fulfilled - message:', message);
        console.log(
          'sendMessage.fulfilled - current messages keys:',
          Object.keys(state.messages)
        );

        if (!state.messages[conversationId]) {
          state.messages[conversationId] = [];
        }

        // Check if message already exists (avoid duplicates)
        const exists = state.messages[conversationId].some(
          m => (m._id || m.id) === (message._id || message.id)
        );

        if (!exists) {
          state.messages[conversationId].push(message);
          console.log(
            'sendMessage.fulfilled - message added to:',
            conversationId
          );
        } else {
          console.log('sendMessage.fulfilled - message already exists');
        }

        // Update conversation lastMessage
        const conv = state.conversations.find(
          c => c._id === conversationId || c.id === conversationId
        );
        if (conv) {
          conv.lastMessage = message;
          const convIndex = state.conversations.indexOf(conv);
          if (convIndex > 0) {
            state.conversations.splice(convIndex, 1);
            state.conversations.unshift(conv);
          }
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
          ].filter(m => m.id !== messageId);
        }
      })
      // Mark Messages As Read
      .addCase(markMessagesAsRead.fulfilled, (state, action) => {
        const { conversationId } = action.payload;
        const conv = state.conversations.find(
          c =>
            (c._id || c.id || c.conversationId) === conversationId ||
            c.directId === conversationId
        );
        if (conv) {
          const count = conv.unreadCount || 0;
          conv.unreadCount = 0;
          if (count > 0) {
            state.unreadCount = Math.max(0, (state.unreadCount || 0) - count);
          }
        }
      })
      // Mark Message As Read
      .addCase(markMessageAsRead.fulfilled, (state, action) => {
        const { conversationId, messageId } = action.payload;
        if (state.messages[conversationId]) {
          const message = state.messages[conversationId].find(
            m => m.id === messageId
          );
          if (message) {
            message.isRead = true;
          }
        }
      })
      // Get Unread Count
      .addCase(getUnreadCount.fulfilled, (state, action) => {
        // Action payload is already a number from the action
        state.unreadCount = action.payload ?? 0;
        console.log('Message unreadCount set to:', state.unreadCount);
      })
      // Search Messages
      .addCase(searchMessages.fulfilled, () => {
        // Handle search results
      })
      // Get Users for Chat
      .addCase(getUsersForChat.fulfilled, (state, action) => {
        // Data is already extracted
        state.usersForChat = action.payload.users || action.payload || [];
      });
  },
});

export const {
  clearError,
  setCurrentConversation,
  addMessageOptimistic,
  updateMessageStatus,
  conversationRead,
  receiveMessage,
  setTyping,
  resetMessageState,
} = messageSlice.actions;
export default messageSlice.reducer;
