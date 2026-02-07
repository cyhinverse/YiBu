/**
 * Get status style classes based on status
 * @param {string} status - Report status ('pending' | 'resolved' | 'rejected')
 * @returns {string} Tailwind CSS classes
 */
export const getReportStatusStyle = status => {
  switch (status) {
    case 'pending':
      return 'admin-pill-warning';
    case 'resolved':
      return 'admin-pill-success';
    case 'rejected':
      return 'admin-pill-danger';
    default:
      return 'admin-pill-muted';
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
