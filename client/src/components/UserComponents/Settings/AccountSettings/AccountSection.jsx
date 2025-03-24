import React from "react";

const AccountSection = ({ title, children }) => {
  return (
    <div className="bg-gray-50 dark:bg-gray-800 p-5 rounded-lg">
      <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100 mb-4">
        {title}
      </h2>
      {children}
    </div>
  );
};

export default AccountSection;
