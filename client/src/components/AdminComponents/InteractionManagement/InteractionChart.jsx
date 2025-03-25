import React from "react";

const InteractionChart = ({
  title,
  timeRange,
  data = [],
  chartType = "bar", // bar, line, pie, etc.
  labels = [],
}) => {
  // Xác định cách hiển thị dựa trên loại biểu đồ
  const renderChart = () => {
    if (chartType === "bar") {
      return (
        <div className="h-64 flex items-end space-x-2">
          {data.map((value, index) => (
            <div key={index} className="flex-1 flex flex-col items-center">
              <div
                className="w-full bg-blue-500 hover:bg-blue-600 rounded-t transition-all duration-200"
                style={{ height: `${value}%` }}
              ></div>
              <span className="text-xs text-gray-500 mt-1">
                {labels[index] || `T${index + 1}`}
              </span>
            </div>
          ))}
        </div>
      );
    } else if (chartType === "pie") {
      return (
        <div className="h-64 flex items-center justify-center">
          <div className="relative w-48 h-48">
            {/* Mô phỏng biểu đồ tròn với các phân đoạn */}
            <div
              className="absolute inset-0 rounded-full border-16 border-blue-500"
              style={{ clipPath: "polygon(0 0, 50% 0, 50% 50%, 0 50%)" }}
            ></div>
            <div
              className="absolute inset-0 rounded-full border-16 border-green-500"
              style={{ clipPath: "polygon(50% 0, 100% 0, 100% 50%, 50% 50%)" }}
            ></div>
            <div
              className="absolute inset-0 rounded-full border-16 border-purple-500"
              style={{ clipPath: "polygon(0 50%, 50% 50%, 50% 100%, 0 100%)" }}
            ></div>
            <div
              className="absolute inset-0 rounded-full border-16 border-red-500"
              style={{
                clipPath: "polygon(50% 50%, 100% 50%, 100% 100%, 50% 100%)",
              }}
            ></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="bg-white w-32 h-32 rounded-full flex items-center justify-center flex-col">
                <div className="text-lg font-bold text-gray-800">5.2</div>
                <div className="text-xs text-gray-500">avg</div>
              </div>
            </div>
          </div>
        </div>
      );
    }

    // Mặc định là biểu đồ thanh
    return (
      <div className="h-64 flex items-end space-x-2">
        {data.map((value, index) => (
          <div key={index} className="flex-1 flex flex-col items-center">
            <div
              className="w-full bg-blue-500 hover:bg-blue-600 rounded-t transition-all duration-200"
              style={{ height: `${value}%` }}
            ></div>
            <span className="text-xs text-gray-500 mt-1">
              {labels[index] || `T${index + 1}`}
            </span>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-semibold text-gray-800">{title}</h3>
        <div className="flex items-center text-sm text-gray-500">
          <span>
            Theo{" "}
            {timeRange === "day"
              ? "ngày"
              : timeRange === "week"
              ? "tuần"
              : "tháng"}
          </span>
        </div>
      </div>

      {renderChart()}
    </div>
  );
};

export default InteractionChart;
