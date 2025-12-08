import { useState } from "react";
import {
  MessageSquare,
  MoreHorizontal,
  Clock,
  Edit,
  Trash2,
  Heart,
  Share2,
  X,
} from "lucide-react";
import { formatDistanceToNow } from "../../../../../utils/dateUtils";

// Custom Modal component
const CustomModal = ({
  title,
  isOpen,
  onClose,
  onConfirm,
  children,
  danger = false,
}) => {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      onClick={onClose}
    >
      <div
        className=" rounded-lg shadow-xl w-full max-w-md mx-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">{title}</h3>
          <button
            className="text-gray-400 hover:text-gray-500 focus:outline-none"
            onClick={onClose}
          >
            <X size={20} />
          </button>
        </div>

        <div className="px-6 py-4">{children}</div>

        <div className="flex justify-end gap-2 px-6 py-4 border-t border-gray-200">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 focus:outline-none"
          >
            Hủy
          </button>
          <button
            onClick={onConfirm}
            className={`px-4 py-2 text-sm font-medium text-white rounded-md focus:outline-none ${
              danger
                ? "bg-red-600 hover:bg-red-700"
                : "bg-blue-600 hover:bg-blue-700"
            }`}
          >
            {danger ? "Xóa" : "Xác nhận"}
          </button>
        </div>
      </div>
    </div>
  );
};

const CommentReply = ({
  reply,
  parentId,
  onDelete,
  onUpdate,
  onReplyClick,
  allReplies,
  currentUser,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState(reply.content || "");
  const [showOptions, setShowOptions] = useState(false);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);

  const isOwner = currentUser?._id === reply.user?._id;

  // Format thời gian
  const formattedTime = reply.createdAt
    ? formatDistanceToNow(new Date(reply.createdAt))
    : "Vừa xong";

  const handleUpdate = async () => {
    if (editedContent.trim() === "") return;

    // Cập nhật reply
    const success = await onUpdate(reply._id, editedContent);
    if (success) {
      setIsEditing(false);
    }
  };

  const handleDelete = async () => {
    await onDelete(reply._id, true, parentId);
    setDeleteModalVisible(false);
  };

  const toggleOptions = () => {
    setShowOptions(!showOptions);
  };

  // Tìm reply mà reply hiện tại đang trả lời
  const replyingTo = reply.replyTo
    ? allReplies.find((r) => r._id === reply.replyTo)
    : null;

  return (
    <div className="transform-gpu transition-all duration-200 hover:translate-x-1">
      <div className="flex items-start space-x-4">
        <img
          src={reply.user?.profile?.avatar || "https://i.pravatar.cc/150?img=8"}
          alt={reply.user?.name || "User"}
          className="w-8 h-8 rounded-full object-cover border-2 border-white shadow-md"
          loading="lazy"
        />
        <div className="flex-1">
          {isEditing ? (
            <div className=" p-4 rounded-2xl shadow-sm border border-blue-200 transition-colors duration-200">
              <div className="flex justify-between items-center mb-3">
                <p className="font-semibold text-gray-800">
                  {reply.user?.name || "Bạn"}
                </p>
                <span className="text-xs text-gray-500 flex items-center">
                  <Clock size={12} className="mr-1 text-gray-400" />{" "}
                  {formattedTime}
                </span>
              </div>
              <textarea
                className="w-full p-3 border border-gray-200 rounded-lg bg-white resize-none focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                value={editedContent}
                onChange={(e) => setEditedContent(e.target.value)}
                rows={3}
                placeholder="Nhập phản hồi của bạn..."
                autoFocus
              />
              <div className="flex justify-end mt-2 space-x-2">
                <button
                  className="px-3 py-1 text-xs bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-md transition-colors duration-200"
                  onClick={() => {
                    setIsEditing(false);
                    setEditedContent(reply.content);
                  }}
                >
                  Hủy
                </button>
                <button
                  className="px-3 py-1 text-xs bg-blue-500 hover:bg-blue-600 text-white rounded-md transition-colors duration-200"
                  onClick={handleUpdate}
                >
                  Cập nhật
                </button>
              </div>
            </div>
          ) : (
            <>
              <div className="bg-white p-3 rounded-2xl shadow-sm border border-gray-100 hover:border-blue-200 transition-colors duration-200">
                <div className="flex justify-between items-center mb-1">
                  <p className="font-medium text-gray-800 text-sm">
                    {reply.user?.name || "Người dùng"}
                  </p>
                  <div className="flex items-center space-x-2 relative">
                    <span className="text-xs text-gray-500 flex items-center">
                      <Clock size={10} className="mr-1 text-gray-400" />{" "}
                      {formattedTime}
                    </span>
                    {isOwner && (
                      <div className="relative">
                        <button
                          className="text-gray-400 hover:text-gray-600 transition-colors"
                          onClick={toggleOptions}
                        >
                          <MoreHorizontal size={14} />
                        </button>

                        {showOptions && (
                          <div className="absolute right-0 mt-1 w-48 bg-white rounded-md shadow-lg z-10 border border-gray-100">
                            <ul className="py-1">
                              <li>
                                <button
                                  className="flex items-center px-4 py-2 text-xs text-gray-700 hover:bg-gray-100 w-full text-left"
                                  onClick={() => {
                                    setIsEditing(true);
                                    setShowOptions(false);
                                  }}
                                >
                                  <Edit size={12} className="mr-2" />
                                  Chỉnh sửa phản hồi
                                </button>
                              </li>
                              <li>
                                <button
                                  className="flex items-center px-4 py-2 text-xs text-red-600 hover:bg-gray-100 w-full text-left"
                                  onClick={() => {
                                    setDeleteModalVisible(true);
                                    setShowOptions(false);
                                  }}
                                >
                                  <Trash2 size={12} className="mr-2" />
                                  Xóa phản hồi
                                </button>
                              </li>
                            </ul>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {replyingTo && (
                  <p className="text-xs text-blue-600 mb-1">
                    Trả lời {replyingTo.user?.name || "Người dùng"}
                  </p>
                )}

                <p className="text-gray-700 leading-relaxed text-sm">
                  {reply.content}
                </p>
              </div>

              <div className="flex items-center mt-2 space-x-4 px-2">
                <button
                  className={`text-xs flex items-center space-x-1.5 ${
                    reply.liked ? "text-pink-500" : "text-gray-500"
                  } hover:text-pink-500 transition-colors duration-200 font-medium`}
                >
                  <Heart
                    size={12}
                    fill={reply.liked ? "currentColor" : "none"}
                    className={`${reply.liked ? "animate-heartBeat" : ""}`}
                  />
                  <span className="text-xs">
                    {reply.likes > 0 ? reply.likes : "Like"}
                  </span>
                </button>
                <button
                  className="text-xs text-gray-500 hover:text-blue-500 flex items-center space-x-1.5 transition-colors duration-200 font-medium"
                  onClick={() => onReplyClick(parentId, reply._id)}
                >
                  <MessageSquare size={12} />
                  <span className="text-xs">Trả lời</span>
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Modal xác nhận xóa */}
      <CustomModal
        title="Xác nhận xóa"
        isOpen={deleteModalVisible}
        onClose={() => setDeleteModalVisible(false)}
        onConfirm={handleDelete}
        danger={true}
      >
        <p>Bạn có chắc chắn muốn xóa phản hồi này?</p>
        <p className="text-gray-500 text-sm mt-2">
          Hành động này không thể hoàn tác.
        </p>
      </CustomModal>
    </div>
  );
};

export default CommentReply;
