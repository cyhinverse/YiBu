import React from "react";
import { XCircle } from "lucide-react";

// Hàm tiện ích để lấy avatar an toàn
const getSafeAvatar = (user) => {
  return (
    user?.avatar || "https://ui-avatars.com/api/?name=User&background=random"
  );
};

// Hàm tiện ích để lấy tên người dùng an toàn
const getSafeUserName = (user) => {
  return user?.name || user?.username || "Người dùng ẩn danh";
};

const DeleteCommentModal = ({
  isOpen,
  comment,
  onClose,
  onDelete,
  deleteReason,
  setDeleteReason,
  isLoading,
}) => {
  if (!isOpen || !comment) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-lg max-w-md w-full">
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-bold text-gray-900">
              Xác nhận xóa bình luận
            </h3>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700"
            >
              <XCircle size={24} />
            </button>
          </div>

          <div className="mb-4">
            <p className="text-gray-700 mb-4">
              Bạn có chắc chắn muốn xóa bình luận này? Hành động này không thể
              hoàn tác.
            </p>

            <div className="bg-gray-50 p-3 rounded-lg mb-4">
              <div className="flex items-center mb-2">
                <img
                  src={getSafeAvatar(comment.user)}
                  alt=""
                  className="h-8 w-8 rounded-full mr-2"
                />
                <div className="text-sm font-medium">
                  {getSafeUserName(comment.user)}
                </div>
              </div>
              <div className="text-sm p-2 bg-white rounded border border-gray-200">
                {comment.content}
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Lý do xóa (tùy chọn)
              </label>
              <textarea
                value={deleteReason}
                onChange={(e) => setDeleteReason(e.target.value)}
                className="w-full border border-gray-300 rounded-md p-2 focus:ring-blue-500 focus:border-blue-500"
                rows="3"
                placeholder="Nhập lý do xóa bình luận..."
              ></textarea>
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              disabled={isLoading}
            >
              Hủy
            </button>
            <button
              onClick={onDelete}
              className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
              disabled={isLoading}
            >
              {isLoading ? "Đang xử lý..." : "Xóa bình luận"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DeleteCommentModal;
