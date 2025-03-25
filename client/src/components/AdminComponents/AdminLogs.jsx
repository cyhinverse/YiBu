import React, { useState, useEffect } from "react";
import {
  Search,
  Filter,
  RefreshCw,
  Calendar,
  Download,
  AlertTriangle,
  Info,
  AlertCircle,
  X,
  Clock,
  Activity,
  User,
  Server,
  FileText,
  Eye,
} from "lucide-react";
import AdminService from "../../services/adminService";
import { ITEMS_PER_PAGE, SEARCH_DEBOUNCE_TIME } from "./LogsConfig";
import { formatDate, exportLogsToCSV, buildFilterParams } from "./LogsUtils";
import { ErrorMessage } from "./LogsComponents";
import LogsToolbar from "./LogsToolbar";
import LogsTable from "./LogsTable";
import LogDetailModal from "./LogDetailModal";

const AdminLogs = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filterLevel, setFilterLevel] = useState("");
  const [filterModule, setFilterModule] = useState("");
  const [filterDateRange, setFilterDateRange] = useState({
    startDate: "",
    endDate: "",
  });
  const [selectedLog, setSelectedLog] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  // Fetch logs data
  const fetchLogs = async () => {
    setLoading(true);
    setError(null);
    try {
      const filters = buildFilterParams(
        searchTerm,
        filterLevel,
        filterModule,
        filterDateRange
      );

      const response = await AdminService.getSystemLogs(
        currentPage,
        ITEMS_PER_PAGE,
        filters
      );

      if (response.code === 1 && response.data) {
        setLogs(response.data.logs || []);
        setTotalPages(response.data.pagination.totalPages || 1);
      } else {
        setError("Không thể tải dữ liệu log hệ thống");
      }
    } catch (err) {
      console.error("Error fetching logs:", err);
      setError("Đã xảy ra lỗi khi tải dữ liệu log");
    } finally {
      setLoading(false);
    }
  };

  // Initial fetch and on filters change
  useEffect(() => {
    fetchLogs();
  }, [currentPage, filterLevel, filterModule, filterDateRange]);

  // Handle search with debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      if (currentPage === 1) {
        fetchLogs();
      } else {
        setCurrentPage(1);
      }
    }, SEARCH_DEBOUNCE_TIME);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Format date for display
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    }).format(date);
  };

  // Export logs as CSV
  const handleExportLogs = () => {
    exportLogsToCSV(logs);
  };

  // Get level badge color
  const getLevelBadgeColor = (level) => {
    switch (level) {
      case "error":
        return "bg-red-100 text-red-800";
      case "warning":
        return "bg-yellow-100 text-yellow-800";
      case "critical":
        return "bg-purple-100 text-purple-800";
      default:
        return "bg-blue-100 text-blue-800";
    }
  };

  // Get level icon
  const getLevelIcon = (level) => {
    switch (level) {
      case "error":
        return <AlertCircle className="h-4 w-4 text-red-600" />;
      case "warning":
        return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
      case "critical":
        return <X className="h-4 w-4 text-purple-600" />;
      default:
        return <Info className="h-4 w-4 text-blue-600" />;
    }
  };

  // Get module icon
  const getModuleIcon = (module) => {
    switch (module) {
      case "user":
        return <User className="h-4 w-4" />;
      case "auth":
        return <User className="h-4 w-4" />;
      case "post":
        return <FileText className="h-4 w-4" />;
      case "comment":
        return <FileText className="h-4 w-4" />;
      case "admin":
        return <Activity className="h-4 w-4" />;
      default:
        return <Server className="h-4 w-4" />;
    }
  };

  // Get level badge text
  const getLevelBadgeText = (level) => {
    switch (level) {
      case "error":
        return "Lỗi";
      case "warning":
        return "Cảnh báo";
      case "critical":
        return "Nghiêm trọng";
      default:
        return "Thông tin";
    }
  };

  // Handle view details
  const handleViewDetails = (log) => {
    setSelectedLog(log);
    setShowDetailModal(true);
  };

  // Handle close modal
  const handleCloseModal = () => {
    setShowDetailModal(false);
    setSelectedLog(null);
  };

  // Kiểm tra có dữ liệu log không
  const hasData = logs && logs.length > 0;

  return (
    <div className="space-y-6">
      <LogsToolbar
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        filterLevel={filterLevel}
        setFilterLevel={setFilterLevel}
        filterModule={filterModule}
        setFilterModule={setFilterModule}
        filterDateRange={filterDateRange}
        setFilterDateRange={setFilterDateRange}
        onRefresh={fetchLogs}
        onExport={handleExportLogs}
        loading={loading}
        hasData={hasData}
      />

      {error && <ErrorMessage message={error} />}

      <LogsTable
        logs={logs}
        loading={loading}
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
        onViewDetails={handleViewDetails}
        formatDate={formatDate}
      />

      {showDetailModal && selectedLog && (
        <LogDetailModal log={selectedLog} onClose={handleCloseModal} />
      )}
    </div>
  );
};

export default AdminLogs;
