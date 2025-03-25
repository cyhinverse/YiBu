import React, { useState, useEffect, useCallback } from "react";
import { Search, Filter, ChevronDown, SlidersHorizontal } from "lucide-react";

const UserFilters = ({
  searchTerm,
  handleSearch,
  filter,
  setFilter,
  usersPerPage,
  setUsersPerPage,
  sortBy,
  setSortBy,
  sortDirection,
  setSortDirection,
  showFilterDropdown,
  setShowFilterDropdown,
  showDisplayDropdown,
  setShowDisplayDropdown,
  showSortDropdown,
  setShowSortDropdown,
}) => {
  // State để debounce search input
  const [searchInput, setSearchInput] = useState(searchTerm);

  // Sử dụng useEffect để debounce search
  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      if (searchInput !== searchTerm) {
        handleSearch({ target: { value: searchInput } });
      }
    }, 500); // 500ms debounce

    return () => clearTimeout(debounceTimer);
  }, [searchInput, handleSearch, searchTerm]);

  // Khi searchTerm thay đổi từ bên ngoài
  useEffect(() => {
    setSearchInput(searchTerm);
  }, [searchTerm]);

  // Handler cho input change với debounce
  const handleInputChange = useCallback((e) => {
    setSearchInput(e.target.value);
  }, []);

  // Hàm đóng tất cả các dropdown
  const closeAllDropdowns = useCallback(() => {
    setShowFilterDropdown(false);
    setShowDisplayDropdown(false);
    setShowSortDropdown(false);
  }, [setShowFilterDropdown, setShowDisplayDropdown, setShowSortDropdown]);

  // Handlers cho từng dropdown
  const toggleFilterDropdown = useCallback(() => {
    setShowFilterDropdown((prev) => !prev);
    setShowDisplayDropdown(false);
    setShowSortDropdown(false);
  }, [setShowFilterDropdown, setShowDisplayDropdown, setShowSortDropdown]);

  const toggleSortDropdown = useCallback(() => {
    setShowSortDropdown((prev) => !prev);
    setShowFilterDropdown(false);
    setShowDisplayDropdown(false);
  }, [setShowSortDropdown, setShowFilterDropdown, setShowDisplayDropdown]);

  const toggleDisplayDropdown = useCallback(() => {
    setShowDisplayDropdown((prev) => !prev);
    setShowFilterDropdown(false);
    setShowSortDropdown(false);
  }, [setShowDisplayDropdown, setShowFilterDropdown, setShowSortDropdown]);

  // Handlers cho filter options
  const handleFilterChange = useCallback(
    (newFilter) => {
      setFilter(newFilter);
      closeAllDropdowns();
    },
    [setFilter, closeAllDropdowns]
  );

  // Handlers cho sort options
  const handleSortByChange = useCallback(
    (field) => {
      setSortBy(field);
      closeAllDropdowns();
    },
    [setSortBy, closeAllDropdowns]
  );

  const handleSortDirectionChange = useCallback(() => {
    setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
    closeAllDropdowns();
  }, [setSortDirection, closeAllDropdowns]);

  return (
    <div className="p-4 border-b">
      <div className="flex flex-wrap gap-4">
        <div className="flex-1 min-w-[280px]">
          <div className="relative">
            <input
              type="text"
              placeholder="Tìm kiếm người dùng..."
              value={searchInput}
              onChange={handleInputChange}
              className="w-full pl-10 pr-4 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500"
            />
            <Search
              size={18}
              className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
            />
            {searchInput && (
              <button
                onClick={() => {
                  setSearchInput("");
                  handleSearch({ target: { value: "" } });
                }}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                ×
              </button>
            )}
          </div>
        </div>
        <div className="dropdown-container relative">
          <button
            onClick={toggleFilterDropdown}
            className="flex items-center px-4 py-2 bg-gray-100 border rounded-md hover:bg-gray-200"
          >
            <Filter size={16} className="mr-2" />
            {filter === "all"
              ? "Tất cả người dùng"
              : filter === "active"
              ? "Người dùng hoạt động"
              : "Người dùng bị cấm"}
            <ChevronDown size={16} className="ml-2" />
          </button>
          {showFilterDropdown && (
            <div className="absolute mt-2 w-48 bg-white rounded-md shadow-lg z-10 border">
              <ul className="py-1">
                <li
                  className={`px-4 py-2 hover:bg-gray-100 cursor-pointer ${
                    filter === "all" ? "bg-gray-100" : ""
                  }`}
                  onClick={() => handleFilterChange("all")}
                >
                  Tất cả người dùng
                </li>
                <li
                  className={`px-4 py-2 hover:bg-gray-100 cursor-pointer ${
                    filter === "active" ? "bg-gray-100" : ""
                  }`}
                  onClick={() => handleFilterChange("active")}
                >
                  Người dùng hoạt động
                </li>
                <li
                  className={`px-4 py-2 hover:bg-gray-100 cursor-pointer ${
                    filter === "banned" ? "bg-gray-100" : ""
                  }`}
                  onClick={() => handleFilterChange("banned")}
                >
                  Người dùng bị cấm
                </li>
              </ul>
            </div>
          )}
        </div>
        <div className="dropdown-container relative">
          <button
            onClick={toggleSortDropdown}
            className="flex items-center px-4 py-2 bg-gray-100 border rounded-md hover:bg-gray-200"
          >
            Sắp xếp
            <ChevronDown size={16} className="ml-2" />
          </button>
          {showSortDropdown && (
            <div className="absolute mt-2 w-48 bg-white rounded-md shadow-lg z-10 border">
              <ul className="py-1">
                <li
                  className={`px-4 py-2 hover:bg-gray-100 cursor-pointer ${
                    sortBy === "createdAt" ? "bg-gray-100" : ""
                  }`}
                  onClick={() => handleSortByChange("createdAt")}
                >
                  Ngày tạo
                </li>
                <li
                  className={`px-4 py-2 hover:bg-gray-100 cursor-pointer ${
                    sortBy === "username" ? "bg-gray-100" : ""
                  }`}
                  onClick={() => handleSortByChange("username")}
                >
                  Tên người dùng
                </li>
                <li
                  className={`px-4 py-2 hover:bg-gray-100 cursor-pointer ${
                    sortBy === "email" ? "bg-gray-100" : ""
                  }`}
                  onClick={() => handleSortByChange("email")}
                >
                  Email
                </li>
                <li
                  className={`px-4 py-2 border-t`}
                  onClick={handleSortDirectionChange}
                >
                  {sortDirection === "asc"
                    ? "Sắp xếp giảm dần ↓"
                    : "Sắp xếp tăng dần ↑"}
                </li>
              </ul>
            </div>
          )}
        </div>
        <div className="dropdown-container relative">
          <button
            onClick={toggleDisplayDropdown}
            className="flex items-center px-4 py-2 bg-gray-100 border rounded-md hover:bg-gray-200"
          >
            <SlidersHorizontal size={16} className="mr-2" />
            Hiển thị
            <ChevronDown size={16} className="ml-2" />
          </button>
          {showDisplayDropdown && (
            <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg z-10 border">
              <div className="p-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Số người dùng mỗi trang:
                </label>
                <select
                  value={usersPerPage}
                  onChange={(e) => {
                    setUsersPerPage(Number(e.target.value));
                    closeAllDropdowns();
                  }}
                  className="w-full p-2 border rounded-md"
                >
                  <option value={5}>5</option>
                  <option value={10}>10</option>
                  <option value={20}>20</option>
                  <option value={50}>50</option>
                </select>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default React.memo(UserFilters);
