import React, { useState } from "react";
import { XCircle, Loader } from "lucide-react";

const DismissReportModal = ({ report, onClose, onDismiss, loading }) => {
  const [reason, setReason] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    onDismiss(report?._id, reason);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
        <div className="p-6 border-b border-gray-200 flex justify-between items-center">
          <h3 className="text-lg font-semibold text-gray-800">
            Bỏ qua báo cáo
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
                Lý do bỏ qua (tùy chọn)
              </label>
              <textarea
                className="w-full rounded-md border border-gray-300 py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Nhập lý do bỏ qua báo cáo này..."
                rows={3}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
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
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 flex items-center disabled:bg-gray-100 disabled:text-gray-400"
              disabled={loading}
            >
              {loading ? (
                <Loader size={16} className="animate-spin mr-2" />
              ) : (
                <XCircle size={16} className="mr-2" />
              )}
              Bỏ qua báo cáo
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default DismissReportModal;
