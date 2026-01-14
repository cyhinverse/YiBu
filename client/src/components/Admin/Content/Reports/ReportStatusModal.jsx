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

  if (!isOpen || !report) return null;

  return (
    <div className="fixed inset-0 bg-neutral-900/20 dark:bg-neutral-900/80 backdrop-blur-sm flex items-center justify-center z-[60] p-4 animate-fade-in">
      <div className="bg-white dark:bg-neutral-900 w-full max-w-md shadow-2xl rounded-3xl transform animate-scale-in overflow-hidden">
        {/* Header */}
        <div className="px-6 py-5 bg-neutral-100/50 dark:bg-neutral-800/40 flex items-center justify-between">
          <h2 className="text-xl font-bold text-neutral-900 dark:text-white tracking-tight">
            Cập nhật trạng thái
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-full transition-colors text-neutral-500 dark:text-neutral-400"
          >
            <X size={20} />
          </button>
        </div>
        <div className="p-6">
          <div className="space-y-5">
            <div>
              <p className="text-sm font-medium text-neutral-600 dark:text-neutral-400 mb-4">
                Bạn đang thay đổi trạng thái của báo cáo này thành:{' '}
                <span className="font-bold text-neutral-900 dark:text-white inline-block px-2 py-0.5 rounded-md bg-neutral-100 dark:bg-neutral-800 ml-1">
                  {getStatusText(newStatus)}
                </span>
              </p>

              <div className="mb-2">
                <label className="block text-xs font-bold text-neutral-900 dark:text-white mb-2">
                  Ghi chú cập nhật
                </label>
                <textarea
                  value={resolutionNote}
                  onChange={e => setResolutionNote(e.target.value)}
                  placeholder="Nhập lý do thay đổi trạng thái..."
                  className="w-full min-h-[120px] p-4 text-sm bg-neutral-50 dark:bg-neutral-800 border-none rounded-2xl placeholder:text-neutral-400 focus:ring-2 focus:ring-neutral-200 dark:focus:ring-neutral-700 outline-none resize-none transition-all"
                />
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                onClick={onClose}
                className="px-6 py-3 rounded-xl bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 font-bold text-sm hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors flex-1"
              >
                Hủy bỏ
              </button>
              <button
                onClick={() =>
                  onUpdateStatus(report, newStatus, resolutionNote)
                }
                disabled={loading}
                className="px-6 py-3 rounded-xl bg-black dark:bg-white text-white dark:text-black font-bold text-sm hover:opacity-90 transition-opacity flex-1 flex items-center justify-center gap-2"
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
