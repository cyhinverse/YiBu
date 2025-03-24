import React from "react";
import { AlertTriangle, X } from "lucide-react";

const DeleteAccountModal = ({ onClose, onConfirm, isLoading }) => {
  // Prevent click propagation to avoid modal closing when clicking inside
  const preventClickPropagation = (e) => {
    e.stopPropagation();
  };

  return (
    <div
      className="fixed inset-0 bg-black/40 dark:bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-md p-5 transform transition-all fade-in"
        onClick={preventClickPropagation}
      >
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center">
            <AlertTriangle size={20} className="text-red-500 mr-2" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Xác nhận xóa tài khoản
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
            disabled={isLoading}
          >
            <X size={20} />
          </button>
        </div>

        <div className="mb-6">
          <p className="text-gray-600 dark:text-gray-300 mb-3">
            Bạn có chắc chắn muốn xóa tài khoản? Hành động này không thể khôi
            phục.
          </p>
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800 rounded-lg p-3">
            <p className="text-red-600 dark:text-red-400 text-sm">
              Tất cả dữ liệu của bạn sẽ bị xóa vĩnh viễn, bao gồm:
            </p>
            <ul className="list-disc list-inside text-sm text-red-600 dark:text-red-400 mt-2 space-y-1">
              <li>Thông tin cá nhân và hồ sơ</li>
              <li>Bài đăng, bình luận và tương tác</li>
              <li>Tin nhắn và liên hệ</li>
              <li>Cài đặt và tùy chỉnh</li>
            </ul>
          </div>
        </div>

        <div className="flex justify-end space-x-2">
          <button
            onClick={onClose}
            className="settings-button bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200"
            disabled={isLoading}
          >
            Hủy
          </button>
          <button
            onClick={onConfirm}
            disabled={isLoading}
            className="settings-button bg-red-600 hover:bg-red-700 text-white flex items-center"
          >
            {isLoading ? (
              <>
                <div className="w-4 h-4 mr-2 rounded-full border-2 border-white border-t-transparent animate-spin"></div>
                <span>Đang xóa...</span>
              </>
            ) : (
              "Xóa tài khoản"
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeleteAccountModal;
