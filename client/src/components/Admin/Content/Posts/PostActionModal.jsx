import React, { useEffect } from 'react';
import {
  Trash2,
  Loader2,
  X,
  AlertTriangle,
  CheckCircle,
  Shield,
} from 'lucide-react';

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

export function DeletePostModal({ isOpen, onClose, onConfirm, loading, post }) {
  useEscapeKey(isOpen, onClose);

  if (!isOpen || !post) return null;

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
      <div className="admin-card w-full max-w-md p-4 rounded-2xl transform animate-scale-in">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-12 h-12 rounded-full bg-rose-100 dark:bg-rose-900/30 flex items-center justify-center text-rose-600 dark:text-rose-400 shrink-0">
            <Trash2 size={24} />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-[var(--color-content)] tracking-tight">
              Xóa bài viết?
            </h3>
            <p className="text-sm text-[var(--color-text-secondary)] font-medium">
              Hành động này không thể hoàn tác.
            </p>
          </div>
        </div>
        <div className="admin-card-muted p-4 rounded-2xl mb-6">
          <p className="text-sm text-[var(--color-text-secondary)] line-clamp-3 italic">
            "
            {post.content ||
              post.caption ||
              'Bài viết không có nội dung văn bản'}
            "
          </p>
        </div>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-3 rounded-xl font-semibold text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-hover)] transition-colors text-sm"
          >
            Hủy bỏ
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className="flex-1 py-3 rounded-xl font-semibold bg-rose-600 hover:bg-rose-700 text-white transition-all flex items-center justify-center gap-2 text-sm"
          >
            {loading ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <Trash2 size={16} />
            )}
            Xác nhận xóa
          </button>
        </div>
      </div>

    </div>
  );
}

export function ModeratePostModal({
  isOpen,
  onClose,
  onConfirm,
  loading,
  action,
  reason,
  setReason,
}) {
  const isHide = action === 'hide';

  useEscapeKey(isOpen, onClose);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/45 dark:bg-black/70 backdrop-blur-sm flex items-center justify-center z-[70] p-4 animate-fade-in"
      role="dialog"
      aria-modal="true"
      tabIndex={-1}
      onKeyDown={event => {
        if (event.key === 'Escape') onClose?.();
      }}
    >
      <div className="admin-card w-full max-w-lg p-4 rounded-2xl transform animate-scale-in">
        <div className="flex items-center gap-4 mb-6">
          <div
            className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 ${
              isHide
                ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400'
                : 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400'
            }`}
          >
            {isHide ? <AlertTriangle size={24} /> : <CheckCircle size={24} />}
          </div>
          <div>
            <h3 className="text-lg font-semibold text-[var(--color-content)] tracking-tight">
              {isHide ? 'Ẩn bài viết' : 'Hiện bài viết'}
            </h3>
            <p className="text-sm text-[var(--color-text-secondary)] font-medium">
              {isHide ? 'Vui lòng nhập lý do (bắt buộc)' : 'Xác nhận để hiển thị lại bài viết.'}
            </p>
          </div>
        </div>
        <div className="space-y-4 mb-6">
          <textarea
            value={reason}
            onChange={e => setReason(e.target.value)}
            placeholder={isHide ? 'Nhập lý do ẩn bài viết...' : 'Ghi chú (tuỳ chọn)'}
            className="admin-textarea w-full min-h-[120px]"
          />
        </div>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-3 rounded-xl font-semibold text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-hover)] transition-colors text-sm"
          >
            Hủy bỏ
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading || (isHide && !reason.trim())}
            className={`flex-1 py-3 rounded-xl font-semibold text-white transition-colors flex items-center justify-center gap-2 text-sm ${
              isHide
                ? 'bg-amber-600 hover:bg-amber-700 disabled:bg-amber-400'
                : 'bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400'
            }`}
          >
            {loading && <Loader2 size={16} className="animate-spin" />}
            {isHide ? 'Xác nhận ẩn' : 'Xác nhận hiện'}
          </button>
        </div>
      </div>

    </div>
  );
}

export function PostReportsModal({ isOpen, onClose, reports }) {
  useEscapeKey(isOpen, onClose);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/45 dark:bg-black/70 backdrop-blur-sm flex items-center justify-center z-[70] p-4 animate-fade-in"
      role="dialog"
      aria-modal="true"
      tabIndex={-1}
      onKeyDown={event => {
        if (event.key === 'Escape') onClose?.();
      }}
    >
      <div className="admin-card w-full max-w-2xl max-h-[80vh] flex flex-col rounded-2xl transform animate-scale-in overflow-hidden">
        <div className="p-4 bg-[var(--color-surface-secondary)] flex items-center justify-between">
          <h2 className="text-lg font-semibold text-[var(--color-content)] tracking-tight">
            Danh sách báo cáo
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="p-2 hover:bg-[var(--color-surface-hover)] rounded-full text-[var(--color-text-secondary)] transition-colors"
            aria-label="Đóng"
          >
            <X size={20} />
          </button>
        </div>
        <div className="p-4 overflow-y-auto space-y-4">
          {reports?.length > 0 ? (
            reports.map(report => (
              <div
                key={report._id}
                className="admin-card-muted p-4 rounded-2xl"
              >
                <div className="flex justify-between items-center mb-3">
                  <span className="admin-pill admin-pill-danger text-xs font-semibold">
                    <Shield size={12} className="mr-1.5" />
                    {report.reason}
                  </span>
                  <span className="text-xs text-[var(--color-text-tertiary)] font-semibold">
                    {new Date(report.createdAt).toLocaleDateString('vi-VN')}
                  </span>
                </div>
                <p className="text-sm text-[var(--color-text-secondary)] font-medium mb-3">
                  "{report.description || 'Không có mô tả'}"
                </p>
                <div className="flex items-center gap-2 pt-3 bg-[var(--color-surface)] rounded-xl px-2 py-1 mt-2">
                  <img
                    src={
                      report.reporter?.avatar || '/images/default-avatar.png'
                    }
                    className="w-6 h-6 rounded-full object-cover"
                    alt={
                      report.reporter?.username
                        ? `${report.reporter.username} avatar`
                        : 'Reporter avatar'
                    }
                  />
                  <span className="text-xs font-semibold text-[var(--color-text-secondary)]">
                    Báo cáo bởi:{' '}
                    <span className="text-[var(--color-content)]">
                      @{report.reporter?.username}
                    </span>
                  </span>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-12">
              <div className="w-16 h-16 rounded-full bg-[var(--color-surface-secondary)] flex items-center justify-center mx-auto mb-4 text-[var(--color-text-tertiary)]">
                <CheckCircle size={32} />
              </div>
              <p className="font-semibold text-[var(--color-text-secondary)]">
                Không có báo cáo nào.
              </p>
            </div>
          )}
        </div>
        <div className="p-4 bg-[var(--color-surface-secondary)]">
          <button
            type="button"
            onClick={onClose}
            className="w-full py-3 rounded-xl font-semibold bg-[var(--color-surface)] text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-hover)] transition-colors text-sm"
          >
            Đóng danh sách
          </button>
        </div>
      </div>

    </div>
  );
}
