import React, { memo } from "react";
import { User, RefreshCw, Search } from "lucide-react";

// Sử dụng memo để tối ưu hóa render
const EmptyState = memo(({ searchTerm, handleRefresh }) => {
  return (
    <div className="flex flex-col items-center justify-center py-12">
      {searchTerm ? (
        <Search size={48} className="text-gray-400 mb-4" />
      ) : (
        <User size={48} className="text-gray-400 mb-4" />
      )}

      <h3 className="text-lg font-medium text-gray-700">
        Không tìm thấy người dùng nào
      </h3>

      <p className="text-sm text-gray-500 mb-4 text-center max-w-md">
        {searchTerm
          ? `Không tìm thấy người dùng nào khớp với từ khóa "${searchTerm}"`
          : "Hiện tại chưa có người dùng nào trong hệ thống"}
      </p>

      <div className="flex space-x-2">
        {searchTerm && (
          <button
            onClick={() => handleRefresh()}
            className="flex items-center px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors"
          >
            <span>Xóa bộ lọc</span>
          </button>
        )}

        <button
          onClick={handleRefresh}
          className="flex items-center px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
        >
          <RefreshCw size={16} className="mr-2" />
          Tải lại
        </button>
      </div>

      <div className="mt-8 text-sm text-gray-500">
        <p>
          Bạn có thể thêm người dùng mới bằng cách nhấn nút "Thêm người dùng" ở
          trên.
        </p>
      </div>
    </div>
  );
});

EmptyState.displayName = "EmptyState";

export default EmptyState;
