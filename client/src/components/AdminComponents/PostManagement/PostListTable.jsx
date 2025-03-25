import React from "react";
import { ThumbsUp, MessageSquare, EyeIcon, Trash2 } from "lucide-react";

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

const PostListTable = ({ posts, onViewPost, onDeleteClick }) => {
  return (
    <table className="min-w-full divide-y divide-gray-200">
      <thead className="bg-gray-50">
        <tr>
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
            Người đăng
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
            Tương tác
          </th>
          <th
            scope="col"
            className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
          >
            Trạng thái
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
        {posts.map((post) => (
          <tr key={post._id} className="hover:bg-gray-50">
            <td className="px-6 py-4 max-w-xs">
              <div className="flex">
                {post.media && post.media.length > 0 && (
                  <div className="flex-shrink-0 h-10 w-10 mr-3">
                    <img
                      src={post.media[0].url}
                      alt=""
                      className="h-10 w-10 rounded object-cover"
                    />
                  </div>
                )}
                <div>
                  <div className="text-sm text-gray-900 truncate max-w-xs">
                    {post.caption}
                  </div>
                </div>
              </div>
            </td>
            <td className="px-6 py-4 whitespace-nowrap">
              <div className="flex items-center">
                <div className="h-8 w-8 flex-shrink-0">
                  <img
                    src={getSafeAvatar(post.user)}
                    alt=""
                    className="h-8 w-8 rounded-full object-cover"
                  />
                </div>
                <div className="ml-3">
                  <div className="text-sm font-medium text-gray-900">
                    {getSafeUserName(post.user)}
                  </div>
                </div>
              </div>
            </td>
            <td className="px-6 py-4 whitespace-nowrap">
              <div className="text-sm text-gray-900">
                {new Date(post.createdAt).toLocaleDateString("vi-VN")}
              </div>
              <div className="text-xs text-gray-500">
                {new Date(post.createdAt).toLocaleTimeString("vi-VN")}
              </div>
            </td>
            <td className="px-6 py-4 whitespace-nowrap">
              <div className="flex space-x-4">
                <div className="flex items-center text-sm text-gray-500">
                  <ThumbsUp size={14} className="mr-1 text-gray-400" />
                  <span>{post.likes?.length || 0}</span>
                </div>
                <div className="flex items-center text-sm text-gray-500">
                  <MessageSquare size={14} className="mr-1 text-gray-400" />
                  <span>{post.comments?.length || 0}</span>
                </div>
              </div>
            </td>
            <td className="px-6 py-4 whitespace-nowrap">
              <span
                className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                  post.reportCount > 0
                    ? "bg-red-100 text-red-800"
                    : "bg-blue-100 text-blue-800"
                }`}
              >
                {post.reportCount > 0
                  ? `Bị báo cáo (${post.reportCount})`
                  : "Bình thường"}
              </span>
            </td>
            <td className="px-6 py-4 whitespace-nowrap">
              <div className="flex space-x-2">
                <button
                  onClick={() => onViewPost(post)}
                  className="text-blue-600 hover:text-blue-900"
                  title="Xem chi tiết"
                >
                  <EyeIcon size={18} />
                </button>
                <button
                  onClick={() => onDeleteClick(post)}
                  className="text-red-600 hover:text-red-900"
                  title="Xóa bài viết"
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

export default PostListTable;
