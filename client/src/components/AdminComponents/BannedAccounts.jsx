import React, { useState, useEffect } from "react";
import {
  Search,
  Filter,
  ChevronDown,
  Unlock,
  Clock,
  Calendar,
  RefreshCw,
  User,
  Shield,
  AlertTriangle,
  Clock8,
  AlertCircle,
} from "lucide-react";
import AdminService from "../../services/adminService";

const BannedAccounts = () => {
  const [bannedUsers, setBannedUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterBanType, setFilterBanType] = useState("all");
  const [selectedUser, setSelectedUser] = useState(null);
  const [showUnbanModal, setShowUnbanModal] = useState(false);
  const [showExtendBanModal, setShowExtendBanModal] = useState(false);
  const [showTempUnbanModal, setShowTempUnbanModal] = useState(false);
  const [showBanHistoryModal, setShowBanHistoryModal] = useState(false);
  const [banHistory, setBanHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Load banned accounts from API
  const fetchBannedAccounts = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await AdminService.getBannedAccounts(currentPage, 10, {
        search: searchTerm,
        banType: filterBanType !== "all" ? filterBanType : undefined,
      });

      if (response.code === 1) {
        setBannedUsers(response.data.users || []);
        setTotalPages(response.data.pagination.totalPages || 1);
      } else {
        setError("Không thể tải danh sách tài khoản bị khóa");
      }
    } catch (err) {
      console.error("Error fetching banned accounts:", err);
      setError("Đã xảy ra lỗi khi tải danh sách tài khoản bị khóa");
    } finally {
      setLoading(false);
    }
  };

  // Load ban history from API
  const fetchBanHistory = async (userId) => {
    try {
      const response = await AdminService.getBanHistory(userId);
      if (response.code === 1) {
        setBanHistory(response.data || []);
      } else {
        setBanHistory([]);
      }
    } catch (err) {
      console.error(`Error fetching ban history for user ${userId}:`, err);
      setBanHistory([]);
    }
  };

  useEffect(() => {
    fetchBannedAccounts();
  }, [currentPage, filterBanType]);

  // Search with 500ms debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      if (currentPage === 1) {
        fetchBannedAccounts();
      } else {
        setCurrentPage(1);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  const handleUnbanUser = async (userId) => {
    try {
      const response = await AdminService.unbanUser(userId);
      if (response.code === 1) {
        // Remove user from local state
        setBannedUsers(bannedUsers.filter((user) => user._id !== userId));
        setShowUnbanModal(false);
        setSelectedUser(null);
      } else {
        setError("Không thể mở khóa tài khoản này");
      }
    } catch (err) {
      console.error(`Error unbanning user ${userId}:`, err);
      setError("Đã xảy ra lỗi khi mở khóa tài khoản");
    }
  };

  const handleExtendBan = async (userId, duration, reason) => {
    try {
      const response = await AdminService.extendBan(userId, duration, reason);
      if (response.code === 1) {
        // Update the user in local state
        setBannedUsers(
          bannedUsers.map((user) =>
            user._id === userId ? response.data.user : user
          )
        );
        setShowExtendBanModal(false);
        setSelectedUser(null);
      } else {
        setError("Không thể gia hạn thời gian khóa tài khoản");
      }
    } catch (err) {
      console.error(`Error extending ban for user ${userId}:`, err);
      setError("Đã xảy ra lỗi khi gia hạn thời gian khóa tài khoản");
    }
  };

  const handleTemporaryUnban = async (userId, duration, reason) => {
    try {
      const response = await AdminService.temporaryUnban(
        userId,
        duration,
        reason
      );
      if (response.code === 1) {
        // Update the user in local state or remove from banned users
        setBannedUsers(bannedUsers.filter((user) => user._id !== userId));
        setShowTempUnbanModal(false);
        setSelectedUser(null);
      } else {
        setError("Không thể tạm thời mở khóa tài khoản");
      }
    } catch (err) {
      console.error(`Error temporarily unbanning user ${userId}:`, err);
      setError("Đã xảy ra lỗi khi tạm thời mở khóa tài khoản");
    }
  };

  const handleViewBanHistory = (user) => {
    setSelectedUser(user);
    fetchBanHistory(user._id);
    setShowBanHistoryModal(true);
  };

  const getBanTypeLabel = (banType) => {
    switch (banType) {
      case "permanent":
        return "Vĩnh viễn";
      case "temporary":
        return "Tạm thời";
      case "review":
        return "Đang xem xét";
      default:
        return "Không xác định";
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-2xl font-bold text-gray-800">Tài Khoản Bị Khóa</h2>

        <div className="flex items-center gap-3">
          <div className="relative">
            <input
              type="text"
              placeholder="Tìm kiếm tài khoản..."
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <Search
              className="absolute left-3 top-2.5 text-gray-400"
              size={18}
            />
          </div>

          <div className="relative inline-block text-left">
            <select
              className="appearance-none bg-white border border-gray-300 rounded-lg px-4 py-2 pr-10 focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-700"
              value={filterBanType}
              onChange={(e) => setFilterBanType(e.target.value)}
            >
              <option value="all">Tất cả</option>
              <option value="permanent">Vĩnh viễn</option>
              <option value="temporary">Tạm thời</option>
            </select>
            <Filter
              className="absolute right-3 top-2.5 text-gray-400 pointer-events-none"
              size={18}
            />
          </div>

          <button
            className="p-2 rounded-md bg-blue-600 text-white hover:bg-blue-700"
            onClick={() => fetchBannedAccounts()}
          >
            <RefreshCw size={18} />
          </button>
        </div>
      </div>

      {/* Stats summary */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <StatCard
          icon={<Shield className="text-red-500" />}
          label="Khóa vĩnh viễn"
          value={
            bannedUsers.filter((user) => user.banStatus === "permanent").length
          }
          bgColor="bg-red-50"
        />
        <StatCard
          icon={<Clock className="text-amber-500" />}
          label="Khóa tạm thời"
          value={
            bannedUsers.filter((user) => user.banStatus === "temporary").length
          }
          bgColor="bg-amber-50"
        />
        <StatCard
          icon={<User className="text-blue-500" />}
          label="Tổng số tài khoản khóa"
          value={bannedUsers.length}
          bgColor="bg-blue-50"
        />
      </div>

      {/* Error message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4 text-red-800 flex items-center">
          <AlertCircle className="h-5 w-5 mr-2 text-red-600" />
          {error}
        </div>
      )}

      {/* Loading state */}
      {loading ? (
        <div className="w-full py-12 flex items-center justify-center">
          <div className="flex items-center space-x-2">
            <RefreshCw className="animate-spin text-blue-600 h-6 w-6" />
            <span className="text-gray-600">Đang tải dữ liệu...</span>
          </div>
        </div>
      ) : bannedUsers.length === 0 ? (
        <div className="bg-white shadow-md rounded-lg p-8 text-center">
          <User className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-lg font-medium text-gray-900">
            Không có tài khoản bị khóa
          </h3>
          <p className="mt-1 text-sm text-gray-500">
            Hiện không có tài khoản nào bị khóa trên hệ thống.
          </p>
        </div>
      ) : (
        /* Table */
        <div className="bg-white shadow-md rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Người dùng
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Lý do khóa
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Loại khóa
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Thời gian khóa
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Thao tác
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {bannedUsers.map((user) => (
                  <tr
                    key={user._id}
                    className={
                      user.banStatus === "permanent"
                        ? "bg-red-50"
                        : "hover:bg-gray-50"
                    }
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="h-10 w-10 rounded-full flex-shrink-0 mr-3">
                          <img
                            src={user.avatar}
                            alt={user.name}
                            className="h-full w-full rounded-full object-cover"
                            onError={(e) => {
                              e.target.onerror = null;
                              e.target.src =
                                "https://i0.wp.com/sbcf.fr/wp-content/uploads/2018/03/sbcf-default-avatar.png?ssl=1";
                            }}
                          />
                        </div>
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {user.name}
                          </div>
                          <div className="text-xs text-gray-500">
                            {user.email}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900 max-w-xs">
                        {user.banReason}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                        ${
                          user.banStatus === "permanent"
                            ? "bg-red-100 text-red-800"
                            : "bg-amber-100 text-amber-800"
                        }`}
                      >
                        {getBanTypeLabel(user.banStatus)}
                        {user.banStatus === "temporary" &&
                          user.remainingDays && (
                            <span className="ml-1">
                              ({user.remainingDays} ngày)
                            </span>
                          )}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {new Date(user.updatedAt).toLocaleDateString("vi-VN")}
                      </div>
                      <div className="text-xs text-gray-500">
                        {user.banElapsed
                          ? `${user.banElapsed} ngày trước`
                          : "Hôm nay"}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          className="text-blue-600 hover:text-blue-900"
                          onClick={() => handleViewBanHistory(user)}
                        >
                          Lịch sử
                        </button>
                        <button
                          className="text-indigo-600 hover:text-indigo-900"
                          onClick={() => {
                            setSelectedUser(user);
                            setShowExtendBanModal(true);
                          }}
                        >
                          Gia hạn
                        </button>
                        <button
                          className="text-amber-600 hover:text-amber-900"
                          onClick={() => {
                            setSelectedUser(user);
                            setShowTempUnbanModal(true);
                          }}
                        >
                          Tạm mở
                        </button>
                        <button
                          className="text-green-600 hover:text-green-900"
                          onClick={() => {
                            setSelectedUser(user);
                            setShowUnbanModal(true);
                          }}
                        >
                          Mở khóa
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center mt-6">
          <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
            <button
              className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
            >
              <span className="sr-only">Trang trước</span>
              <ChevronDown className="h-5 w-5 rotate-90" />
            </button>

            {[...Array(totalPages)].map((_, i) => (
              <button
                key={i}
                className={`relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium ${
                  currentPage === i + 1
                    ? "z-10 bg-blue-50 border-blue-500 text-blue-600"
                    : "text-gray-700 hover:bg-gray-50"
                }`}
                onClick={() => setCurrentPage(i + 1)}
              >
                {i + 1}
              </button>
            ))}

            <button
              className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50"
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
            >
              <span className="sr-only">Trang tiếp</span>
              <ChevronDown className="h-5 w-5 -rotate-90" />
            </button>
          </nav>
        </div>
      )}

      {/* Unban Modal */}
      {showUnbanModal && selectedUser && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
            <div className="p-6">
              <h3 className="text-lg font-medium text-gray-900">
                Mở khóa tài khoản
              </h3>
              <p className="mt-2 text-sm text-gray-500">
                Bạn có chắc chắn muốn mở khóa tài khoản của{" "}
                <span className="font-medium text-gray-900">
                  {selectedUser.name}
                </span>
                ?
              </p>
              <div className="mt-4 flex justify-end space-x-3">
                <button
                  type="button"
                  className="inline-flex justify-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                  onClick={() => {
                    setShowUnbanModal(false);
                    setSelectedUser(null);
                  }}
                >
                  Hủy
                </button>
                <button
                  type="button"
                  className="inline-flex justify-center px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700"
                  onClick={() => handleUnbanUser(selectedUser._id)}
                >
                  Mở khóa
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Implement other modals (ExtendBan, TempUnban, BanHistory) as needed */}
      {/* These will be similar to the Unban modal with appropriate form fields */}
    </div>
  );
};

const StatCard = ({ icon, label, value, bgColor }) => {
  return (
    <div className={`${bgColor} p-6 rounded-lg shadow-sm`}>
      <div className="flex items-center">
        <div className="mr-4">{icon}</div>
        <div>
          <p className="text-sm font-medium text-gray-600">{label}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
        </div>
      </div>
    </div>
  );
};

export default BannedAccounts;
