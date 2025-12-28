import React, { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
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
    <div className="fixed inset-0 bg-neutral-900/70 backdrop-blur-md flex items-center justify-center z-[60] p-4 animate-fade-in">
      <div className="yb-card bg-white dark:bg-neutral-900 w-full max-w-md p-8 shadow-2xl transform animate-scale-in">
        <h2 className="text-2xl font-black text-neutral-900 dark:text-white mb-6 tracking-tight">
          Cập nhật trạng thái
        </h2>

        <div className="space-y-6">
          <div>
            <p className="text-sm font-bold text-neutral-500 mb-4">
              Chuyển trạng thái báo cáo sang:{' '}
              <span className="text-primary uppercase font-black">
                {getStatusText(newStatus)}
              </span>
            </p>
            <label className="block text-[10px] font-black text-neutral-400 mb-2 uppercase tracking-widest">
              Ghi chú cập nhật
            </label>
            <textarea
              value={resolutionNote}
              onChange={e => setResolutionNote(e.target.value)}
              placeholder="Nhập lý do thay đổi trạng thái..."
              className="yb-input w-full min-h-[120px] py-3 text-sm resize-none"
            />
          </div>

          <div className="flex gap-4">
            <button
              onClick={onClose}
              className="yb-btn !bg-neutral-100 dark:!bg-neutral-800 !text-neutral-700 dark:!text-neutral-300 flex-1 py-4 font-black"
            >
              Hủy bỏ
            </button>
            <button
              onClick={() => onUpdateStatus(report, newStatus, resolutionNote)}
              disabled={loading}
              className="yb-btn yb-btn-primary flex-1 py-4 font-black flex items-center justify-center gap-2"
            >
              {loading && <Loader2 size={18} className="animate-spin" />}
              Cập nhật
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
