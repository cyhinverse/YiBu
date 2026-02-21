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
          className="animate-spin text-[var(--color-text-tertiary)] mb-4"
        />
        <p className="text-[var(--color-text-secondary)] font-medium">
          Đang tải báo cáo...
        </p>
      </div>
    );
  }

  if (reports.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-[var(--color-text-secondary)]">
        <div className="w-20 h-20 rounded-full bg-[var(--color-surface-secondary)] flex items-center justify-center mb-4 text-[var(--color-text-tertiary)]">
          <CheckCircle size={40} />
        </div>
        <p className="font-bold text-lg text-[var(--color-content)]">
          Không tìm thấy báo cáo nào
        </p>
        <p className="text-sm">Hệ thống an toàn.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {reports.map(report => {
        const reporter = report.reporter || report.reportedBy || {};
        const targetType = report.targetType || report.target?.type || 'post';
        const targetContent =
          report.targetContent ||
          report.target?.content ||
          report.content ||
          '';
        const targetAuthor = report.targetAuthor || report.target?.author || '';
        const isReviewable =
          !report.status ||
          report.status === 'pending' ||
          report.status === 'reviewing';

        return (
          <div
            key={report._id || report.id}
            className="admin-card p-4 hover:bg-[var(--color-surface-hover)] transition-colors duration-200"
          >

            <div className="flex items-start gap-4">
              {/* Reporter Avatar */}
              <div className="relative flex-shrink-0">
                <img
                  src={reporter.avatar || '/images/default-avatar.png'}
                  alt={reporter.name || reporter.username || 'Reporter'}
                  className="w-10 h-10 rounded-full object-cover"
                />
                <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-[var(--color-surface-secondary)] flex items-center justify-center text-[var(--color-text-tertiary)]">
                  {getTargetIcon(targetType)}
                </div>
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-4 mb-2">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-bold text-[var(--color-content)] text-sm">
                        {reporter.name || reporter.username || 'Ẩn danh'}
                      </h3>
                      <span className="text-[var(--color-text-secondary)] text-sm">
                        báo cáo
                      </span>
                      <span className="admin-chip">
                        {getTargetTypeText(targetType)}
                      </span>

                    </div>
                    <div className="flex items-center gap-3 mt-1 text-xs text-[var(--color-text-tertiary)] font-medium">
                      <span className="flex items-center gap-1">
                        <Calendar size={12} />
                        {report.createdAt
                          ? new Date(report.createdAt).toLocaleDateString(
                              'vi-VN'
                            )
                          : 'N/A'}
                      </span>
                      <span className="text-[var(--color-text-tertiary)] opacity-60">
                        •
                      </span>
                      <span>ID: {report._id?.slice(-6) || '...'}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span
                      className={`admin-pill ${getStatusStyle(
                        report.status || 'pending'
                      )}`}
                    >
                      {getStatusText(report.status || 'pending')}
                    </span>


                    {/* Actions Dropdown */}
                    <div className="relative">
                      <button
                        type="button"
                        onClick={() =>
                          setActiveDropdown(
                            activeDropdown === (report._id || report.id)
                              ? null
                              : report._id || report.id
                          )
                        }
                        onKeyDown={event => {
                          if (event.key === 'Escape') {
                            setActiveDropdown(null);
                          }
                        }}
                        aria-haspopup="menu"
                        aria-expanded={
                          activeDropdown === (report._id || report.id)
                        }
                        aria-label="Tùy chọn"
                        className="p-1.5 hover:bg-[var(--color-surface-hover)] rounded-full transition-colors text-[var(--color-text-tertiary)]"
                      >
                        <MoreHorizontal size={18} strokeWidth={1.6} />
                      </button>

                      {activeDropdown === (report._id || report.id) && (
                        <div
                          role="menu"
                          className="absolute right-0 top-full mt-2 w-48 bg-[var(--color-surface)] rounded-xl py-1.5 z-20 overflow-hidden animate-scale-in"
                        >
                          <button
                            type="button"
                            onClick={() => {
                              onViewDetails(report);
                              setActiveDropdown(null);
                            }}
                            role="menuitem"
                            className="w-full px-4 py-2 text-left text-sm font-medium hover:bg-[var(--color-surface-hover)] flex items-center gap-2.5 text-[var(--color-text-secondary)] transition-colors"
                          >
                            <Eye size={16} />
                            Xem chi tiết
                          </button>
                          {isReviewable && (
                            <>
                              <div className="my-1 mx-2" />
                              {(!report.status || report.status === 'pending') && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    onStartReview(report);
                                    setActiveDropdown(null);
                                  }}
                                  role="menuitem"
                                  className="w-full px-4 py-2 text-left text-sm font-medium hover:bg-[var(--color-surface-hover)] flex items-center gap-2.5 text-[var(--color-warning)] transition-colors"
                                >
                                  <RefreshCcw size={16} />
                                  Xem xét
                                </button>
                              )}
                              <button
                                type="button"
                                onClick={() => {
                                  onOpenStatusModal(report, 'resolved');
                                  setActiveDropdown(null);
                                }}
                                role="menuitem"
                                className="w-full px-4 py-2 text-left text-sm font-medium hover:bg-[var(--color-surface-hover)] flex items-center gap-2.5 text-[var(--color-success)] transition-colors"
                              >
                                <CheckCircle size={16} />
                                Chấp nhận
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  onOpenStatusModal(report, 'rejected');
                                  setActiveDropdown(null);
                                }}
                                role="menuitem"
                                className="w-full px-4 py-2 text-left text-sm font-medium hover:bg-[var(--color-surface-hover)] flex items-center gap-2.5 text-[var(--color-error)] transition-colors"
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
                  <span className="admin-pill admin-pill-muted text-xs font-semibold">
                    <span className="font-semibold">Lý do:</span>{' '}
                    {report.reason || report.type || 'Vi phạm'}
                  </span>
                </div>


                {/* Description */}
                {report.description && (
                  <p className="text-[var(--color-text-secondary)] text-sm mb-3 pl-3 bg-[var(--color-surface-secondary)] py-2 rounded-lg italic">
                    "{report.description}"
                  </p>
                )}

                {/* Target Content Preview */}
                <div className="flex items-center gap-3 pt-3 bg-[var(--color-surface-secondary)] rounded-xl px-3 py-2 mt-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] font-bold text-[var(--color-text-tertiary)] uppercase tracking-widest mb-1">
                      Nội dung bị báo cáo
                    </p>
                    <p className="text-sm font-medium text-[var(--color-content)] truncate">
                      {targetContent || (
                        <span className="text-[var(--color-text-tertiary)] italic">
                          Nội dung không khả dụng
                        </span>
                      )}
                    </p>
                  </div>
                  {targetAuthor && (
                    <div className="text-right flex-shrink-0">
                      <p className="text-[10px] font-bold text-[var(--color-text-tertiary)] uppercase tracking-widest mb-1">
                        Tác giả
                      </p>
                      <p className="text-sm font-medium text-[var(--color-content)]">
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
