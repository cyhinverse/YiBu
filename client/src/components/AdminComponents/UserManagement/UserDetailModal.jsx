import React, { memo } from "react";
import {
  XCircle,
  Mail,
  Calendar,
  Shield,
  Ban,
  CheckCircle,
  Lock,
  Unlock,
} from "lucide-react";

// Sử dụng memo để tránh re-render không cần thiết
const UserDetailModal = memo(
  ({ selectedUser, setShowUserDetail, submitUnbanUser, handleBanUser }) => {
    if (!selectedUser) return null;

    // Tạo hàm xử lý để đảm bảo không click nhầm vào modal
    const handleModalClick = (e) => {
      // Chỉ đóng modal khi click vào background, không phải nội dung
      if (e.target === e.currentTarget) {
        setShowUserDetail(false);
      }
    };

    // Xác định trạng thái banExpiration
    const getBanExpirationText = () => {
      if (!selectedUser.banExpiration) return "Vĩnh viễn";

      const expirationDate = new Date(selectedUser.banExpiration);
      const now = new Date();

      // Kiểm tra xem thời gian đã hết chưa
      if (expirationDate <= now) {
        return "Đã hết hạn";
      }

      return expirationDate.toLocaleString();
    };

    return (
      <div
        className="fixed inset-0 bg-black/10 bg-opacity-50 flex items-center justify-center z-50"
        onClick={handleModalClick}
      >
        <div className="bg-white rounded-lg shadow-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
          <div className="p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-gray-900">
                Chi tiết người dùng
              </h3>
              <button
                onClick={() => setShowUserDetail(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <XCircle size={24} />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="flex flex-col items-center">
                <img
                  src={selectedUser.avatar}
                  alt={selectedUser.name}
                  className="w-32 h-32 rounded-full object-cover border-4 border-blue-100"
                  onError={(e) => {
                    // Khi ảnh lỗi, sử dụng avatar mặc định
                    e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(
                      selectedUser.name
                    )}&background=random`;
                  }}
                />
                <h4 className="mt-4 text-lg font-medium">
                  {selectedUser.name}
                </h4>
                <p className="text-gray-500">@{selectedUser.username}</p>

                <div className="mt-4 flex flex-wrap gap-2 justify-center">
                  {selectedUser.isAdmin && (
                    <span className="px-3 py-1 inline-flex items-center text-xs font-semibold rounded-full bg-purple-100 text-purple-800">
                      <Shield size={12} className="mr-1" />
                      Admin
                    </span>
                  )}
                  {selectedUser.isBanned ? (
                    <span className="px-3 py-1 inline-flex items-center text-xs font-semibold rounded-full bg-red-100 text-red-800">
                      <Ban size={12} className="mr-1" />
                      Bị cấm
                    </span>
                  ) : (
                    <span className="px-3 py-1 inline-flex items-center text-xs font-semibold rounded-full bg-green-100 text-green-800">
                      <CheckCircle size={12} className="mr-1" />
                      Hoạt động
                    </span>
                  )}
                </div>
              </div>

              <div>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Email
                    </label>
                    <div className="flex items-center border rounded-md px-3 py-2 bg-gray-50">
                      <Mail size={16} className="text-gray-400 mr-2" />
                      <span>{selectedUser.email}</span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Ngày đăng ký
                    </label>
                    <div className="flex items-center border rounded-md px-3 py-2 bg-gray-50">
                      <Calendar size={16} className="text-gray-400 mr-2" />
                      <span>
                        {new Date(selectedUser.createdAt).toLocaleString()}
                      </span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Đăng nhập gần đây
                    </label>
                    <div className="flex items-center border rounded-md px-3 py-2 bg-gray-50">
                      <Calendar size={16} className="text-gray-400 mr-2" />
                      <span>
                        {selectedUser.lastLogin
                          ? new Date(selectedUser.lastLogin).toLocaleString()
                          : "Chưa đăng nhập"}
                      </span>
                    </div>
                  </div>

                  {selectedUser.isBanned && (
                    <>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Lý do cấm
                        </label>
                        <div className="border rounded-md px-3 py-2 bg-gray-50">
                          {selectedUser.banReason || "Không có lý do"}
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Thời hạn cấm
                        </label>
                        <div className="border rounded-md px-3 py-2 bg-gray-50">
                          {getBanExpirationText()}
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 mt-6">
              <button
                onClick={() => setShowUserDetail(false)}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                Đóng
              </button>
              {selectedUser.isBanned ? (
                <button
                  onClick={() => {
                    setShowUserDetail(false);
                    submitUnbanUser(selectedUser._id);
                  }}
                  className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                >
                  <Unlock size={16} className="inline mr-1" />
                  Mở khóa tài khoản
                </button>
              ) : (
                <button
                  onClick={() => {
                    setShowUserDetail(false);
                    handleBanUser(selectedUser);
                  }}
                  className="px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700"
                >
                  <Lock size={16} className="inline mr-1" />
                  Khóa tài khoản
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }
);

UserDetailModal.displayName = "UserDetailModal";

export default UserDetailModal;
