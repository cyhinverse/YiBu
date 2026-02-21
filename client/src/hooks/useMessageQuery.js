import {
  useQuery,
  useMutation,
  useQueryClient,
  useInfiniteQuery,
} from '@tanstack/react-query';
import api from '@/axios/axiosConfig';
import { MESSAGE_API } from '@/axios/apiEndpoint';
import { extractData } from '@/utils/apiUtils';
import { invalidateQueryKeys } from './queryClientUtils';

const MESSAGE_PAGE_LIMIT = 50;
const MAX_MEDIA_SCAN_PAGES = 20;
const MEDIA_FETCH_BATCH_SIZE = 5;

/**
 * Hook to fetch conversations list
 * @param {Object} [options] - Query options
 * @param {number} [options.page=1] - Page number
 * @param {number} [options.limit=20] - Items per page
 * @returns {import('@tanstack/react-query').UseQueryResult} Query result containing conversations
 */
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

/**
 * Hook to fetch messages in a conversation
 * @param {Object} [options] - Query options
 * @param {string} [options.conversationId] - Conversation ID
 * @param {number} [options.page=1] - Page number
 * @param {number} [options.limit=50] - Items per page
 * @returns {import('@tanstack/react-query').UseQueryResult} Query result containing messages
 */
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

/**
 * Hook to fetch messages with infinite scroll
 * @param {Object} [options] - Query options
 * @param {string} [options.conversationId] - Conversation ID
 * @param {number} [options.limit=50] - Items per page
 * @returns {import('@tanstack/react-query').UseInfiniteQueryResult} Infinite query result
 */
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

/**
 * Hook to send a message
 * @returns {import('@tanstack/react-query').UseMutationResult} Mutation to send message
 */
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
      if (content !== undefined && content !== null) {
        formData.append('content', content);
      }
      formData.append('type', type);
      if (attachments) {
        attachments.forEach(file => {
          formData.append('files', file);
        });
      }
      const response = await api.post(MESSAGE_API.SEND, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return extractData(response);
    },
    onSuccess: (_, variables) => {
      invalidateQueryKeys(queryClient, [
        ['messages', 'list', variables.conversationId],
        ['messages', 'infinite', variables.conversationId],
        ['messages', 'conversations'],
      ]);
    },
  });
};

/**
 * Hook to mark conversation as read
 * @returns {import('@tanstack/react-query').UseMutationResult} Mutation to mark as read
 */
export const useMarkAsRead = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async conversationId => {
      await api.post(MESSAGE_API.MARK_CONVERSATION_READ(conversationId));
      return conversationId;
    },
    onSuccess: () => {
      invalidateQueryKeys(queryClient, [
        ['messages', 'conversations'],
        ['messages', 'unreadCount'],
      ]);
    },
  });
};

/**
 * Hook to fetch unread messages count
 * @returns {import('@tanstack/react-query').UseQueryResult} Query result containing unread count
 */
export const useUnreadMessagesCount = () => {
  return useQuery({
    queryKey: ['messages', 'unreadCount'],
    queryFn: async () => {
      const response = await api.get(MESSAGE_API.GET_UNREAD_COUNT);
      const data = extractData(response);
      return data?.unreadCount ?? data?.count ?? data ?? 0;
    },
    refetchInterval: 1000 * 60,
  });
};

/**
 * Hook to fetch conversation media
 * @param {string} conversationId - Conversation ID
 * @returns {import('@tanstack/react-query').UseQueryResult} Query result containing media list
 */
export const useConversationMedia = conversationId => {
  return useQuery({
    queryKey: ['messages', 'media', conversationId],
    queryFn: async () => {
      const pagesToFetch = [];
      for (let page = 1; page <= MAX_MEDIA_SCAN_PAGES; page++) {
        pagesToFetch.push(page);
      }

      const batchResults = [];
      for (let i = 0; i < pagesToFetch.length; i += MEDIA_FETCH_BATCH_SIZE) {
        const batch = pagesToFetch.slice(i, i + MEDIA_FETCH_BATCH_SIZE);
        const responses = await Promise.all(
          batch.map(page =>
            api
              .get(MESSAGE_API.GET_MESSAGES(conversationId), {
                params: { page, limit: MESSAGE_PAGE_LIMIT },
              })
              .then(res => extractData(res))
              .catch(() => null)
          )
        );
        batchResults.push(...responses);
        
        const lastResult = responses[responses.length - 1];
        if (!lastResult?.hasMore) break;
      }

      const media = [];
      batchResults.forEach(data => {
        if (!data) return;
        const messages = Array.isArray(data.messages) ? data.messages : [];
        messages.forEach(message => {
          const attachments = Array.isArray(message.media) ? message.media : [];
          attachments.forEach(item => {
            media.push({
              ...item,
              messageId: message._id,
              createdAt: message.createdAt,
              sender: message.sender,
            });
          });
        });
      });

      media.sort(
        (a, b) =>
          new Date(b.createdAt || 0).getTime() -
          new Date(a.createdAt || 0).getTime()
      );

      return {
        media,
        hasMore: false,
        scannedPages: batchResults.filter(Boolean).length,
      };
    },
    enabled: !!conversationId,
    staleTime: 1000 * 60 * 5,
  });
};

/**
 * Hook to fetch conversation by ID
 * @param {string} conversationId - Conversation ID
 * @returns {import('@tanstack/react-query').UseQueryResult} Query result containing conversation info
 */
export const useConversationById = conversationId => {
  return useQuery({
    queryKey: ['messages', 'conversation', conversationId],
    queryFn: async () => {
      const response = await api.get(
        MESSAGE_API.GET_CONVERSATION(conversationId)
      );
      return extractData(response);
    },
    enabled: !!conversationId,
  });
};

/**
 * Hook to create a new conversation
 * @returns {import('@tanstack/react-query').UseMutationResult} Mutation to create conversation
 */
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
      invalidateQueryKeys(queryClient, [['messages', 'conversations']]);
    },
  });
};

/**
 * Hook to create a group chat
 * @returns {import('@tanstack/react-query').UseMutationResult} Mutation to create group
 */
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
      invalidateQueryKeys(queryClient, [['messages', 'conversations']]);
    },
  });
};

/**
 * Hook to delete a message
 * @returns {import('@tanstack/react-query').UseMutationResult} Mutation to delete message
 */
export const useDeleteMessage = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ conversationId, messageId }) => {
      await api.delete(MESSAGE_API.DELETE_MESSAGE(messageId));
      return { conversationId, messageId };
    },
    onSuccess: data => {
      invalidateQueryKeys(queryClient, [
        ['messages', 'list', data.conversationId],
        ['messages', 'infinite', data.conversationId],
      ]);
    },
  });
};

/**
 * Hook to update group information
 * @returns {import('@tanstack/react-query').UseMutationResult} Mutation to update group
 */
export const useUpdateGroup = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ groupId, data }) => {
      const response = await api.put(MESSAGE_API.UPDATE_GROUP(groupId), data);
      return extractData(response);
    },
    onSuccess: (_, variables) => {
      invalidateQueryKeys(queryClient, [
        ['messages', 'conversations'],
        ['messages', 'conversation', variables.groupId],
      ]);
    },
  });
};

/**
 * Hook to add member to group
 * @returns {import('@tanstack/react-query').UseMutationResult} Mutation to add member
 */
export const useAddGroupMember = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ groupId, memberIds }) => {
      const response = await api.post(MESSAGE_API.ADD_MEMBERS(groupId), {
        memberIds,
      });
      return extractData(response);
    },
    onSuccess: (_, variables) => {
      invalidateQueryKeys(queryClient, [
        ['messages', 'conversation', variables.groupId],
      ]);
    },
  });
};

/**
 * Hook to remove member from group
 * @returns {import('@tanstack/react-query').UseMutationResult} Mutation to remove member
 */
export const useRemoveGroupMember = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ groupId, userId }) => {
      await api.delete(MESSAGE_API.REMOVE_MEMBER(groupId, userId));
      return { groupId, userId };
    },
    onSuccess: data => {
      invalidateQueryKeys(queryClient, [['messages', 'conversation', data.groupId]]);
    },
  });
};

/**
 * Hook to leave a group
 * @returns {import('@tanstack/react-query').UseMutationResult} Mutation to leave group
 */
export const useLeaveGroup = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async groupId => {
      await api.post(MESSAGE_API.LEAVE_GROUP(groupId));
      return groupId;
    },
    onSuccess: () => {
      invalidateQueryKeys(queryClient, [['messages', 'conversations']]);
    },
  });
};

/**
 * Hook to delete a conversation
 * @returns {import('@tanstack/react-query').UseMutationResult} Mutation to delete conversation
 */
export const useDeleteConversation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async conversationId => {
      await api.delete(MESSAGE_API.DELETE_CONVERSATION(conversationId));
      return conversationId;
    },
    onSuccess: () => {
      invalidateQueryKeys(queryClient, [['messages', 'conversations']]);
    },
  });
};
