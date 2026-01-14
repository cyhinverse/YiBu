import React from 'react';
import {
  Trash2,
  Loader2,
  X,
  AlertTriangle,
  CheckCircle,
  Shield,
} from 'lucide-react';

export function DeletePostModal({ isOpen, onClose, onConfirm, loading, post }) {
  if (!isOpen || !post) return null;

  return (
    <div className="fixed inset-0 bg-neutral-900/20 dark:bg-neutral-900/80 backdrop-blur-sm flex items-center justify-center z-[60] p-4 animate-fade-in">
      <div className="bg-white dark:bg-neutral-900 w-full max-w-md p-6 shadow-2xl rounded-3xl transform animate-scale-in">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-12 h-12 rounded-full bg-rose-100 dark:bg-rose-900/30 flex items-center justify-center text-rose-600 dark:text-rose-400 shrink-0">
            <Trash2 size={24} />
          </div>
          <div>
            <h3 className="text-xl font-bold text-neutral-900 dark:text-white tracking-tight">
              Xóa bài viết?
            </h3>
            <p className="text-sm text-neutral-500 font-medium">
              Hành động này không thể hoàn tác.
            </p>
          </div>
        </div>
        <div className="bg-neutral-100 dark:bg-neutral-800/50 p-4 rounded-2xl mb-6">
          <p className="text-sm text-neutral-600 dark:text-neutral-300 line-clamp-3 italic">
            "
            {post.content ||
              post.caption ||
              'Bài viết không có nội dung văn bản'}
            "
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
            className="flex-1 py-3 rounded-xl font-bold bg-rose-600 hover:bg-rose-700 text-white transition-all flex items-center justify-center gap-2 text-sm"
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
  if (!isOpen) return null;

  const isHide = action === 'hide';

  return (
    <div className="fixed inset-0 bg-neutral-900/20 dark:bg-neutral-900/80 backdrop-blur-sm flex items-center justify-center z-[70] p-4 animate-fade-in">
      <div className="bg-white dark:bg-neutral-900 w-full max-w-lg p-6 shadow-2xl rounded-3xl transform animate-scale-in">
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
            <h3 className="text-xl font-bold text-neutral-900 dark:text-white tracking-tight">
              {isHide ? 'Ẩn bài viết' : 'Phê duyệt bài viết'}
            </h3>
            <p className="text-sm text-neutral-500 font-medium">
              Vui lòng nhập lý do (bắt buộc)
            </p>
          </div>
        </div>
        <div className="space-y-4 mb-6">
          <textarea
            value={reason}
            onChange={e => setReason(e.target.value)}
            placeholder="Nhập lý do kiểm duyệt..."
            className="w-full min-h-[120px] p-4 bg-neutral-100 dark:bg-neutral-800/50 rounded-2xl border-none focus:ring-2 focus:ring-primary/50 outline-none text-sm font-medium resize-none transition-all"
          />
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
            disabled={loading || !reason.trim()}
            className={`flex-1 py-3 rounded-xl font-bold text-white shadow-lg transition-all flex items-center justify-center gap-2 text-sm ${
              isHide
                ? 'bg-amber-600 hover:bg-amber-700 disabled:bg-amber-400'
                : 'bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400'
            }`}
          >
            {loading && <Loader2 size={16} className="animate-spin" />}
            {isHide ? 'Xác nhận ẩn' : 'Xác nhận duyệt'}
          </button>
        </div>
      </div>
    </div>
  );
}

export function PostReportsModal({ isOpen, onClose, reports }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-neutral-900/20 dark:bg-neutral-900/80 backdrop-blur-sm flex items-center justify-center z-[70] p-4 animate-fade-in">
      <div className="bg-white dark:bg-neutral-900 w-full max-w-2xl max-h-[80vh] flex flex-col shadow-2xl rounded-3xl transform animate-scale-in overflow-hidden">
        <div className="p-6 bg-neutral-100/50 dark:bg-neutral-800/40 flex items-center justify-between">
          <h2 className="text-xl font-bold text-neutral-900 dark:text-white tracking-tight">
            Danh sách báo cáo
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-full text-neutral-500 transition-colors"
          >
            <X size={20} />
          </button>
        </div>
        <div className="p-6 overflow-y-auto space-y-4">
          {reports?.length > 0 ? (
            reports.map(report => (
              <div
                key={report._id}
                className="p-5 rounded-2xl bg-neutral-100/50 dark:bg-neutral-800/30"
              >
                <div className="flex justify-between items-center mb-3">
                  <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-rose-100 dark:bg-rose-900/30 text-rose-700 dark:text-rose-400">
                    <Shield size={12} className="mr-1.5" />
                    {report.reason}
                  </span>
                  <span className="text-xs text-neutral-400 font-bold">
                    {new Date(report.createdAt).toLocaleDateString('vi-VN')}
                  </span>
                </div>
                <p className="text-sm text-neutral-700 dark:text-neutral-300 font-medium mb-3">
                  "{report.description || 'Không có mô tả'}"
                </p>
                <div className="flex items-center gap-2 pt-3 bg-white/50 dark:bg-neutral-900/50 rounded-xl px-2 py-1 mt-2">
                  <img
                    src={
                      report.reporter?.avatar || '/images/default-avatar.png'
                    }
                    className="w-6 h-6 rounded-full object-cover"
                    alt=""
                  />
                  <span className="text-xs font-bold text-neutral-500">
                    Báo cáo bởi:{' '}
                    <span className="text-neutral-900 dark:text-white">
                      @{report.reporter?.username}
                    </span>
                  </span>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-12">
              <div className="w-16 h-16 rounded-full bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center mx-auto mb-4 text-neutral-400">
                <CheckCircle size={32} />
              </div>
              <p className="font-bold text-neutral-600 dark:text-neutral-300">
                Không có báo cáo nào.
              </p>
            </div>
          )}
        </div>
        <div className="p-6 bg-neutral-100/50 dark:bg-neutral-800/40">
          <button
            onClick={onClose}
            className="w-full py-3 rounded-xl font-bold bg-white dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-700 transition-colors text-sm shadow-sm"
          >
            Đóng danh sách
          </button>
        </div>
      </div>
    </div>
  );
}
