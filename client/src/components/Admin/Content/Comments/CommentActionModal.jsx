import {
  X,
  Trash2,
  Calendar,
  MessageCircle,
  Heart,
  Loader2,
} from 'lucide-react';
import { getStatusStyle, getStatusText } from './CommentsUtils.jsx';

export const DeleteCommentModal = ({
  isOpen,
  onClose,
  onConfirm,
  loading,
  comment,
}) => {
  if (!isOpen || !comment) return null;

  return (
    <div className="fixed inset-0 bg-neutral-900/20 dark:bg-neutral-900/80 backdrop-blur-sm flex items-center justify-center z-[60] p-4 animate-fade-in">
      <div className="bg-white dark:bg-neutral-900 w-full max-w-md p-6 shadow-2xl rounded-3xl transform animate-scale-in border border-neutral-200 dark:border-neutral-800">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-12 h-12 rounded-full bg-rose-100 dark:bg-rose-900/30 flex items-center justify-center text-rose-600 dark:text-rose-400 shrink-0">
            <Trash2 size={24} />
          </div>
          <div>
            <h3 className="text-xl font-bold text-neutral-900 dark:text-white tracking-tight">
              Xóa bình luận?
            </h3>
            <p className="text-sm text-neutral-500 font-medium">
              Hành động này không thể hoàn tác.
            </p>
          </div>
        </div>

        <div className="bg-neutral-50 dark:bg-neutral-800/50 p-4 rounded-2xl border border-neutral-100 dark:border-neutral-800 mb-6">
          <div className="flex items-center gap-2 mb-2">
            <img
              src={comment.user?.avatar || '/images/default-avatar.png'}
              className="w-5 h-5 rounded-full"
              alt=""
            />
            <span className="text-xs font-bold text-neutral-900 dark:text-white">
              {comment.user?.username}
            </span>
          </div>
          <p className="text-sm text-neutral-600 dark:text-neutral-300 line-clamp-3 italic">
            "{comment.content}"
          </p>
        </div>

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-3 rounded-xl font-bold text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors text-sm"
          >
            Hủy bỏ
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className="flex-1 py-3 rounded-xl font-bold bg-rose-600 hover:bg-rose-700 text-white shadow-lg shadow-rose-600/20 transition-all flex items-center justify-center gap-2 text-sm"
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
  if (!isOpen || !comment) return null;

  return (
    <div className="fixed inset-0 bg-neutral-900/20 dark:bg-neutral-900/80 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
      <div
        className="bg-white dark:bg-neutral-900 w-full max-w-lg shadow-2xl rounded-3xl transform animate-scale-in overflow-hidden border border-neutral-200 dark:border-neutral-800"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-5 border-b border-neutral-100 dark:border-neutral-800 flex items-center justify-between">
          <h2 className="text-xl font-bold text-neutral-900 dark:text-white tracking-tight">
            Chi tiết bình luận
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-full transition-colors text-neutral-500 dark:text-neutral-400"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* User Info */}
          <div className="flex items-center gap-4">
            <img
              src={comment.user?.avatar || '/images/default-avatar.png'}
              alt=""
              className="w-14 h-14 rounded-full border border-neutral-200 dark:border-neutral-700 shadow-sm"
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
          <div className="bg-neutral-50 dark:bg-neutral-800/50 p-6 rounded-3xl border border-neutral-100 dark:border-neutral-800 relative group overflow-hidden">
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
              <span className="text-2xl font-black text-neutral-900 dark:text-white tracking-tight">
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
