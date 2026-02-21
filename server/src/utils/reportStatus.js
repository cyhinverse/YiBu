export const normalizeReportStatus = status => {
  if (status === 'dismissed') return 'rejected';
  if (status === 'in_review') return 'reviewing';
  return status;
};
