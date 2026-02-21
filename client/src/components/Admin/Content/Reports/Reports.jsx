import { useId, useState, useEffect } from 'react';
import { useDebounce } from '@/hooks/useDebounce';
import {
  Search,
  RefreshCcw,
  ChevronDown,
  Filter,
} from 'lucide-react';
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
import AdminPagination from '@/components/Admin/Shared/AdminPagination.jsx';

export default function Reports() {
  const reportsSearchId = useId();
  const reportsTypeId = useId();
  const reportsStatusId = useId();

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
  }, [debouncedSearch, filterStatus, filterType]);

  const {
    data: reportsData,
    isLoading: reportsLoading,
    refetch: refetchReports,
  } = useAdminReports({
    page: currentPage,
    limit: 10,
    status: filterStatus !== 'all' ? filterStatus : undefined,
    type: filterType !== 'all' ? filterType : undefined,
  });

  const { data: pendingReportsData } = usePendingReports({ page: 1, limit: 1 });

  const reportsList = Array.isArray(reportsData?.reports)
    ? reportsData.reports
    : Array.isArray(reportsData?.data)
    ? reportsData.data
    : [];
  const normalizedSearch = debouncedSearch.trim().toLowerCase();
  const isLocalSearching = Boolean(normalizedSearch);
  const filteredReports = isLocalSearching
    ? reportsList.filter(report => {
        const searchableText = [
          report.reason,
          report.description,
          report.reporter?.name,
          report.reporter?.username,
          report.targetType,
          report.targetContent,
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();
        return searchableText.includes(normalizedSearch);
      })
    : reportsList;
  const pagination = {
    pages: isLocalSearching
      ? 1
      : reportsData?.totalPages || reportsData?.pages || 1,
  };

  const pendingCount = pendingReportsData?.total || 0;

  // Mutations
  const resolveMutation = useResolveReport();
  const startReviewMutation = useStartReportReview();
  const updateStatusMutation = useUpdateReportStatus();

  const loading = reportsLoading;
  const reports = Array.isArray(filteredReports) ? filteredReports : [];

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
    <div className="admin-page">
      {/* Header */}
      <div className="admin-card p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--color-text-tertiary)]">
            Báo cáo
          </p>
          <h1 className="text-2xl font-semibold text-[var(--color-content)]">
            Trung tâm Báo cáo
          </h1>
          <p className="text-sm text-[var(--color-text-secondary)] mt-1">
            Có{' '}
            <span className="font-semibold text-[var(--color-content)]">
              {pendingCount}
            </span>{' '}
            báo cáo đang chờ xử lý
          </p>
        </div>
        <button
          type="button"
          onClick={handleRefresh}
          disabled={loading}
          onKeyDown={event => {
            if (event.key === 'Escape') {
              event.currentTarget.blur();
            }
          }}
          className="p-2 rounded-lg bg-[var(--color-surface-secondary)] text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-hover)] transition-colors"
          title="Làm mới"
          aria-label="Làm mới báo cáo"
        >
          <RefreshCcw size={20} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>

      {/* Stats Cards */}
      <ReportStats reports={reports} />

      {/* Filters */}
      <div className="admin-card p-4 flex flex-col md:flex-row gap-3 md:items-center">
        <div className="relative flex-1 w-full">
          <label htmlFor={reportsSearchId} className="sr-only">
            Tìm kiếm báo cáo
          </label>
          <Search
            size={16}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--color-text-tertiary)]"
          />
          <input
            id={reportsSearchId}
            type="text"
            placeholder="Tìm kiếm báo cáo..."
            value={searchTerm}
            aria-label="Search reports"
            onChange={e => setSearchTerm(e.target.value)}
            className="admin-input w-full pl-10"
          />
        </div>
        <div className="flex gap-2 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
          <div className="relative min-w-[160px]">
            <label htmlFor={reportsTypeId} className="sr-only">
              Lọc loại báo cáo
            </label>
            <Filter
              size={16}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--color-text-tertiary)] pointer-events-none"
            />
            <select
              id={reportsTypeId}
              value={filterType}
              onChange={e => setFilterType(e.target.value)}
              className="admin-select w-full pl-9 pr-9 appearance-none cursor-pointer"
            >
              <option value="all">Tất cả loại</option>
              <option value="post">Bài viết</option>
              <option value="comment">Bình luận</option>
              <option value="user">Người dùng</option>
              <option value="message">Tin nhắn</option>
            </select>
            <ChevronDown
              size={16}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-text-tertiary)] pointer-events-none"
            />
          </div>

          <div className="relative min-w-[180px]">
            <label htmlFor={reportsStatusId} className="sr-only">
              Lọc trạng thái báo cáo
            </label>
            <Filter
              size={16}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--color-text-tertiary)] pointer-events-none"
            />
            <select
              id={reportsStatusId}
              value={filterStatus}
              onChange={e => setFilterStatus(e.target.value)}
              className="admin-select w-full pl-9 pr-9 appearance-none cursor-pointer"
            >
              <option value="all">Tất cả trạng thái</option>
              <option value="pending">Chờ xử lý</option>
              <option value="reviewing">Đang xem xét</option>
              <option value="resolved">Đã giải quyết</option>
              <option value="rejected">Đã từ chối</option>
              <option value="escalated">Leo thang</option>
            </select>
            <ChevronDown
              size={16}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-text-tertiary)] pointer-events-none"
            />
          </div>
        </div>
      </div>

      {/* Reports List */}
      <div className="admin-card p-4">
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
      <AdminPagination
        currentPage={currentPage}
        totalPages={pagination?.pages || 1}
        canPrev={currentPage > 1}
        canNext={currentPage < (pagination?.pages || 1)}
        onPrev={() => handlePageChange(currentPage - 1)}
        onNext={() => handlePageChange(currentPage + 1)}
      />


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
