/**
 * Get status style classes based on status
 * @param {string} status - Report status ('pending' | 'resolved' | 'rejected')
 * @returns {string} Tailwind CSS classes
 */
export const getReportStatusStyle = status => {
  switch (status) {
    case 'pending':
      return 'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800';
    case 'resolved':
      return 'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800';
    case 'rejected':
      return 'bg-rose-100 text-rose-700 border-rose-200 dark:bg-rose-900/30 dark:text-rose-400 dark:border-rose-800';
    default:
      return 'bg-neutral-100 text-neutral-700 border-neutral-200 dark:bg-neutral-800 dark:text-neutral-400 dark:border-neutral-700';
  }
};

/**
 * Get status text based on status
 * @param {string} status - Report status
 * @returns {string} Status text in Vietnamese
 */
export const getReportStatusText = status => {
  switch (status) {
    case 'pending':
      return 'Chờ xử lý';
    case 'resolved':
      return 'Đã giải quyết';
    case 'rejected':
      return 'Đã từ chối';
    default:
      return status;
  }
};

/**
 * Get target type text
 * @param {string} type - Target type ('post' | 'comment' | 'user')
 * @returns {string} Target type text in Vietnamese
 */
export const getTargetTypeText = type => {
  switch (type) {
    case 'post':
      return 'bài viết';
    case 'comment':
      return 'bình luận';
    case 'user':
      return 'người dùng';
    default:
      return type;
  }
};
