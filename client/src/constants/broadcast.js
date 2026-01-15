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
  },
  {
    id: 'success',
    label: 'Thành công',
    icon: CheckCircle2,
    color: 'green',
    bg: 'bg-green-50 dark:bg-green-900/20',
    text: 'text-green-600 dark:text-green-400',
  },
  {
    id: 'warning',
    label: 'Cảnh báo',
    icon: AlertTriangle,
    color: 'yellow',
    bg: 'bg-yellow-50 dark:bg-yellow-900/20',
    text: 'text-yellow-600 dark:text-yellow-400',
  },
  {
    id: 'alert',
    label: 'Khẩn cấp',
    icon: AlertCircle,
    color: 'red',
    bg: 'bg-red-50 dark:bg-red-900/20',
    text: 'text-red-600 dark:text-red-400',
  },
  {
    id: 'announcement',
    label: 'Thông báo',
    icon: Sparkles,
    color: 'purple',
    bg: 'bg-purple-50 dark:bg-purple-900/20',
    text: 'text-purple-600 dark:text-purple-400',
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
