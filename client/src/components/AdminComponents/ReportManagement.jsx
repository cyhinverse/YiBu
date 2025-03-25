import React, { useState, useEffect } from "react";
import {
  Flag,
  CheckCircle,
  XCircle,
  Clock,
  Loader,
  AlertTriangle,
  User,
  MessageSquare,
  FileText,
} from "lucide-react";
import AdminService from "../../services/adminService";
import SearchAndFilter from "./ReportManagement/SearchAndFilter";
import HeaderActions from "./ReportManagement/HeaderActions";
import Pagination from "./ReportManagement/Pagination";
import ReportListTable from "./ReportManagement/ReportListTable";
import EmptyState from "./ReportManagement/EmptyState";
import ReportDetailModal from "./ReportManagement/ReportDetailModal";
import ResolveReportModal from "./ReportManagement/ResolveReportModal";
import DismissReportModal from "./ReportManagement/DismissReportModal";

const ReportManagement = () => {
  const [reports, setReports] = useState([]);
  const [selectedReport, setSelectedReport] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [showViewModal, setShowViewModal] = useState(false);
  const [showResolveModal, setShowResolveModal] = useState(false);
  const [showDismissModal, setShowDismissModal] = useState(false);
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterType, setFilterType] = useState("all");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalReports: 0,
    limit: 10,
  });
  const [processingAction, setProcessingAction] = useState(false);

  useEffect(() => {
    fetchReports();
  }, [pagination.currentPage, filterStatus, filterType]);

  const fetchReports = async () => {
    setLoading(true);
    setError(null);
    try {
      const filter = {};
      if (filterStatus !== "all") filter.status = filterStatus;
      if (filterType !== "all") filter.type = filterType;

      const result = await AdminService.getAllReports(
        pagination.currentPage || 1,
        pagination.limit || 10,
        filter
      );

      if (result && result.reports) {
        setReports(result.reports);
        if (result.pagination) {
          setPagination({
            currentPage: result.pagination.currentPage || 1,
            totalPages: result.pagination.totalPages || 1,
            totalReports: result.pagination.totalReports || 0,
            limit: result.pagination.limit || 10,
          });
        }
      } else {
        setReports([]);
        console.error("Invalid response format:", result);
      }
    } catch (err) {
      console.error("Error fetching reports:", err);
      setError("Failed to load reports. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleResolveReport = async (reportId, action, notes) => {
    if (processingAction) return;

    setProcessingAction(true);
    try {
      await AdminService.resolveReport(reportId, action, notes);
      setReports(
        reports.map((report) =>
          report._id === reportId ? { ...report, status: "resolved" } : report
        )
      );
      if (selectedReport && selectedReport._id === reportId) {
        setSelectedReport({ ...selectedReport, status: "resolved" });
      }
      setShowResolveModal(false);
      setShowViewModal(false);
    } catch (err) {
      console.error("Error resolving report:", err);
      setError("Failed to resolve report. Please try again.");
    } finally {
      setProcessingAction(false);
    }
  };

  const handleDismissReport = async (reportId, reason) => {
    if (processingAction) return;

    setProcessingAction(true);
    try {
      await AdminService.dismissReport(reportId, reason);
      setReports(
        reports.map((report) =>
          report._id === reportId ? { ...report, status: "dismissed" } : report
        )
      );
      if (selectedReport && selectedReport._id === reportId) {
        setSelectedReport({ ...selectedReport, status: "dismissed" });
      }
      setShowDismissModal(false);
      setShowViewModal(false);
    } catch (err) {
      console.error("Error dismissing report:", err);
      setError("Failed to dismiss report. Please try again.");
    } finally {
      setProcessingAction(false);
    }
  };

  const handleRefresh = () => {
    fetchReports();
  };

  const handleViewReport = async (reportId) => {
    try {
      const result = await AdminService.getReportById(reportId);
      setSelectedReport(result.report);
      setShowViewModal(true);
    } catch (err) {
      console.error("Error fetching report details:", err);
      setError("Failed to load report details. Please try again.");
    }
  };

  const handlePageChange = (newPage) => {
    if (newPage > 0 && newPage <= pagination.totalPages) {
      setPagination({ ...pagination, currentPage: newPage });
    }
  };

  const filteredReports = reports.filter((report) => {
    if (!report) return false;

    const matchesSearch =
      (report.reason &&
        report.reason.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (report.reporter &&
        report.reporter.name &&
        report.reporter.name
          .toLowerCase()
          .includes(searchTerm.toLowerCase())) ||
      (report.content &&
        report.content.toLowerCase().includes(searchTerm.toLowerCase()));

    return matchesSearch;
  });

  const getStatusBadgeColor = (status) => {
    if (!status) return "bg-gray-100 text-gray-800";

    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "resolved":
        return "bg-green-100 text-green-800";
      case "dismissed":
        return "bg-gray-100 text-gray-800";
      case "escalated":
        return "bg-purple-100 text-purple-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getTypeIcon = (type) => {
    if (!type) return <AlertTriangle size={16} className="text-gray-500" />;

    switch (type) {
      case "post":
        return <FileText size={16} className="text-blue-500" />;
      case "comment":
        return <MessageSquare size={16} className="text-green-500" />;
      case "user":
        return <User size={16} className="text-purple-500" />;
      default:
        return <AlertTriangle size={16} className="text-gray-500" />;
    }
  };

  const renderReportContent = (report) => {
    if (!report) return null;

    const reportType = report.reportType || report.type;
    if (!reportType) return null;

    switch (reportType) {
      case "post":
        return (
          <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
            <p className="text-gray-500 text-sm mb-1">Nội dung bài viết:</p>
            <p className="text-gray-800">{report.content}</p>
            {report.postDetails && report.postDetails.mediaUrl && (
              <div className="mt-2">
                <img
                  src={report.postDetails.mediaUrl}
                  alt="Nội dung bài viết"
                  className="max-h-40 rounded-md border border-gray-200"
                />
              </div>
            )}
          </div>
        );
      case "comment":
        return (
          <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
            <p className="text-gray-500 text-sm mb-1">Nội dung bình luận:</p>
            <p className="text-gray-800">{report.content}</p>
            <div className="mt-2 text-xs text-gray-500">
              <p>ID bình luận: {report.targetId}</p>
              {report.parentPostId && (
                <p>Thuộc bài viết: {report.parentPostId}</p>
              )}
            </div>
          </div>
        );
      case "user":
        return (
          <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
            <p className="text-gray-500 text-sm mb-1">Người dùng bị báo cáo:</p>
            <div className="flex items-center">
              {report.userDetails &&
              report.userDetails.profile &&
              report.userDetails.profile.avatar ? (
                <img
                  src={report.userDetails.profile.avatar}
                  alt={report.content}
                  className="w-10 h-10 rounded-full mr-3 border border-gray-200"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-gray-300 mr-3 flex items-center justify-center">
                  <User size={18} className="text-gray-500" />
                </div>
              )}
              <div>
                <p className="text-gray-800 font-medium">{report.content}</p>
                <p className="text-xs text-gray-500">ID: {report.targetId}</p>
              </div>
            </div>
          </div>
        );
      default:
        return (
          <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
            <p className="text-gray-800">{report.content}</p>
          </div>
        );
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleDateString("vi-VN");
  };

  const formatTime = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleTimeString("vi-VN", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-2xl font-bold text-gray-800">
          Báo Cáo & Khiếu Nại
        </h2>

        <div className="flex items-center gap-3">
          <SearchAndFilter
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            filterStatus={filterStatus}
            setFilterStatus={setFilterStatus}
            filterType={filterType}
            setFilterType={setFilterType}
          />
          <HeaderActions onRefresh={handleRefresh} loading={loading} />
        </div>
      </div>

      {/* Stats summary */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={<Flag className="text-red-500" />}
          label="Tổng báo cáo"
          value={pagination?.totalReports || 0}
          bgColor="bg-red-50"
        />
        <StatCard
          icon={<Clock className="text-yellow-500" />}
          label="Đang chờ xử lý"
          value={
            reports?.filter((report) => report?.status === "pending")?.length ||
            0
          }
          bgColor="bg-yellow-50"
        />
        <StatCard
          icon={<CheckCircle className="text-green-500" />}
          label="Đã giải quyết"
          value={
            reports?.filter((report) => report?.status === "resolved")
              ?.length || 0
          }
          bgColor="bg-green-50"
        />
        <StatCard
          icon={<XCircle className="text-gray-500" />}
          label="Đã bỏ qua"
          value={
            reports?.filter((report) => report?.status === "dismissed")
              ?.length || 0
          }
          bgColor="bg-gray-50"
        />
      </div>

      {/* Error message */}
      {error && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-4">
          <div className="flex items-center">
            <AlertTriangle className="text-red-500 mr-2" size={18} />
            <p className="text-red-700">{error}</p>
          </div>
        </div>
      )}

      {/* Main content */}
      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <Loader size={36} className="text-blue-500 animate-spin" />
            <span className="ml-2 text-gray-600">Đang tải dữ liệu...</span>
          </div>
        ) : reports.length === 0 ? (
          <EmptyState />
        ) : (
          <>
            <ReportListTable
              reports={filteredReports}
              getTypeIcon={getTypeIcon}
              getStatusBadgeColor={getStatusBadgeColor}
              formatDate={formatDate}
              formatTime={formatTime}
              onViewReport={handleViewReport}
              onResolveReport={(reportId) => {
                const report = reports.find((r) => r._id === reportId);
                setSelectedReport(report);
                setShowResolveModal(true);
              }}
              onDismissReport={(reportId) => {
                const report = reports.find((r) => r._id === reportId);
                setSelectedReport(report);
                setShowDismissModal(true);
              }}
              processingAction={processingAction}
            />

            <Pagination
              pagination={pagination}
              onPageChange={handlePageChange}
            />
          </>
        )}
      </div>

      {/* Modals */}
      {showViewModal && selectedReport && (
        <ReportDetailModal
          report={selectedReport}
          onClose={() => setShowViewModal(false)}
          onResolve={() => {
            setShowViewModal(false);
            setShowResolveModal(true);
          }}
          onDismiss={() => {
            setShowViewModal(false);
            setShowDismissModal(true);
          }}
          loading={processingAction}
          formatDate={formatDate}
          formatTime={formatTime}
          getStatusBadgeColor={getStatusBadgeColor}
          getTypeIcon={getTypeIcon}
          renderReportContent={renderReportContent}
        />
      )}

      {showResolveModal && selectedReport && (
        <ResolveReportModal
          report={selectedReport}
          onClose={() => setShowResolveModal(false)}
          onResolve={handleResolveReport}
          loading={processingAction}
        />
      )}

      {showDismissModal && selectedReport && (
        <DismissReportModal
          report={selectedReport}
          onClose={() => setShowDismissModal(false)}
          onDismiss={handleDismissReport}
          loading={processingAction}
        />
      )}
    </div>
  );
};

const StatCard = ({ icon, label, value, bgColor }) => {
  return (
    <div className={`${bgColor} rounded-lg shadow p-4`}>
      <div className="flex items-center">
        <div className="p-3 rounded-full bg-white shadow-sm mr-4">{icon}</div>
        <div>
          <p className="text-sm text-gray-600 font-medium">{label}</p>
          <h3 className="text-xl font-bold text-gray-800">{value}</h3>
        </div>
      </div>
    </div>
  );
};

export default ReportManagement;
