import React from 'react';
import { FileText, MessageCircle, User, Flag } from 'lucide-react';
export {
  getReportStatusStyle as getStatusStyle,
  getReportStatusText as getStatusText,
  getTargetTypeText,
} from '@/utils/reportUtils';

/**
 * Get target icon component based on type
 * @param {string} type - Target type
 * @returns {JSX.Element} Icon component
 */
export const getTargetIcon = type => {
  switch (type) {
    case 'post':
      return <FileText size={18} />;
    case 'comment':
      return <MessageCircle size={18} />;
    case 'user':
      return <User size={18} />;
    default:
      return <Flag size={18} />;
  }
};
