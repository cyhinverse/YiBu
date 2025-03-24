import React from "react";
import AccountSection from "./AccountSection";
import { LogOut, Trash2 } from "lucide-react";

const AccountActionsSection = ({ onLogout, onDelete }) => {
  return (
    <AccountSection title="Hành động tài khoản">
      <div className="space-y-5">
        {/* Logout action */}
        <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-3 border-b border-gray-200 dark:border-gray-700 pb-4">
          <div>
            <p className="text-gray-800 dark:text-gray-200 font-medium">
              Đăng xuất
            </p>
            <p className="text-gray-500 dark:text-gray-400 text-sm">
              Đăng xuất khỏi tài khoản của bạn
            </p>
          </div>
          <button
            onClick={onLogout}
            className="settings-button flex items-center justify-center gap-2 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200"
          >
            <LogOut size={16} />
            <span>Đăng xuất</span>
          </button>
        </div>

        {/* Delete account action */}
        <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-3">
          <div>
            <p className="text-red-600 dark:text-red-400 font-medium">
              Xóa tài khoản
            </p>
            <p className="text-gray-500 dark:text-gray-400 text-sm">
              Xóa vĩnh viễn tài khoản và dữ liệu của bạn
            </p>
          </div>
          <button
            onClick={onDelete}
            className="settings-button flex items-center justify-center gap-2 bg-red-100 hover:bg-red-200 dark:bg-red-900/30 dark:hover:bg-red-800/40 text-red-600 dark:text-red-400"
          >
            <Trash2 size={16} />
            <span>Xóa tài khoản</span>
          </button>
        </div>
      </div>
    </AccountSection>
  );
};

export default AccountActionsSection;
