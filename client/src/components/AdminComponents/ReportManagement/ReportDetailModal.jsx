import React from "react";
import {
  XCircle,
  User,
  Calendar,
  Eye,
  CheckCircle,
  FileText,
  MessageSquare,
} from "lucide-react";

const ReportDetailModal = ({
  report,
  onClose,
  onResolve,
  onDismiss,
  loading,
  formatDate,
  formatTime,
  getStatusBadgeColor,
  getTypeIcon,
  renderReportContent,
}) => {
  if (!report) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200 flex justify-between items-center">
          <h3 className="text-lg font-semibold text-gray-800">
            Chi tiết báo cáo
          </h3>
          <button
            className="text-gray-400 hover:text-gray-500"
            onClick={onClose}
          >
            <XCircle size={20} />
          </button>
        </div>
        <div className="p-6 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center mb-2 sm:mb-0">
              <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0 mr-3">
                {report?.reporter?.profile?.avatar ? (
                  <img
                    src={report.reporter.profile.avatar}
                    alt="Avatar"
                    className="h-10 w-10 rounded-full"
                  />
                ) : (
                  <User size={18} className="text-gray-500" />
                )}
              </div>
              <div>
                <div className="font-medium">
                  {report?.reporter?.name || "Unknown"}
                </div>
                <div className="text-sm text-gray-500">
                  {report?.reporter?.email || ""}
                </div>
              </div>
            </div>
            <div className="flex items-center">
              <Calendar size={16} className="mr-1 text-gray-500" />
              <span className="text-sm text-gray-500">
                {formatDate(report?.createdAt)}, {formatTime(report?.createdAt)}
              </span>
            </div>
          </div>

          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="flex items-center mb-2">
              {getTypeIcon(report?.reportType)}
              <span className="ml-2 font-medium text-gray-700 capitalize">
                Báo cáo {report?.reportType || ""}
              </span>
              <span
                className={`ml-auto px-2 py-1 text-xs font-semibold rounded-full ${getStatusBadgeColor(
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
            </div>
            <h4 className="font-medium text-gray-800 mb-2">Lý do báo cáo:</h4>
            <p className="text-gray-700 bg-white p-3 rounded border border-gray-200 mb-4">
              {report?.reason || ""}
            </p>

            {renderReportContent(report)}
          </div>

          {report?.actions && report.actions.length > 0 && (
            <div>
              <h4 className="font-medium text-gray-800 mb-2">Lịch sử xử lý:</h4>
              <div className="space-y-2">
                {report.actions.map((action, index) => (
                  <div
                    key={index}
                    className="bg-gray-50 p-3 rounded-lg flex items-start"
                  >
                    <div className="bg-blue-100 text-blue-700 p-1 rounded mr-3">
                      {action.type === "review" ? (
                        <Eye size={14} />
                      ) : action.type === "resolve" ? (
                        <CheckCircle size={14} />
                      ) : (
                        <XCircle size={14} />
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="text-sm">
                        <span className="font-medium">
                          {action.admin && typeof action.admin === "object"
                            ? action.admin.name
                            : "Admin"}
                        </span>
                        <span className="text-gray-500 ml-1">
                          {action.type === "review"
                            ? "đã xem xét"
                            : action.type === "resolve"
                            ? "đã giải quyết"
                            : "đã bỏ qua"}{" "}
                          báo cáo
                        </span>
                      </div>
                      {action.comment && (
                        <p className="text-xs text-gray-600 mt-1">
                          {action.comment}
                        </p>
                      )}
                    </div>
                    <div className="text-xs text-gray-500">
                      {formatDate(action.time)} {formatTime(action.time)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
        <div className="flex justify-end gap-2 p-6 border-t border-gray-200">
          {report?.status === "pending" && (
            <>
              <button
                className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700 flex items-center disabled:bg-green-300"
                onClick={() => onResolve(report._id)}
                disabled={loading}
              >
                <CheckCircle size={16} className="mr-2" />
                Giải quyết
              </button>
              <button
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 flex items-center disabled:bg-gray-100 disabled:text-gray-400"
                onClick={() => onDismiss(report._id)}
                disabled={loading}
              >
                <XCircle size={16} className="mr-2" />
                Bỏ qua
              </button>
            </>
          )}
          <button
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
            onClick={onClose}
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};

export default ReportDetailModal;
