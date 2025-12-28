import React from 'react';
import { Heart, MessageCircle, Share2, UserPlus, Bookmark } from 'lucide-react';
import StatCard from '../../Shared/StatCard';

export default function InteractionStats({ stats }) {
  const safeStats = stats || {
    likes: 0,
    comments: 0,
    shares: 0,
    follows: 0,
    saves: 0,
  };

  const statItems = [
    {
      label: 'Lượt thích',
      value: safeStats.likes,
      icon: Heart,
      bgClass:
        'bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400',
    },
    {
      label: 'Bình luận',
      value: safeStats.comments,
      icon: MessageCircle,
      bgClass:
        'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400',
    },
    {
      label: 'Chia sẻ',
      value: safeStats.shares,
      icon: Share2,
      bgClass:
        'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400',
    },
    {
      label: 'Theo dõi',
      value: safeStats.follows,
      icon: UserPlus,
      bgClass:
        'bg-violet-100 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400',
    },
    {
      label: 'Lưu bài',
      value: safeStats.saves,
      icon: Bookmark,
      bgClass:
        'bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400',
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 h-full">
      {statItems.map((item, index) => (
        <StatCard
          key={index}
          title={item.label}
          value={item.value?.toLocaleString() || '0'}
          icon={item.icon}
          iconBgClass={item.bgClass}
          iconColorClass=""
          loading={false}
        />
      ))}
    </div>
  );
}
