import React from "react";
import AccountSection from "./AccountSection";

const AccountActionsSection = ({
  handleLogout,
  isLoggingOut,
  setShowDeleteConfirm,
}) => {
  return (
    <AccountSection title="Hành động tài khoản">
      <div className="space-y-5">
        {/* Logout action */}
        <div className="flex justify-between items-center border-b border-gray-200 dark:border-gray-700 pb-4">
          <div>
            <p className="text-gray-800 dark:text-gray-200 font-medium">
              Đăng xuất
            </p>
            <p className="text-gray-500 dark:text-gray-400 text-sm">
              Đăng xuất khỏi tài khoản của bạn
            </p>
          </div>
          <button
            onClick={handleLogout}
            disabled={isLoggingOut}
            className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-md hover:bg-gray-300 dark:hover:bg-gray-600 transition disabled:opacity-50"
          >
            {isLoggingOut ? "Đang đăng xuất..." : "Đăng xuất"}
          </button>
        </div>

        {/* Delete account action */}
        <div className="flex justify-between items-center">
          <div>
            <p className="text-red-600 dark:text-red-400 font-medium">
              Xóa tài khoản
            </p>
            <p className="text-gray-500 dark:text-gray-400 text-sm">
              Xóa vĩnh viễn tài khoản và dữ liệu của bạn
            </p>
          </div>
          <button
            onClick={() => setShowDeleteConfirm(true)}
            className="px-4 py-2 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-md hover:bg-red-200 dark:hover:bg-red-800/40 transition"
          >
            Xóa tài khoản
          </button>
        </div>
      </div>
    </AccountSection>
  );
};

export default AccountActionsSection;
