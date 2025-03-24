import React from "react";

const PasswordModal = ({
  showPasswordModal,
  closePasswordModal,
  passwordData,
  passwordErrors,
  handlePasswordChange,
  handleUpdatePassword,
  isUpdatingPassword,
}) => {
  if (!showPasswordModal) return null;

  // Prevent click propagation to avoid modal closing when clicking inside
  const preventClickPropagation = (e) => {
    e.stopPropagation();
  };

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center"
      tabIndex="-1"
    >
      <div
        className="bg-white rounded-lg p-6 w-full max-w-md mx-auto"
        onClick={preventClickPropagation}
      >
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-purple-700">
            Đổi mật khẩu
          </h2>
          <button
            type="button"
            onClick={closePasswordModal}
            className="text-gray-500 hover:text-gray-700"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleUpdatePassword();
          }}
        >
          <div className="space-y-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Mật khẩu hiện tại
              </label>
              <input
                type="password"
                name="currentPassword"
                value={passwordData.currentPassword}
                onChange={handlePasswordChange}
                className={`w-full p-2 border ${
                  passwordErrors.currentPassword
                    ? "border-red-500"
                    : "border-gray-300"
                } rounded-md focus:ring-purple-500 focus:border-purple-500`}
                placeholder="Nhập mật khẩu hiện tại"
                autoFocus
              />
              {passwordErrors.currentPassword && (
                <p className="text-red-500 text-sm mt-1">
                  {passwordErrors.currentPassword}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Mật khẩu mới
              </label>
              <input
                type="password"
                name="newPassword"
                value={passwordData.newPassword}
                onChange={handlePasswordChange}
                className={`w-full p-2 border ${
                  passwordErrors.newPassword
                    ? "border-red-500"
                    : "border-gray-300"
                } rounded-md focus:ring-purple-500 focus:border-purple-500`}
                placeholder="Nhập mật khẩu mới"
              />
              {passwordErrors.newPassword && (
                <p className="text-red-500 text-sm mt-1">
                  {passwordErrors.newPassword}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Xác nhận mật khẩu mới
              </label>
              <input
                type="password"
                name="confirmPassword"
                value={passwordData.confirmPassword}
                onChange={handlePasswordChange}
                className={`w-full p-2 border ${
                  passwordErrors.confirmPassword
                    ? "border-red-500"
                    : "border-gray-300"
                } rounded-md focus:ring-purple-500 focus:border-purple-500`}
                placeholder="Nhập lại mật khẩu mới"
              />
              {passwordErrors.confirmPassword && (
                <p className="text-red-500 text-sm mt-1">
                  {passwordErrors.confirmPassword}
                </p>
              )}
            </div>
          </div>

          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={closePasswordModal}
              disabled={isUpdatingPassword}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={isUpdatingPassword}
              className="px-4 py-2 text-sm font-medium text-white bg-purple-600 rounded-md hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
            >
              {isUpdatingPassword ? "Đang cập nhật..." : "Cập nhật"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PasswordModal;
