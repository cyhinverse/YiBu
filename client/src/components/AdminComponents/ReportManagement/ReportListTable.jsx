import React from "react";
import { Eye, CheckCircle, XCircle, User } from "lucide-react";

const ReportListTable = ({
  reports = [],
  getTypeIcon,
  getStatusBadgeColor,
  formatDate,
  formatTime,
  onViewReport,
  onResolveReport,
  onDismissReport,
  processingAction,
}) => {
  if (!reports || reports.length === 0) {
    return (
      <div className="p-10 text-center">
        <p className="text-gray-500">
          Không có báo cáo nào phù hợp với bộ lọc hiện tại.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th
              scope="col"
              className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
            >
              Loại
            </th>
            <th
              scope="col"
              className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
            >
              Nội dung báo cáo
            </th>
            <th
              scope="col"
              className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
            >
              Người báo cáo
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
              Trạng thái
            </th>
            <th
              scope="col"
              className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider"
            >
              Thao tác
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {reports.map((report) => (
            <tr
              key={report?._id || Math.random().toString()}
              className={
                report?.status === "pending"
                  ? "bg-yellow-50 hover:bg-yellow-100"
                  : "hover:bg-gray-50"
              }
            >
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="flex items-center">
                  {getTypeIcon(report?.reportType)}
                  <span className="ml-2 text-sm font-medium text-gray-900 capitalize">
                    {report?.reportType}
                  </span>
                </div>
              </td>
              <td className="px-6 py-4">
                <div className="text-sm text-gray-900 line-clamp-2">
                  <span className="font-medium">Lý do:</span> {report?.reason}
                </div>
                {report?.content && (
                  <div className="text-sm text-gray-500 line-clamp-1 mt-1">
                    "{report.content}"
                  </div>
                )}
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="flex items-center">
                  <div className="h-7 w-7 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0 mr-2">
                    {report?.reporter?.profile?.avatar ? (
                      <img
                        src={report.reporter.profile.avatar}
                        alt="Avatar"
                        className="h-7 w-7 rounded-full"
                      />
                    ) : (
                      <User size={14} className="text-gray-500" />
                    )}
                  </div>
                  <div>
                    <div className="text-sm font-medium text-gray-900">
                      {report?.reporter?.name || "Unknown"}
                    </div>
                    <div className="text-xs text-gray-500">
                      {report?.reporter?.email || ""}
                    </div>
                  </div>
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm text-gray-900">
                  {formatDate(report?.createdAt)}
                </div>
                <div className="text-xs text-gray-500">
                  {formatTime(report?.createdAt)}
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <span
                  className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadgeColor(
                    report?.status || ""
                  )}`}
                >
                  {report?.status === "pending"
                    ? "Đang chờ xử lý"
                    : report?.status === "resolved"
                    ? "Đã giải quyết"
                    : report?.status === "dismissed"
                    ? "Đã bỏ qua"
                    : "Chuyển cấp"}
                </span>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                <button
                  onClick={() => onViewReport(report._id)}
                  className="text-blue-600 hover:text-blue-900 mr-3"
                  title="Xem chi tiết"
                >
                  <Eye size={18} />
                </button>
                {report?.status === "pending" && (
                  <>
                    <button
                      onClick={() => onResolveReport(report._id)}
                      className="text-green-600 hover:text-green-900 mr-3"
                      disabled={processingAction}
                      title="Giải quyết"
                    >
                      <CheckCircle size={18} />
                    </button>
                    <button
                      onClick={() => onDismissReport(report._id)}
                      className="text-gray-600 hover:text-gray-900"
                      disabled={processingAction}
                      title="Bỏ qua"
                    >
                      <XCircle size={18} />
                    </button>
                  </>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default ReportListTable;
