import React from "react";
import { Search, Filter } from "lucide-react";

const SearchAndFilter = ({
  searchTerm,
  setSearchTerm,
  filterType,
  setFilterType,
  interactionTypes,
}) => {
  return (
    <div className="flex flex-col md:flex-row gap-3 w-full">
      <div className="relative flex-1">
        <input
          type="text"
          placeholder="Tìm kiếm tương tác, người dùng..."
          className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
      </div>

      <div className="flex gap-2">
        <div className="relative inline-block text-left">
          <select
            className="appearance-none bg-white border border-gray-300 rounded-lg px-4 py-2 pr-10 focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-700"
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
          >
            <option value="all">Tất cả tương tác</option>
            {interactionTypes &&
              interactionTypes.map((type) => (
                <option key={type.id} value={type.value}>
                  {type.label}
                </option>
              ))}
          </select>
          <Filter
            className="absolute right-3 top-2.5 text-gray-400 pointer-events-none"
            size={18}
          />
        </div>
      </div>
    </div>
  );
};

export default SearchAndFilter;
