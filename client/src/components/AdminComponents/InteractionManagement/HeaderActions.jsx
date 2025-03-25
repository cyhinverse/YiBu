import React from "react";
import { RefreshCw, Download, Filter } from "lucide-react";

const HeaderActions = ({ timeRange, setTimeRange, onRefresh, onExport }) => {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <div className="inline-flex rounded-md shadow-sm">
        {["day", "week", "month"].map((range) => (
          <button
            key={range}
            type="button"
            className={`px-4 py-2 text-sm font-medium ${
              timeRange === range
                ? "bg-blue-600 text-white"
                : "bg-white text-gray-700 hover:bg-gray-50"
            } ${
              range === "day"
                ? "rounded-l-md"
                : range === "month"
                ? "rounded-r-md"
                : ""
            } border border-gray-300`}
            onClick={() => setTimeRange(range)}
          >
            {range === "day" ? "Ngày" : range === "week" ? "Tuần" : "Tháng"}
          </button>
        ))}
      </div>

      <button
        className="p-2 rounded-md bg-white border border-gray-300 text-gray-700 hover:bg-gray-50"
        onClick={onExport}
        title="Xuất dữ liệu"
      >
        <Download size={18} />
      </button>

      <button
        className="p-2 rounded-md bg-blue-600 text-white hover:bg-blue-700"
        onClick={onRefresh}
        title="Làm mới dữ liệu"
      >
        <RefreshCw size={18} />
      </button>
    </div>
  );
};

export default HeaderActions;
