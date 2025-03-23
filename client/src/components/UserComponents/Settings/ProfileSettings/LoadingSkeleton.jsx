import React from "react";

// Component hiển thị skeleton khi đang tải dữ liệu
const LoadingSkeleton = () => (
  <div className="w-full max-w-2xl mx-auto p-8 space-y-10 bg-neutral-50 border border-neutral-200 rounded-xl animate-pulse">
    <div className="h-8 bg-gray-200 rounded w-1/3 mb-8"></div>

    <div className="space-y-4">
      <div className="h-6 bg-gray-200 rounded w-1/4"></div>
      <div className="h-10 bg-gray-200 rounded w-full"></div>
    </div>

    <div className="space-y-4">
      <div className="h-6 bg-gray-200 rounded w-1/4"></div>
      <div className="h-24 bg-gray-200 rounded w-full"></div>
    </div>

    <div className="space-y-4">
      <div className="h-6 bg-gray-200 rounded w-1/4"></div>
      <div className="h-10 bg-gray-200 rounded w-full"></div>
    </div>
  </div>
);

export default LoadingSkeleton;
