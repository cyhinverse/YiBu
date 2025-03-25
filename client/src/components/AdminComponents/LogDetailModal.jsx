import React from "react";
import { X, Clock, User } from "lucide-react";
import { LevelBadge, ModuleIcon } from "./LogsComponents";
import { formatDate } from "./LogsUtils";

/**
 * Modal hiển thị chi tiết log
 * @param {Object} log - Đối tượng log cần hiển thị chi tiết
 * @param {Function} onClose - Hàm để đóng modal
 */
const LogDetailModal = ({ log, onClose }) => {
  if (!log) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl">
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-bold text-gray-900">
              Chi tiết nhật ký
            </h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-500"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
            <div className="space-y-2">
              <div>
                <span className="text-sm font-medium text-gray-500">
                  Hành động:
                </span>
                <p className="text-lg font-medium">{log.action}</p>
              </div>
              <div>
                <span className="text-sm font-medium text-gray-500">
                  Mức độ:
                </span>
                <p>
                  <LevelBadge level={log.level} />
                </p>
              </div>
              <div>
                <span className="text-sm font-medium text-gray-500">
                  Module:
                </span>
                <p className="capitalize flex items-center">
                  <ModuleIcon module={log.module} />
                  <span className="ml-1">{log.module}</span>
                </p>
              </div>
              <div>
                <span className="text-sm font-medium text-gray-500">
                  Thời gian:
                </span>
                <p className="flex items-center">
                  <Clock className="h-4 w-4 text-gray-400 mr-1" />
                  {formatDate(log.createdAt)}
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <div>
                <span className="text-sm font-medium text-gray-500">
                  Người dùng:
                </span>
                <p>
                  {log.user ? (
                    <div className="flex items-center">
                      {log.user.avatar ? (
                        <img
                          src={log.user.avatar}
                          alt={log.user.username}
                          className="h-6 w-6 rounded-full mr-2"
                        />
                      ) : (
                        <User className="h-5 w-5 text-gray-400 mr-2" />
                      )}
                      {log.user.username}
                    </div>
                  ) : (
                    <span className="text-gray-400">Hệ thống</span>
                  )}
                </p>
              </div>
              <div>
                <span className="text-sm font-medium text-gray-500">IP:</span>
                <p>{log.ip || "N/A"}</p>
              </div>
              <div>
                <span className="text-sm font-medium text-gray-500">
                  User Agent:
                </span>
                <p className="text-sm text-gray-500 truncate">
                  {log.userAgent || "N/A"}
                </p>
              </div>
              <div>
                <span className="text-sm font-medium text-gray-500">ID:</span>
                <p className="text-sm text-gray-500">{log._id}</p>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <span className="text-sm font-medium text-gray-500">Chi tiết:</span>
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-gray-700 whitespace-pre-wrap">{log.details}</p>
            </div>
          </div>

          {log.metadata && (
            <div className="mt-4 space-y-2">
              <span className="text-sm font-medium text-gray-500">
                Metadata:
              </span>
              <div className="bg-gray-50 p-4 rounded-lg overflow-auto max-h-40">
                <pre className="text-xs text-gray-700">
                  {JSON.stringify(log.metadata, null, 2)}
                </pre>
              </div>
            </div>
          )}

          <div className="mt-6 flex justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300"
            >
              Đóng
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LogDetailModal;
