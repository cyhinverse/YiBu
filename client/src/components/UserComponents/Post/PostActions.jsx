import React, { useState } from "react";
import {
  Heart,
  MessageSquare,
  Share2,
  Flag,
  MoreHorizontal,
  X,
} from "lucide-react";
import { toast } from "react-hot-toast";
import reportService from "../../../services/reportService";

const reportReasons = [
  {
    id: "spam",
    label: "Spam hoặc quảng cáo trái phép",
    description:
      "Bài viết chứa nội dung quảng cáo, liên kết không liên quan hoặc được đăng nhiều lần",
  },
  {
    id: "inappropriate",
    label: "Nội dung không phù hợp",
    description: "Bài viết có nội dung người lớn, khỏa thân hoặc gây khó chịu",
  },
  {
    id: "hate_speech",
    label: "Phát ngôn thù ghét",
    description:
      "Bài viết chứa ngôn từ thù ghét, phân biệt chủng tộc, tôn giáo hoặc nhóm xã hội",
  },
  {
    id: "violent",
    label: "Bạo lực hoặc nội dung nguy hiểm",
    description:
      "Bài viết kêu gọi hoặc cổ súy bạo lực, tự tử hoặc gây hại cho người khác",
  },
  {
    id: "false_info",
    label: "Thông tin sai sự thật",
    description:
      "Bài viết chia sẻ thông tin sai lệch có thể gây hại hoặc hiểu nhầm",
  },
  {
    id: "other",
    label: "Lý do khác",
    description: "Các vi phạm khác không thuộc các danh mục trên",
  },
];

const ReportModal = ({ isOpen, onClose, post, onSubmitReport }) => {
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
        type: "post",
        targetId: post._id,
        reason: selectedReason,
        additionalInfo: selectedReason === "other" ? customReason : "",
        content: post.caption,
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
            Báo cáo bài viết
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
            <Flag
              size={20}
              className="text-amber-500 mt-0.5 mr-3 flex-shrink-0"
            />
            <div>
              <p className="text-sm text-gray-700">
                Vui lòng chọn lý do báo cáo bài viết này. Báo cáo của bạn sẽ
                được gửi đến đội ngũ quản trị viên để xem xét.
              </p>
            </div>
          </div>

          <div className="mb-4">
            <h4 className="text-sm font-medium text-gray-900 mb-2">
              Nội dung bài viết:
            </h4>
            <div className="p-3 bg-gray-50 rounded-lg text-gray-700 text-sm border border-gray-200">
              {post?.caption || ""}
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

const PostActions = ({
  post,
  onLike,
  onComment,
  isLiked,
  likeCount,
  commentCount,
}) => {
  const [showReportModal, setShowReportModal] = useState(false);
  const [showOptions, setShowOptions] = useState(false);

  const handleSubmitReport = async (reportData) => {
    try {
      await reportService.createReport(reportData);
      toast.success("Báo cáo đã được gửi thành công");
      return true;
    } catch (error) {
      console.error("Error submitting report:", error);
      toast.error("Không thể gửi báo cáo. Vui lòng thử lại sau.");
      return false;
    }
  };

  return (
    <div className="flex items-center justify-between px-4 py-2">
      <div className="flex space-x-4">
        <button
          onClick={onLike}
          className={`flex items-center space-x-1 ${
            isLiked ? "text-red-500" : "text-gray-500 hover:text-red-500"
          }`}
        >
          <Heart size={20} fill={isLiked ? "currentColor" : "none"} />
          <span className="text-sm font-medium">
            {likeCount > 0 ? likeCount : ""}
          </span>
        </button>

        <button
          onClick={onComment}
          className="flex items-center space-x-1 text-gray-500 hover:text-blue-500"
        >
          <MessageSquare size={20} />
          <span className="text-sm font-medium">
            {commentCount > 0 ? commentCount : ""}
          </span>
        </button>

        <button className="flex items-center space-x-1 text-gray-500 hover:text-green-500">
          <Share2 size={20} />
        </button>
      </div>

      <div className="relative">
        <button
          className="text-gray-500 hover:text-gray-700"
          onClick={() => setShowOptions(!showOptions)}
        >
          <MoreHorizontal size={20} />
        </button>

        {showOptions && (
          <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg z-10 border border-gray-100">
            <ul className="py-1">
              <li>
                <button
                  className="flex items-center px-4 py-2 text-sm text-red-600 hover:bg-gray-100 w-full text-left"
                  onClick={() => {
                    setShowReportModal(true);
                    setShowOptions(false);
                  }}
                >
                  <Flag size={14} className="mr-2" />
                  Báo cáo bài viết
                </button>
              </li>
            </ul>
          </div>
        )}
      </div>

      <ReportModal
        isOpen={showReportModal}
        onClose={() => setShowReportModal(false)}
        post={post}
        onSubmitReport={handleSubmitReport}
      />
    </div>
  );
};

export default PostActions;
