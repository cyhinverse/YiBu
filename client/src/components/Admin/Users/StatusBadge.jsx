const StatusBadge = ({ status }) => {
  const styles = {
    active: 'admin-pill admin-pill-success',
    pending: 'admin-pill admin-pill-warning',
    suspended: 'admin-pill admin-pill-muted',
    banned: 'admin-pill admin-pill-danger',
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
    <span className={styles[status] || styles.active}>{getLabel(status)}</span>

  );
};

export default StatusBadge;
