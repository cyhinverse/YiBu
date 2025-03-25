import React from "react";

const UserPagination = ({ page, setPage, totalPages, users, totalUsers }) => {
  return (
    <div className="flex justify-between items-center mt-6">
      <div className="text-sm text-gray-700">
        Hiển thị <span className="font-medium">{users.length}</span> người dùng
      </div>

      <div className="flex items-center space-x-2">
        <button
          onClick={() => setPage(page > 1 ? page - 1 : 1)}
          disabled={page === 1}
          className={`px-3 py-1 rounded-md ${
            page === 1
              ? "bg-gray-100 text-gray-400 cursor-not-allowed"
              : "bg-white border border-gray-300 text-gray-700 hover:bg-gray-50"
          }`}
        >
          Trước
        </button>

        <span className="px-3 py-1 bg-blue-50 text-blue-600 rounded-md border border-blue-200">
          {page}
        </span>

        <button
          onClick={() => setPage(page + 1)}
          disabled={page >= totalPages}
          className={`px-3 py-1 rounded-md ${
            page >= totalPages
              ? "bg-gray-100 text-gray-400 cursor-not-allowed"
              : "bg-white border border-gray-300 text-gray-700 hover:bg-gray-50"
          }`}
        >
          Tiếp
        </button>
      </div>

      <div className="text-sm text-gray-700">
        Tổng: <span className="font-medium">{totalUsers}</span> người dùng
      </div>
    </div>
  );
};

export default UserPagination;
