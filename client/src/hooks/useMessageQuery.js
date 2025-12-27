import {
  useQuery,
  useMutation,
  useQueryClient,
  useInfiniteQuery,
} from '@tanstack/react-query';
import api from '../axios/axiosConfig';
import { MESSAGE_API } from '../axios/apiEndpoint';

const extractData = response =>
  response?.data?.data || response?.data || response;

export const useConversations = ({ page = 1, limit = 20 } = {}) => {
  return useQuery({
    queryKey: ['messages', 'conversations', { page, limit }],
    queryFn: async () => {
      const response = await api.get(MESSAGE_API.GET_CONVERSATIONS, {
        params: { page, limit },
      });
      return extractData(response);
    },
    keepPreviousData: true,
  });
};

export const useMessages = ({ conversationId, page = 1, limit = 50 } = {}) => {
  return useQuery({
    queryKey: ['messages', 'list', conversationId, { page, limit }],
    queryFn: async () => {
      if (!conversationId) return { messages: [], total: 0 };
      const response = await api.get(MESSAGE_API.GET_MESSAGES(conversationId), {
        params: { page, limit },
      });
      return extractData(response);
    },
    enabled: !!conversationId,
    keepPreviousData: true,
  });
};

export const useInfiniteMessages = ({ conversationId, limit = 50 } = {}) => {
  return useInfiniteQuery({
    queryKey: ['messages', 'infinite', conversationId],
    queryFn: async ({ pageParam = 1 }) => {
      const response = await api.get(MESSAGE_API.GET_MESSAGES(conversationId), {
        params: { page: pageParam, limit },
      });
      return extractData(response);
    },
    getNextPageParam: (lastPage, allPages) => {
      return lastPage.hasMore ? allPages.length + 1 : undefined;
    },
    enabled: !!conversationId,
  });
};

export const useSendMessage = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      conversationId,
      content,
      type = 'text',
      attachments,
    }) => {
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
      return extractData(response);
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries([
        'messages',
        'list',
        variables.conversationId,
      ]);
      queryClient.invalidateQueries([
        'messages',
        'infinite',
        variables.conversationId,
      ]);
      queryClient.invalidateQueries(['messages', 'conversations']);
    },
  });
};

export const useMarkAsRead = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async conversationId => {
      await api.post(MESSAGE_API.MARK_CONVERSATION_READ(conversationId));
      return conversationId;
    },
    onSuccess: conversationId => {
      queryClient.invalidateQueries(['messages', 'conversations']);
      queryClient.invalidateQueries(['messages', 'unreadCount']);
    },
  });
};

export const useUnreadMessagesCount = () => {
  return useQuery({
    queryKey: ['messages', 'unreadCount'],
    queryFn: async () => {
      const response = await api.get(MESSAGE_API.GET_UNREAD_COUNT);
      const data = extractData(response);
      return data?.unreadCount ?? data?.count ?? data ?? 0;
    },
    refetchInterval: 1000 * 60, // Refresh every minute as fallback
  });
};

export const useConversationMedia = conversationId => {
  return useQuery({
    queryKey: ['messages', 'media', conversationId],
    queryFn: async () => {
      const response = await api.get(MESSAGE_API.GET_MEDIA(conversationId));
      return extractData(response);
    },
    enabled: !!conversationId,
  });
};

export const useConversationById = conversationId => {
  return useQuery({
    queryKey: ['messages', 'conversation', conversationId],
    queryFn: async () => {
      const response = await api.get(
        MESSAGE_API.GET_CONVERSATION(conversationId)
      );
      return extractData(response);
    },
    enabled: !!conversationId && conversationId.length === 24, // Assuming MongoDB ObjectId
  });
};

export const useCreateConversation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async participantId => {
      const response = await api.post(MESSAGE_API.CREATE_CONVERSATION, {
        participantId,
      });
      return extractData(response);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['messages', 'conversations']);
    },
  });
};

export const useCreateGroup = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ name, participantIds }) => {
      const response = await api.post(MESSAGE_API.CREATE_GROUP, {
        name,
        participantIds,
      });
      return extractData(response);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['messages', 'conversations']);
    },
  });
};
export const useDeleteMessage = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ conversationId, messageId }) => {
      await api.delete(MESSAGE_API.DELETE_MESSAGE(messageId));
      return { conversationId, messageId };
    },
    onSuccess: data => {
      queryClient.invalidateQueries(['messages', 'list', data.conversationId]);
      queryClient.invalidateQueries([
        'messages',
        'infinite',
        data.conversationId,
      ]);
    },
  });
};

export const useUpdateGroup = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ groupId, data }) => {
      const response = await api.put(MESSAGE_API.UPDATE_GROUP(groupId), data);
      return extractData(response);
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries(['messages', 'conversations']);
      queryClient.invalidateQueries([
        'messages',
        'conversation',
        variables.groupId,
      ]);
    },
  });
};

export const useAddGroupMember = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ groupId, memberIds }) => {
      const response = await api.post(MESSAGE_API.ADD_MEMBERS(groupId), {
        memberIds,
      });
      return extractData(response);
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries([
        'messages',
        'conversation',
        variables.groupId,
      ]);
    },
  });
};

export const useRemoveGroupMember = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ groupId, userId }) => {
      await api.delete(MESSAGE_API.REMOVE_MEMBER(groupId, userId));
      return { groupId, userId };
    },
    onSuccess: data => {
      queryClient.invalidateQueries(['messages', 'conversation', data.groupId]);
    },
  });
};

export const useLeaveGroup = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async groupId => {
      await api.post(MESSAGE_API.LEAVE_GROUP(groupId));
      return groupId;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['messages', 'conversations']);
    },
  });
};

export const useDeleteConversation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async conversationId => {
      await api.delete(MESSAGE_API.DELETE_CONVERSATION(conversationId));
      return conversationId;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['messages', 'conversations']);
    },
  });
};
