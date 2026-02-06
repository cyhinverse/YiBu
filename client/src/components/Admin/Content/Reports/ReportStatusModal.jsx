import React, { useState, useEffect } from 'react';
import { Loader2, X } from 'lucide-react';
import { getStatusText } from './ReportsUtils.jsx';

export default function ReportStatusModal({
  isOpen,
  onClose,
  report,
  newStatus,
  onUpdateStatus,
  loading,
}) {
  const [resolutionNote, setResolutionNote] = useState('');

  // Reset note when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setResolutionNote('');
    }
  }, [isOpen]);

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

  if (!isOpen || !report) return null;

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
      <div className="admin-card w-full max-w-md rounded-2xl transform animate-scale-in overflow-hidden">
        {/* Header */}
        <div className="px-4 py-3.5 bg-[var(--color-surface-secondary)] flex items-center justify-between">
          <h2 className="text-lg font-semibold text-[var(--color-content)] tracking-tight">
            Cập nhật trạng thái
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
        <div className="p-4">
          <div className="space-y-5">
            <div>
              <p className="text-sm font-medium text-[var(--color-text-secondary)] mb-4">
                Bạn đang thay đổi trạng thái của báo cáo này thành:{' '}
                <span className="font-semibold text-[var(--color-content)] inline-block px-2 py-0.5 rounded-md bg-[var(--color-surface-secondary)] ml-1">
                  {getStatusText(newStatus)}
                </span>
              </p>

              <div className="mb-2">
                <label className="block text-xs font-semibold text-[var(--color-content)] mb-2">
                  Ghi chú cập nhật
                </label>
                <textarea
                  value={resolutionNote}
                  onChange={e => setResolutionNote(e.target.value)}
                  aria-label="Ghi chú cập nhật"
                  placeholder="Nhập lý do thay đổi trạng thái..."
                  className="admin-textarea w-full min-h-[120px]"
                />
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-3 rounded-xl bg-[var(--color-surface-secondary)] text-[var(--color-text-secondary)] font-semibold text-sm hover:bg-[var(--color-surface-hover)] transition-colors flex-1"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={() =>
                  onUpdateStatus(report, newStatus, resolutionNote)
                }
                disabled={loading}
                className="px-5 py-3 rounded-xl bg-[var(--color-primary)] text-[var(--color-primary-foreground)] font-semibold text-sm hover:opacity-90 transition-opacity flex-1 flex items-center justify-center gap-2"
              >
                {loading && <Loader2 size={16} className="animate-spin" />}
                Cập nhật
              </button>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}
