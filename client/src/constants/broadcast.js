import {
  Info,
  Sparkles,
} from 'lucide-react';

// Notification types for broadcast
export const NOTIFICATION_TYPES = [
  {
    id: 'system',
    label: 'Hệ thống',
    icon: Info,
    color: 'cyan',
    bg: 'bg-cyan-50 dark:bg-cyan-900/20',
    text: 'text-cyan-700 dark:text-cyan-300',
    border: 'border-cyan-200 dark:border-cyan-800',
    ring: 'ring-1 ring-cyan-500 dark:ring-cyan-400',
  },
  {
    id: 'announcement',
    label: 'Thông báo chung',
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
    id: 'new_users',
    label: 'Người dùng mới',
    description: 'Đăng ký trong 30 ngày qua',
  },
  {
    id: 'verified',
    label: 'Đã xác thực',
    description: 'Chỉ tài khoản đã xác minh',
  },
];
