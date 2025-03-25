import React from "react";
import { Link } from "react-router-dom";
import { ShieldAlert, Home, ArrowLeft } from "lucide-react";

const AccessDenied = () => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 px-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
        <div className="flex justify-center mb-6">
          <ShieldAlert size={80} className="text-red-500" />
        </div>

        <h1 className="text-3xl font-bold text-gray-800 mb-4">
          Truy cập bị từ chối
        </h1>

        <p className="text-gray-600 mb-8">
          Bạn không có quyền truy cập vào trang quản trị. Chỉ tài khoản có quyền
          admin mới có thể truy cập vào khu vực này.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            to="/"
            className="flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            <Home size={18} />
            <span>Về trang chủ</span>
          </Link>

          <button
            onClick={() => window.history.back()}
            className="flex items-center justify-center gap-2 px-6 py-3 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors"
          >
            <ArrowLeft size={18} />
            <span>Quay lại</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default AccessDenied;
