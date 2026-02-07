import React, { useEffect, useState } from 'react';
import { X, AlertTriangle, User, CheckCircle, XCircle } from 'lucide-react';
import { getTargetIcon, getTargetTypeText } from './ReportsUtils.jsx';

export default function ReportDetailModal({
  report,
  isOpen,
  onClose,
  onResolve,
  onReject,
}) {
  const [resolutionNote, setResolutionNote] = useState('');

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

  const handleKeyDown = event => {
    if (event.key === 'Escape') {
      onClose?.();
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/45 dark:bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in"
      role="dialog"
      aria-modal="true"
      tabIndex={-1}
      onKeyDown={handleKeyDown}
    >
      <div
        className="admin-card w-full max-w-lg rounded-2xl transform animate-scale-in overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-4 py-3.5 bg-[var(--color-surface-secondary)] flex items-center justify-between">
          <h2 className="text-lg font-semibold text-[var(--color-content)] tracking-tight">
            Chi tiết báo cáo
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

        <div className="p-4 overflow-y-auto max-h-[80vh]">
          {/* Reporter Info */}
          <div className="flex items-center gap-4 mb-6 p-4 bg-[var(--color-surface-secondary)] rounded-2xl">
            <img
              src={report.reporter?.avatar || '/images/default-avatar.png'}
              alt={
                report.reporter?.name || report.reporter?.username || 'Reporter'
              }
              className="w-12 h-12 rounded-full object-cover"
            />
            <div>
              <p className="text-[10px] font-semibold text-[var(--color-text-tertiary)] uppercase tracking-[0.2em] mb-0.5">
                Người báo cáo
              </p>
              <div className="flex items-center gap-2">
                <p className="font-semibold text-[var(--color-content)] text-base">
                  {report.reporter?.name || 'Ẩn danh'}
                </p>
                <p className="text-xs text-[var(--color-text-tertiary)] font-medium">
                  @{report.reporter?.username || 'unknown'}
                </p>
              </div>
            </div>
          </div>

          {/* Report Reason */}
          <div className="mb-6">
            <p className="text-xs font-semibold text-[var(--color-content)] mb-2.5">
              Lý do báo cáo
            </p>
            <div className="admin-pill admin-pill-warning text-sm">
              <AlertTriangle size={16} />
              {report.reason}
            </div>
          </div>

          {/* Description */}
          <div className="mb-6">
            <p className="text-xs font-semibold text-[var(--color-content)] mb-2.5">
              Mô tả chi tiết
            </p>
            <p className="text-[var(--color-text-secondary)] leading-relaxed bg-[var(--color-surface-secondary)] p-4 rounded-2xl italic text-sm">
              "{report.description || 'Không có mô tả bổ sung.'}"
            </p>
          </div>

          {/* Target Content */}
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-2.5">
              <div className="p-1 rounded-md bg-[var(--color-surface-secondary)] text-[var(--color-text-secondary)]">
                {getTargetIcon(report.target?.type)}
              </div>
              <p className="text-xs font-semibold text-[var(--color-content)]">
                Nội dung bị báo cáo
              </p>
            </div>
            <div className="p-4 bg-[var(--color-surface-secondary)] rounded-2xl relative group">
              <div className="absolute top-4 right-4 text-[10px] font-semibold text-[var(--color-text-tertiary)] uppercase tracking-[0.2em] bg-[var(--color-surface)] px-2 py-1 rounded-md">
                {getTargetTypeText(report.target?.type)}
              </div>
              <p className="text-xs font-semibold text-[var(--color-text-tertiary)] mb-2 flex items-center gap-1.5">
                <User size={12} />
                Tác giả:{' '}
                <span className="text-[var(--color-content)]">
                  {report.target?.author}
                </span>
              </p>
              <p className="text-[var(--color-content)] font-medium leading-relaxed pr-16 text-sm">
                "{report.target?.content}"
              </p>
            </div>
          </div>

          {/* Resolution Note Input */}
          {report.status === 'pending' && (
            <div className="mb-2">
              <p className="text-xs font-semibold text-[var(--color-content)] mb-2.5">
                Ghi chú giải quyết
              </p>
              <textarea
                value={resolutionNote}
                onChange={e => setResolutionNote(e.target.value)}
                placeholder="Nhập ghi chú cho quyết định của bạn..."
                className="admin-textarea w-full min-h-[100px]"
              />
            </div>
          )}
        </div>

        {/* Actions */}
        {(report.status === 'pending' || !report.status) && (
          <div className="p-4 pt-2 bg-[var(--color-surface-secondary)] flex gap-3 rounded-b-3xl">
            <button
              type="button"
              onClick={() => onReject(report, resolutionNote)}
              className="px-5 py-3 rounded-xl bg-[var(--color-surface)] text-[var(--color-text-secondary)] font-semibold text-sm hover:bg-[var(--color-surface-hover)] transition-colors flex-1 flex items-center justify-center gap-2"
            >
              <XCircle size={18} />
              Từ chối báo cáo
            </button>
            <button
              type="button"
              onClick={() => onResolve(report, resolutionNote)}
              className="px-5 py-3 rounded-xl bg-[var(--color-primary)] text-[var(--color-primary-foreground)] font-semibold text-sm hover:opacity-90 transition-opacity flex-1 flex items-center justify-center gap-2"
            >
              <CheckCircle size={18} />
              Chấp nhận báo cáo
            </button>
          </div>
        )}
      </div>

    </div>
  );
}
