import React from "react";
import AccountSection from "./AccountSection";
import { LockIcon } from "lucide-react";

const PasswordSection = ({ onUpdatePassword }) => {
  return (
    <AccountSection title="Mật khẩu">
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
        <div>
          <p className="text-gray-500 dark:text-gray-400 mb-1 text-sm">
            Mật khẩu của bạn
          </p>
          <div className="flex items-center">
            <LockIcon size={16} className="text-gray-500 mr-2" />
            <p className="text-gray-800 dark:text-gray-200 font-medium">
              ••••••••
            </p>
          </div>
        </div>
        <button
          onClick={onUpdatePassword}
          className="settings-button settings-button-primary bg-purple-600 hover:bg-purple-700 dark:bg-purple-700 dark:hover:bg-purple-600 text-white"
        >
          Đổi mật khẩu
        </button>
      </div>
    </AccountSection>
  );
};

export default PasswordSection;
