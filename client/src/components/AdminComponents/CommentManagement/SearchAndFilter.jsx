import React, { useState } from "react";
import { Search, Filter, ChevronDown } from "lucide-react";

const SearchAndFilter = ({
  searchTerm,
  setSearchTerm,
  filterType,
  setFilterType,
  handleSearch,
}) => {
  const [showFilterMenu, setShowFilterMenu] = useState(false);

  const handleFilterChange = (newFilterType) => {
    setFilterType(newFilterType);
    setShowFilterMenu(false);
  };

  return (
    <div className="mb-6 flex flex-col sm:flex-row gap-3">
      <div className="relative flex-1">
        <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
          <Search size={18} className="text-gray-400" />
        </div>
        <input
          type="text"
          placeholder="Tìm kiếm theo nội dung, người dùng..."
          className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg w-full focus:ring-blue-500 focus:border-blue-500"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          onKeyDown={handleSearch}
        />
      </div>

      <div className="relative">
        <button
          className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg shadow-sm hover:bg-gray-50"
          onClick={() => setShowFilterMenu(!showFilterMenu)}
        >
          <Filter size={16} />
          <span>
            {filterType === "all" && "Tất cả bình luận"}
            {filterType === "reported" && "Đã bị báo cáo"}
            {filterType === "recent" && "Mới nhất"}
          </span>
          <ChevronDown
            size={16}
            className={`transition-transform duration-200 ${
              showFilterMenu ? "rotate-180" : ""
            }`}
          />
        </button>

        {showFilterMenu && (
          <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg z-10 border border-gray-200">
            <div className="py-1">
              <button
                className={`flex w-full items-center px-4 py-2 text-sm ${
                  filterType === "all"
                    ? "bg-blue-50 text-blue-700"
                    : "text-gray-700 hover:bg-gray-100"
                }`}
                onClick={() => handleFilterChange("all")}
              >
                Tất cả bình luận
              </button>
              <button
                className={`flex w-full items-center px-4 py-2 text-sm ${
                  filterType === "reported"
                    ? "bg-blue-50 text-blue-700"
                    : "text-gray-700 hover:bg-gray-100"
                }`}
                onClick={() => handleFilterChange("reported")}
              >
                Đã bị báo cáo
              </button>
              <button
                className={`flex w-full items-center px-4 py-2 text-sm ${
                  filterType === "recent"
                    ? "bg-blue-50 text-blue-700"
                    : "text-gray-700 hover:bg-gray-100"
                }`}
                onClick={() => handleFilterChange("recent")}
              >
                Mới nhất
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SearchAndFilter;
