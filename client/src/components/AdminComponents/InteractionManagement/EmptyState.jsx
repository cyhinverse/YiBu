import React from "react";
import { SearchX, RefreshCw } from "lucide-react";

const EmptyState = ({ message, onRefresh }) => {
  return (
    <div className="bg-white rounded-lg shadow-md p-6 flex flex-col items-center justify-center py-12">
      <SearchX className="h-16 w-16 text-gray-400 mb-4" />
      <h3 className="text-lg font-medium text-gray-900 mb-2">
        Không có dữ liệu
      </h3>
      <p className="text-gray-500 text-center max-w-md mb-6">
        {message ||
          "Không tìm thấy dữ liệu tương tác nào. Vui lòng thử lại với bộ lọc khác hoặc làm mới dữ liệu."}
      </p>
      {onRefresh && (
        <button
          onClick={onRefresh}
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          <RefreshCw className="mr-2 h-4 w-4" />
          Làm mới dữ liệu
        </button>
      )}
    </div>
  );
};

export default EmptyState;
