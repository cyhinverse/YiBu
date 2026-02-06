import { useEffect } from 'react';
import {
  X,
  Trash2,
  Calendar,
  MessageCircle,
  Heart,
  Loader2,
} from 'lucide-react';
import { getStatusStyle, getStatusText } from './CommentsUtils.jsx';

const useEscapeKey = (isOpen, onClose) => {
  useEffect(() => {
    if (!isOpen) return undefined;
    const handleKeyDown = event => {
      if (event.key === 'Escape') {
        onClose?.();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);
};

export const DeleteCommentModal = ({
  isOpen,
  onClose,
  onConfirm,
  loading,
  comment,
}) => {
  useEscapeKey(isOpen, onClose);

  if (!isOpen || !comment) return null;

  return (
    <div
      className="fixed inset-0 bg-black/45 dark:bg-black/70 backdrop-blur-sm flex items-center justify-center z-[60] p-4 animate-fade-in"
      role="dialog"
      aria-modal="true"
      tabIndex={-1}
      onKeyDown={event => {
        if (event.key === 'Escape') onClose?.();
      }}
    >
      <div className="admin-card w-full max-w-md p-4 shadow-2xl rounded-2xl transform animate-scale-in">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-12 h-12 rounded-full bg-[var(--color-error)]/15 flex items-center justify-center text-[var(--color-error)] shrink-0">
            <Trash2 size={24} />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-[var(--color-content)] tracking-tight">
              Xóa bình luận?
            </h3>
            <p className="text-sm text-[var(--color-text-secondary)] font-medium">
              Hành động này không thể hoàn tác.
            </p>
          </div>
        </div>

        <div className="admin-card-muted p-4 rounded-2xl mb-6">
          <div className="flex items-center gap-2 mb-2">
            <img
              src={comment.user?.avatar || '/images/default-avatar.png'}
              className="w-5 h-5 yb-avatar"
              alt={`${comment.user?.username || 'User'} avatar`}
            />
            <span className="text-xs font-bold text-[var(--color-content)]">
              {comment.user?.username}
            </span>
          </div>
          <p className="text-sm text-[var(--color-text-secondary)] line-clamp-3 italic">
            "{comment.content}"
          </p>
        </div>

        <div className="flex gap-3">
          <button
            type="button"
            onClick={onClose}
            className="yb-btn yb-btn-secondary flex-1 py-3 rounded-xl font-bold text-sm"
          >
            Hủy bỏ
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className="yb-btn flex-1 py-3 rounded-xl font-bold bg-[var(--color-error)] text-[var(--color-text-inverse)] hover:opacity-90 transition-all flex items-center justify-center gap-2 text-sm"
          >
            {loading ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <>
                <Trash2 size={16} />
                Xóa ngay
              </>
            )}
          </button>
        </div>
      </div>

    </div>
  );
};

export const CommentDetailModal = ({ isOpen, onClose, comment }) => {
  useEscapeKey(isOpen, onClose);

  if (!isOpen || !comment) return null;

  return (
    <div
      className="fixed inset-0 bg-black/45 dark:bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in"
      role="dialog"
      aria-modal="true"
      tabIndex={-1}
      onKeyDown={event => {
        if (event.key === 'Escape') onClose?.();
      }}
    >
      <div
        className="yb-card w-full max-w-lg shadow-2xl rounded-2xl transform animate-scale-in overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-4 py-3.5 bg-[var(--color-surface-secondary)] border-b border-[var(--color-border)] flex items-center justify-between">
          <h2 className="text-lg font-semibold text-[var(--color-content)] tracking-tight">
            Chi tiết bình luận
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="p-2 hover:bg-[var(--color-surface-hover)] rounded-full transition-colors text-[var(--color-text-secondary)]"
            aria-label="Đóng"
          >
            <X size={20} />
          </button>
        </div>


        <div className="p-4 space-y-5">
          {/* User Info */}
          <div className="flex items-center gap-4">
            <img
              src={comment.user?.avatar || '/images/default-avatar.png'}
              alt={`${comment.user?.username || 'User'} avatar`}
              className="w-14 h-12 rounded-full border border-neutral-200 dark:border-neutral-700 shadow-sm"
            />
            <div>
              <h3 className="font-bold text-lg text-neutral-900 dark:text-white tracking-tight">
                {comment.user?.username || 'Người dùng'}
              </h3>
              <p className="text-sm text-neutral-400 font-medium">
                {comment.user?.email}
              </p>
            </div>
          </div>

          {/* Comment Content */}
          <div className="bg-neutral-50 dark:bg-neutral-800/50 p-4 rounded-2xl border border-neutral-100 dark:border-neutral-800 relative group overflow-hidden">
            <MessageCircle
              size={120}
              className="absolute -right-4 -bottom-4 text-neutral-200 dark:text-neutral-700/20 opacity-30 rotate-12 transition-transform group-hover:scale-110"
            />
            <p className="text-base text-neutral-700 dark:text-neutral-200 leading-relaxed relative z-10 font-medium">
              "{comment.content}"
            </p>
            <div className="flex items-center gap-2 mt-4 pt-4 border-t border-neutral-200 dark:border-neutral-700 relative z-10">
              <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">
                Đăng vào:
              </span>
              <span className="flex items-center gap-1.5 text-xs font-bold text-neutral-600 dark:text-neutral-400">
                <Calendar size={12} />
                {new Date(comment.createdAt).toLocaleString('vi-VN')}
              </span>
            </div>
          </div>

          {/* Stats & Status */}
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 flex flex-col items-center justify-center gap-1 shadow-sm">
              <Heart size={20} className="text-rose-500 mb-1 fill-rose-500" />
              <span className="text-xl font-black text-neutral-900 dark:text-white tracking-tight">
                {comment.likes?.length || 0}
              </span>
              <span className="text-[10px] uppercase font-bold text-neutral-400 tracking-widest">
                Lượt thích
              </span>
            </div>
            <div className="p-4 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 flex flex-col items-center justify-center gap-1 shadow-sm">
              <span
                className={`inline-block px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide border mb-1 ${getStatusStyle(
                  comment.status || 'active'
                )}`}
              >
                {getStatusText(comment.status || 'active')}
              </span>
              <span className="text-[10px] uppercase font-bold text-neutral-400 tracking-widest mt-auto">
                Trạng thái
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
