import React from "react";
import { XCircle, Clock, Calendar, MessageSquare, User } from "lucide-react";

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

const CommentDetailModal = ({ isOpen, comment, onClose, onDelete }) => {
  if (!isOpen || !comment) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-lg max-w-2xl w-full">
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-bold text-gray-900">
              Chi tiết bình luận
            </h3>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700"
            >
              <XCircle size={24} />
            </button>
          </div>

          <div className="mb-6">
            {/* User info */}
            <div className="flex items-center mb-4 p-3 bg-gray-50 rounded-lg">
              <img
                src={getSafeAvatar(comment.user)}
                alt=""
                className="h-12 w-12 rounded-full mr-4"
              />
              <div>
                <h4 className="font-semibold text-gray-900">
                  {getSafeUserName(comment.user)}
                </h4>
                <div className="flex items-center text-gray-500 text-sm">
                  <User size={14} className="mr-1" />
                  <span>User ID: {comment.user?._id || "N/A"}</span>
                </div>
              </div>
            </div>

            {/* Comment content */}
            <div className="bg-gray-50 p-4 rounded-lg mb-4">
              <h5 className="font-medium text-gray-900 mb-2">Nội dung</h5>
              <div className="whitespace-pre-wrap text-gray-700 p-3 bg-white rounded border border-gray-200">
                {comment.content}
              </div>
              <div className="mt-3 flex items-center text-gray-500 text-sm">
                <Calendar size={14} className="mr-1" />
                <span>
                  {new Date(comment.createdAt).toLocaleDateString("vi-VN")}
                </span>
                <Clock size={14} className="ml-3 mr-1" />
                <span>
                  {new Date(comment.createdAt).toLocaleTimeString("vi-VN")}
                </span>
              </div>
            </div>

            {/* Post info */}
            {comment.post && (
              <div className="bg-gray-50 p-4 rounded-lg mb-4">
                <h5 className="font-medium text-gray-900 mb-2 flex items-center">
                  <MessageSquare size={16} className="mr-2" />
                  Bài viết liên quan
                </h5>

                {comment.post.caption ? (
                  <>
                    <div className="text-sm text-gray-700 truncate mb-2 p-3 bg-white rounded border border-gray-200">
                      <span className="font-medium">Nội dung: </span>
                      {comment.post.caption}
                    </div>
                    <div className="flex items-center mb-2">
                      <img
                        src={getSafeAvatar(comment.post.user)}
                        alt=""
                        className="h-6 w-6 rounded-full mr-2"
                      />
                      <span className="text-sm text-gray-700">
                        Đăng bởi: {getSafeUserName(comment.post.user)}
                      </span>
                    </div>
                    <div className="text-sm text-gray-500">
                      ID bài viết: {comment.post._id}
                    </div>
                  </>
                ) : (
                  <div className="text-gray-500 p-3 bg-white rounded border border-gray-200">
                    Bài viết đã bị xóa hoặc không tồn tại
                  </div>
                )}
              </div>
            )}

            {/* Report info if available */}
            {comment.reports && comment.reports.length > 0 && (
              <div className="bg-red-50 p-4 rounded-lg">
                <h5 className="font-medium text-red-700 mb-2">
                  Báo cáo ({comment.reports.length})
                </h5>
                <div className="space-y-2">
                  {comment.reports.map((report, index) => (
                    <div
                      key={index}
                      className="p-2 bg-white rounded text-sm text-gray-700 border border-red-200"
                    >
                      <div className="flex items-center mb-1">
                        <img
                          src={getSafeAvatar(report.reportedBy)}
                          alt=""
                          className="h-5 w-5 rounded-full mr-2"
                        />
                        <span className="font-medium">
                          {getSafeUserName(report.reportedBy)}
                        </span>
                        <span className="ml-auto text-xs text-gray-500">
                          {new Date(report.createdAt).toLocaleString("vi-VN")}
                        </span>
                      </div>
                      <div>{report.reason}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="flex justify-end gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
            >
              Đóng
            </button>
            <button
              onClick={() => onDelete(comment)}
              className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
            >
              Xóa bình luận
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CommentDetailModal;
