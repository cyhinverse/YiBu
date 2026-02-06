/**
 * Get comment status style classes
 * @param {string} status - Comment status ('active' | 'hidden' | 'removed' | 'flagged')
 * @returns {string} Tailwind CSS classes
 */
export const getCommentStatusStyle = status => {
  switch (status) {
    case 'active':
      return 'admin-pill-success';
    case 'hidden':
    case 'removed':
      return 'admin-pill-danger';
    case 'flagged':
      return 'admin-pill-warning';
    default:
      return 'admin-pill-muted';
  }
};

/**
 * Get comment status text
 * @param {string} status - Comment status
 * @returns {string} Status text in Vietnamese
 */
export const getCommentStatusText = status => {
  switch (status) {
    case 'active':
      return 'Hoạt động';
    case 'hidden':
    case 'removed':
      return 'Đã ẩn/xóa';
    case 'flagged':
      return 'Bị báo cáo';
    default:
      return status;
  }
};
