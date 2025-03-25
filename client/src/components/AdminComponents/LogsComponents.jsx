import React from "react";
import {
  AlertTriangle,
  Info,
  AlertCircle,
  X,
  Clock,
  Activity,
  User,
  Server,
  FileText,
} from "lucide-react";
import { getLevelBadgeColor } from "./LogsConfig";

// Component hiển thị icon level
export const LevelIcon = ({ level }) => {
  switch (level) {
    case "error":
      return <AlertCircle className="h-4 w-4 text-red-600" />;
    case "warning":
      return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
    case "critical":
      return <X className="h-4 w-4 text-purple-600" />;
    default:
      return <Info className="h-4 w-4 text-blue-600" />;
  }
};

// Component hiển thị icon module
export const ModuleIcon = ({ module }) => {
  switch (module) {
    case "user":
      return <User className="h-4 w-4" />;
    case "auth":
      return <User className="h-4 w-4" />;
    case "post":
      return <FileText className="h-4 w-4" />;
    case "comment":
      return <FileText className="h-4 w-4" />;
    case "admin":
      return <Activity className="h-4 w-4" />;
    default:
      return <Server className="h-4 w-4" />;
  }
};

// Component badge level
export const LevelBadge = ({ level }) => (
  <span
    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getLevelBadgeColor(
      level
    )}`}
  >
    <LevelIcon level={level} />
    <span className="ml-1 capitalize">{level}</span>
  </span>
);

// Component hiển thị thông tin người dùng
export const UserInfo = ({ user }) => {
  if (!user) {
    return <span className="text-gray-400">Hệ thống</span>;
  }

  return (
    <div className="flex items-center">
      {user.avatar ? (
        <img
          src={user.avatar}
          alt={user.username}
          className="h-6 w-6 rounded-full mr-2"
        />
      ) : (
        <User className="h-5 w-5 text-gray-400 mr-2" />
      )}
      {user.username}
    </div>
  );
};

// Component hiển thị thời gian đã định dạng
export const FormattedTime = ({ dateString, formatDate }) => (
  <div className="flex items-center">
    <Clock className="h-4 w-4 text-gray-400 mr-1" />
    {formatDate(dateString)}
  </div>
);

// Component hiển thị khi đang tải
export const LoadingState = () => (
  <tr>
    <td colSpan="8" className="px-6 py-4 text-center">
      <div className="flex justify-center items-center space-x-2">
        <div className="animate-spin h-5 w-5 border-2 border-blue-500 rounded-full border-t-transparent"></div>
        <span>Đang tải dữ liệu...</span>
      </div>
    </td>
  </tr>
);

// Component hiển thị khi không có dữ liệu
export const EmptyState = () => (
  <tr>
    <td colSpan="8" className="px-6 py-4 text-center text-gray-500">
      Không có dữ liệu log phù hợp với bộ lọc
    </td>
  </tr>
);

// Component hiển thị thông báo lỗi
export const ErrorMessage = ({ message }) => (
  <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative">
    <span className="block sm:inline">{message}</span>
  </div>
);

// Header cột cho bảng log
export const LogTableHeader = () => (
  <tr>
    <th
      scope="col"
      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
    >
      Mức độ
    </th>
    <th
      scope="col"
      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
    >
      Module
    </th>
    <th
      scope="col"
      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
    >
      Hành động
    </th>
    <th
      scope="col"
      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
    >
      Chi tiết
    </th>
    <th
      scope="col"
      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
    >
      Người dùng
    </th>
    <th
      scope="col"
      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
    >
      Thời gian
    </th>
    <th
      scope="col"
      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
    >
      IP
    </th>
    <th scope="col" className="relative px-6 py-3">
      <span className="sr-only">Chi tiết</span>
    </th>
  </tr>
);
