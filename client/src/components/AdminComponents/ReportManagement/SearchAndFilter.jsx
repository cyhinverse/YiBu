import React, { useState } from "react";
import { Search, Filter, ChevronDown } from "lucide-react";

const SearchAndFilter = ({
  searchTerm,
  setSearchTerm,
  filterStatus,
  setFilterStatus,
  filterType,
  setFilterType,
}) => {
  const [showStatusFilter, setShowStatusFilter] = useState(false);
  const [showTypeFilter, setShowTypeFilter] = useState(false);

  const handleClickOutside = () => {
    setShowStatusFilter(false);
    setShowTypeFilter(false);
  };

  return (
    <div className="flex items-center gap-3">
      <div className="relative">
        <input
          type="text"
          placeholder="Tìm kiếm báo cáo..."
          className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
      </div>

      <div className="relative">
        <button
          className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg shadow-sm hover:bg-gray-50"
          onClick={() => {
            setShowStatusFilter(!showStatusFilter);
            setShowTypeFilter(false);
          }}
        >
          <Filter size={16} />
          <span>Trạng thái</span>
          <ChevronDown size={16} />
        </button>

        {showStatusFilter && (
          <>
            <div className="fixed inset-0 z-10" onClick={handleClickOutside} />
            <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg z-20 border border-gray-200">
              <div className="py-1">
                {["all", "pending", "resolved", "dismissed", "escalated"].map(
                  (status) => (
                    <button
                      key={status}
                      className={`flex w-full items-center px-4 py-2 text-sm ${
                        filterStatus === status
                          ? "bg-blue-50 text-blue-700"
                          : "text-gray-700 hover:bg-gray-100"
                      }`}
                      onClick={() => {
                        setFilterStatus(status);
                        setShowStatusFilter(false);
                      }}
                    >
                      {status === "all" && "Tất cả"}
                      {status === "pending" && "Đang chờ xử lý"}
                      {status === "resolved" && "Đã giải quyết"}
                      {status === "dismissed" && "Đã bỏ qua"}
                      {status === "escalated" && "Chuyển cấp"}
                    </button>
                  )
                )}
              </div>
            </div>
          </>
        )}
      </div>

      <div className="relative">
        <button
          className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg shadow-sm hover:bg-gray-50"
          onClick={() => {
            setShowTypeFilter(!showTypeFilter);
            setShowStatusFilter(false);
          }}
        >
          <Filter size={16} />
          <span>Loại</span>
          <ChevronDown size={16} />
        </button>

        {showTypeFilter && (
          <>
            <div className="fixed inset-0 z-10" onClick={handleClickOutside} />
            <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg z-20 border border-gray-200">
              <div className="py-1">
                {["all", "post", "comment", "user"].map((type) => (
                  <button
                    key={type}
                    className={`flex w-full items-center px-4 py-2 text-sm ${
                      filterType === type
                        ? "bg-blue-50 text-blue-700"
                        : "text-gray-700 hover:bg-gray-100"
                    }`}
                    onClick={() => {
                      setFilterType(type);
                      setShowTypeFilter(false);
                    }}
                  >
                    {type === "all" && "Tất cả"}
                    {type === "post" && "Bài viết"}
                    {type === "comment" && "Bình luận"}
                    {type === "user" && "Người dùng"}
                  </button>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default SearchAndFilter;
