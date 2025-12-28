import React from 'react';
import {
  Heart,
  MessageCircle,
  Share2,
  UserPlus,
  Bookmark,
  Activity,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { vi } from 'date-fns/locale';

export const getInteractionIcon = type => {
  switch (type) {
    case 'like':
      return <Heart size={18} className="text-red-500" fill="currentColor" />;
    case 'comment':
      return <MessageCircle size={18} className="text-blue-500" />;
    case 'share':
      return <Share2 size={18} className="text-green-500" />;
    case 'follow':
      return <UserPlus size={18} className="text-purple-500" />;
    case 'save':
      return (
        <Bookmark size={18} className="text-amber-500" fill="currentColor" />
      );
    default:
      return <Activity size={18} className="text-neutral-500" />;
  }
};

export const getInteractionText = type => {
  switch (type) {
    case 'like':
      return 'đã thích';
    case 'comment':
      return 'đã bình luận';
    case 'share':
      return 'đã chia sẻ';
    case 'follow':
      return 'đã theo dõi';
    case 'save':
      return 'đã lưu';
    default:
      return 'tương tác';
  }
};

export const formatTime = date => {
  try {
    return formatDistanceToNow(new Date(date), { addSuffix: true, locale: vi });
  } catch {
    return 'vừa xong';
  }
};
