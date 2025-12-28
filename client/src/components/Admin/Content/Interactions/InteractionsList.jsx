import React from 'react';
import { Loader2, Activity, Calendar, ArrowRight } from 'lucide-react';
import {
  getInteractionIcon,
  getInteractionText,
  formatTime,
} from './InteractionsUtils.jsx';

export default function InteractionsList({ interactions, loading }) {
  if (loading && interactions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <Loader2 size={32} className="animate-spin text-neutral-400 mb-4" />
        <p className="text-neutral-500 font-medium">Đang tải dữ liệu...</p>
      </div>
    );
  }

  if (interactions.length === 0) {
    return (
      <div className="text-center py-20">
        <div className="w-16 h-16 bg-neutral-100 dark:bg-neutral-800 rounded-full flex items-center justify-center mx-auto mb-6">
          <Activity size={32} className="text-neutral-400" />
        </div>
        <h3 className="text-lg font-bold text-neutral-900 dark:text-white mb-2">
          Chưa có tương tác nào
        </h3>
        <p className="text-neutral-500 max-w-xs mx-auto text-sm">
          Không tìm thấy hoạt động tương tác nào phù hợp với bộ lọc hiện tại.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {interactions.map(interaction => (
        <div
          key={interaction._id}
          className="group flex flex-col sm:flex-row gap-4 p-5 rounded-3xl bg-neutral-50/50 dark:bg-neutral-800/30 border border-neutral-100 dark:border-neutral-800 hover:bg-white dark:hover:bg-neutral-800 hover:shadow-md transition-all duration-300"
        >
          {/* User Avatar with Action Icon */}
          <div className="relative shrink-0">
            <img
              src={
                interaction.user?.avatar ||
                `https://ui-avatars.com/api/?name=${encodeURIComponent(
                  interaction.user?.name || 'U'
                )}&background=random`
              }
              alt={interaction.user?.name || 'User'}
              className="w-12 h-12 rounded-full object-cover border border-neutral-200 dark:border-neutral-700 shadow-sm"
            />
            <div className="absolute -bottom-1 -right-1 p-1 rounded-full bg-white dark:bg-neutral-900 shadow-sm border border-neutral-100 dark:border-neutral-800">
              {getInteractionIcon(interaction.type)}
            </div>
          </div>

          {/* Main Content Area */}
          <div className="flex-1 min-w-0">
            <div className="flex flex-col gap-1 mb-2">
              <div className="flex items-center flex-wrap gap-1.5 text-sm">
                <span className="font-bold text-neutral-900 dark:text-white cursor-pointer hover:underline">
                  {interaction.user?.name || 'Người dùng'}
                </span>
                <span className="text-neutral-500 text-xs font-medium">
                  @{interaction.user?.username || 'unknown'}
                </span>
              </div>

              <div className="flex items-center gap-2 text-sm text-neutral-600 dark:text-neutral-400">
                <span>{getInteractionText(interaction.type)}</span>
                {interaction.target?.type === 'user' ? (
                  <>
                    <ArrowRight size={12} className="text-neutral-400" />
                    <span className="font-bold text-neutral-900 dark:text-white">
                      {interaction.target.name}
                    </span>
                  </>
                ) : interaction.target ? (
                  <>
                    <ArrowRight size={12} className="text-neutral-400" />
                    <span>bài viết của</span>
                    <span className="font-bold text-neutral-900 dark:text-white">
                      {interaction.target.author}
                    </span>
                  </>
                ) : null}
              </div>
            </div>

            {/* Content Preview */}
            {(interaction.content || interaction.target?.preview) && (
              <div className="p-4 bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 mb-3 group-hover:border-neutral-300 dark:group-hover:border-neutral-700 transition-colors">
                {interaction.target?.preview && (
                  <div className="text-[10px] bg-neutral-100 dark:bg-neutral-800 text-neutral-500 font-bold px-2 py-0.5 rounded-full inline-block mb-2">
                    PREVIEW
                  </div>
                )}
                <p className="text-sm text-neutral-700 dark:text-neutral-300 italic font-medium line-clamp-2">
                  "{interaction.content || interaction.target?.preview}"
                </p>
              </div>
            )}

            {/* Footer: Meta Info */}
            <div className="flex items-center gap-4 text-xs font-bold text-neutral-400 mt-2">
              <div className="flex items-center gap-1.5">
                <Calendar size={12} />
                <span>{formatTime(interaction.createdAt)}</span>
              </div>

              {interaction.sentiment && (
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] uppercase tracking-wider border ${
                    interaction.sentiment === 'positive'
                      ? 'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800'
                      : interaction.sentiment === 'negative'
                      ? 'bg-rose-100 text-rose-700 border-rose-200 dark:bg-rose-900/30 dark:text-rose-400 dark:border-rose-800'
                      : 'bg-neutral-100 text-neutral-600 border-neutral-200 dark:bg-neutral-800 dark:text-neutral-400 dark:border-neutral-700'
                  }`}
                >
                  {interaction.sentiment === 'positive'
                    ? 'Tích cực'
                    : interaction.sentiment === 'negative'
                    ? 'Tiêu cực'
                    : 'Trung lập'}
                </span>
              )}

              {interaction.weight !== undefined && (
                <div className="ml-auto flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Activity size={12} className="text-indigo-500" />
                  <span className="text-neutral-500">
                    AI Score: {interaction.weight}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
