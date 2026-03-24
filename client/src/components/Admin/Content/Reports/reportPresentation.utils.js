export const getReportStatusStyle = status => {
  switch (status) {
    case 'pending':
      return 'admin-pill-warning';
    case 'reviewing':
      return 'admin-pill-warning';
    case 'resolved':
      return 'admin-pill-success';
    case 'escalated':
      return 'admin-pill-danger';
    case 'rejected':
      return 'admin-pill-danger';
    default:
      return 'admin-pill-muted';
  }
};

export const getReportStatusText = status => {
  switch (status) {
    case 'pending':
      return 'Chờ xử lý';
    case 'reviewing':
      return 'Đang xem xét';
    case 'resolved':
      return 'Đã giải quyết';
    case 'escalated':
      return 'Leo thang';
    case 'rejected':
      return 'Đã từ chối';
    default:
      return status;
  }
};

export const getTargetTypeText = type => {
  switch (type) {
    case 'post':
      return 'bài viết';
    case 'comment':
      return 'bình luận';
    case 'user':
      return 'người dùng';
    case 'message':
      return 'tin nhắn';
    default:
      return type;
  }
};
