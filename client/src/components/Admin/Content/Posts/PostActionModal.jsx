import React from 'react';
import { Trash2, Loader2, X } from 'lucide-react';

export function DeletePostModal({ isOpen, onClose, onConfirm, loading, post }) {
  if (!isOpen || !post) return null;

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-[60] p-4 animate-fade-in">
      <div className="yb-card bg-surface w-full max-w-md p-10 shadow-2xl transform animate-scale-in text-center">
        <div className="flex flex-col items-center mb-8">
          <div className="w-20 h-20 rounded-3xl bg-error/20 text-error flex items-center justify-center mb-6 shadow-lg shadow-error/10">
            <Trash2 size={36} strokeWidth={3} />
          </div>
          <h2 className="text-2xl font-black text-primary mb-3 tracking-tight">
            Xóa bài viết?
          </h2>
          <p className="text-sm font-bold text-secondary px-4 leading-relaxed">
            Bạn có chắc chắn muốn xóa bài viết này không? Hành động này không
            thể hoàn tác.
          </p>
        </div>

        <div className="flex gap-4">
          <button
            onClick={onClose}
            className="yb-btn yb-btn-secondary flex-1 py-4 font-black"
          >
            Hủy bỏ
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className="yb-btn flex-1 py-4 font-black bg-error hover:bg-error/90 text-white shadow-xl shadow-error/20 flex items-center justify-center gap-2"
          >
            {loading && <Loader2 size={20} className="animate-spin" />}
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

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center z-[70] p-4 animate-fade-in">
      <div className="yb-card bg-surface w-full max-w-lg p-8 shadow-2xl transform animate-scale-in">
        <h2 className="text-2xl font-black text-primary mb-6 tracking-tight">
          {action === 'hide' ? 'Ẩn bài viết' : 'Phê duyệt bài viết'}
        </h2>

        <div className="space-y-6">
          <div>
            <label className="block text-sm font-black text-secondary mb-2 uppercase tracking-widest">
              Lý do thực hiện
            </label>
            <textarea
              value={reason}
              onChange={e => setReason(e.target.value)}
              placeholder="Nhập lý do kiểm duyệt..."
              className="yb-input w-full min-h-[120px] py-3 text-sm resize-none"
            />
          </div>

          <div className="flex gap-4">
            <button
              onClick={onClose}
              className="yb-btn yb-btn-secondary flex-1 py-4 font-black"
            >
              Hủy bỏ
            </button>
            <button
              onClick={onConfirm}
              disabled={loading}
              className={`yb-btn flex-1 py-4 font-black text-white shadow-xl flex items-center justify-center gap-2 ${
                action === 'hide'
                  ? 'bg-error hover:bg-error/90 shadow-error/20'
                  : 'bg-success hover:bg-success/90 shadow-success/20'
              }`}
            >
              {loading && <Loader2 size={18} className="animate-spin" />}
              Xác nhận
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export function PostReportsModal({ isOpen, onClose, reports }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center z-[70] p-4 animate-fade-in">
      <div className="yb-card bg-surface w-full max-w-2xl max-h-[80vh] flex flex-col shadow-2xl transform animate-scale-in">
        <div className="p-6 border-b border-border flex items-center justify-between bg-surface-secondary/30">
          <h2 className="text-xl font-black text-primary tracking-tight">
            Danh sách báo cáo
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-surface-secondary rounded-full text-secondary"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-6 overflow-y-auto space-y-4">
          {reports?.length > 0 ? (
            reports.map(report => (
              <div
                key={report._id}
                className="p-4 border border-border rounded-2xl bg-surface-secondary/20"
              >
                <div className="flex justify-between items-center mb-2">
                  <span className="text-xs font-black text-error uppercase tracking-widest bg-error/10 px-2 py-0.5 rounded border border-error/10">
                    {report.reason}
                  </span>
                  <span className="text-[10px] text-secondary font-bold">
                    {new Date(report.createdAt).toLocaleDateString('vi-VN')}
                  </span>
                </div>
                <p className="text-sm text-primary font-medium">
                  {report.description || 'Không có mô tả'}
                </p>
                <div className="mt-2 flex items-center gap-2">
                  <img
                    src={
                      report.reporter?.avatar || '/images/default-avatar.png'
                    }
                    className="w-5 h-5 rounded-full border border-border"
                  />
                  <span className="text-[10px] font-bold text-secondary">
                    @{report.reporter?.username}
                  </span>
                </div>
              </div>
            ))
          ) : (
            <p className="text-center py-10 text-secondary font-bold">
              Không có báo cáo nào.
            </p>
          )}
        </div>

        <div className="p-6 border-t border-border bg-surface-secondary/30">
          <button
            onClick={onClose}
            className="yb-btn yb-btn-secondary w-full py-3 font-black"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
}
