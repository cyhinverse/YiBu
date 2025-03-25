import React, { useState } from "react";
import { XCircle, CheckCircle, Loader } from "lucide-react";

const ResolveReportModal = ({ report, onClose, onResolve, loading }) => {
  const [notes, setNotes] = useState("");
  const [action, setAction] = useState("no_action");

  const getActionsBasedOnType = () => {
    const reportType = report?.reportType || "";
    switch (reportType) {
      case "post":
        return [
          { value: "remove_post", label: "Xóa bài viết" },
          { value: "warn_user", label: "Cảnh báo người đăng" },
          { value: "no_action", label: "Chỉ đánh dấu đã giải quyết" },
        ];
      case "comment":
        return [
          { value: "remove_comment", label: "Xóa bình luận" },
          { value: "warn_user", label: "Cảnh báo người bình luận" },
          { value: "no_action", label: "Chỉ đánh dấu đã giải quyết" },
        ];
      case "user":
        return [
          { value: "ban_user", label: "Khóa tài khoản" },
          { value: "warn_user", label: "Cảnh báo người dùng" },
          { value: "no_action", label: "Chỉ đánh dấu đã giải quyết" },
        ];
      default:
        return [{ value: "no_action", label: "Chỉ đánh dấu đã giải quyết" }];
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onResolve(report?._id, action, notes);
  };

  const actions = getActionsBasedOnType();

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
        <div className="p-6 border-b border-gray-200 flex justify-between items-center">
          <h3 className="text-lg font-semibold text-gray-800">
            Giải quyết báo cáo
          </h3>
          <button
            className="text-gray-400 hover:text-gray-500"
            onClick={onClose}
          >
            <XCircle size={20} />
          </button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="p-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Hành động
              </label>
              <select
                className="w-full rounded-md border border-gray-300 py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={action}
                onChange={(e) => setAction(e.target.value)}
                required
              >
                {actions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Ghi chú (tùy chọn)
              </label>
              <textarea
                className="w-full rounded-md border border-gray-300 py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Thêm ghi chú cho hành động này..."
                rows={3}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 p-6 border-t border-gray-200">
            <button
              type="button"
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
              onClick={onClose}
            >
              Hủy
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700 flex items-center disabled:bg-green-300"
              disabled={loading}
            >
              {loading ? (
                <Loader size={16} className="animate-spin mr-2" />
              ) : (
                <CheckCircle size={16} className="mr-2" />
              )}
              Giải quyết
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ResolveReportModal;
