import { useMutation } from '@tanstack/react-query';
import api from '@/axios/axiosConfig';
import { REPORT_API } from '@/axios/apiEndpoint';

// Submit a report
export const useSubmitReport = () => {
  return useMutation({
    mutationFn: async ({ targetId, targetType, reason, description }) => {
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

      const response = await api.post(endpoint, { reason, description });
      return response.data;
    },
    onSuccess: _ => {
      // Potentially invalidate admin report queries if needed?
      // For user side, usually just success message is enough
      // But if we have a list of "my reports" (REPORT_API.GET_MY_REPORTS), we should invalidate it
    },
  });
};
