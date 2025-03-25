import React from "react";
import { RefreshCw, Download } from "lucide-react";

const HeaderActions = ({ handleRefresh, isLoading }) => {
  return (
    <div className="flex flex-col sm:flex-row justify-between items-center mb-6">
      <h2 className="text-2xl font-bold text-gray-800 mb-4 sm:mb-0">
        Quản Lý Bình Luận
      </h2>
      <div className="flex gap-2">
        <button
          onClick={handleRefresh}
          className="flex items-center px-3 py-2 bg-blue-50 rounded-md text-blue-600 hover:bg-blue-100 transition-colors"
          disabled={isLoading}
        >
          <RefreshCw
            size={16}
            className={`mr-2 ${isLoading ? "animate-spin" : ""}`}
          />
          <span>{isLoading ? "Đang tải..." : "Làm mới"}</span>
        </button>
        <button className="flex items-center px-3 py-2 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors">
          <Download size={16} className="mr-2" />
          <span>Xuất</span>
        </button>
      </div>
    </div>
  );
};

export default HeaderActions; 