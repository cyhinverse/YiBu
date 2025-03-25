import React from "react";

const Pagination = ({
  page,
  totalPages,
  totalItems,
  pageSize,
  onPageChange,
}) => {
  return (
    <div className="mt-4 flex flex-col sm:flex-row items-center justify-between">
      <div className="text-sm text-gray-700 mb-4 sm:mb-0">
        Hiển thị{" "}
        <span className="font-medium">
          {Math.min((page - 1) * pageSize + 1, totalItems)}
        </span>{" "}
        đến{" "}
        <span className="font-medium">
          {Math.min(page * pageSize, totalItems)}
        </span>{" "}
        trong <span className="font-medium">{totalItems}</span> bình luận
      </div>
      <div className="flex items-center justify-center space-x-2">
        <button
          onClick={() => onPageChange(Math.max(1, page - 1))}
          disabled={page === 1}
          className={`px-3 py-1 rounded-md ${
            page === 1
              ? "bg-gray-100 text-gray-400 cursor-not-allowed"
              : "bg-gray-200 text-gray-700 hover:bg-gray-300"
          }`}
        >
          Trước
        </button>
        {[...Array(Math.min(5, totalPages))].map((_, index) => {
          const pageNumber =
            totalPages <= 5
              ? index + 1
              : page <= 3
              ? index + 1
              : page >= totalPages - 2
              ? totalPages - 4 + index
              : page - 2 + index;

          return (
            <button
              key={index}
              onClick={() => onPageChange(pageNumber)}
              className={`px-3 py-1 rounded-md ${
                page === pageNumber
                  ? "bg-blue-500 text-white"
                  : "bg-gray-200 text-gray-700 hover:bg-gray-300"
              }`}
            >
              {pageNumber}
            </button>
          );
        })}
        <button
          onClick={() => onPageChange(Math.min(totalPages, page + 1))}
          disabled={page === totalPages}
          className={`px-3 py-1 rounded-md ${
            page === totalPages
              ? "bg-gray-100 text-gray-400 cursor-not-allowed"
              : "bg-gray-200 text-gray-700 hover:bg-gray-300"
          }`}
        >
          Tiếp
        </button>
      </div>
    </div>
  );
};

export default Pagination;
