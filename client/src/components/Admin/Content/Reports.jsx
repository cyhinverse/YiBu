import { useState } from "react";
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
} from "lucide-react";

const FAKE_REPORTS = [
  {
    id: 1,
    reporter: {
      name: "Nguyễn Văn A",
      username: "@nguyenvana",
      avatar: "https://i.pravatar.cc/150?img=1",
    },
    target: {
      type: "post",
      content: "Nội dung bài viết vi phạm quy định cộng đồng...",
      author: "Lê Văn C",
    },
    reason: "Nội dung không phù hợp",
    description: "Bài viết chứa hình ảnh bạo lực và ngôn từ thô tục.",
    status: "pending",
    createdAt: "2024-01-15 10:30",
  },
  {
    id: 2,
    reporter: {
      name: "Trần Thị B",
      username: "@tranthib",
      avatar: "https://i.pravatar.cc/150?img=2",
    },
    target: {
      type: "comment",
      content: "Bình luận spam quảng cáo link lạ...",
      author: "Hoàng Văn E",
    },
    reason: "Spam / Quảng cáo",
    description: "Người dùng liên tục spam link quảng cáo trong các bình luận.",
    status: "pending",
    createdAt: "2024-01-15 09:15",
  },
  {
    id: 3,
    reporter: {
      name: "Phạm Thị D",
      username: "@phamthid",
      avatar: "https://i.pravatar.cc/150?img=4",
    },
    target: {
      type: "user",
      content: "Tài khoản giả mạo người nổi tiếng",
      author: "FakeAccount123",
    },
    reason: "Giả mạo / Mạo danh",
    description: "Tài khoản này đang mạo danh một người nổi tiếng để lừa đảo.",
    status: "resolved",
    createdAt: "2024-01-14 22:30",
  },
  {
    id: 4,
    reporter: {
      name: "Hoàng Văn E",
      username: "@hoangvane",
      avatar: "https://i.pravatar.cc/150?img=5",
    },
    target: {
      type: "post",
      content: "Bài viết chứa thông tin sai lệch về y tế...",
      author: "MedFake",
    },
    reason: "Thông tin sai lệch",
    description:
      "Bài viết đăng thông tin y tế không chính xác, có thể gây hại.",
    status: "pending",
    createdAt: "2024-01-14 18:45",
  },
  {
    id: 5,
    reporter: {
      name: "Ngô Thị F",
      username: "@ngothif",
      avatar: "https://i.pravatar.cc/150?img=6",
    },
    target: {
      type: "comment",
      content: "Bình luận chứa nội dung quấy rối...",
      author: "TrollUser",
    },
    reason: "Quấy rối / Bắt nạt",
    description: "Người dùng liên tục bình luận quấy rối và đe dọa người khác.",
    status: "rejected",
    createdAt: "2024-01-14 16:20",
  },
  {
    id: 6,
    reporter: {
      name: "Đặng Văn G",
      username: "@dangvang",
      avatar: "https://i.pravatar.cc/150?img=7",
    },
    target: {
      type: "user",
      content: "Tài khoản đăng nội dung người lớn",
      author: "NSFW_Account",
    },
    reason: "Nội dung người lớn",
    description: "Tài khoản liên tục đăng ảnh và video không phù hợp.",
    status: "resolved",
    createdAt: "2024-01-14 14:00",
  },
];

const getTargetIcon = (type) => {
  switch (type) {
    case "post":
      return <FileText size={16} />;
    case "comment":
      return <MessageCircle size={16} />;
    case "user":
      return <User size={16} />;
    default:
      return <Flag size={16} />;
  }
};

const getStatusStyle = (status) => {
  switch (status) {
    case "pending":
      return "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400";
    case "resolved":
      return "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400";
    case "rejected":
      return "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400";
    default:
      return "bg-neutral-100 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-400";
  }
};

const getStatusText = (status) => {
  switch (status) {
    case "pending":
      return "Chờ xử lý";
    case "resolved":
      return "Đã xử lý";
    case "rejected":
      return "Từ chối";
    default:
      return status;
  }
};

export default function Reports() {
  const [reports, setReports] = useState(FAKE_REPORTS);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterType, setFilterType] = useState("all");
  const [selectedReport, setSelectedReport] = useState(null);
  const [activeDropdown, setActiveDropdown] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);

  const filteredReports = reports.filter((report) => {
    const matchSearch =
      report.reason.toLowerCase().includes(searchTerm.toLowerCase()) ||
      report.reporter.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      report.target.author.toLowerCase().includes(searchTerm.toLowerCase());
    const matchStatus =
      filterStatus === "all" || report.status === filterStatus;
    const matchType = filterType === "all" || report.target.type === filterType;
    return matchSearch && matchStatus && matchType;
  });

  const handleResolve = (reportId) => {
    setReports(
      reports.map((r) => (r.id === reportId ? { ...r, status: "resolved" } : r))
    );
    setActiveDropdown(null);
  };

  const handleReject = (reportId) => {
    setReports(
      reports.map((r) => (r.id === reportId ? { ...r, status: "rejected" } : r))
    );
    setActiveDropdown(null);
  };

  const pendingCount = reports.filter((r) => r.status === "pending").length;

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
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-2xl p-4 border border-yellow-200 dark:border-yellow-800">
          <p className="text-yellow-600 dark:text-yellow-400 text-sm font-medium">
            Chờ xử lý
          </p>
          <p className="text-2xl font-bold text-yellow-700 dark:text-yellow-300 mt-1">
            {reports.filter((r) => r.status === "pending").length}
          </p>
        </div>
        <div className="bg-green-50 dark:bg-green-900/20 rounded-2xl p-4 border border-green-200 dark:border-green-800">
          <p className="text-green-600 dark:text-green-400 text-sm font-medium">
            Đã xử lý
          </p>
          <p className="text-2xl font-bold text-green-700 dark:text-green-300 mt-1">
            {reports.filter((r) => r.status === "resolved").length}
          </p>
        </div>
        <div className="bg-red-50 dark:bg-red-900/20 rounded-2xl p-4 border border-red-200 dark:border-red-800">
          <p className="text-red-600 dark:text-red-400 text-sm font-medium">
            Từ chối
          </p>
          <p className="text-2xl font-bold text-red-700 dark:text-red-300 mt-1">
            {reports.filter((r) => r.status === "rejected").length}
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
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-black dark:text-white focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white"
          />
        </div>

        <div className="flex gap-3">
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="px-4 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-black dark:text-white focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white"
          >
            <option value="all">Tất cả loại</option>
            <option value="post">Bài viết</option>
            <option value="comment">Bình luận</option>
            <option value="user">Người dùng</option>
          </select>

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
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
      <div className="space-y-4">
        {filteredReports.map((report) => (
          <div
            key={report.id}
            className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 p-5"
          >
            <div className="flex items-start gap-4">
              {/* Reporter Avatar */}
              <img
                src={report.reporter.avatar}
                alt={report.reporter.name}
                className="w-10 h-10 rounded-full border-2 border-neutral-200 dark:border-neutral-700 flex-shrink-0"
              />

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-semibold text-black dark:text-white">
                        {report.reporter.name}
                      </h3>
                      <span className="text-neutral-500 dark:text-neutral-400 text-sm">
                        báo cáo
                      </span>
                      <span className="flex items-center gap-1 text-sm font-medium text-black dark:text-white">
                        {getTargetIcon(report.target.type)}
                        {report.target.type === "post"
                          ? "bài viết"
                          : report.target.type === "comment"
                          ? "bình luận"
                          : "người dùng"}
                      </span>
                      <span className="text-neutral-500 dark:text-neutral-400 text-sm">
                        của
                      </span>
                      <span className="font-medium text-black dark:text-white text-sm">
                        {report.target.author}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 mt-1 text-sm text-neutral-500 dark:text-neutral-400">
                      <Calendar size={14} />
                      {report.createdAt}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusStyle(
                        report.status
                      )}`}
                    >
                      {getStatusText(report.status)}
                    </span>

                    {/* Actions Dropdown */}
                    <div className="relative">
                      <button
                        onClick={() =>
                          setActiveDropdown(
                            activeDropdown === report.id ? null : report.id
                          )
                        }
                        className="p-2 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg transition-colors"
                      >
                        <MoreHorizontal
                          size={18}
                          className="text-neutral-500"
                        />
                      </button>

                      {activeDropdown === report.id && (
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
                          {report.status === "pending" && (
                            <>
                              <button
                                onClick={() => handleResolve(report.id)}
                                className="w-full px-4 py-2 text-left text-sm hover:bg-neutral-100 dark:hover:bg-neutral-700 flex items-center gap-2 text-green-600"
                              >
                                <CheckCircle size={16} />
                                Chấp nhận xử lý
                              </button>
                              <button
                                onClick={() => handleReject(report.id)}
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
                    {report.reason}
                  </span>
                </div>

                {/* Description */}
                <p className="mt-3 text-neutral-600 dark:text-neutral-400 text-sm">
                  {report.description}
                </p>

                {/* Target Content Preview */}
                <div className="mt-3 p-3 bg-neutral-50 dark:bg-neutral-800 rounded-lg border border-neutral-200 dark:border-neutral-700">
                  <p className="text-sm text-neutral-500 dark:text-neutral-400">
                    Nội dung bị báo cáo:
                  </p>
                  <p className="text-sm text-black dark:text-white mt-1 truncate">
                    "{report.target.content}"
                  </p>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-neutral-500 dark:text-neutral-400">
          Hiển thị {filteredReports.length} báo cáo
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
                    {selectedReport.target.type === "post"
                      ? "Bài viết"
                      : selectedReport.target.type === "comment"
                      ? "Bình luận"
                      : "Người dùng"}{" "}
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
              {selectedReport.status === "pending" && (
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
