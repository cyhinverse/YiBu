import { useState } from "react";
import {
  Search,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Filter,
  AlertCircle,
  AlertTriangle,
  Info,
  CheckCircle,
  User,
  Shield,
  Settings,
  Database,
  Activity,
  Download,
  RefreshCw,
} from "lucide-react";

const FAKE_LOGS = [
  {
    id: 1,
    level: "info",
    action: "user_login",
    message: "User đăng nhập thành công",
    user: "nguyenvana@email.com",
    ip: "192.168.1.100",
    userAgent: "Chrome 120.0 / Windows 10",
    createdAt: "2024-01-15 10:30:45",
  },
  {
    id: 2,
    level: "warning",
    action: "failed_login",
    message: "Đăng nhập thất bại - Sai mật khẩu",
    user: "tranthib@email.com",
    ip: "192.168.1.101",
    userAgent: "Safari 17.0 / macOS",
    createdAt: "2024-01-15 10:28:30",
  },
  {
    id: 3,
    level: "error",
    action: "api_error",
    message: "Database connection failed",
    user: "system",
    ip: "127.0.0.1",
    userAgent: "Node.js Server",
    createdAt: "2024-01-15 10:25:12",
  },
  {
    id: 4,
    level: "success",
    action: "post_created",
    message: "Bài viết mới được tạo thành công",
    user: "levanc@email.com",
    ip: "192.168.1.102",
    userAgent: "Firefox 121.0 / Ubuntu",
    createdAt: "2024-01-15 10:20:00",
  },
  {
    id: 5,
    level: "info",
    action: "user_register",
    message: "Tài khoản mới đăng ký",
    user: "phamthid@email.com",
    ip: "192.168.1.103",
    userAgent: "Chrome 120.0 / Android",
    createdAt: "2024-01-15 10:15:30",
  },
  {
    id: 6,
    level: "warning",
    action: "rate_limit",
    message: "Rate limit exceeded - API calls",
    user: "hoangvane@email.com",
    ip: "192.168.1.104",
    userAgent: "Postman/10.0",
    createdAt: "2024-01-15 10:10:15",
  },
  {
    id: 7,
    level: "info",
    action: "admin_action",
    message: "Admin đã ban user ID #123",
    user: "admin@system.com",
    ip: "10.0.0.1",
    userAgent: "Chrome 120.0 / Windows 11",
    createdAt: "2024-01-15 10:05:00",
  },
  {
    id: 8,
    level: "success",
    action: "backup_complete",
    message: "Database backup hoàn thành",
    user: "system",
    ip: "127.0.0.1",
    userAgent: "Cron Job",
    createdAt: "2024-01-15 10:00:00",
  },
  {
    id: 9,
    level: "error",
    action: "upload_failed",
    message: "File upload failed - Size exceeded",
    user: "ngothif@email.com",
    ip: "192.168.1.105",
    userAgent: "Chrome 120.0 / iOS",
    createdAt: "2024-01-15 09:55:45",
  },
  {
    id: 10,
    level: "info",
    action: "settings_update",
    message: "Cài đặt hệ thống được cập nhật",
    user: "admin@system.com",
    ip: "10.0.0.1",
    userAgent: "Chrome 120.0 / Windows 11",
    createdAt: "2024-01-15 09:50:30",
  },
];

const getLevelIcon = (level) => {
  switch (level) {
    case "info":
      return <Info size={16} className="text-blue-500" />;
    case "warning":
      return <AlertTriangle size={16} className="text-yellow-500" />;
    case "error":
      return <AlertCircle size={16} className="text-red-500" />;
    case "success":
      return <CheckCircle size={16} className="text-green-500" />;
    default:
      return <Activity size={16} className="text-neutral-500" />;
  }
};

const getLevelStyle = (level) => {
  switch (level) {
    case "info":
      return "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400";
    case "warning":
      return "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400";
    case "error":
      return "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400";
    case "success":
      return "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400";
    default:
      return "bg-neutral-100 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-400";
  }
};

const getActionIcon = (action) => {
  if (action.includes("login") || action.includes("user"))
    return <User size={14} />;
  if (action.includes("admin")) return <Shield size={14} />;
  if (action.includes("settings")) return <Settings size={14} />;
  if (action.includes("backup") || action.includes("database"))
    return <Database size={14} />;
  return <Activity size={14} />;
};

export default function Logs() {
  const [logs] = useState(FAKE_LOGS);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterLevel, setFilterLevel] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const filteredLogs = logs.filter((log) => {
    const matchSearch =
      log.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.user.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.action.toLowerCase().includes(searchTerm.toLowerCase());
    const matchLevel = filterLevel === "all" || log.level === filterLevel;
    return matchSearch && matchLevel;
  });

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => setIsRefreshing(false), 1000);
  };

  const stats = {
    total: logs.length,
    info: logs.filter((l) => l.level === "info").length,
    warning: logs.filter((l) => l.level === "warning").length,
    error: logs.filter((l) => l.level === "error").length,
    success: logs.filter((l) => l.level === "success").length,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-black dark:text-white">
            Nhật ký hệ thống
          </h1>
          <p className="text-neutral-500 dark:text-neutral-400 mt-1">
            Theo dõi các hoạt động và sự kiện
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleRefresh}
            className={`p-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors ${
              isRefreshing ? "animate-spin" : ""
            }`}
          >
            <RefreshCw size={18} />
          </button>
          <button className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-black dark:bg-white text-white dark:text-black hover:opacity-90 transition-opacity">
            <Download size={18} />
            Xuất logs
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
        <div className="bg-neutral-50 dark:bg-neutral-800/50 rounded-2xl p-4 border border-neutral-200 dark:border-neutral-700">
          <p className="text-neutral-500 dark:text-neutral-400 text-sm">
            Tổng logs
          </p>
          <p className="text-2xl font-bold text-black dark:text-white mt-1">
            {stats.total}
          </p>
        </div>
        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-2xl p-4 border border-blue-200 dark:border-blue-800">
          <p className="text-blue-600 dark:text-blue-400 text-sm">Info</p>
          <p className="text-2xl font-bold text-blue-700 dark:text-blue-300 mt-1">
            {stats.info}
          </p>
        </div>
        <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-2xl p-4 border border-yellow-200 dark:border-yellow-800">
          <p className="text-yellow-600 dark:text-yellow-400 text-sm">
            Warning
          </p>
          <p className="text-2xl font-bold text-yellow-700 dark:text-yellow-300 mt-1">
            {stats.warning}
          </p>
        </div>
        <div className="bg-red-50 dark:bg-red-900/20 rounded-2xl p-4 border border-red-200 dark:border-red-800">
          <p className="text-red-600 dark:text-red-400 text-sm">Error</p>
          <p className="text-2xl font-bold text-red-700 dark:text-red-300 mt-1">
            {stats.error}
          </p>
        </div>
        <div className="bg-green-50 dark:bg-green-900/20 rounded-2xl p-4 border border-green-200 dark:border-green-800 col-span-2 sm:col-span-1">
          <p className="text-green-600 dark:text-green-400 text-sm">Success</p>
          <p className="text-2xl font-bold text-green-700 dark:text-green-300 mt-1">
            {stats.success}
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
            placeholder="Tìm kiếm logs..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-black dark:text-white focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white"
          />
        </div>

        <select
          value={filterLevel}
          onChange={(e) => setFilterLevel(e.target.value)}
          className="px-4 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-black dark:text-white focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white"
        >
          <option value="all">Tất cả mức độ</option>
          <option value="info">Info</option>
          <option value="warning">Warning</option>
          <option value="error">Error</option>
          <option value="success">Success</option>
        </select>
      </div>

      {/* Logs Table */}
      <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-neutral-200 dark:border-neutral-700">
                <th className="text-left px-5 py-4 text-sm font-semibold text-neutral-500 dark:text-neutral-400">
                  Thời gian
                </th>
                <th className="text-left px-5 py-4 text-sm font-semibold text-neutral-500 dark:text-neutral-400">
                  Mức độ
                </th>
                <th className="text-left px-5 py-4 text-sm font-semibold text-neutral-500 dark:text-neutral-400">
                  Hành động
                </th>
                <th className="text-left px-5 py-4 text-sm font-semibold text-neutral-500 dark:text-neutral-400">
                  Thông báo
                </th>
                <th className="text-left px-5 py-4 text-sm font-semibold text-neutral-500 dark:text-neutral-400">
                  Người dùng
                </th>
                <th className="text-left px-5 py-4 text-sm font-semibold text-neutral-500 dark:text-neutral-400">
                  IP
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredLogs.map((log) => (
                <tr
                  key={log.id}
                  className="border-b border-neutral-100 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors"
                >
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-2 text-sm text-neutral-600 dark:text-neutral-400">
                      <Calendar size={14} />
                      <span className="whitespace-nowrap">{log.createdAt}</span>
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <span
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${getLevelStyle(
                        log.level
                      )}`}
                    >
                      {getLevelIcon(log.level)}
                      {log.level.toUpperCase()}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <span className="flex items-center gap-1.5 text-sm text-black dark:text-white">
                      {getActionIcon(log.action)}
                      <code className="bg-neutral-100 dark:bg-neutral-800 px-2 py-0.5 rounded text-xs">
                        {log.action}
                      </code>
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <span className="text-sm text-black dark:text-white">
                      {log.message}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <span className="text-sm text-neutral-600 dark:text-neutral-400">
                      {log.user}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <code className="text-xs bg-neutral-100 dark:bg-neutral-800 px-2 py-1 rounded text-neutral-600 dark:text-neutral-400">
                      {log.ip}
                    </code>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-neutral-500 dark:text-neutral-400">
          Hiển thị {filteredLogs.length} logs
        </p>
        <div className="flex items-center gap-2">
          <button
            disabled={currentPage === 1}
            onClick={() => setCurrentPage((p) => p - 1)}
            className="p-2 rounded-lg border border-neutral-200 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-800 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronLeft size={18} />
          </button>
          <span className="px-4 py-2 text-sm">Trang {currentPage}</span>
          <button
            onClick={() => setCurrentPage((p) => p + 1)}
            className="p-2 rounded-lg border border-neutral-200 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-800"
          >
            <ChevronRight size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}
