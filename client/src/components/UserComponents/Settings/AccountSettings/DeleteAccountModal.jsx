import React from "react";

const DeleteAccountModal = ({
  showDeleteConfirm,
  setShowDeleteConfirm,
  handleDeleteAccount,
  isDeleting,
}) => {
  if (!showDeleteConfirm) return null;

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center"
      tabIndex="-1"
    >
      <div
        className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md mx-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-xl font-semibold text-red-600 dark:text-red-400 mb-4">
          Xác nhận xóa tài khoản
        </h2>
        <p className="text-gray-700 dark:text-gray-300 mb-6">
          Bạn chắc chắn muốn xóa tài khoản? Hành động này không thể hoàn tác và
          sẽ xóa vĩnh viễn tất cả dữ liệu của bạn.
        </p>
        <div className="flex justify-end space-x-3">
          <button
            type="button"
            onClick={() => setShowDeleteConfirm(false)}
            disabled={isDeleting}
            className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600"
          >
            Hủy
          </button>
          <button
            type="button"
            onClick={handleDeleteAccount}
            disabled={isDeleting}
            className="px-4 py-2 text-sm font-medium text-white bg-red-600 dark:bg-red-700 rounded-md hover:bg-red-700 dark:hover:bg-red-600"
          >
            {isDeleting ? "Đang xóa..." : "Xóa tài khoản"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeleteAccountModal;
