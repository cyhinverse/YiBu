import { useMutation } from '@tanstack/react-query';
import api from '@/axios/axiosConfig';
import { REPORT_API } from '@/axios/apiEndpoint';

/**
 * Hook to submit a violation report
 * @returns {import('@tanstack/react-query').UseMutationResult} Mutation to submit report
 * @example
 * const { mutate } = useSubmitReport();
 * mutate({
 *   targetId: 'post123',
 *   targetType: 'post',
 *   category: 'spam',
 *   reason: 'Spam content',
 *   description: 'Details...'
 * });
 */
export const useSubmitReport = () => {
  return useMutation({
    mutationFn: async ({
      targetId,
      targetType,
      category,
      reason,
      description,
    }) => {
      let endpoint;
      switch (targetType) {
        case 'post':
          endpoint = REPORT_API.REPORT_POST(targetId);
          break;
        case 'comment':
          endpoint = REPORT_API.REPORT_COMMENT(targetId);
          break;
        case 'user':
          endpoint = REPORT_API.REPORT_USER(targetId);
          break;
        case 'message':
          endpoint = REPORT_API.REPORT_MESSAGE(targetId);
          break;
        default:
          throw new Error('Invalid target type');
      }

      const response = await api.post(endpoint, {
        category,
        reason,
        description,
      });
      return response.data;
    },
  });
};
