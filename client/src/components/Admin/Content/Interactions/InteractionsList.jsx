import React from 'react';
import { Loader2, Activity, Calendar } from 'lucide-react';
import {
  getInteractionIcon,
  getInteractionText,
  getInteractionBg,
  formatTime,
} from './InteractionsUtils.jsx';

export default function InteractionsList({ interactions, loading }) {
  if (loading && interactions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800">
        <Loader2 size={32} className="animate-spin text-indigo-500 mb-4" />
        <p className="text-neutral-500">Đang tải dữ liệu...</p>
      </div>
    );
  }

  if (interactions.length === 0) {
    return (
      <div className="yb-card p-20 text-center">
        <div className="w-16 h-16 bg-neutral-100 dark:bg-neutral-800 rounded-full flex items-center justify-center mx-auto mb-4">
          <Activity size={32} className="text-neutral-400" />
        </div>
        <h3 className="text-lg font-semibold text-black dark:text-white mb-2">
          Chưa có tương tác nào
        </h3>
        <p className="text-neutral-500 max-w-xs mx-auto">
          Không tìm thấy hoạt động tương tác nào phù hợp với bộ lọc hiện tại.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-4">
        {interactions.map(interaction => (
          <div
            key={interaction._id}
            className={`yb-card p-4 transition-all hover:shadow-lg border-2 ${getInteractionBg(
              interaction.type
            )}`}
          >
            <div className="flex items-start gap-4">
              {/* User Avatar */}
              <div className="relative">
                <img
                  src={
                    interaction.user?.avatar ||
                    `https://ui-avatars.com/api/?name=${encodeURIComponent(
                      interaction.user?.name || 'U'
                    )}&background=random`
                  }
                  alt={interaction.user?.name || 'User'}
                  className="w-12 h-12 rounded-full ring-2 ring-white dark:ring-neutral-700 object-cover shadow-sm bg-neutral-200"
                />
                <div className="absolute -bottom-1 -right-1 p-1 rounded-full bg-white dark:bg-neutral-900 shadow-sm ring-1 ring-neutral-200 dark:ring-neutral-700">
                  {getInteractionIcon(interaction.type)}
                </div>
              </div>

              {/* Main Content Area */}
              <div className="flex-1 min-w-0">
                {/* Header: User & Sentiment */}
                <div className="flex items-center justify-between gap-2 mb-2">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-x-2">
                    <span className="font-bold text-black dark:text-white hover:underline cursor-pointer">
                      {interaction.user?.name || 'Người dùng'}
                    </span>
                    <span className="text-neutral-500 text-sm">
                      @{interaction.user?.username || 'unknown'}
                    </span>
                  </div>

                  {interaction.sentiment && (
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                        interaction.sentiment === 'positive'
                          ? 'bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-400'
                          : interaction.sentiment === 'negative'
                          ? 'bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-400'
                          : 'bg-neutral-100 text-neutral-600 border-neutral-200 dark:bg-neutral-800 dark:text-neutral-400'
                      }`}
                    >
                      {interaction.sentiment === 'positive'
                        ? 'Tích cực'
                        : interaction.sentiment === 'negative'
                        ? 'Tiêu cực'
                        : 'Trung lập'}
                    </span>
                  )}
                </div>

                {/* Action & Target */}
                <div className="flex flex-wrap items-center gap-1.5 text-sm mb-3">
                  <span className="text-neutral-600 dark:text-neutral-400">
                    {getInteractionText(interaction.type)}
                  </span>

                  {interaction.target?.type === 'user' ? (
                    <span className="text-neutral-600 dark:text-neutral-400">
                      người dùng{' '}
                      <span className="font-semibold text-black dark:text-white cursor-pointer hover:text-indigo-500 transition-colors">
                        {interaction.target.name}
                      </span>
                    </span>
                  ) : interaction.target ? (
                    <span className="text-neutral-600 dark:text-neutral-400">
                      bài viết của{' '}
                      <span className="font-semibold text-black dark:text-white cursor-pointer hover:text-indigo-500 transition-colors">
                        {interaction.target.author}
                      </span>
                    </span>
                  ) : null}
                </div>

                {/* Content Preview */}
                {(interaction.content || interaction.target?.preview) && (
                  <div className="p-3 bg-white/50 dark:bg-black/20 rounded-xl border border-black/5 dark:border-white/5 mb-3 group relative">
                    {interaction.target?.preview && (
                      <div className="text-[10px] text-neutral-400 uppercase font-bold mb-1 opacity-50 group-hover:opacity-100 transition-opacity">
                        Xem trước bài viết
                      </div>
                    )}
                    <p className="text-sm text-neutral-700 dark:text-neutral-300 italic leading-snug">
                      "{interaction.content || interaction.target?.preview}"
                    </p>
                  </div>
                )}

                {/* Footer: Meta Info */}
                <div className="flex flex-wrap items-center gap-x-4 gap-y-2 pt-3 mt-3 border-t border-black/5 dark:border-white/5 text-[11px] text-neutral-500 dark:text-neutral-400">
                  <div className="flex items-center gap-1.5" title="Thời gian">
                    <Calendar size={12} />
                    <span>{formatTime(interaction.createdAt)}</span>
                  </div>

                  {interaction.context?.source && (
                    <div className="flex items-center gap-1.5">
                      <span className="opacity-60">Nguồn:</span>
                      <span className="font-semibold text-neutral-700 dark:text-neutral-300 capitalize">
                        {interaction.context.source}
                      </span>
                    </div>
                  )}

                  {interaction.context?.deviceType && (
                    <div className="flex items-center gap-1.5">
                      <span className="opacity-60">Thiết bị:</span>
                      <span className="font-semibold text-neutral-700 dark:text-neutral-300 capitalize">
                        {interaction.context.deviceType}
                      </span>
                    </div>
                  )}

                  {interaction.weight !== undefined && (
                    <div
                      className="ml-auto flex items-center gap-1 bg-neutral-100 dark:bg-neutral-800 px-2 py-0.5 rounded font-mono"
                      title="Độ ưu tiên / Trọng số AI"
                    >
                      <span className="opacity-60">SCORE:</span>
                      <span className="font-bold text-indigo-600 dark:text-indigo-400">
                        {interaction.weight}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
