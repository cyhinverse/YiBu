import React from "react";
import { Eye } from "lucide-react";
import {
  LogTableHeader,
  LoadingState,
  EmptyState,
  LevelBadge,
  ModuleIcon,
  UserInfo,
  FormattedTime,
} from "./LogsComponents";
import Pagination from "../Common/Pagination";

/**
 * Component hiển thị bảng dữ liệu log
 * @param {Object} props - Các props cho component
 */
const LogsTable = ({
  logs,
  loading,
  currentPage,
  totalPages,
  onPageChange,
  onViewDetails,
  formatDate,
}) => {
  const hasData = logs && logs.length > 0;

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <LogTableHeader />
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {loading ? (
              <LoadingState />
            ) : !hasData ? (
              <EmptyState />
            ) : (
              logs.map((log) => (
                <tr key={log._id} className="hover:bg-gray-50">
                  {/* Mức độ */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <LevelBadge level={log.level} />
                    </div>
                  </td>

                  {/* Module */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <ModuleIcon module={log.module} />
                      <span className="ml-1 capitalize">{log.module}</span>
                    </div>
                  </td>

                  {/* Hành động */}
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {log.action}
                  </td>

                  {/* Chi tiết */}
                  <td className="px-6 py-4 text-sm text-gray-500 max-w-md truncate">
                    {log.details}
                  </td>

                  {/* Người dùng */}
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <UserInfo user={log.user} />
                  </td>

                  {/* Thời gian */}
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <FormattedTime
                      dateString={log.createdAt}
                      formatDate={formatDate}
                    />
                  </td>

                  {/* IP */}
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {log.ip || "N/A"}
                  </td>

                  {/* Nút xem chi tiết */}
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      onClick={() => onViewDetails(log)}
                      className="text-blue-600 hover:text-blue-900 flex items-center"
                      title="Xem chi tiết"
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      <span>Chi tiết</span>
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Phân trang */}
      {hasData && (
        <div className="bg-white px-4 py-3 border-t border-gray-200 sm:px-6">
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={onPageChange}
          />
        </div>
      )}
    </div>
  );
};

export default LogsTable;
