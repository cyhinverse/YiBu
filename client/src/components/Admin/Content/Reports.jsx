import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
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
} from 'lucide-react';
import {
  getAllReports,
  getPendingReports,
  reviewReport,
  resolveReport,
  startReportReview,
} from '../../../redux/actions/adminActions';

const getTargetIcon = type => {
  switch (type) {
    case 'post':
      return <FileText size={16} />;
    case 'comment':
      return <MessageCircle size={16} />;
    case 'user':
      return <User size={16} />;
    default:
      return <Flag size={16} />;
  }
};

const getStatusStyle = status => {
  switch (status) {
    case 'pending':
      return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400';
    case 'resolved':
      return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400';
    case 'rejected':
      return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400';
    default:
      return 'bg-neutral-100 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-400';
  }
};

const getStatusText = status => {
  switch (status) {
    case 'pending':
      return 'Chờ xử lý';
    case 'resolved':
      return 'Đã xử lý';
    case 'rejected':
      return 'Từ chối';
    default:
      return status;
  }
};

export default function Reports() {
  const dispatch = useDispatch();
  const {
    reports: reportsList,
    pendingReports,
    pagination,
    loading,
  } = useSelector(state => state.admin);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterType, setFilterType] = useState('all');
  const [selectedReport, setSelectedReport] = useState(null);
  const [activeDropdown, setActiveDropdown] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [resolutionNote, setResolutionNote] = useState('');

  // Fetch reports on mount and when filters change
  useEffect(() => {
    const params = {
      page: currentPage,
      limit: 10,
    };
    if (filterStatus !== 'all') params.status = filterStatus;
    if (filterType !== 'all') params.type = filterType;

    dispatch(getAllReports(params));
    dispatch(getPendingReports());
  }, [dispatch, currentPage, filterStatus, filterType]);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchTerm !== undefined) {
        const params = {
          page: 1,
          limit: 10,
          search: searchTerm || undefined,
        };
        if (filterStatus !== 'all') params.status = filterStatus;
        if (filterType !== 'all') params.type = filterType;
        dispatch(getAllReports(params));
        setCurrentPage(1);
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const reports = Array.isArray(reportsList) ? reportsList : [];
  const pendingCount = Array.isArray(pendingReports)
    ? pendingReports.length
    : reports.filter(r => r.status === 'pending').length;

  const handleResolve = async report => {
    try {
      await dispatch(
        resolveReport({
          reportId: report._id || report.id,
          resolution: 'resolved',
          notes: resolutionNote || 'Report resolved by admin',
        })
      ).unwrap();
      dispatch(getAllReports({ page: currentPage, limit: 10 }));
      dispatch(getPendingReports());
    } catch (error) {
      console.error('Failed to resolve report:', error);
    }
    setActiveDropdown(null);
    setResolutionNote('');
  };

  const handleReject = async report => {
    try {
      await dispatch(
        resolveReport({
          reportId: report._id || report.id,
          resolution: 'rejected',
          notes: resolutionNote || 'Report rejected by admin',
        })
      ).unwrap();
      dispatch(getAllReports({ page: currentPage, limit: 10 }));
      dispatch(getPendingReports());
    } catch (error) {
      console.error('Failed to reject report:', error);
    }
    setActiveDropdown(null);
    setResolutionNote('');
  };

  const handleStartReview = async report => {
    try {
      await dispatch(startReportReview(report._id || report.id)).unwrap();
      dispatch(getAllReports({ page: currentPage, limit: 10 }));
    } catch (error) {
      console.error('Failed to start review:', error);
    }
    setActiveDropdown(null);
  };

  const handleRefresh = () => {
    dispatch(getAllReports({ page: currentPage, limit: 10 }));
    dispatch(getPendingReports());
  };

  const handlePageChange = newPage => {
    setCurrentPage(newPage);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-black dark:text-white">
            Quản lý báo cáo
          </h1>
          <p className="text-neutral-500 dark:text-neutral-400 mt-1">
            {pendingCount} báo cáo chờ xử lý
          </p>
        </div>
        <button
          onClick={handleRefresh}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 bg-neutral-100 dark:bg-neutral-800 rounded-lg font-medium text-sm hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors disabled:opacity-50"
        >
          <RefreshCcw size={16} className={loading ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-2xl p-4 border border-yellow-200 dark:border-yellow-800">
          <p className="text-yellow-600 dark:text-yellow-400 text-sm font-medium">
            Chờ xử lý
          </p>
          <p className="text-2xl font-bold text-yellow-700 dark:text-yellow-300 mt-1">
            {reports.filter(r => r.status === 'pending').length}
          </p>
        </div>
        <div className="bg-green-50 dark:bg-green-900/20 rounded-2xl p-4 border border-green-200 dark:border-green-800">
          <p className="text-green-600 dark:text-green-400 text-sm font-medium">
            Đã xử lý
          </p>
          <p className="text-2xl font-bold text-green-700 dark:text-green-300 mt-1">
            {reports.filter(r => r.status === 'resolved').length}
          </p>
        </div>
        <div className="bg-red-50 dark:bg-red-900/20 rounded-2xl p-4 border border-red-200 dark:border-red-800">
          <p className="text-red-600 dark:text-red-400 text-sm font-medium">
            Từ chối
          </p>
          <p className="text-2xl font-bold text-red-700 dark:text-red-300 mt-1">
            {reports.filter(r => r.status === 'rejected').length}
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search
            size={18}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400"
          />
          <input
            type="text"
            placeholder="Tìm kiếm báo cáo..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-black dark:text-white focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white"
          />
        </div>

        <div className="flex gap-3">
          <select
            value={filterType}
            onChange={e => setFilterType(e.target.value)}
            className="px-4 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-black dark:text-white focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white"
          >
            <option value="all">Tất cả loại</option>
            <option value="post">Bài viết</option>
            <option value="comment">Bình luận</option>
            <option value="user">Người dùng</option>
          </select>

          <select
            value={filterStatus}
            onChange={e => setFilterStatus(e.target.value)}
            className="px-4 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-black dark:text-white focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white"
          >
            <option value="all">Tất cả trạng thái</option>
            <option value="pending">Chờ xử lý</option>
            <option value="resolved">Đã xử lý</option>
            <option value="rejected">Từ chối</option>
          </select>
        </div>
      </div>

      {/* Reports List */}
      {loading && reports.length === 0 ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 size={24} className="animate-spin text-neutral-400" />
        </div>
      ) : reports.length === 0 ? (
        <div className="text-center py-12 text-neutral-500">
          Không có báo cáo nào
        </div>
      ) : (
        <div className="space-y-4">
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
                className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 p-5"
              >
                <div className="flex items-start gap-4">
                  {/* Reporter Avatar */}
                  <img
                    src={reporter.avatar || '/images/default-avatar.png'}
                    alt={reporter.name || reporter.username || 'Reporter'}
                    className="w-10 h-10 rounded-full border-2 border-neutral-200 dark:border-neutral-700 flex-shrink-0"
                  />

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-semibold text-black dark:text-white">
                            {reporter.name || reporter.username || 'Unknown'}
                          </h3>
                          <span className="text-neutral-500 dark:text-neutral-400 text-sm">
                            báo cáo
                          </span>
                          <span className="flex items-center gap-1 text-sm font-medium text-black dark:text-white">
                            {getTargetIcon(targetType)}
                            {targetType === 'post'
                              ? 'bài viết'
                              : targetType === 'comment'
                              ? 'bình luận'
                              : 'người dùng'}
                          </span>
                          <span className="text-neutral-500 dark:text-neutral-400 text-sm">
                            của
                          </span>
                          <span className="font-medium text-black dark:text-white text-sm">
                            {targetAuthor || 'Unknown'}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 mt-1 text-sm text-neutral-500 dark:text-neutral-400">
                          <Calendar size={14} />
                          {report.createdAt
                            ? new Date(report.createdAt).toLocaleString()
                            : 'N/A'}
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusStyle(
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
                            className="p-2 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg transition-colors"
                          >
                            <MoreHorizontal
                              size={18}
                              className="text-neutral-500"
                            />
                          </button>

                          {activeDropdown === (report._id || report.id) && (
                            <div className="absolute right-0 top-full mt-1 w-44 bg-white dark:bg-neutral-800 rounded-xl shadow-lg border border-neutral-200 dark:border-neutral-700 py-1 z-10">
                              <button
                                onClick={() => {
                                  setSelectedReport(report);
                                  setActiveDropdown(null);
                                }}
                                className="w-full px-4 py-2 text-left text-sm hover:bg-neutral-100 dark:hover:bg-neutral-700 flex items-center gap-2"
                              >
                                <Eye size={16} />
                                Xem chi tiết
                              </button>
                              {(report.status === 'pending' ||
                                !report.status) && (
                                <>
                                  <button
                                    onClick={() => handleStartReview(report)}
                                    className="w-full px-4 py-2 text-left text-sm hover:bg-neutral-100 dark:hover:bg-neutral-700 flex items-center gap-2 text-blue-600"
                                  >
                                    <Eye size={16} />
                                    Bắt đầu xem xét
                                  </button>
                                  <button
                                    onClick={() => handleResolve(report)}
                                    className="w-full px-4 py-2 text-left text-sm hover:bg-neutral-100 dark:hover:bg-neutral-700 flex items-center gap-2 text-green-600"
                                  >
                                    <CheckCircle size={16} />
                                    Chấp nhận xử lý
                                  </button>
                                  <button
                                    onClick={() => handleReject(report)}
                                    className="w-full px-4 py-2 text-left text-sm hover:bg-neutral-100 dark:hover:bg-neutral-700 flex items-center gap-2 text-red-600"
                                  >
                                    <XCircle size={16} />
                                    Từ chối báo cáo
                                  </button>
                                </>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Reason */}
                    <div className="mt-3">
                      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 text-sm font-medium">
                        <AlertTriangle size={14} />
                        {report.reason || report.type || 'Violation'}
                      </span>
                    </div>

                    {/* Description */}
                    <p className="mt-3 text-neutral-600 dark:text-neutral-400 text-sm">
                      {report.description ||
                        report.details ||
                        'No additional details'}
                    </p>

                    {/* Target Content Preview */}
                    <div className="mt-3 p-3 bg-neutral-50 dark:bg-neutral-800 rounded-lg border border-neutral-200 dark:border-neutral-700">
                      <p className="text-sm text-neutral-500 dark:text-neutral-400">
                        Nội dung bị báo cáo:
                      </p>
                      <p className="text-sm text-black dark:text-white mt-1 truncate">
                        &quot;{targetContent || 'Content not available'}&quot;
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-neutral-500 dark:text-neutral-400">
          Page {currentPage} of {pagination?.pages || 1} (
          {pagination?.total || reports.length} reports)
        </p>
        <div className="flex items-center gap-2">
          <button
            disabled={currentPage <= 1}
            onClick={() => handlePageChange(currentPage - 1)}
            className="p-2 rounded-lg border border-neutral-200 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-800 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronLeft size={18} />
          </button>
          <span className="px-4 py-2 text-sm">Trang {currentPage}</span>
          <button
            disabled={currentPage >= (pagination?.pages || 1)}
            onClick={() => handlePageChange(currentPage + 1)}
            className="p-2 rounded-lg border border-neutral-200 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-800 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronRight size={18} />
          </button>
        </div>
      </div>

      {/* View Report Modal */}
      {selectedReport && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-neutral-900 rounded-2xl w-full max-w-lg">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-black dark:text-white">
                  Chi tiết báo cáo
                </h2>
                <button
                  onClick={() => setSelectedReport(null)}
                  className="p-2 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Reporter */}
              <div className="flex items-center gap-3 mb-4 p-3 bg-neutral-50 dark:bg-neutral-800 rounded-xl">
                <img
                  src={selectedReport.reporter.avatar}
                  alt={selectedReport.reporter.name}
                  className="w-10 h-10 rounded-full border-2 border-neutral-200 dark:border-neutral-700"
                />
                <div>
                  <p className="text-sm text-neutral-500 dark:text-neutral-400">
                    Người báo cáo
                  </p>
                  <p className="font-semibold text-black dark:text-white">
                    {selectedReport.reporter.name}
                  </p>
                </div>
              </div>

              {/* Target */}
              <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 rounded-xl border border-red-200 dark:border-red-800">
                <div className="flex items-center gap-2 mb-2">
                  {getTargetIcon(selectedReport.target.type)}
                  <span className="text-sm font-medium text-red-700 dark:text-red-400">
                    {selectedReport.target.type === 'post'
                      ? 'Bài viết'
                      : selectedReport.target.type === 'comment'
                      ? 'Bình luận'
                      : 'Người dùng'}{' '}
                    bị báo cáo
                  </span>
                </div>
                <p className="text-sm text-black dark:text-white">
                  Tác giả: <strong>{selectedReport.target.author}</strong>
                </p>
                <p className="text-sm text-neutral-600 dark:text-neutral-400 mt-2">
                  "{selectedReport.target.content}"
                </p>
              </div>

              {/* Reason */}
              <div className="mb-4">
                <p className="text-sm text-neutral-500 dark:text-neutral-400 mb-2">
                  Lý do báo cáo
                </p>
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 font-medium">
                  <AlertTriangle size={16} />
                  {selectedReport.reason}
                </span>
              </div>

              {/* Description */}
              <div className="mb-6">
                <p className="text-sm text-neutral-500 dark:text-neutral-400 mb-2">
                  Mô tả chi tiết
                </p>
                <p className="text-black dark:text-white">
                  {selectedReport.description}
                </p>
              </div>

              {/* Actions */}
              {selectedReport.status === 'pending' && (
                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      handleReject(selectedReport.id);
                      setSelectedReport(null);
                    }}
                    className="flex-1 px-4 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors flex items-center justify-center gap-2"
                  >
                    <XCircle size={18} />
                    Từ chối
                  </button>
                  <button
                    onClick={() => {
                      handleResolve(selectedReport.id);
                      setSelectedReport(null);
                    }}
                    className="flex-1 px-4 py-2.5 rounded-xl bg-green-600 text-white hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
                  >
                    <CheckCircle size={18} />
                    Xử lý
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
