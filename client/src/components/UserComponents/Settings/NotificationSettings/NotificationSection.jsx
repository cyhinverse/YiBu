import React from "react";

const NotificationSection = ({ title, children }) => {
  return (
    <div className="bg-white p-5 rounded-lg border border-gray-200 shadow-sm mb-6">
      <h3 className="text-lg font-medium mb-3">{title}</h3>
      <div className="space-y-3">{children}</div>
    </div>
  );
};

export default NotificationSection;
