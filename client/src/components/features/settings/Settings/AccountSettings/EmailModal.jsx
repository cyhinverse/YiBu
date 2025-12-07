import React from "react";
import { X } from "lucide-react";

const EmailModal = ({
  email,
  newEmail,
  onEmailChange,
  onClose,
  onSubmit,
  isLoading,
}) => {
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
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Thay đổi email
          </h3>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="mb-6">
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Email hiện tại
            </label>
            <div className="bg-gray-100 dark:bg-gray-700 p-2 rounded-md text-gray-800 dark:text-gray-200">
              {email}
            </div>
          </div>

          <div>
            <label
              htmlFor="newEmail"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
            >
              Email mới
            </label>
            <input
              type="email"
              id="newEmail"
              value={newEmail}
              onChange={onEmailChange}
              className="settings-input dark:bg-gray-700 dark:text-white"
              placeholder="Nhập email mới"
              disabled={isLoading}
            />
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
            onClick={onSubmit}
            disabled={isLoading}
            className="settings-button settings-button-primary flex items-center"
          >
            {isLoading ? (
              <>
                <div className="w-4 h-4 mr-2 rounded-full border-2 border-white border-t-transparent animate-spin"></div>
                <span>Đang cập nhật...</span>
              </>
            ) : (
              "Cập nhật"
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default EmailModal;
