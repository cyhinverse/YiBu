import React from "react";
import { Flag } from "lucide-react";

const EmptyState = ({
  message = "Không có báo cáo nào",
  description = "Hiện không có báo cáo nào phù hợp với bộ lọc hiện tại.",
}) => {
  return (
    <div className="bg-white shadow-md rounded-lg overflow-hidden">
      <div className="p-10 text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full mb-4">
          <Flag size={24} className="text-gray-400" />
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">{message}</h3>
        <p className="text-gray-500">{description}</p>
      </div>
    </div>
  );
};

export default EmptyState;
