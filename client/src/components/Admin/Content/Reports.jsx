import { useState, useEffect } from 'react';
import { useDebounce } from '@/hooks/useDebounce';
import {
  Search,
  MoreHorizontal,
  Eye,
  CheckCircle,
  XCircle,
  Calendar,
  ChevronLeft,
  ChevronRight,
  X,
  AlertTriangle,
  Flag,
  MessageCircle,
  User,
  FileText,
  RefreshCcw,
  Loader2,
  Check,
} from 'lucide-react';
import {
  useAdminReports,
  usePendingReports,
  useResolveReport,
  useStartReportReview,
  useUpdateReportStatus,
} from '@/hooks/useAdminQuery';

const getTargetIcon = type => {
  switch (type) {
    case 'post':
      return <FileText size={18} />;
    case 'comment':
      return <MessageCircle size={18} />;
    case 'user':
      return <User size={18} />;
    default:
      return <Flag size={18} />;
  }
};

const getStatusStyle = status => {
  switch (status) {
    case 'pending':
      return 'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800';
    case 'resolved':
      return 'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800';
    case 'rejected':
      return 'bg-rose-100 text-rose-700 border-rose-200 dark:bg-rose-900/30 dark:text-rose-400 dark:border-rose-800';
    default:
      return 'bg-neutral-100 text-neutral-700 border-neutral-200 dark:bg-neutral-800 dark:text-neutral-400 dark:border-neutral-700';
  }
};

const getStatusText = status => {
  switch (status) {
    case 'pending':
      return 'Chờ xử lý';
    case 'resolved':
      return 'Đã giải quyết';
    case 'rejected':
      return 'Đã từ chối';
    default:
      return status;
  }
};

const getTargetTypeText = type => {
  switch (type) {
    case 'post':
      return 'bài viết';
    case 'comment':
      return 'bình luận';
    case 'user':
      return 'người dùng';
    default:
      return type;
  }
};

export default function Reports() {
  /* State */
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearch = useDebounce(searchTerm, 500);
  const [currentPage, setCurrentPage] = useState(1);
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterType, setFilterType] = useState('all');
  const [activeDropdown, setActiveDropdown] = useState(null);
  const [selectedReport, setSelectedReport] = useState(null);
  const [resolutionNote, setResolutionNote] = useState('');
  const [newStatus, setNewStatus] = useState('');
  const [showStatusModal, setShowStatusModal] = useState(false);

  // Reset page on search
  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearch]);

  // Queries
  const {
    data: reportsData,
    isLoading: reportsLoading,
    refetch: refetchReports,
  } = useAdminReports({
    page: currentPage,
    limit: 10,
    search: debouncedSearch || undefined,
    status: filterStatus !== 'all' ? filterStatus : undefined,
    type: filterType !== 'all' ? filterType : undefined,
  });

  const { data: pendingReportsData } = usePendingReports({ page: 1, limit: 1 }); // Just to get total count? Or use reportsData stats if available?
  // pendingReportsData usually returns list + totalDocs.
  // pendingCount logic below uses pendingReports length if array, or filters reports.

  const reportsList = Array.isArray(reportsData?.reports)
    ? reportsData.reports
    : Array.isArray(reportsData?.data)
    ? reportsData.data
    : [];
  const pagination = {
    pages: reportsData?.totalPages || reportsData?.pages || 1,
  };

  const pendingCount =
    pendingReportsData?.totalReports || pendingReportsData?.totalDocs || 0; // Check API response structure for total

  // Mutations
  const resolveMutation = useResolveReport();
  const startReviewMutation = useStartReportReview();
  const updateStatusMutation = useUpdateReportStatus();

  const loading = reportsLoading;
  const reports = Array.isArray(reportsList) ? reportsList : [];

  const handleResolve = async report => {
    try {
      await resolveMutation.mutateAsync({
        reportId: report._id || report.id,
        decision: 'resolved',
        notes: resolutionNote || 'Đã giải quyết bởi quản trị viên',
      });
      // refetch is handled by invalidation
    } catch (error) {
      console.error('Failed to resolve report:', error);
    }
    setActiveDropdown(null);
    setResolutionNote('');
  };

  const handleReject = async report => {
    try {
      await resolveMutation.mutateAsync({
        reportId: report._id || report.id,
        decision: 'rejected',
        notes: resolutionNote || 'Đã từ chối bởi quản trị viên',
      });
    } catch (error) {
      console.error('Failed to reject report:', error);
    }
    setActiveDropdown(null);
    setResolutionNote('');
  };

  const handleStartReview = async report => {
    try {
      await startReviewMutation.mutateAsync(report._id || report.id);
    } catch (error) {
      console.error('Failed to start review:', error);
    }
    setActiveDropdown(null);
  };

  const handleUpdateStatus = async () => {
    if (!selectedReport) return;
    try {
      await updateStatusMutation.mutateAsync({
        reportId: selectedReport._id || selectedReport.id,
        status: newStatus,
        notes:
          resolutionNote ||
          'Trạng thái được cập nhật thủ công bởi quản trị viên',
      });
      setShowStatusModal(false);
      setSelectedReport(null);
      setResolutionNote('');
    } catch (error) {
      console.error('Failed to update status:', error);
    }
  };

  const handleOpenStatusModal = (report, status) => {
    setSelectedReport(report);
    setNewStatus(status);
    setResolutionNote('');
    setShowStatusModal(true);
    setActiveDropdown(null);
  };

  const handleRefresh = () => {
    refetchReports();
  };

  const handlePageChange = newPage => {
    setCurrentPage(newPage);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="yb-card p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-neutral-900 to-neutral-600 dark:from-white dark:to-neutral-400 bg-clip-text text-transparent">
            Trung tâm Báo cáo
          </h1>
          <p className="text-sm text-neutral-500 mt-1">
            Có {pendingCount} báo cáo đang chờ xử lý
          </p>
        </div>
        <button
          onClick={handleRefresh}
          disabled={loading}
          className="yb-btn yb-btn-primary h-11 w-11 !p-0 flex items-center justify-center"
          title="Làm mới"
        >
          <RefreshCcw size={20} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="yb-card p-6 flex items-center justify-between border-l-4 border-l-amber-500">
          <div>
            <p className="text-xs font-bold text-neutral-500 uppercase tracking-wider mb-1">
              Chờ xử lý
            </p>
            <p className="text-3xl font-black text-amber-500">
              {reports.filter(r => r.status === 'pending').length}
            </p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-amber-50 dark:bg-amber-900/20 flex items-center justify-center text-amber-600 dark:text-amber-400">
            <AlertTriangle size={24} />
          </div>
        </div>

        <div className="yb-card p-6 flex items-center justify-between border-l-4 border-l-emerald-500">
          <div>
            <p className="text-xs font-bold text-neutral-500 uppercase tracking-wider mb-1">
              Đã giải quyết
            </p>
            <p className="text-3xl font-black text-emerald-500">
              {reports.filter(r => r.status === 'resolved').length}
            </p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
            <CheckCircle size={24} />
          </div>
        </div>

        <div className="yb-card p-6 flex items-center justify-between border-l-4 border-l-rose-500">
          <div>
            <p className="text-xs font-bold text-neutral-500 uppercase tracking-wider mb-1">
              Đã từ chối
            </p>
            <p className="text-3xl font-black text-rose-500">
              {reports.filter(r => r.status === 'rejected').length}
            </p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-rose-50 dark:bg-rose-900/20 flex items-center justify-center text-rose-600 dark:text-rose-400">
            <XCircle size={24} />
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search
            size={18}
            className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400"
          />
          <input
            type="text"
            placeholder="Tìm kiếm báo cáo..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="yb-input pl-11"
          />
        </div>

        <div className="flex gap-3">
          <select
            value={filterType}
            onChange={e => setFilterType(e.target.value)}
            className="yb-input min-w-[140px] cursor-pointer"
          >
            <option value="all">Tất cả loại</option>
            <option value="post">Bài viết</option>
            <option value="comment">Bình luận</option>
            <option value="user">Người dùng</option>
          </select>

          <select
            value={filterStatus}
            onChange={e => setFilterStatus(e.target.value)}
            className="yb-input min-w-[140px] cursor-pointer"
          >
            <option value="all">Tất cả trạng thái</option>
            <option value="pending">Chờ xử lý</option>
            <option value="resolved">Đã giải quyết</option>
            <option value="rejected">Đã từ chối</option>
          </select>
        </div>
      </div>

      {/* Reports List */}
      <div className="yb-card overflow-hidden">
        {loading && reports.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2
              size={40}
              className="animate-spin text-neutral-900 dark:text-white mb-4"
            />
            <p className="text-neutral-500 font-medium">Đang tải báo cáo...</p>
          </div>
        ) : reports.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-neutral-500">
            <div className="w-20 h-20 rounded-full bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center mb-4">
              <CheckCircle size={40} className="text-emerald-500/50" />
            </div>
            <p className="font-bold text-lg text-neutral-900 dark:text-white">
              Không tìm thấy báo cáo nào
            </p>
            <p className="text-sm">Làm tốt lắm! Hệ thống hiện đang an toàn.</p>
          </div>
        ) : (
          <div className="divide-y divide-neutral-100 dark:divide-neutral-800">
            {reports.map(report => {
              const reporter = report.reporter || report.reportedBy || {};
              const targetType =
                report.targetType || report.target?.type || 'post';
              const targetContent =
                report.targetContent ||
                report.target?.content ||
                report.content ||
                '';
              const targetAuthor =
                report.targetAuthor || report.target?.author || '';

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
                                ? new Date(report.createdAt).toLocaleString(
                                    'vi-VN'
                                  )
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
                                    setSelectedReport(report);
                                    setActiveDropdown(null);
                                  }}
                                  className="w-full px-4 py-2 text-left text-sm font-bold hover:bg-neutral-50 dark:hover:bg-neutral-800/50 flex items-center gap-3 text-neutral-700 dark:text-neutral-300"
                                >
                                  <Eye size={16} />
                                  Xem chi tiết
                                </button>

                                {(report.status === 'pending' ||
                                  !report.status) && (
                                  <>
                                    <div className="h-px bg-neutral-100 dark:bg-neutral-800 my-1" />
                                    <button
                                      onClick={() => handleStartReview(report)}
                                      className="w-full px-4 py-2 text-left text-sm font-bold hover:bg-amber-50 dark:hover:bg-amber-900/10 flex items-center gap-3 text-amber-600"
                                    >
                                      <RefreshCcw size={16} />
                                      Bắt đầu xem xét
                                    </button>
                                    <button
                                      onClick={() =>
                                        handleOpenStatusModal(
                                          report,
                                          'resolved'
                                        )
                                      }
                                      className="w-full px-4 py-2 text-left text-sm font-bold hover:bg-emerald-50 dark:hover:bg-emerald-900/10 flex items-center gap-3 text-emerald-600"
                                    >
                                      <CheckCircle size={16} />
                                      Chấp nhận
                                    </button>
                                    <button
                                      onClick={() =>
                                        handleOpenStatusModal(
                                          report,
                                          'rejected'
                                        )
                                      }
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
                        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-50 dark:bg-rose-900/10 text-rose-600 dark:text-rose-400 text-sm font-black border border-rose-100/50 dark:border-rose-900/30">
                          <AlertTriangle size={14} />
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
        )}
      </div>

      {/* Pagination */}
      <div className="yb-card flex items-center justify-between px-6 py-4">
        <span className="text-sm font-bold text-neutral-500">
          Trang {currentPage} / {pagination?.pages || 1}
        </span>
        <div className="flex items-center gap-2">
          <button
            disabled={currentPage <= 1}
            onClick={() => handlePageChange(currentPage - 1)}
            className="w-10 h-10 flex items-center justify-center rounded-xl border border-neutral-200 dark:border-neutral-700 hover:bg-neutral-50 dark:hover:bg-neutral-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all text-neutral-600 dark:text-neutral-400"
          >
            <ChevronLeft size={18} />
          </button>
          <div className="h-10 px-4 bg-neutral-900 dark:bg-white text-white dark:text-black rounded-xl text-sm font-black flex items-center justify-center shadow-lg shadow-neutral-900/10">
            {currentPage}
          </div>
          <button
            disabled={currentPage >= (pagination?.pages || 1)}
            onClick={() => handlePageChange(currentPage + 1)}
            className="w-10 h-10 flex items-center justify-center rounded-xl border border-neutral-200 dark:border-neutral-700 hover:bg-neutral-50 dark:hover:bg-neutral-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all text-neutral-600 dark:text-neutral-400"
          >
            <ChevronRight size={18} />
          </button>
        </div>
      </div>

      {/* View Report Modal */}
      {selectedReport && (
        <div className="fixed inset-0 bg-neutral-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="yb-card !bg-white dark:!bg-neutral-900 w-full max-w-lg shadow-2xl transform animate-scale-in overflow-hidden border-none">
            {/* Header */}
            <div className="p-6 border-b border-neutral-100 dark:border-neutral-800 flex items-center justify-between bg-neutral-50/50 dark:bg-neutral-800/30">
              <h2 className="text-xl font-black text-neutral-900 dark:text-white uppercase tracking-tight">
                Chi tiết báo cáo
              </h2>
              <button
                onClick={() => setSelectedReport(null)}
                className="p-2 hover:bg-neutral-200 dark:hover:bg-neutral-700 rounded-full transition-colors text-neutral-500"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-6">
              {/* Reporter Info */}
              <div className="flex items-center gap-4 mb-6 p-4 bg-neutral-50 dark:bg-neutral-800/50 rounded-2xl border border-neutral-100 dark:border-neutral-700">
                <img
                  src={
                    selectedReport.reporter?.avatar ||
                    '/images/default-avatar.png'
                  }
                  alt="Reporter"
                  className="yb-avatar w-14 h-14 !rounded-2xl border-2 border-white dark:border-neutral-700 shadow-sm"
                />
                <div>
                  <p className="text-[10px] font-black text-neutral-400 uppercase tracking-widest mb-1">
                    Người báo cáo
                  </p>
                  <p className="font-black text-neutral-900 dark:text-white text-lg leading-tight">
                    {selectedReport.reporter?.name || 'Ẩn danh'}
                  </p>
                  <p className="text-xs text-neutral-500 font-mono mt-1">
                    @{selectedReport.reporter?.username || 'unknown'}
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
                  {selectedReport.reason}
                </div>
              </div>

              {/* Description */}
              <div className="mb-6">
                <p className="text-[10px] font-black text-neutral-400 uppercase tracking-widest mb-2">
                  Mô tả chi tiết
                </p>
                <p className="text-neutral-700 dark:text-neutral-300 leading-relaxed bg-neutral-50 dark:bg-neutral-800/30 p-4 rounded-2xl border border-neutral-100 dark:border-neutral-800 italic text-sm">
                  {selectedReport.description || 'Không có mô tả bổ sung.'}
                </p>
              </div>

              {/* Target Content */}
              <div className="mb-8">
                <div className="flex items-center gap-2 mb-2">
                  <div className="p-1.5 rounded-lg bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400">
                    {getTargetIcon(selectedReport.target?.type)}
                  </div>
                  <p className="text-[10px] font-black text-neutral-400 uppercase tracking-widest">
                    {getTargetTypeText(selectedReport.target?.type)} bị báo cáo
                  </p>
                </div>
                <div className="p-5 bg-neutral-50 dark:bg-neutral-800/30 rounded-2xl border-2 border-dashed border-neutral-200 dark:border-neutral-700 shadow-inner">
                  <p className="text-xs font-black text-neutral-500 mb-2 flex items-center gap-2">
                    <User size={12} />
                    Tác giả:{' '}
                    <span className="text-neutral-900 dark:text-white">
                      {selectedReport.target?.author}
                    </span>
                  </p>
                  <p className="text-neutral-900 dark:text-white font-bold leading-relaxed">
                    "{selectedReport.target?.content}"
                  </p>
                </div>
              </div>

              {/* Resolution Note Input */}
              {selectedReport.status === 'pending' && (
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
              {(selectedReport.status === 'pending' ||
                !selectedReport.status) && (
                <div className="flex gap-3 pt-6 border-t border-neutral-100 dark:border-neutral-800">
                  <button
                    onClick={() => {
                      handleReject(selectedReport);
                      setSelectedReport(null);
                    }}
                    className="yb-btn flex-1 !bg-neutral-100 dark:!bg-neutral-800 !text-neutral-700 dark:!text-neutral-300 !border-none hover:!bg-rose-500 hover:!text-white transition-all flex items-center justify-center gap-2 group"
                  >
                    <XCircle
                      size={18}
                      className="group-hover:scale-110 transition-transform"
                    />
                    Từ chối
                  </button>
                  <button
                    onClick={() => {
                      handleResolve(selectedReport);
                      setSelectedReport(null);
                    }}
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
      )}
      {/* Status Update Modal */}
      {showStatusModal && selectedReport && (
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
                  onClick={() => {
                    setShowStatusModal(false);
                    setSelectedReport(null);
                  }}
                  className="yb-btn !bg-neutral-100 dark:!bg-neutral-800 !text-neutral-700 dark:!text-neutral-300 flex-1 py-4 font-black"
                >
                  Hủy bỏ
                </button>
                <button
                  onClick={handleUpdateStatus}
                  disabled={updateStatusMutation.isLoading}
                  className="yb-btn yb-btn-primary flex-1 py-4 font-black flex items-center justify-center gap-2"
                >
                  {updateStatusMutation.isLoading && (
                    <Loader2 size={18} className="animate-spin" />
                  )}
                  Cập nhật
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
