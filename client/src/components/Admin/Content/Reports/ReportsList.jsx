import React from 'react';
import {
  MoreHorizontal,
  Eye,
  CheckCircle,
  XCircle,
  Calendar,
  Loader2,
  RefreshCcw,
} from 'lucide-react';
import {
  getTargetIcon,
  getStatusStyle,
  getStatusText,
  getTargetTypeText,
} from './ReportsUtils.jsx';

export default function ReportsList({
  loading,
  reports,
  activeDropdown,
  setActiveDropdown,
  onViewDetails,
  onStartReview,
  onOpenStatusModal,
}) {
  if (loading && reports.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <Loader2
          size={40}
          className="animate-spin text-neutral-900 dark:text-white mb-4"
        />
        <p className="text-neutral-500 font-medium">Đang tải báo cáo...</p>
      </div>
    );
  }

  if (reports.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-neutral-500">
        <div className="w-20 h-20 rounded-full bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center mb-4">
          <CheckCircle size={40} className="text-emerald-500/50" />
        </div>
        <p className="font-bold text-lg text-neutral-900 dark:text-white">
          Không tìm thấy báo cáo nào
        </p>
        <p className="text-sm">Làm tốt lắm! Hệ thống hiện đang an toàn.</p>
      </div>
    );
  }

  return (
    <div className="divide-y divide-neutral-100 dark:divide-neutral-800">
      {reports.map(report => {
        const reporter = report.reporter || report.reportedBy || {};
        const targetType = report.targetType || report.target?.type || 'post';
        const targetContent =
          report.targetContent ||
          report.target?.content ||
          report.content ||
          '';
        const targetAuthor = report.targetAuthor || report.target?.author || '';

        return (
          <div
            key={report._id || report.id}
            className="p-6 hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors duration-200"
          >
            <div className="flex items-start gap-5">
              {/* Reporter Avatar */}
              <div className="relative flex-shrink-0">
                <img
                  src={reporter.avatar || '/images/default-avatar.png'}
                  alt={reporter.name || reporter.username || 'Reporter'}
                  className="yb-avatar w-12 h-12 !rounded-2xl border-2 border-white dark:border-neutral-800 shadow-sm"
                />
                <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-lg bg-white dark:bg-neutral-900 flex items-center justify-center shadow-sm border border-neutral-100 dark:border-neutral-800">
                  {getTargetIcon(targetType)}
                </div>
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-4 mb-3">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-bold text-neutral-900 dark:text-white">
                        {reporter.name || reporter.username || 'Ẩn danh'}
                      </h3>
                      <span className="text-neutral-400 text-sm">
                        báo cáo một
                      </span>
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 text-xs font-bold uppercase tracking-wider">
                        {getTargetTypeText(targetType)}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 mt-1 text-xs font-medium text-neutral-400">
                      <span className="flex items-center gap-1.5">
                        <Calendar size={12} />
                        {report.createdAt
                          ? new Date(report.createdAt).toLocaleString('vi-VN')
                          : 'N/A'}
                      </span>
                      <span className="px-1.5 py-0.5 rounded bg-neutral-100 dark:bg-neutral-800 text-[10px] font-mono">
                        ID: {report._id?.slice(-6) || '...'}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <span
                      className={`px-3 py-1 rounded-full text-[10px] font-black border uppercase tracking-widest ${getStatusStyle(
                        report.status || 'pending'
                      )}`}
                    >
                      {getStatusText(report.status || 'pending')}
                    </span>

                    {/* Actions Dropdown */}
                    <div className="relative">
                      <button
                        onClick={() =>
                          setActiveDropdown(
                            activeDropdown === (report._id || report.id)
                              ? null
                              : report._id || report.id
                          )
                        }
                        className="p-2 hover:bg-neutral-100 dark:hover:bg-neutral-700 rounded-xl transition-colors text-neutral-400 hover:text-neutral-900 dark:hover:text-white"
                      >
                        <MoreHorizontal size={18} />
                      </button>

                      {activeDropdown === (report._id || report.id) && (
                        <div className="absolute right-0 top-full mt-2 w-52 bg-white dark:bg-neutral-900 rounded-2xl shadow-xl border border-neutral-100 dark:border-neutral-800 py-2 z-20 overflow-hidden animate-scale-in">
                          <button
                            onClick={() => {
                              onViewDetails(report);
                              setActiveDropdown(null);
                            }}
                            className="w-full px-4 py-2 text-left text-sm font-bold hover:bg-neutral-50 dark:hover:bg-neutral-800/50 flex items-center gap-3 text-neutral-700 dark:text-neutral-300"
                          >
                            <Eye size={16} />
                            Xem chi tiết
                          </button>

                          {(report.status === 'pending' || !report.status) && (
                            <>
                              <div className="h-px bg-neutral-100 dark:bg-neutral-800 my-1" />
                              <button
                                onClick={() => {
                                  onStartReview(report);
                                  setActiveDropdown(null);
                                }}
                                className="w-full px-4 py-2 text-left text-sm font-bold hover:bg-amber-50 dark:hover:bg-amber-900/10 flex items-center gap-3 text-amber-600"
                              >
                                <RefreshCcw size={16} />
                                Bắt đầu xem xét
                              </button>
                              <button
                                onClick={() => {
                                  onOpenStatusModal(report, 'resolved');
                                  setActiveDropdown(null);
                                }}
                                className="w-full px-4 py-2 text-left text-sm font-bold hover:bg-emerald-50 dark:hover:bg-emerald-900/10 flex items-center gap-3 text-emerald-600"
                              >
                                <CheckCircle size={16} />
                                Chấp nhận
                              </button>
                              <button
                                onClick={() => {
                                  onOpenStatusModal(report, 'rejected');
                                  setActiveDropdown(null);
                                }}
                                className="w-full px-4 py-2 text-left text-sm font-bold hover:bg-rose-50 dark:hover:bg-rose-900/10 flex items-center gap-3 text-rose-600"
                              >
                                <XCircle size={16} />
                                Từ chối
                              </button>
                            </>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Reason Badge */}
                <div className="mb-3">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-orange-50 dark:bg-orange-900/10 text-orange-600 dark:text-orange-400 text-sm font-black border border-orange-100/50 dark:border-orange-900/30">
                    <span className="font-bold">Lý do:</span>{' '}
                    {report.reason || report.type || 'Vi phạm'}
                  </span>
                </div>

                {/* Description */}
                <p className="text-neutral-600 dark:text-neutral-400 text-sm mb-4 leading-relaxed bg-neutral-50/50 dark:bg-neutral-900/50 p-4 rounded-2xl border border-neutral-100 dark:border-neutral-800 italic">
                  {report.description ||
                    report.details ||
                    'Không có chi tiết bổ sung.'}
                </p>

                {/* Target Content Preview */}
                <div className="flex items-center gap-4 pt-4 border-t border-neutral-100 dark:border-neutral-800">
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] font-black text-neutral-400 uppercase tracking-widest mb-1">
                      Nội dung bị báo cáo
                    </p>
                    <div className="flex items-center gap-2">
                      <div className="w-1 h-8 bg-neutral-200 dark:bg-neutral-700 rounded-full flex-shrink-0" />
                      <p className="text-sm font-bold text-neutral-900 dark:text-white truncate">
                        "{targetContent || 'Nội dung không khả dụng'}"
                      </p>
                    </div>
                  </div>
                  {targetAuthor && (
                    <div className="text-right flex-shrink-0">
                      <p className="text-[10px] font-black text-neutral-400 uppercase tracking-widest mb-1">
                        Tác giả
                      </p>
                      <p className="text-sm font-bold text-neutral-900 dark:text-white">
                        {targetAuthor}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
