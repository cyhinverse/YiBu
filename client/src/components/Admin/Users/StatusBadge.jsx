const StatusBadge = ({ status }) => {
  const styles = {
    active:
      'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400',
    pending:
      'bg-amber-50 text-amber-600 dark:bg-amber-900/20 dark:text-amber-400',
    suspended:
      'bg-neutral-50 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400',
    banned: 'bg-rose-50 text-rose-600 dark:bg-rose-900/20 dark:text-rose-400',
  };

  const getLabel = s => {
    switch (s) {
      case 'active':
        return 'Hoạt động';
      case 'pending':
        return 'Chờ duyệt';
      case 'suspended':
        return 'Tạm ngưng';
      case 'banned':
        return 'Bị chặn';
      default:
        return s;
    }
  };

  return (
    <span
      className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
        styles[status] || styles.active
      }`}
    >
      {getLabel(status)}
    </span>
  );
};

export default StatusBadge;
