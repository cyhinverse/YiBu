import React, { useState, useEffect } from "react";
import {
  Search,
  Filter,
  ChevronDown,
  RefreshCw,
  Calendar,
  Clock,
  User,
  ShieldAlert,
  Flag,
  Check,
  X,
  UserPlus,
  Lock,
  Settings,
  Download,
  Trash2,
  RotateCcw,
  Eye,
} from "lucide-react";

const AdminLogs = () => {
  const [logs, setLogs] = useState(mockLogs);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterAction, setFilterAction] = useState("all");
  const [filterAdmin, setFilterAdmin] = useState("all");
  const [timeRange, setTimeRange] = useState("week");
  const [showActionDropdown, setShowActionDropdown] = useState(false);
  const [showAdminDropdown, setShowAdminDropdown] = useState(false);

  // Add click outside handler to close dropdowns
  useEffect(() => {
    const handleClickOutside = (event) => {
      // Close dropdowns when clicking outside
      if (!event.target.closest(".dropdown-container")) {
        setShowActionDropdown(false);
        setShowAdminDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const filteredLogs = logs.filter((log) => {
    const matchesSearch =
      log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.admin.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.details.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesAction =
      filterAction === "all" || log.actionType === filterAction;
    const matchesAdmin = filterAdmin === "all" || log.admin.id === filterAdmin;

    return matchesSearch && matchesAction && matchesAdmin;
  });

  const getActionIcon = (actionType) => {
    switch (actionType) {
      case "user":
        return <User className="text-blue-500" />;
      case "content":
        return <Flag className="text-amber-500" />;
      case "approval":
        return <Check className="text-green-500" />;
      case "ban":
        return <Lock className="text-red-500" />;
      case "settings":
        return <Settings className="text-purple-500" />;
      case "delete":
        return <Trash2 className="text-red-500" />;
      case "restore":
        return <RotateCcw className="text-green-500" />;
      default:
        return <ShieldAlert className="text-gray-500" />;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-2xl font-bold text-gray-800">
          Log & Hoạt Động Admin
        </h2>

        <div className="flex items-center gap-3 flex-wrap justify-end">
          <div className="relative">
            <input
              type="text"
              placeholder="Tìm kiếm hoạt động..."
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <Search
              className="absolute left-3 top-2.5 text-gray-400"
              size={18}
            />
          </div>

          <div className="relative dropdown-container">
            <button
              className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg shadow-sm hover:bg-gray-50"
              onClick={() => setShowActionDropdown(!showActionDropdown)}
            >
              <Filter size={16} />
              <span>Loại</span>
              <ChevronDown size={16} />
            </button>

            {showActionDropdown && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg z-10 border border-gray-200">
                <div className="py-1">
                  {[
                    { id: "all", label: "Tất cả" },
                    { id: "user", label: "Người dùng" },
                    { id: "content", label: "Nội dung" },
                    { id: "approval", label: "Phê duyệt" },
                    { id: "ban", label: "Cấm/Khóa" },
                    { id: "settings", label: "Cài đặt" },
                    { id: "delete", label: "Xóa" },
                    { id: "restore", label: "Khôi phục" },
                  ].map((type) => (
                    <button
                      key={type.id}
                      className={`flex w-full items-center px-4 py-2 text-sm ${
                        filterAction === type.id
                          ? "bg-blue-50 text-blue-700"
                          : "text-gray-700 hover:bg-gray-100"
                      }`}
                      onClick={() => {
                        setFilterAction(type.id);
                        setShowActionDropdown(false);
                      }}
                    >
                      {type.label}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="relative dropdown-container">
            <button
              className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg shadow-sm hover:bg-gray-50"
              onClick={() => setShowAdminDropdown(!showAdminDropdown)}
            >
              <User size={16} />
              <span>Admin</span>
              <ChevronDown size={16} />
            </button>

            {showAdminDropdown && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg z-10 border border-gray-200">
                <div className="py-1">
                  <button
                    className={`flex w-full items-center px-4 py-2 text-sm ${
                      filterAdmin === "all"
                        ? "bg-blue-50 text-blue-700"
                        : "text-gray-700 hover:bg-gray-100"
                    }`}
                    onClick={() => {
                      setFilterAdmin("all");
                      setShowAdminDropdown(false);
                    }}
                  >
                    Tất cả Admin
                  </button>
                  {[...new Set(logs.map((log) => log.admin.id))].map(
                    (adminId) => {
                      const admin = logs.find(
                        (log) => log.admin.id === adminId
                      )?.admin;
                      return (
                        <button
                          key={adminId}
                          className={`flex w-full items-center px-4 py-2 text-sm ${
                            filterAdmin === adminId
                              ? "bg-blue-50 text-blue-700"
                              : "text-gray-700 hover:bg-gray-100"
                          }`}
                          onClick={() => {
                            setFilterAdmin(adminId);
                            setShowAdminDropdown(false);
                          }}
                        >
                          {admin?.name}
                        </button>
                      );
                    }
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="inline-flex rounded-md shadow-sm">
            {["day", "week", "month"].map((range) => (
              <button
                key={range}
                type="button"
                className={`px-3 py-2 text-sm font-medium ${
                  timeRange === range
                    ? "bg-blue-600 text-white"
                    : "bg-white text-gray-700 hover:bg-gray-50"
                } ${
                  range === "day"
                    ? "rounded-l-md"
                    : range === "month"
                    ? "rounded-r-md"
                    : ""
                } border border-gray-300`}
                onClick={() => setTimeRange(range)}
              >
                {range.charAt(0).toUpperCase() + range.slice(1)}
              </button>
            ))}
          </div>

          <button className="p-2 rounded-md bg-blue-600 text-white hover:bg-blue-700">
            <RefreshCw size={18} />
          </button>
        </div>
      </div>

      {/* Activity Log Table */}
      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        <div className="p-6 border-b border-gray-200 flex justify-between items-center">
          <h3 className="text-lg font-semibold text-gray-800">
            Lịch sử hoạt động
          </h3>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500">
              Hiển thị {filteredLogs.length} kết quả
            </span>
            <button className="flex items-center text-blue-600 hover:text-blue-800 text-sm font-medium">
              <Download size={16} className="mr-1" />
              Xuất log
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Thời gian
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Admin
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Hành động
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Chi tiết
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  IP
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Thao tác
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredLogs.map((log) => (
                <tr key={log.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex flex-col">
                      <div className="text-sm text-gray-900 flex items-center">
                        <Calendar size={14} className="mr-1 text-gray-500" />
                        {log.date}
                      </div>
                      <div className="text-xs text-gray-500 flex items-center">
                        <Clock size={12} className="mr-1 text-gray-400" />
                        {log.time}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0 mr-3">
                        <User size={14} className="text-blue-600" />
                      </div>
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {log.admin.name}
                        </div>
                        <div className="text-xs text-gray-500">
                          {log.admin.role}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center">
                      <div className="p-1.5 rounded-md bg-gray-100 mr-2">
                        {getActionIcon(log.actionType)}
                      </div>
                      <span className="text-sm text-gray-900">
                        {log.action}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900 max-w-xs">
                      {log.details}
                    </div>
                    {log.status && (
                      <div
                        className={`text-xs mt-1 flex items-center ${
                          log.status === "success"
                            ? "text-green-600"
                            : log.status === "failed"
                            ? "text-red-600"
                            : "text-amber-600"
                        }`}
                      >
                        {log.status === "success" ? (
                          <Check size={12} className="mr-1" />
                        ) : log.status === "failed" ? (
                          <X size={12} className="mr-1" />
                        ) : (
                          <RefreshCw size={12} className="mr-1" />
                        )}
                        {log.status === "success"
                          ? "Thành công"
                          : log.status === "failed"
                          ? "Thất bại"
                          : "Đang xử lý"}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    <div className="text-sm text-gray-500">{log.ip}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    <button className="text-blue-600 hover:text-blue-900 p-1">
                      <Eye size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
          <div className="text-sm text-gray-500">
            Hiển thị <span className="font-medium">{filteredLogs.length}</span>{" "}
            trong số <span className="font-medium">{logs.length}</span> hoạt
            động
          </div>
          <div className="flex space-x-2">
            <button className="px-3 py-1 border border-gray-300 rounded-md text-sm bg-white hover:bg-gray-50">
              Trước
            </button>
            <button className="px-3 py-1 border border-gray-300 rounded-md text-sm bg-white hover:bg-gray-50">
              Sau
            </button>
          </div>
        </div>
      </div>

      {/* System Security Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white shadow-md rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">
            Bảo mật hệ thống
          </h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center">
                <ShieldAlert className="text-blue-600 mr-3" size={20} />
                <div>
                  <div className="text-sm font-medium">
                    Đăng nhập bất thường
                  </div>
                  <div className="text-xs text-gray-500">
                    0 lần trong 7 ngày qua
                  </div>
                </div>
              </div>
              <div className="text-sm text-green-600 font-medium">
                Bình thường
              </div>
            </div>

            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center">
                <UserPlus className="text-blue-600 mr-3" size={20} />
                <div>
                  <div className="text-sm font-medium">Admin mới được thêm</div>
                  <div className="text-xs text-gray-500">
                    1 người trong 30 ngày qua
                  </div>
                </div>
              </div>
              <div className="text-sm text-green-600 font-medium">
                Bình thường
              </div>
            </div>

            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center">
                <Settings className="text-blue-600 mr-3" size={20} />
                <div>
                  <div className="text-sm font-medium">
                    Thay đổi cài đặt hệ thống
                  </div>
                  <div className="text-xs text-gray-500">
                    3 lần trong 7 ngày qua
                  </div>
                </div>
              </div>
              <div className="text-sm text-green-600 font-medium">
                Bình thường
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white shadow-md rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">
            Admin hoạt động
          </h3>

          <div className="space-y-4">
            {[...new Set(logs.map((log) => log.admin.id))]
              .slice(0, 4)
              .map((adminId) => {
                const admin = logs.find(
                  (log) => log.admin.id === adminId
                )?.admin;
                const adminLogs = logs.filter(
                  (log) => log.admin.id === adminId
                );
                const lastActivity = adminLogs[0];

                return (
                  <div
                    key={adminId}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                  >
                    <div className="flex items-center">
                      <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0 mr-3">
                        <User size={16} className="text-blue-600" />
                      </div>
                      <div>
                        <div className="text-sm font-medium">{admin?.name}</div>
                        <div className="text-xs text-gray-500">
                          {admin?.role}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-gray-900">
                        {adminLogs.length} hoạt động
                      </div>
                      <div className="text-xs text-gray-500">
                        Gần nhất: {lastActivity?.date}
                      </div>
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      </div>
    </div>
  );
};

// Mock data for admin logs
const mockLogs = [
  {
    id: 1,
    date: "23/03/2024",
    time: "09:15",
    admin: { id: "admin1", name: "Admin User", role: "Super Admin" },
    action: "Xóa bài viết",
    actionType: "delete",
    details:
      "Đã xóa bài viết ID 12345 của người dùng 'user123' vì vi phạm quy định cộng đồng",
    ip: "192.168.1.1",
    status: "success",
  },
  {
    id: 2,
    date: "23/03/2024",
    time: "10:30",
    admin: { id: "admin2", name: "Moderator X", role: "Moderator" },
    action: "Từ chối bình luận",
    actionType: "content",
    details: "Từ chối bình luận ID 7890 vì nội dung không phù hợp",
    ip: "192.168.1.2",
    status: "success",
  },
  {
    id: 3,
    date: "22/03/2024",
    time: "15:45",
    admin: { id: "admin1", name: "Admin User", role: "Super Admin" },
    action: "Chỉnh sửa cài đặt",
    actionType: "settings",
    details:
      "Thay đổi cài đặt trang chủ và thay đổi quy định đăng ký thành viên",
    ip: "192.168.1.1",
    status: "success",
  },
  {
    id: 4,
    date: "22/03/2024",
    time: "14:20",
    admin: { id: "admin2", name: "Moderator X", role: "Moderator" },
    action: "Khóa tài khoản",
    actionType: "ban",
    details: "Khóa tài khoản 'spammer123' trong 30 ngày vì spam quảng cáo",
    ip: "192.168.1.2",
    status: "success",
  },
  {
    id: 5,
    date: "21/03/2024",
    time: "11:10",
    admin: { id: "admin3", name: "Moderator Y", role: "Moderator" },
    action: "Phê duyệt bài viết",
    actionType: "approval",
    details: "Đã phê duyệt 15 bài viết mới trong danh sách chờ",
    ip: "192.168.1.3",
    status: "success",
  },
  {
    id: 6,
    date: "21/03/2024",
    time: "09:30",
    admin: { id: "admin1", name: "Admin User", role: "Super Admin" },
    action: "Thêm admin mới",
    actionType: "user",
    details: "Đã thêm 'Moderator Z' vào hệ thống với quyền Moderator",
    ip: "192.168.1.1",
    status: "success",
  },
  {
    id: 7,
    date: "20/03/2024",
    time: "16:45",
    admin: { id: "admin3", name: "Moderator Y", role: "Moderator" },
    action: "Khôi phục bài viết",
    actionType: "restore",
    details: "Khôi phục bài viết ID 5678 sau khi xem xét báo cáo",
    ip: "192.168.1.3",
    status: "success",
  },
  {
    id: 8,
    date: "20/03/2024",
    time: "13:25",
    admin: { id: "admin2", name: "Moderator X", role: "Moderator" },
    action: "Cảnh báo người dùng",
    actionType: "user",
    details:
      "Đã gửi cảnh báo đến người dùng 'user456' về việc vi phạm quy định bình luận",
    ip: "192.168.1.2",
    status: "success",
  },
  {
    id: 9,
    date: "19/03/2024",
    time: "10:15",
    admin: { id: "admin1", name: "Admin User", role: "Super Admin" },
    action: "Cập nhật cài đặt bảo mật",
    actionType: "settings",
    details: "Thay đổi cài đặt bảo mật và quyền riêng tư của hệ thống",
    ip: "192.168.1.1",
    status: "success",
  },
  {
    id: 10,
    date: "19/03/2024",
    time: "09:05",
    admin: { id: "admin4", name: "Moderator Z", role: "Moderator" },
    action: "Đăng nhập lần đầu",
    actionType: "user",
    details: "Đăng nhập lần đầu vào hệ thống và thiết lập thông tin cá nhân",
    ip: "192.168.1.4",
    status: "success",
  },
];

export default AdminLogs;
