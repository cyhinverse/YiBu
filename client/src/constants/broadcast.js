import {
  Info,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  Sparkles,
} from 'lucide-react';

// Notification types for broadcast
export const NOTIFICATION_TYPES = [
  {
    id: 'info',
    label: 'Thông tin',
    icon: Info,
    color: 'blue',
    bg: 'bg-blue-50 dark:bg-blue-900/20',
    text: 'text-blue-600 dark:text-blue-400',
    border: 'border-blue-200 dark:border-blue-800',
    ring: 'ring-1 ring-blue-500 dark:ring-blue-400',
  },
  {
    id: 'success',
    label: 'Thành công',
    icon: CheckCircle2,
    color: 'green',
    bg: 'bg-green-50 dark:bg-green-900/20',
    text: 'text-green-600 dark:text-green-400',
    border: 'border-green-200 dark:border-green-800',
    ring: 'ring-1 ring-green-500 dark:ring-green-400',
  },
  {
    id: 'warning',
    label: 'Cảnh báo',
    icon: AlertTriangle,
    color: 'yellow',
    bg: 'bg-yellow-50 dark:bg-yellow-900/20',
    text: 'text-yellow-600 dark:text-yellow-400',
    border: 'border-yellow-200 dark:border-yellow-800',
    ring: 'ring-1 ring-yellow-500 dark:ring-yellow-400',
  },
  {
    id: 'alert',
    label: 'Khẩn cấp',
    icon: AlertCircle,
    color: 'red',
    bg: 'bg-red-50 dark:bg-red-900/20',
    text: 'text-red-600 dark:text-red-400',
    border: 'border-red-200 dark:border-red-800',
    ring: 'ring-1 ring-red-500 dark:ring-red-400',
  },
  {
    id: 'announcement',
    label: 'Thông báo',
    icon: Sparkles,
    color: 'neutral',
    bg: 'bg-neutral-100 dark:bg-neutral-800/60',
    text: 'text-neutral-700 dark:text-neutral-300',
    border: 'border-neutral-200 dark:border-neutral-700',
    ring: 'ring-1 ring-neutral-500 dark:ring-neutral-400',
  },
];

// Target audience options for broadcast
export const TARGET_AUDIENCES = [
  {
    id: 'all',
    label: 'Tất cả người dùng',
    description: 'Gửi cho toàn bộ người dùng',
  },
  {
    id: 'active',
    label: 'Người dùng hoạt động',
    description: 'Hoạt động trong 30 ngày qua',
  },
  {
    id: 'new',
    label: 'Người dùng mới',
    description: 'Đăng ký trong 7 ngày qua',
  },
  {
    id: 'verified',
    label: 'Đã xác thực',
    description: 'Chỉ tài khoản đã xác minh',
  },
];
