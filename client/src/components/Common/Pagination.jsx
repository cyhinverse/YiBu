import React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

/**
 * Component phân trang có thể tái sử dụng
 * @param {Object} props - Props cho component
 * @param {number} props.currentPage - Trang hiện tại
 * @param {number} props.totalPages - Tổng số trang
 * @param {Function} props.onPageChange - Hàm xử lý khi chuyển trang
 */
const Pagination = ({ currentPage, totalPages, onPageChange }) => {
  // Không hiển thị nếu chỉ có 1 trang
  if (totalPages <= 1) return null;

  // Hàm tạo các nút số trang
  const getPageNumbers = () => {
    const pages = [];
    const maxPagesToShow = 5;

    // Nếu tổng số trang <= số trang tối đa hiển thị, hiển thị tất cả
    if (totalPages <= maxPagesToShow) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Nếu trang hiện tại gần đầu
      if (currentPage <= 3) {
        for (let i = 1; i <= 4; i++) {
          pages.push(i);
        }
        pages.push("...");
        pages.push(totalPages);
      }
      // Nếu trang hiện tại gần cuối
      else if (currentPage >= totalPages - 2) {
        pages.push(1);
        pages.push("...");
        for (let i = totalPages - 3; i <= totalPages; i++) {
          pages.push(i);
        }
      }
      // Nếu trang hiện tại ở giữa
      else {
        pages.push(1);
        pages.push("...");
        for (let i = currentPage - 1; i <= currentPage + 1; i++) {
          pages.push(i);
        }
        pages.push("...");
        pages.push(totalPages);
      }
    }

    return pages;
  };

  return (
    <div className="flex justify-center items-center">
      <nav className="flex items-center space-x-1">
        {/* Nút Previous */}
        <button
          onClick={() => onPageChange(Math.max(1, currentPage - 1))}
          disabled={currentPage === 1}
          className={`px-3 py-1 rounded-md ${
            currentPage === 1
              ? "text-gray-400 cursor-not-allowed"
              : "text-gray-700 hover:bg-gray-200"
          }`}
          aria-label="Previous Page"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>

        {/* Các số trang */}
        {getPageNumbers().map((page, index) => (
          <React.Fragment key={index}>
            {page === "..." ? (
              <span className="px-3 py-1 text-gray-500">...</span>
            ) : (
              <button
                onClick={() => onPageChange(page)}
                className={`px-3 py-1 rounded-md ${
                  currentPage === page
                    ? "bg-blue-600 text-white"
                    : "text-gray-700 hover:bg-gray-200"
                }`}
                aria-label={`Page ${page}`}
                aria-current={currentPage === page ? "page" : undefined}
              >
                {page}
              </button>
            )}
          </React.Fragment>
        ))}

        {/* Nút Next */}
        <button
          onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
          disabled={currentPage === totalPages}
          className={`px-3 py-1 rounded-md ${
            currentPage === totalPages
              ? "text-gray-400 cursor-not-allowed"
              : "text-gray-700 hover:bg-gray-200"
          }`}
          aria-label="Next Page"
        >
          <ChevronRight className="h-5 w-5" />
        </button>
      </nav>
    </div>
  );
};

export default Pagination;
