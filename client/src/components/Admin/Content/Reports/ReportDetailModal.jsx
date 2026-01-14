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
    <div className="fixed inset-0 bg-neutral-900/20 dark:bg-neutral-900/80 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
      <div
        className="bg-white dark:bg-neutral-900 w-full max-w-lg shadow-2xl rounded-3xl transform animate-scale-in overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-5 bg-neutral-100/50 dark:bg-neutral-800/40 flex items-center justify-between">
          <h2 className="text-xl font-bold text-neutral-900 dark:text-white tracking-tight">
            Chi tiết báo cáo
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-full transition-colors text-neutral-500 dark:text-neutral-400"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-6 overflow-y-auto max-h-[80vh]">
          {/* Reporter Info */}
          <div className="flex items-center gap-4 mb-6 p-4 bg-neutral-100 dark:bg-neutral-800/50 rounded-2xl shadow-sm">
            <img
              src={report.reporter?.avatar || '/images/default-avatar.png'}
              alt="Reporter"
              className="w-12 h-12 rounded-full object-cover"
            />
            <div>
              <p className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest mb-0.5">
                Người báo cáo
              </p>
              <div className="flex items-center gap-2">
                <p className="font-bold text-neutral-900 dark:text-white text-base">
                  {report.reporter?.name || 'Ẩn danh'}
                </p>
                <p className="text-xs text-neutral-400 font-medium">
                  @{report.reporter?.username || 'unknown'}
                </p>
              </div>
            </div>
          </div>

          {/* Report Reason */}
          <div className="mb-6">
            <p className="text-xs font-bold text-neutral-900 dark:text-white mb-2.5">
              Lý do báo cáo
            </p>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-orange-100 dark:bg-orange-900/10 text-orange-600 dark:text-orange-400 font-bold text-sm">
              <AlertTriangle size={16} />
              {report.reason}
            </div>
          </div>

          {/* Description */}
          <div className="mb-6">
            <p className="text-xs font-bold text-neutral-900 dark:text-white mb-2.5">
              Mô tả chi tiết
            </p>
            <p className="text-neutral-600 dark:text-neutral-300 leading-relaxed bg-neutral-100 dark:bg-neutral-800/50 p-4 rounded-2xl italic text-sm">
              "{report.description || 'Không có mô tả bổ sung.'}"
            </p>
          </div>

          {/* Target Content */}
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-2.5">
              <div className="p-1 rounded-md bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400">
                {getTargetIcon(report.target?.type)}
              </div>
              <p className="text-xs font-bold text-neutral-900 dark:text-white">
                Nội dung bị báo cáo
              </p>
            </div>
            <div className="p-5 bg-neutral-100 dark:bg-neutral-800/30 rounded-2xl relative group">
              <div className="absolute top-4 right-4 text-[10px] font-bold text-neutral-400 uppercase tracking-wider bg-white dark:bg-neutral-900 px-2 py-1 rounded-md shadow-sm">
                {getTargetTypeText(report.target?.type)}
              </div>
              <p className="text-xs font-bold text-neutral-500 mb-2 flex items-center gap-1.5">
                <User size={12} />
                Tác giả:{' '}
                <span className="text-neutral-900 dark:text-white">
                  {report.target?.author}
                </span>
              </p>
              <p className="text-neutral-900 dark:text-white font-medium leading-relaxed pr-16 text-sm">
                "{report.target?.content}"
              </p>
            </div>
          </div>

          {/* Resolution Note Input */}
          {report.status === 'pending' && (
            <div className="mb-2">
              <p className="text-xs font-bold text-neutral-900 dark:text-white mb-2.5">
                Ghi chú giải quyết
              </p>
              <textarea
                value={resolutionNote}
                onChange={e => setResolutionNote(e.target.value)}
                placeholder="Nhập ghi chú cho quyết định của bạn..."
                className="w-full min-h-[100px] p-4 text-sm bg-neutral-50 dark:bg-neutral-800 border-none rounded-2xl placeholder:text-neutral-400 focus:ring-2 focus:ring-neutral-200 dark:focus:ring-neutral-700 outline-none resize-none transition-all"
              />
            </div>
          )}
        </div>

        {/* Actions */}
        {(report.status === 'pending' || !report.status) && (
          <div className="p-6 pt-2 bg-neutral-100/50 dark:bg-neutral-800/40 flex gap-3 rounded-b-3xl">
            <button
              onClick={() => onReject(report, resolutionNote)}
              className="px-6 py-3 rounded-xl bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 font-bold text-sm hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors flex-1 flex items-center justify-center gap-2"
            >
              <XCircle size={18} />
              Từ chối báo cáo
            </button>
            <button
              onClick={() => onResolve(report, resolutionNote)}
              className="px-6 py-3 rounded-xl bg-black dark:bg-white text-white dark:text-black font-bold text-sm hover:opacity-90 transition-opacity flex-1 flex items-center justify-center gap-2"
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
