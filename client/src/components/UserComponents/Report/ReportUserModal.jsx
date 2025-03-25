import React, { useState } from "react";
import { X, AlertTriangle, User } from "lucide-react";
import reportService from "../../../services/reportService";
import { toast } from "react-hot-toast";

const reportReasons = [
  {
    id: "fake_account",
    label: "Tài khoản giả mạo",
    description: "Người dùng này đang giả mạo ai đó hoặc một tổ chức",
  },
  {
    id: "harassment",
    label: "Quấy rối hoặc bắt nạt",
    description:
      "Người dùng này có hành vi quấy rối, đe dọa hoặc bắt nạt người khác",
  },
  {
    id: "spam",
    label: "Spam hoặc quảng cáo trái phép",
    description: "Người dùng này đăng spam hoặc quảng cáo không được phép",
  },
  {
    id: "inappropriate_content",
    label: "Nội dung không phù hợp",
    description:
      "Người dùng này thường xuyên đăng nội dung đồi trụy, bạo lực hoặc phản cảm",
  },
  {
    id: "hate_speech",
    label: "Phát ngôn thù ghét",
    description: "Người dùng này đăng nội dung phân biệt hoặc thù ghét",
  },
  {
    id: "other",
    label: "Lý do khác",
    description: "Các vi phạm khác không thuộc các danh mục trên",
  },
];

const ReportUserModal = ({ isOpen, onClose, user }) => {
  const [selectedReason, setSelectedReason] = useState("");
  const [customReason, setCustomReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleReasonSelect = (reasonId) => {
    setSelectedReason(reasonId);
  };

  const handleSubmit = async () => {
    if (!selectedReason) return;

    setIsSubmitting(true);

    try {
      const reportData = {
        type: "user",
        targetId: user._id,
        reason: selectedReason,
        additionalInfo: selectedReason === "other" ? customReason : "",
        content: user.name,
      };

      await reportService.createReport(reportData);
      toast.success("Báo cáo đã được gửi thành công");
      onClose();
    } catch (error) {
      console.error("Error submitting report:", error);
      toast.error("Không thể gửi báo cáo. Vui lòng thử lại sau.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4 animate-fadeIn">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">
            Báo cáo người dùng
          </h3>
          <button
            className="text-gray-400 hover:text-gray-500 focus:outline-none"
            onClick={onClose}
          >
            <X size={20} />
          </button>
        </div>

        <div className="px-6 py-4">
          <div className="flex items-start mb-4 p-3 bg-gray-50 rounded-lg">
            <AlertTriangle
              size={20}
              className="text-amber-500 mt-0.5 mr-3 flex-shrink-0"
            />
            <div>
              <p className="text-sm text-gray-700">
                Vui lòng chọn lý do báo cáo người dùng này. Báo cáo của bạn sẽ
                được gửi đến đội ngũ quản trị viên để xem xét.
              </p>
            </div>
          </div>

          <div className="mb-4">
            <h4 className="text-sm font-medium text-gray-900 mb-2">
              Thông tin người dùng:
            </h4>
            <div className="flex items-center p-3 bg-gray-50 rounded-lg border border-gray-200">
              <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0 mr-3 overflow-hidden">
                {user?.profile?.avatar ? (
                  <img
                    src={user.profile.avatar}
                    alt={user.name}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <User size={20} className="text-gray-500" />
                )}
              </div>
              <div>
                <p className="font-medium text-gray-900">{user?.name}</p>
                <p className="text-xs text-gray-500">{user?.email}</p>
              </div>
            </div>
          </div>

          <div className="space-y-3 mb-4">
            <h4 className="text-sm font-medium text-gray-900">
              Lý do báo cáo:
            </h4>
            {reportReasons.map((reason) => (
              <label
                key={reason.id}
                className={`flex items-start p-3 border rounded-lg cursor-pointer transition-colors ${
                  selectedReason === reason.id
                    ? "border-purple-500 bg-purple-50"
                    : "border-gray-200 hover:bg-gray-50"
                }`}
              >
                <input
                  type="radio"
                  name="reportReason"
                  value={reason.id}
                  checked={selectedReason === reason.id}
                  onChange={() => handleReasonSelect(reason.id)}
                  className="mt-1 mr-3"
                />
                <div>
                  <p className="font-medium text-gray-900">{reason.label}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    {reason.description}
                  </p>
                </div>
              </label>
            ))}
          </div>

          {selectedReason === "other" && (
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Vui lòng mô tả chi tiết:
              </label>
              <textarea
                value={customReason}
                onChange={(e) => setCustomReason(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-purple-500 focus:border-purple-500"
                rows={3}
                placeholder="Mô tả lý do báo cáo..."
              />
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2 px-6 py-4 border-t border-gray-200">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 focus:outline-none"
            disabled={isSubmitting}
          >
            Hủy
          </button>
          <button
            onClick={handleSubmit}
            className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 focus:outline-none disabled:bg-red-300 disabled:cursor-not-allowed"
            disabled={
              !selectedReason ||
              (selectedReason === "other" && !customReason) ||
              isSubmitting
            }
          >
            {isSubmitting ? "Đang gửi..." : "Gửi báo cáo"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ReportUserModal;
