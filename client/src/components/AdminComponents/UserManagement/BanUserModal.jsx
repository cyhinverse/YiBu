import React, { memo, useState, useEffect } from "react";
import { XCircle, ShieldOff, Info, AlertTriangle } from "lucide-react";

// Tối ưu với memo
const BanUserModal = memo(
  ({
    selectedUser,
    setShowBanModal,
    banReason,
    setBanReason,
    banDuration,
    setBanDuration,
    submitBanUser,
    isLoading,
  }) => {
    // Trạng thái local để hiển thị validation
    const [errors, setErrors] = useState({
      reason: false,
      duration: false,
    });

    // Reset errors khi modal mở lại
    useEffect(() => {
      if (selectedUser) {
        setErrors({ reason: false, duration: false });
      }
    }, [selectedUser]);

    // Xử lý khi click ngoài modal
    const handleModalClick = (e) => {
      if (e.target === e.currentTarget) {
        setShowBanModal(false);
      }
    };

    // Xác thực input trước khi submit
    const handleSubmit = () => {
      let isValid = true;
      const newErrors = { reason: false, duration: false };

      // Kiểm tra lý do (không bắt buộc nhưng nên có)
      if (!banReason || banReason.trim() === "") {
        newErrors.reason = true;
        isValid = false;
      }

      // Kiểm tra thời gian (phải là số dương)
      if (isNaN(banDuration) || Number(banDuration) < 0) {
        newErrors.duration = true;
        isValid = false;
      }

      setErrors(newErrors);

      if (isValid) {
        submitBanUser();
      } else {
        // Hiển thị thông báo cho người dùng
        alert("Vui lòng điền đúng thông tin trước khi khóa tài khoản");
      }
    };

    // Đảm bảo selectedUser tồn tại trước khi render nội dung
    if (!selectedUser) return null;

    return (
      <div
        className="fixed inset-0 bg-black/10 bg-opacity-50 flex items-center justify-center z-50"
        onClick={handleModalClick}
      >
        <div className="bg-white rounded-lg shadow-lg max-w-md w-full">
          <div className="p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-gray-900 flex items-center">
                <ShieldOff size={20} className="mr-2 text-red-500" />
                Khóa tài khoản người dùng
              </h3>
              <button
                onClick={() => setShowBanModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <XCircle size={24} />
              </button>
            </div>

            <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-md">
              <div className="flex">
                <AlertTriangle
                  size={20}
                  className="text-amber-500 mr-2 flex-shrink-0"
                />
                <p className="text-gray-700">
                  Bạn đang chuẩn bị khóa tài khoản của{" "}
                  <span className="font-medium text-gray-900">
                    {selectedUser.name}
                  </span>
                  . Người dùng sẽ không thể đăng nhập hoặc sử dụng tài khoản
                  trong thời gian bị khóa.
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Lý do khóa tài khoản <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={banReason}
                  onChange={(e) => {
                    setBanReason(e.target.value);
                    if (e.target.value.trim() !== "") {
                      setErrors({ ...errors, reason: false });
                    }
                  }}
                  className={`w-full border ${
                    errors.reason ? "border-red-500" : "border-gray-300"
                  } rounded-md p-3 focus:ring-blue-500 focus:border-blue-500`}
                  placeholder="Nhập lý do khóa tài khoản người dùng"
                  rows={3}
                ></textarea>
                {errors.reason && (
                  <p className="mt-1 text-sm text-red-500 flex items-center">
                    <Info size={14} className="mr-1" />
                    Vui lòng nhập lý do khóa tài khoản
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Thời gian khóa (ngày) <span className="text-red-500">*</span>
                </label>
                <div className="flex items-center">
                  <input
                    type="number"
                    min="0"
                    value={banDuration}
                    onChange={(e) => {
                      setBanDuration(e.target.value);
                      if (
                        !isNaN(e.target.value) &&
                        Number(e.target.value) >= 0
                      ) {
                        setErrors({ ...errors, duration: false });
                      }
                    }}
                    className={`w-full border ${
                      errors.duration ? "border-red-500" : "border-gray-300"
                    } rounded-md p-2 focus:ring-blue-500 focus:border-blue-500`}
                  />
                  <span className="ml-2 text-sm text-gray-500">
                    Nhập 0 để khóa vĩnh viễn
                  </span>
                </div>
                {errors.duration && (
                  <p className="mt-1 text-sm text-red-500 flex items-center">
                    <Info size={14} className="mr-1" />
                    Vui lòng nhập số ngày hợp lệ
                  </p>
                )}
              </div>
            </div>

            <div className="flex justify-end gap-2 mt-6">
              <button
                onClick={() => setShowBanModal(false)}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                disabled={isLoading}
              >
                Hủy
              </button>
              <button
                onClick={handleSubmit}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <span className="inline-block h-4 w-4 border-2 border-t-transparent border-white rounded-full animate-spin mr-2 align-middle"></span>
                    Đang xử lý...
                  </>
                ) : (
                  "Xác nhận khóa tài khoản"
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }
);

BanUserModal.displayName = "BanUserModal";

export default BanUserModal;
