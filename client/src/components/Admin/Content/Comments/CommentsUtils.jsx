export const getStatusStyle = status => {
  switch (status) {
    case 'active':
      return 'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800';
    case 'hidden':
    case 'removed':
      return 'bg-rose-100 text-rose-700 border-rose-200 dark:bg-rose-900/30 dark:text-rose-400 dark:border-rose-800';
    case 'flagged':
      return 'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800';
    default:
      return 'bg-neutral-100 text-neutral-700 border-neutral-200 dark:bg-neutral-800 dark:text-neutral-400 dark:border-neutral-700';
  }
};

export const getStatusText = status => {
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
