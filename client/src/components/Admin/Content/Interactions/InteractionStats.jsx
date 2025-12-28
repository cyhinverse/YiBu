import React from 'react';
import { Heart, MessageCircle, Share2, UserPlus, Bookmark } from 'lucide-react';

export default function InteractionStats({ stats }) {
  const safeStats = stats || {
    likes: 0,
    comments: 0,
    shares: 0,
    follows: 0,
    saves: 0,
  };

  return (
    <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
      <div className="yb-card p-4 border-l-4 border-l-red-500 bg-red-50/30 dark:bg-red-950/10">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 rounded-lg bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400">
            <Heart size={20} fill="currentColor" />
          </div>
          <span className="text-neutral-600 dark:text-neutral-400 text-sm font-medium">
            Lượt thích
          </span>
        </div>
        <p className="text-2xl font-bold text-black dark:text-white">
          {(safeStats.likes || 0).toLocaleString()}
        </p>
      </div>

      <div className="yb-card p-4 border-l-4 border-l-blue-500 bg-blue-50/30 dark:bg-blue-950/10">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400">
            <MessageCircle size={20} />
          </div>
          <span className="text-neutral-600 dark:text-neutral-400 text-sm font-medium">
            Bình luận
          </span>
        </div>
        <p className="text-2xl font-bold text-black dark:text-white">
          {(safeStats.comments || 0).toLocaleString()}
        </p>
      </div>

      <div className="yb-card p-4 border-l-4 border-l-green-500 bg-green-50/30 dark:bg-green-950/10">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400">
            <Share2 size={20} />
          </div>
          <span className="text-neutral-600 dark:text-neutral-400 text-sm font-medium">
            Chia sẻ
          </span>
        </div>
        <p className="text-2xl font-bold text-black dark:text-white">
          {(safeStats.shares || 0).toLocaleString()}
        </p>
      </div>

      <div className="yb-card p-4 border-l-4 border-l-purple-500 bg-purple-50/30 dark:bg-purple-950/10">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400">
            <UserPlus size={20} />
          </div>
          <span className="text-neutral-600 dark:text-neutral-400 text-sm font-medium">
            Theo dõi
          </span>
        </div>
        <p className="text-2xl font-bold text-black dark:text-white">
          {(safeStats.follows || 0).toLocaleString()}
        </p>
      </div>

      <div className="yb-card p-4 border-l-4 border-l-amber-500 bg-amber-50/30 dark:bg-amber-950/10 col-span-2 lg:col-span-1">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 rounded-lg bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400">
            <Bookmark size={20} fill="currentColor" />
          </div>
          <span className="text-neutral-600 dark:text-neutral-400 text-sm font-medium">
            Lưu bài
          </span>
        </div>
        <p className="text-2xl font-bold text-black dark:text-white">
          {(safeStats.saves || 0).toLocaleString()}
        </p>
      </div>
    </div>
  );
}
