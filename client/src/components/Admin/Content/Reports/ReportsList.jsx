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
        <Loader2 size={40} className="animate-spin text-neutral-400 mb-4" />
        <p className="text-neutral-500 font-medium">Đang tải báo cáo...</p>
      </div>
    );
  }

  if (reports.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-neutral-500">
        <div className="w-20 h-20 rounded-full bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center mb-4 text-neutral-400">
          <CheckCircle size={40} />
        </div>
        <p className="font-bold text-lg text-neutral-900 dark:text-white">
          Không tìm thấy báo cáo nào
        </p>
        <p className="text-sm">Hệ thống an toàn.</p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-neutral-900">
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
            className="p-5 hover:bg-neutral-100/50 dark:hover:bg-neutral-800/50 transition-colors duration-200 rounded-2xl mb-2 bg-white dark:bg-neutral-900 shadow-sm"
          >
            <div className="flex items-start gap-4">
              {/* Reporter Avatar */}
              <div className="relative flex-shrink-0">
                <img
                  src={reporter.avatar || '/images/default-avatar.png'}
                  alt={reporter.name || reporter.username || 'Reporter'}
                  className="w-10 h-10 rounded-full object-cover"
                />
                <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-white dark:bg-neutral-900 flex items-center justify-center text-neutral-500 shadow-sm">
                  {getTargetIcon(targetType)}
                </div>
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-4 mb-2">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-bold text-neutral-900 dark:text-white text-sm">
                        {reporter.name || reporter.username || 'Ẩn danh'}
                      </h3>
                      <span className="text-neutral-500 text-sm">báo cáo</span>
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 text-xs font-medium">
                        {getTargetTypeText(targetType)}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 mt-1 text-xs text-neutral-400 font-medium">
                      <span className="flex items-center gap-1">
                        <Calendar size={12} />
                        {report.createdAt
                          ? new Date(report.createdAt).toLocaleDateString(
                              'vi-VN'
                            )
                          : 'N/A'}
                      </span>
                      <span className="text-neutral-300 dark:text-neutral-700">
                        •
                      </span>
                      <span>ID: {report._id?.slice(-6) || '...'}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span
                      className={`px-2.5 py-1 rounded-full text-xs font-medium ${getStatusStyle(
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
                        className="p-1.5 hover:bg-neutral-100 dark:hover:bg-neutral-700 rounded-full transition-colors text-neutral-400 hover:text-neutral-900 dark:hover:text-white"
                      >
                        <MoreHorizontal size={18} />
                      </button>

                      {activeDropdown === (report._id || report.id) && (
                        <div className="absolute right-0 top-full mt-2 w-48 bg-white dark:bg-neutral-900 rounded-xl shadow-xl py-1.5 z-20 overflow-hidden animate-scale-in">
                          <button
                            onClick={() => {
                              onViewDetails(report);
                              setActiveDropdown(null);
                            }}
                            className="w-full px-4 py-2 text-left text-sm font-medium hover:bg-neutral-50 dark:hover:bg-neutral-800/50 flex items-center gap-2.5 text-neutral-700 dark:text-neutral-300 transition-colors"
                          >
                            <Eye size={16} />
                            Xem chi tiết
                          </button>
                          {(report.status === 'pending' || !report.status) && (
                            <>
                              <div className="h-px bg-neutral-100/50 dark:bg-neutral-800/20 my-1 mx-2" />
                              <button
                                onClick={() => {
                                  onStartReview(report);
                                  setActiveDropdown(null);
                                }}
                                className="w-full px-4 py-2 text-left text-sm font-medium hover:bg-amber-50 dark:hover:bg-amber-900/10 flex items-center gap-2.5 text-amber-600 transition-colors"
                              >
                                <RefreshCcw size={16} />
                                Xem xét
                              </button>
                              <button
                                onClick={() => {
                                  onOpenStatusModal(report, 'resolved');
                                  setActiveDropdown(null);
                                }}
                                className="w-full px-4 py-2 text-left text-sm font-medium hover:bg-emerald-50 dark:hover:bg-emerald-900/10 flex items-center gap-2.5 text-emerald-600 transition-colors"
                              >
                                <CheckCircle size={16} />
                                Chấp nhận
                              </button>
                              <button
                                onClick={() => {
                                  onOpenStatusModal(report, 'rejected');
                                  setActiveDropdown(null);
                                }}
                                className="w-full px-4 py-2 text-left text-sm font-medium hover:bg-rose-50 dark:hover:bg-rose-900/10 flex items-center gap-2.5 text-rose-600 transition-colors"
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
                <div className="mb-2">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-orange-100/50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400 text-xs font-medium">
                    <span className="font-semibold">Lý do:</span>{' '}
                    {report.reason || report.type || 'Vi phạm'}
                  </span>
                </div>

                {/* Description */}
                {report.description && (
                  <p className="text-neutral-600 dark:text-neutral-400 text-sm mb-3 pl-3 bg-neutral-50/50 dark:bg-neutral-800/30 py-2 rounded-lg italic">
                    "{report.description}"
                  </p>
                )}

                {/* Target Content Preview */}
                <div className="flex items-center gap-3 pt-3 bg-neutral-50/20 dark:bg-neutral-800/10 rounded-xl px-2 py-1 mt-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest mb-1">
                      Nội dung bị báo cáo
                    </p>
                    <p className="text-sm font-medium text-neutral-900 dark:text-white truncate">
                      {targetContent || (
                        <span className="text-neutral-400 italic">
                          Nội dung không khả dụng
                        </span>
                      )}
                    </p>
                  </div>
                  {targetAuthor && (
                    <div className="text-right flex-shrink-0">
                      <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest mb-1">
                        Tác giả
                      </p>
                      <p className="text-sm font-medium text-neutral-900 dark:text-white">
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
