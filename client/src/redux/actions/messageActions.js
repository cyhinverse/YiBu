import { createAsyncThunk } from "@reduxjs/toolkit";
import api from "../../axios/axiosConfig";
import { MESSAGE_API_ENDPOINTS } from "../../axios/apiEndpoint";

export const getConversations = createAsyncThunk(
  "message/getConversations",
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get(MESSAGE_API_ENDPOINTS.GET_CONVERSATIONS);
      if (response.data.code === 1) {
        return response.data.data;
      }
      return rejectWithValue(response.data.message);
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

export const getMessages = createAsyncThunk(
  "message/getMessages",
  async ({ userId, page, limit }, { rejectWithValue }) => {
    try {
      const response = await api.get(`${MESSAGE_API_ENDPOINTS.GET_MESSAGES}/${userId}?page=${page}&limit=${limit}`);
      if (response.data.code === 1) {
        // Adapt to match what service returned: { messages: data, pagination: ... }
        // Service did: 
        // data: {
        //   messages: data.data,
        //   pagination: { ... hasMore: data.data.length === limit }
        // }
        // We replicate this structure
        const messages = response.data.data;
        return { 
            userId, 
            data: {
                messages: messages,
                pagination: {
                    page,
                    limit,
                    hasMore: messages.length === limit
                }
            }
        };
      }
      return rejectWithValue(response.data.message);
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

export const sendMessage = createAsyncThunk(
  "message/sendMessage",
  async (messageData, { rejectWithValue }) => {
    try {
      const { receiverId, content, media = null } = messageData;
      if (!receiverId) throw new Error("receiverId is required");

      const response = await api.post(MESSAGE_API_ENDPOINTS.SEND_MESSAGE, {
          receiverId,
          content,
          media
      });
      
      if (response.data.code === 1) {
        return response.data.data;
      }
      return rejectWithValue(response.data.message);
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

export const markAsRead = createAsyncThunk(
  "message/markAsRead",
  async (messageIds, { rejectWithValue }) => {
    try {
      const ids = Array.isArray(messageIds) ? messageIds : [messageIds];
      const response = await api.put(MESSAGE_API_ENDPOINTS.MARK_AS_READ, { messageIds: ids });
      if (response.data.code === 1) {
        return ids;
      }
      return rejectWithValue(response.data.message);
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

export const deleteMessage = createAsyncThunk(
  "message/deleteMessage",
  async ({ messageId, conversationId }, { rejectWithValue }) => {
    try {
      const response = await api.delete(`${MESSAGE_API_ENDPOINTS.DELETE_MESSAGE}/${messageId}`);
      if (response.data.code === 1) {
        return { messageId, conversationId };
      }
      return rejectWithValue(response.data.message);
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

export const deleteConversation = createAsyncThunk(
  "message/deleteConversation",
  async (partnerId, { rejectWithValue }) => {
    try {
       // Service used /api/messages/conversation/${partnerId}
      const response = await api.delete(`${MESSAGE_API_ENDPOINTS.DELETE_CONVERSATION}/${partnerId}`);
      if (response.data.code === 1) {
        return partnerId; 
      }
      return rejectWithValue(response.data.message);
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);