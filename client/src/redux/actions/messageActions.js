import { createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../axios/axiosConfig';
import { MESSAGE_API } from '../../axios/apiEndpoint';

// Helper to extract data from response
// Server returns { code, message, data } format, we need to extract the actual data
const extractData = response => {
  const responseData = response.data;
  return responseData?.data !== undefined ? responseData.data : responseData;
};

// ========== Conversations ==========

// Get Conversations
export const getConversations = createAsyncThunk(
  'message/getConversations',
  async ({ page = 1, limit = 20 } = {}, { rejectWithValue }) => {
    try {
      const response = await api.get(MESSAGE_API.GET_CONVERSATIONS, {
        params: { page, limit },
      });
      const data = extractData(response);
      return { ...data, isLoadMore: page > 1 };
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Lấy danh sách hội thoại thất bại'
      );
    }
  }
);

// Get Conversation by ID
export const getConversationById = createAsyncThunk(
  'message/getConversationById',
  async (conversationId, { rejectWithValue }) => {
    try {
      const response = await api.get(
        MESSAGE_API.GET_CONVERSATION(conversationId)
      );
      return extractData(response);
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Lấy thông tin hội thoại thất bại'
      );
    }
  }
);

// Get Conversation by ID (For List/Background)
export const getConversationForList = createAsyncThunk(
  'message/getConversationForList',
  async (conversationId, { rejectWithValue }) => {
    try {
      const response = await api.get(
        MESSAGE_API.GET_CONVERSATION(conversationId)
      );
      return extractData(response);
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Lấy thông tin hội thoại thất bại'
      );
    }
  }
);

// Check and Fetch Conversation (Middleware logic)
export const checkAndFetchConversation = createAsyncThunk(
  'message/checkAndFetch',
  async (conversationId, { getState, dispatch }) => {
    const { message } = getState();
    const exists = message.conversations.some(
      c => (c._id || c.id || c.conversationId) === conversationId
    );
    if (!exists) {
      await dispatch(getConversationForList(conversationId));
    }
  }
);

// Create Conversation
export const createConversation = createAsyncThunk(
  'message/createConversation',
  async (participantId, { rejectWithValue }) => {
    try {
      const response = await api.post(MESSAGE_API.CREATE_CONVERSATION, {
        participantId,
      });
      return extractData(response);
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Tạo hội thoại thất bại'
      );
    }
  }
);

// Delete Conversation
export const deleteConversation = createAsyncThunk(
  'message/deleteConversation',
  async (conversationId, { rejectWithValue }) => {
    try {
      await api.delete(MESSAGE_API.DELETE_CONVERSATION(conversationId));
      return { conversationId };
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Xóa hội thoại thất bại'
      );
    }
  }
);

// ========== Groups ==========

// Create Group
export const createGroup = createAsyncThunk(
  'message/createGroup',
  async ({ name, participantIds }, { rejectWithValue }) => {
    try {
      const response = await api.post(MESSAGE_API.CREATE_GROUP, {
        name,
        participantIds,
      });
      return extractData(response);
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Tạo nhóm thất bại'
      );
    }
  }
);

// Update Group
export const updateGroup = createAsyncThunk(
  'message/updateGroup',
  async ({ groupId, data }, { rejectWithValue }) => {
    try {
      const response = await api.put(MESSAGE_API.UPDATE_GROUP(groupId), data);
      return extractData(response);
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Cập nhật nhóm thất bại'
      );
    }
  }
);

// Add Group Member
export const addGroupMember = createAsyncThunk(
  'message/addGroupMember',
  async ({ groupId, memberIds }, { rejectWithValue }) => {
    try {
      // Ensure memberIds is an array
      const ids = Array.isArray(memberIds) ? memberIds : [memberIds];
      const response = await api.post(MESSAGE_API.ADD_MEMBERS(groupId), {
        memberIds: ids,
      });
      const data = extractData(response);
      return { groupId, ...data };
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Thêm thành viên thất bại'
      );
    }
  }
);

// Remove Group Member
export const removeGroupMember = createAsyncThunk(
  'message/removeGroupMember',
  async ({ groupId, userId }, { rejectWithValue }) => {
    try {
      await api.delete(MESSAGE_API.REMOVE_MEMBER(groupId, userId));
      return { groupId, userId };
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Xóa thành viên thất bại'
      );
    }
  }
);

// Leave Group
export const leaveGroup = createAsyncThunk(
  'message/leaveGroup',
  async (groupId, { rejectWithValue }) => {
    try {
      await api.post(MESSAGE_API.LEAVE_GROUP(groupId));
      return { groupId };
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Rời nhóm thất bại'
      );
    }
  }
);

// ========== Messages ==========

// Get Messages
export const getMessages = createAsyncThunk(
  'message/getMessages',
  async (
    { conversationId, page = 1, limit = 50, before },
    { rejectWithValue }
  ) => {
    try {
      const response = await api.get(MESSAGE_API.GET_MESSAGES(conversationId), {
        params: { page, limit, before },
      });
      const data = extractData(response);
      return { ...data, conversationId, isLoadMore: page > 1 };
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Lấy tin nhắn thất bại'
      );
    }
  }
);

// Send Message
export const sendMessage = createAsyncThunk(
  'message/sendMessage',
  async (
    { conversationId, content, type = 'text', attachments },
    { rejectWithValue }
  ) => {
    try {
      const formData = new FormData();
      formData.append('conversationId', conversationId);
      formData.append('content', content);
      formData.append('type', type);
      if (attachments) {
        attachments.forEach(file => {
          formData.append('attachments', file);
        });
      }
      const response = await api.post(MESSAGE_API.SEND, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      const data = extractData(response);
      return { ...data, conversationId };
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Gửi tin nhắn thất bại'
      );
    }
  }
);

// Delete Message
export const deleteMessage = createAsyncThunk(
  'message/deleteMessage',
  async ({ conversationId, messageId }, { rejectWithValue }) => {
    try {
      await api.delete(MESSAGE_API.DELETE_MESSAGE(messageId));
      return { conversationId, messageId };
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Xóa tin nhắn thất bại'
      );
    }
  }
);

// ========== Status & Reactions ==========

// Mark Conversation as Read
export const markMessagesAsRead = createAsyncThunk(
  'message/markAsRead',
  async (conversationId, { rejectWithValue }) => {
    try {
      await api.post(MESSAGE_API.MARK_CONVERSATION_READ(conversationId));
      return { conversationId };
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Đánh dấu đã đọc thất bại'
      );
    }
  }
);

// Mark Message as Read
export const markMessageAsRead = createAsyncThunk(
  'message/markMessageAsRead',
  async (messageId, { rejectWithValue }) => {
    try {
      await api.post(MESSAGE_API.MARK_MESSAGE_READ(messageId));
      return { messageId };
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Đánh dấu tin nhắn đã đọc thất bại'
      );
    }
  }
);

// Get Unread Count
export const getUnreadCount = createAsyncThunk(
  'message/getUnreadCount',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get(MESSAGE_API.GET_UNREAD_COUNT);
      const data = extractData(response);
      // Extract count from response
      const count = data?.unreadCount ?? data?.count ?? data ?? 0;
      return typeof count === 'number' ? count : 0;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Lấy số tin nhắn chưa đọc thất bại'
      );
    }
  }
);

// ========== Typing ==========

// Send Typing Indicator
export const sendTypingIndicator = createAsyncThunk(
  'message/sendTyping',
  async ({ conversationId, isTyping }, { rejectWithValue }) => {
    try {
      await api.post(MESSAGE_API.TYPING(conversationId), { isTyping });
      return { conversationId, isTyping };
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Gửi trạng thái đang nhập thất bại'
      );
    }
  }
);

// ========== Search ==========

// Search Messages
export const searchMessages = createAsyncThunk(
  'message/searchMessages',
  async (
    { query, conversationId, page = 1, limit = 20 },
    { rejectWithValue }
  ) => {
    try {
      const response = await api.get(MESSAGE_API.SEARCH, {
        params: { q: query, conversationId, page, limit },
      });
      const data = extractData(response);
      return { ...data, isLoadMore: page > 1 };
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Tìm kiếm tin nhắn thất bại'
      );
    }
  }
);

// Get Users for Chat
export const getUsersForChat = createAsyncThunk(
  'message/getUsersForChat',
  async ({ query, page = 1, limit = 20 } = {}, { rejectWithValue }) => {
    try {
      const response = await api.get(MESSAGE_API.GET_USERS, {
        params: { q: query, page, limit },
      });
      const data = extractData(response);
      return { ...data, isLoadMore: page > 1 };
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message ||
          'Lấy danh sách người dùng để chat thất bại'
      );
    }
  }
);
