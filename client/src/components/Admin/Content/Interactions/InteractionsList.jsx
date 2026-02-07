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
        <Loader2 size={32} className="animate-spin text-[var(--color-text-tertiary)] mb-4" />
        <p className="text-[var(--color-text-secondary)] font-medium">
          Đang tải dữ liệu...
        </p>
      </div>
    );
  }

  if (interactions.length === 0) {
    return (
      <div className="text-center py-20">
        <div className="w-16 h-16 bg-[var(--color-surface-secondary)] rounded-full flex items-center justify-center mx-auto mb-6">
          <Activity size={32} className="text-[var(--color-text-tertiary)]" />
        </div>
        <h3 className="text-lg font-semibold text-[var(--color-content)] mb-2">
          Chưa có tương tác nào
        </h3>
        <p className="text-[var(--color-text-secondary)] max-w-xs mx-auto text-sm">
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
          className="group flex flex-col sm:flex-row gap-4 p-4 rounded-2xl hover:bg-[var(--color-surface)] transition-colors"
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
              className="w-12 h-12 rounded-full object-cover bg-[var(--color-surface-secondary)]"
            />
            <div className="absolute -bottom-1 -right-1 p-1 rounded-full bg-[var(--color-surface-secondary)]">
              {getInteractionIcon(interaction.type)}
            </div>
          </div>

          {/* Main Content Area */}
          <div className="flex-1 min-w-0">
            <div className="flex flex-col gap-1 mb-2">
              <div className="flex items-center flex-wrap gap-1.5 text-sm">
                <span className="font-bold text-[var(--color-content)] cursor-pointer hover:underline">
                  {interaction.user?.name || 'Người dùng'}
                </span>
                <span className="text-[var(--color-text-tertiary)] text-xs font-medium">
                  @{interaction.user?.username || 'unknown'}
                </span>
              </div>

              <div className="flex items-center gap-2 text-sm text-[var(--color-text-secondary)]">
                <span>{getInteractionText(interaction.type)}</span>
                {interaction.target?.type === 'user' ? (
                  <>
                    <ArrowRight size={12} className="text-[var(--color-text-tertiary)]" />
                    <span className="font-bold text-[var(--color-content)]">
                      {interaction.target.name}
                    </span>
                  </>
                ) : interaction.target ? (
                  <>
                    <ArrowRight size={12} className="text-[var(--color-text-tertiary)]" />
                    <span>bài viết của</span>
                    <span className="font-bold text-[var(--color-content)]">
                      {interaction.target.author}
                    </span>
                  </>
                ) : null}
              </div>
            </div>

            {/* Content Preview */}
            {(interaction.content || interaction.target?.preview) && (
              <div className="p-4 bg-[var(--color-surface-secondary)] rounded-2xl mb-3">
                {interaction.target?.preview && (
                  <div className="text-[10px] bg-[var(--color-surface)] text-[var(--color-text-tertiary)] font-bold px-2 py-0.5 rounded-full inline-block mb-2">
                    PREVIEW
                  </div>
                )}
                <p className="text-sm text-[var(--color-text-secondary)] italic font-medium line-clamp-2">
                  "{interaction.content || interaction.target?.preview}"
                </p>
              </div>
            )}

            {/* Footer: Meta Info */}
            <div className="flex items-center gap-4 text-xs font-bold text-[var(--color-text-tertiary)] mt-2">
              <div className="flex items-center gap-1.5">
                <Calendar size={12} />
                <span>{formatTime(interaction.createdAt)}</span>
              </div>

              {interaction.sentiment && (
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] uppercase tracking-wider ${
                    interaction.sentiment === 'positive'
                      ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                      : interaction.sentiment === 'negative'
                      ? 'bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400'
                      : 'bg-[var(--color-surface-secondary)] text-[var(--color-text-tertiary)]'
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
                  <Activity size={12} className="text-[var(--color-text-tertiary)]" />
                  <span className="text-[var(--color-text-tertiary)]">
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
