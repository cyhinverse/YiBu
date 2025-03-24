import React from "react";
import AccountSection from "./AccountSection";

const EmailSection = ({ email, openEmailModal }) => {
  return (
    <AccountSection title="Email">
      <div className="flex justify-between items-center">
        <div>
          <p className="text-gray-500 dark:text-gray-400 mb-1">
            Email hiện tại
          </p>
          <p className="text-gray-800 dark:text-gray-200 font-medium account-email-display">
            {email}
          </p>
        </div>
        <button
          onClick={openEmailModal}
          className="px-4 py-2 bg-purple-600 hover:bg-purple-700 dark:bg-purple-700 dark:hover:bg-purple-600 text-white rounded-md transition"
        >
          Thay đổi
        </button>
      </div>
    </AccountSection>
  );
};

export default EmailSection;
