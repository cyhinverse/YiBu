import React from "react";
import { EyeIcon, Trash2, RefreshCw } from "lucide-react";

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

const CommentsTable = ({
  comments,
  isLoading,
  onViewComment,
  onDeleteClick,
}) => {
  if (isLoading) {
    return (
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th
              scope="col"
              className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
            >
              Người dùng
            </th>
            <th
              scope="col"
              className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
            >
              Bình luận
            </th>
            <th
              scope="col"
              className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
            >
              Bài viết
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
              Hành động
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          <tr>
            <td colSpan="5" className="px-6 py-4 text-center">
              <div className="flex justify-center">
                <RefreshCw className="animate-spin h-6 w-6 text-blue-500" />
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    );
  }

  return (
    <table className="min-w-full divide-y divide-gray-200">
      <thead className="bg-gray-50">
        <tr>
          <th
            scope="col"
            className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
          >
            Người dùng
          </th>
          <th
            scope="col"
            className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
          >
            Bình luận
          </th>
          <th
            scope="col"
            className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
          >
            Bài viết
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
            Hành động
          </th>
        </tr>
      </thead>
      <tbody className="bg-white divide-y divide-gray-200">
        {comments.map((comment) => (
          <tr key={comment._id} className="hover:bg-gray-50">
            <td className="px-6 py-4">
              <div className="flex items-center">
                <div className="h-8 w-8 flex-shrink-0">
                  <img
                    src={getSafeAvatar(comment.user)}
                    alt=""
                    className="h-8 w-8 rounded-full object-cover"
                  />
                </div>
                <div className="ml-3">
                  <div className="text-sm font-medium text-gray-900">
                    {getSafeUserName(comment.user)}
                  </div>
                </div>
              </div>
            </td>
            <td className="px-6 py-4">
              <div className="text-sm text-gray-900 max-w-xs truncate">
                {comment.content}
              </div>
            </td>
            <td className="px-6 py-4">
              <div className="text-sm text-gray-900">
                {comment.post?.caption ? (
                  <div className="text-sm text-gray-900 max-w-xs truncate">
                    {comment.post.caption}
                  </div>
                ) : (
                  <span className="text-gray-500 text-sm">
                    Bài viết đã bị xóa
                  </span>
                )}
              </div>
            </td>
            <td className="px-6 py-4 whitespace-nowrap">
              <div className="text-sm text-gray-900">
                {new Date(comment.createdAt).toLocaleDateString("vi-VN")}
              </div>
              <div className="text-xs text-gray-500">
                {new Date(comment.createdAt).toLocaleTimeString("vi-VN")}
              </div>
            </td>
            <td className="px-6 py-4 whitespace-nowrap">
              <div className="flex space-x-2">
                <button
                  onClick={() => onViewComment(comment)}
                  className="text-blue-600 hover:text-blue-900"
                  title="Xem chi tiết"
                >
                  <EyeIcon size={18} />
                </button>
                <button
                  onClick={() => onDeleteClick(comment)}
                  className="text-red-600 hover:text-red-900"
                  title="Xóa bình luận"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
};

export default CommentsTable;
