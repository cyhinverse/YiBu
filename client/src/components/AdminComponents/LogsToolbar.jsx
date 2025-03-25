import React from "react";
import {
  Search,
  Filter,
  RefreshCw,
  Calendar,
  Download,
  Server,
} from "lucide-react";
import { LOG_LEVELS, LOG_MODULES } from "./LogsConfig";

/**
 * Component thanh công cụ cho AdminLogs
 * @param {Object} props - Các props cho component
 */
const LogsToolbar = ({
  searchTerm,
  setSearchTerm,
  filterLevel,
  setFilterLevel,
  filterModule,
  setFilterModule,
  filterDateRange,
  setFilterDateRange,
  onRefresh,
  onExport,
  loading,
  hasData,
}) => {
  return (
    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
      <h2 className="text-2xl font-bold text-gray-800">Nhật ký hệ thống</h2>

      <div className="flex items-center gap-3 flex-wrap">
        {/* Tìm kiếm */}
        <div className="relative">
          <input
            type="text"
            placeholder="Tìm kiếm nhật ký..."
            className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
        </div>

        {/* Filter level */}
        <div className="relative inline-block text-left">
          <select
            className="appearance-none bg-white border border-gray-300 rounded-lg px-4 py-2 pr-10 focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-700"
            value={filterLevel}
            onChange={(e) => setFilterLevel(e.target.value)}
          >
            {LOG_LEVELS.map((level) => (
              <option key={level.value} value={level.value}>
                {level.label}
              </option>
            ))}
          </select>
          <Filter
            className="absolute right-3 top-2.5 text-gray-400 pointer-events-none"
            size={18}
          />
        </div>

        {/* Filter module */}
        <div className="relative inline-block text-left">
          <select
            className="appearance-none bg-white border border-gray-300 rounded-lg px-4 py-2 pr-10 focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-700"
            value={filterModule}
            onChange={(e) => setFilterModule(e.target.value)}
          >
            {LOG_MODULES.map((module) => (
              <option key={module.value} value={module.value}>
                {module.label}
              </option>
            ))}
          </select>
          <Server
            className="absolute right-3 top-2.5 text-gray-400 pointer-events-none"
            size={18}
          />
        </div>

        {/* Chọn khoảng thời gian */}
        <div className="flex items-center gap-2">
          <div className="relative">
            <input
              type="date"
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={filterDateRange.startDate}
              onChange={(e) =>
                setFilterDateRange({
                  ...filterDateRange,
                  startDate: e.target.value,
                })
              }
            />
            <Calendar
              className="absolute left-3 top-2.5 text-gray-400"
              size={18}
            />
          </div>
          <span className="text-gray-500">đến</span>
          <div className="relative">
            <input
              type="date"
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={filterDateRange.endDate}
              onChange={(e) =>
                setFilterDateRange({
                  ...filterDateRange,
                  endDate: e.target.value,
                })
              }
            />
            <Calendar
              className="absolute left-3 top-2.5 text-gray-400"
              size={18}
            />
          </div>
        </div>

        {/* Action buttons */}
        <button
          className="p-2 rounded-md bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-60 disabled:hover:bg-blue-600"
          onClick={onRefresh}
          disabled={loading}
          title="Làm mới dữ liệu"
        >
          <RefreshCw size={18} className={loading ? "animate-spin" : ""} />
        </button>
        <button
          className="p-2 rounded-md bg-green-600 text-white hover:bg-green-700 disabled:opacity-60 disabled:hover:bg-green-600"
          onClick={onExport}
          disabled={loading || !hasData}
          title="Xuất dữ liệu"
        >
          <Download size={18} />
        </button>
      </div>
    </div>
  );
};

export default LogsToolbar;
