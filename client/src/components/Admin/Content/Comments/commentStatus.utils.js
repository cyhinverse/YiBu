export const getCommentStatusStyle = status => {
  switch (status) {
    case 'active':
      return 'admin-pill-success';
    case 'pending':
      return 'admin-pill-warning';
    case 'hidden':
    case 'removed':
      return 'admin-pill-danger';
    case 'flagged':
      return 'admin-pill-warning';
    default:
      return 'admin-pill-muted';
  }
};

export const getCommentStatusText = status => {
  switch (status) {
    case 'active':
      return 'Hoạt động';
    case 'pending':
      return 'Chờ duyệt';
    case 'hidden':
    case 'removed':
      return 'Đã ẩn/xóa';
    case 'flagged':
      return 'Bị báo cáo';
    default:
      return status;
  }
};
