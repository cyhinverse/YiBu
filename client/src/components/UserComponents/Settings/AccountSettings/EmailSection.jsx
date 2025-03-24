import React from "react";
import AccountSection from "./AccountSection";

const EmailSection = ({ email, isVerified, onUpdateEmail }) => {
  return (
    <AccountSection title="Email">
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
        <div>
          <p className="text-gray-500 dark:text-gray-400 mb-1 text-sm">
            Email hiện tại
          </p>
          <div className="flex items-center">
            <p className="text-gray-800 dark:text-gray-200 font-medium account-email-display mr-2">
              {email}
            </p>
            {isVerified ? (
              <span className="text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded-full">
                Đã xác thực
              </span>
            ) : (
              <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded-full">
                Chưa xác thực
              </span>
            )}
          </div>
        </div>
        <button
          onClick={onUpdateEmail}
          className="settings-button settings-button-primary bg-purple-600 hover:bg-purple-700 dark:bg-purple-700 dark:hover:bg-purple-600 text-white"
        >
          Thay đổi
        </button>
      </div>
    </AccountSection>
  );
};

export default EmailSection;
