import React, { useState } from 'react';
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

  if (!isOpen || !report) return null;

  return (
    <div className="fixed inset-0 bg-neutral-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
      <div className="yb-card !bg-white dark:!bg-neutral-900 w-full max-w-lg shadow-2xl transform animate-scale-in overflow-hidden border-none">
        {/* Header */}
        <div className="p-6 border-b border-neutral-100 dark:border-neutral-800 flex items-center justify-between bg-neutral-50/50 dark:bg-neutral-800/30">
          <h2 className="text-xl font-black text-neutral-900 dark:text-white uppercase tracking-tight">
            Chi tiết báo cáo
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-neutral-200 dark:hover:bg-neutral-700 rounded-full transition-colors text-neutral-500"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-6">
          {/* Reporter Info */}
          <div className="flex items-center gap-4 mb-6 p-4 bg-neutral-50 dark:bg-neutral-800/50 rounded-2xl border border-neutral-100 dark:border-neutral-700">
            <img
              src={report.reporter?.avatar || '/images/default-avatar.png'}
              alt="Reporter"
              className="yb-avatar w-14 h-14 !rounded-2xl border-2 border-white dark:border-neutral-700 shadow-sm"
            />
            <div>
              <p className="text-[10px] font-black text-neutral-400 uppercase tracking-widest mb-1">
                Người báo cáo
              </p>
              <p className="font-black text-neutral-900 dark:text-white text-lg leading-tight">
                {report.reporter?.name || 'Ẩn danh'}
              </p>
              <p className="text-xs text-neutral-500 font-mono mt-1">
                @{report.reporter?.username || 'unknown'}
              </p>
            </div>
          </div>

          {/* Report Reason */}
          <div className="mb-6">
            <p className="text-[10px] font-black text-neutral-400 uppercase tracking-widest mb-2">
              Lý do
            </p>
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400 border border-rose-100 dark:border-rose-900/30 font-black text-sm">
              <AlertTriangle size={16} />
              {report.reason}
            </div>
          </div>

          {/* Description */}
          <div className="mb-6">
            <p className="text-[10px] font-black text-neutral-400 uppercase tracking-widest mb-2">
              Mô tả chi tiết
            </p>
            <p className="text-neutral-700 dark:text-neutral-300 leading-relaxed bg-neutral-50 dark:bg-neutral-800/30 p-4 rounded-2xl border border-neutral-100 dark:border-neutral-800 italic text-sm">
              {report.description || 'Không có mô tả bổ sung.'}
            </p>
          </div>

          {/* Target Content */}
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-2">
              <div className="p-1.5 rounded-lg bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400">
                {getTargetIcon(report.target?.type)}
              </div>
              <p className="text-[10px] font-black text-neutral-400 uppercase tracking-widest">
                {getTargetTypeText(report.target?.type)} bị báo cáo
              </p>
            </div>
            <div className="p-5 bg-neutral-50 dark:bg-neutral-800/30 rounded-2xl border-2 border-dashed border-neutral-200 dark:border-neutral-700 shadow-inner">
              <p className="text-xs font-black text-neutral-500 mb-2 flex items-center gap-2">
                <User size={12} />
                Tác giả:{' '}
                <span className="text-neutral-900 dark:text-white">
                  {report.target?.author}
                </span>
              </p>
              <p className="text-neutral-900 dark:text-white font-bold leading-relaxed">
                "{report.target?.content}"
              </p>
            </div>
          </div>

          {/* Resolution Note Input */}
          {report.status === 'pending' && (
            <div className="mb-6">
              <p className="text-[10px] font-black text-neutral-400 uppercase tracking-widest mb-2">
                Ghi chú giải quyết
              </p>
              <textarea
                value={resolutionNote}
                onChange={e => setResolutionNote(e.target.value)}
                placeholder="Nhập ghi chú hoặc lý do giải quyết..."
                className="yb-input w-full min-h-[100px] py-3 text-sm resize-none bg-neutral-50 dark:bg-neutral-800/50"
              />
            </div>
          )}

          {/* Actions */}
          {(report.status === 'pending' || !report.status) && (
            <div className="flex gap-3 pt-6 border-t border-neutral-100 dark:border-neutral-800">
              <button
                onClick={() => onReject(report, resolutionNote)}
                className="yb-btn flex-1 !bg-neutral-100 dark:!bg-neutral-800 !text-neutral-700 dark:!text-neutral-300 !border-none hover:!bg-rose-500 hover:!text-white transition-all flex items-center justify-center gap-2 group"
              >
                <XCircle
                  size={18}
                  className="group-hover:scale-110 transition-transform"
                />
                Từ chối
              </button>
              <button
                onClick={() => onResolve(report, resolutionNote)}
                className="yb-btn yb-btn-primary flex-1 flex items-center justify-center gap-2 h-12 shadow-neutral-900/10"
              >
                <CheckCircle size={18} />
                Chấp nhận
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
