import { useState, useEffect } from 'react';
import { useDebounce } from '@/hooks/useDebounce';
import { Search, RefreshCcw, ChevronLeft, ChevronRight } from 'lucide-react';
import {
  useAdminReports,
  usePendingReports,
  useResolveReport,
  useStartReportReview,
  useUpdateReportStatus,
} from '@/hooks/useAdminQuery';
import ReportStats from './ReportStats';
import ReportsList from './ReportsList';
import ReportDetailModal from './ReportDetailModal';
import ReportStatusModal from './ReportStatusModal';

export default function Reports() {
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearch = useDebounce(searchTerm, 500);
  const [currentPage, setCurrentPage] = useState(1);
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterType, setFilterType] = useState('all');
  const [activeDropdown, setActiveDropdown] = useState(null);
  const [selectedReport, setSelectedReport] = useState(null);
  const [newStatus, setNewStatus] = useState('');
  const [showStatusModal, setShowStatusModal] = useState(false);

  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearch]);

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

  const { data: pendingReportsData } = usePendingReports({ page: 1, limit: 1 });

  const reportsList = Array.isArray(reportsData?.reports)
    ? reportsData.reports
    : Array.isArray(reportsData?.data)
    ? reportsData.data
    : [];
  const pagination = {
    pages: reportsData?.totalPages || reportsData?.pages || 1,
  };

  const pendingCount =
    pendingReportsData?.totalReports || pendingReportsData?.totalDocs || 0;

  // Mutations
  const resolveMutation = useResolveReport();
  const startReviewMutation = useStartReportReview();
  const updateStatusMutation = useUpdateReportStatus();

  const loading = reportsLoading;
  const reports = Array.isArray(reportsList) ? reportsList : [];

  const handleResolve = async (report, notes) => {
    try {
      await resolveMutation.mutateAsync({
        reportId: report._id || report.id,
        decision: 'resolved',
        notes: notes || 'Đã giải quyết bởi quản trị viên',
      });
    } catch (error) {
      console.error('Failed to resolve report:', error);
    }
    setActiveDropdown(null);
    setSelectedReport(null);
  };

  const handleReject = async (report, notes) => {
    try {
      await resolveMutation.mutateAsync({
        reportId: report._id || report.id,
        decision: 'rejected',
        notes: notes || 'Đã từ chối bởi quản trị viên',
      });
    } catch (error) {
      console.error('Failed to reject report:', error);
    }
    setActiveDropdown(null);
    setSelectedReport(null);
  };

  const handleStartReview = async report => {
    try {
      await startReviewMutation.mutateAsync(report._id || report.id);
    } catch (error) {
      console.error('Failed to start review:', error);
    }
    setActiveDropdown(null);
  };

  const handleUpdateStatus = async (report, status, notes) => {
    if (!report) return;
    try {
      await updateStatusMutation.mutateAsync({
        reportId: report._id || report.id,
        status: status,
        notes: notes || 'Trạng thái được cập nhật thủ công bởi quản trị viên',
      });
      setShowStatusModal(false);
      setSelectedReport(null);
    } catch (error) {
      console.error('Failed to update status:', error);
    }
  };

  const handleOpenStatusModal = (report, status) => {
    setSelectedReport(report);
    setNewStatus(status);
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
      <ReportStats reports={reports} />

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
        <ReportsList
          loading={loading}
          reports={reports}
          activeDropdown={activeDropdown}
          setActiveDropdown={setActiveDropdown}
          onViewDetails={report => setSelectedReport(report)}
          onStartReview={handleStartReview}
          onOpenStatusModal={handleOpenStatusModal}
        />
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
      {selectedReport && !showStatusModal && (
        <ReportDetailModal
          report={selectedReport}
          isOpen={true}
          onClose={() => setSelectedReport(null)}
          onResolve={handleResolve}
          onReject={handleReject}
        />
      )}

      {/* Status Update Modal */}
      <ReportStatusModal
        isOpen={showStatusModal}
        onClose={() => setShowStatusModal(false)}
        report={selectedReport}
        newStatus={newStatus}
        onUpdateStatus={handleUpdateStatus}
        loading={updateStatusMutation.isLoading}
      />
    </div>
  );
}
