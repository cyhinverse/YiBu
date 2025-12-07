import React from "react";

const AccountSection = ({ title, children }) => {
  return (
    <div className="settings-card bg-white dark:bg-gray-800 p-5 border border-gray-200 dark:border-gray-700">
      <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-4">
        {title}
      </h2>
      <div className="space-y-4">{children}</div>
    </div>
  );
};

export default AccountSection;
