const StatusBadge = ({ status }) => {
  const styles = {
    active: 'bg-success/10 text-success border-success/20',
    pending: 'bg-warning/10 text-warning border-warning/20',
    suspended: 'bg-secondary/10 text-secondary border-secondary/20',
    banned: 'bg-error/10 text-error border-error/20',
  };

  return (
    <span
      className={`yb-badge border ${
        styles[status] || styles.active
      } font-black`}
    >
      {status === 'active'
        ? 'Hoạt động'
        : status === 'pending'
        ? 'Chờ duyệt'
        : status === 'suspended'
        ? 'Tạm ngưng'
        : 'Bị chặn'}
    </span>
  );
};

export default StatusBadge;
