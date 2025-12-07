import React, { useState } from "react";
import { X, AlertTriangle } from "lucide-react";

const reportReasons = [
  {
    id: "spam",
    label: "Spam hoặc quảng cáo trái phép",
    description:
      "Bình luận chứa nội dung quảng cáo, liên kết không liên quan hoặc được đăng nhiều lần",
  },
  {
    id: "harassment",
    label: "Quấy rối hoặc bắt nạt",
    description:
      "Bình luận có nội dung mang tính chất quấy rối, đe dọa hoặc bắt nạt người dùng khác",
  },
  {
    id: "hate_speech",
    label: "Phát ngôn thù ghét",
    description:
      "Bình luận chứa ngôn từ thù ghét, phân biệt chủng tộc, tôn giáo hoặc nhóm xã hội",
  },
  {
    id: "violent",
    label: "Bạo lực hoặc nội dung nguy hiểm",
    description:
      "Bình luận kêu gọi hoặc cổ súy bạo lực, tự tử hoặc gây hại cho người khác",
  },
  {
    id: "personal_info",
    label: "Tiết lộ thông tin cá nhân",
    description:
      "Bình luận chia sẻ thông tin cá nhân của người khác mà không được phép",
  },
  {
    id: "other",
    label: "Lý do khác",
    description: "Các vi phạm khác không thuộc các danh mục trên",
  },
];

const ReportCommentModal = ({ isOpen, onClose, comment, onSubmitReport }) => {
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
        type: "comment",
        targetId: comment._id,
        reason: selectedReason,
        additionalInfo: selectedReason === "other" ? customReason : "",
        content: comment.content,
      };

      await onSubmitReport(reportData);
      onClose();
    } catch (error) {
      console.error("Error submitting report:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4 animate-fadeIn">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">
            Báo cáo bình luận
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
                Vui lòng chọn lý do báo cáo bình luận này. Báo cáo của bạn sẽ
                được gửi đến đội ngũ quản trị viên để xem xét.
              </p>
            </div>
          </div>

          <div className="mb-4">
            <h4 className="text-sm font-medium text-gray-900 mb-2">
              Nội dung bình luận:
            </h4>
            <div className="p-3 bg-gray-50 rounded-lg text-gray-700 text-sm border border-gray-200">
              {comment?.content || ""}
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

export default ReportCommentModal;
