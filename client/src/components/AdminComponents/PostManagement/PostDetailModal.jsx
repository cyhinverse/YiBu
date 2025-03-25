import React from "react";
import {
  XCircle,
  Calendar,
  Clock,
  ThumbsUp,
  MessageSquare,
  FileText,
  Link,
} from "lucide-react";

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

const PostDetailModal = ({ isOpen, post, onClose, onDelete }) => {
  if (!isOpen || !post) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-bold text-gray-900">
              Chi tiết bài viết
            </h3>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700"
            >
              <XCircle size={24} />
            </button>
          </div>

          <div className="mb-6">
            <div className="flex items-center mb-4">
              <img
                src={getSafeAvatar(post.user)}
                alt=""
                className="h-12 w-12 rounded-full mr-4"
              />
              <div>
                <h4 className="font-semibold text-lg">
                  {getSafeUserName(post.user)}
                </h4>
                <div className="flex items-center text-gray-500 text-sm">
                  <Calendar size={14} className="mr-1" />
                  <span>
                    {new Date(post.createdAt).toLocaleDateString("vi-VN")}
                  </span>
                  <Clock size={14} className="ml-2 mr-1" />
                  <span>
                    {new Date(post.createdAt).toLocaleTimeString("vi-VN")}
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg mb-4">
              <h5 className="font-medium text-gray-900 mb-3">Nội dung</h5>
              <div className="whitespace-pre-wrap mb-4 text-gray-700">
                {post.caption || "Không có nội dung"}
              </div>

              {post.media && post.media.length > 0 ? (
                <div className="mt-4">
                  <h5 className="font-medium text-gray-900 mb-3">Media</h5>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {post.media.map((item, index) => (
                      <div key={index} className="border rounded-lg p-1">
                        {item.type === "image" ? (
                          <img
                            src={item.url}
                            alt={`Media ${index}`}
                            className="w-full h-auto max-h-80 object-contain rounded"
                          />
                        ) : item.type === "video" ? (
                          <video
                            controls
                            className="w-full h-auto max-h-80 object-contain rounded"
                          >
                            <source src={item.url} />
                            Your browser does not support the video tag.
                          </video>
                        ) : (
                          <div className="flex items-center justify-center h-40 bg-gray-200 text-gray-500 rounded">
                            <FileText size={40} />
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}

              {post.link && (
                <div className="mt-4">
                  <h5 className="font-medium text-gray-900 mb-2">Liên kết</h5>
                  <a
                    href={post.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline flex items-center"
                  >
                    <Link size={14} className="mr-1" />
                    {post.link}
                  </a>
                </div>
              )}
            </div>

            <div className="flex items-center justify-between mb-4">
              <div className="flex space-x-4">
                <div className="flex items-center text-gray-500">
                  <ThumbsUp size={16} className="mr-1" />
                  <span>{post.likes?.length || 0} lượt thích</span>
                </div>
                <div className="flex items-center text-gray-500">
                  <MessageSquare size={16} className="mr-1" />
                  <span>{post.comments?.length || 0} bình luận</span>
                </div>
              </div>

              <div>
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
              </div>
            </div>

            {/* Comments section */}
            <div className="border-t pt-4">
              <h5 className="font-semibold mb-2 flex items-center">
                <MessageSquare size={16} className="mr-2" />
                Bình luận ({post.comments?.length || 0})
              </h5>
              {post.comments && post.comments.length > 0 ? (
                <div className="space-y-3">
                  {post.comments.map((comment) => (
                    <div
                      key={comment._id}
                      className="bg-gray-50 p-3 rounded-lg"
                    >
                      <div className="flex items-center mb-1">
                        <img
                          src={getSafeAvatar(comment.user)}
                          alt=""
                          className="h-8 w-8 rounded-full mr-2"
                        />
                        <div>
                          <div className="font-medium text-sm">
                            {getSafeUserName(comment.user)}
                          </div>
                          <div className="text-xs text-gray-500">
                            {comment.createdAt &&
                              new Date(comment.createdAt).toLocaleString(
                                "vi-VN"
                              )}
                          </div>
                        </div>
                      </div>
                      <p className="text-sm">{comment.content}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-gray-500 text-sm">
                  Chưa có bình luận nào cho bài viết này.
                </div>
              )}
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
            >
              Đóng
            </button>
            <button
              onClick={() => onDelete(post)}
              className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
            >
              Xóa bài viết
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PostDetailModal;
