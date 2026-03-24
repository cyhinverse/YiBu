import { formatDistanceToNowStrict } from 'date-fns';
import { vi } from 'date-fns/locale';

const toValidDate = value => {
  if (!value) return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

export const formatDistanceToNow = (date, options = {}) => {
  const { addSuffix = true, fallback = '' } = options;
  const target = toValidDate(date);
  if (!target) return fallback;

  const diffInSeconds = Math.abs(
    Math.floor((Date.now() - target.getTime()) / 1000)
  );
  if (diffInSeconds < 30) return 'vừa xong';

  return formatDistanceToNowStrict(target, { addSuffix, locale: vi });
};

export const formatRelativeShortTime = (date, options = {}) => {
  const { fallback = '' } = options;
  const target = toValidDate(date);
  if (!target) return fallback;

  const diffInSeconds = Math.floor((Date.now() - target.getTime()) / 1000);
  if (diffInSeconds < 0) return target.toLocaleDateString('vi-VN');
  if (diffInSeconds < 60) return 'vừa xong';
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}p`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}g`;
  if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}n`;
  return target.toLocaleDateString('vi-VN');
};
