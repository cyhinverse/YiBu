import React from "react";

const SuccessNotification = ({ showSuccess, successMessage, successType }) => {
  if (!showSuccess) return null;

  // Tạo style dựa trên loại thông báo
  let bgColor = "bg-green-100";
  let borderColor = "border-green-500";
  let textColor = "text-green-700";
  let iconColor = "text-green-500";

  if (successType === "password") {
    bgColor = "bg-blue-100";
    borderColor = "border-blue-500";
    textColor = "text-blue-700";
    iconColor = "text-blue-500";
  } else if (successType === "verification") {
    bgColor = "bg-purple-100";
    borderColor = "border-purple-500";
    textColor = "text-purple-700";
    iconColor = "text-purple-500";
  }

  return (
    <div
      className={`fixed bottom-5 right-5 ${bgColor} border-l-4 ${borderColor} ${textColor} p-4 rounded shadow-md z-50 animate-fade-in-up`}
    >
      <div className="flex items-center">
        <svg
          className={`h-6 w-6 ${iconColor} mr-2`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M5 13l4 4L19 7"
          />
        </svg>
        <p>{successMessage}</p>
      </div>
    </div>
  );
};

export default SuccessNotification;
