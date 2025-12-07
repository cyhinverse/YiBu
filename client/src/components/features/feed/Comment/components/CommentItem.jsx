import { useState, useRef, useEffect } from "react";
import {
  Heart,
  MessageSquare,
  Share2,
  MoreHorizontal,
  Clock,
  Edit,
  Trash2,
  X,
  Flag,
} from "lucide-react";
import CommentReply from "./CommentReply";
import ReplyInput from "./ReplyInput";
import CommentDecoration from "./CommentDecoration";
import { ReportCommentModal } from "../../../report/Report";
import reportService from "../../../../services/reportService";
import { useSelector } from "react-redux";
import { formatDistanceToNow } from "date-fns";
import { vi } from "date-fns/locale";
import { toast } from "react-hot-toast";

const CustomModal = ({
  title,
  isOpen,
  onClose,
  onConfirm,
  children,
  danger = false,
}) => {
  const modalRef = useRef(null);

  useEffect(() => {
    const handleEscKey = (e) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleEscKey);
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.removeEventListener("keydown", handleEscKey);
      document.body.style.overflow = "";
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div
        className=" rounded-lg shadow-xl w-full max-w-md mx-4"
        ref={modalRef}
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

const CommentItem = ({
  comment,
  onLike,
  onUpdate,
  onDelete,
  onReplyClick,
  onAddReply,
  reply,
  replyToChild,
  currentComment,
  setCurrentComment,
}) => {
  const [isEditing, setIsEditing] = useState(comment.isEditing || false);
  const [editedContent, setEditedContent] = useState(comment.content || "");
  const [showOptions, setShowOptions] = useState(false);
  const { current: currentUser } = useSelector((state) => state.user);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [reportModalVisible, setReportModalVisible] = useState(false);

  const isOwner = currentUser?._id === comment.user?._id;

  const formattedTime = comment.createdAt
    ? formatDistanceToNow(new Date(comment.createdAt), {
        addSuffix: true,
        locale: vi,
      })
    : "Vừa xong";

  const handleUpdate = async () => {
    if (editedContent.trim() === "") return;

    if (comment.isTemp) {
      const success = await onAddReply(null, null, editedContent);
      if (success) {
        setCurrentComment((currentComments) =>
          currentComments.filter((c) => !c.isTemp)
        );
        setIsEditing(false);
      }
    } else {
      const success = await onUpdate(comment._id, editedContent);
      if (success) {
        setIsEditing(false);
      }
    }
  };

  const handleDelete = async () => {
    if (comment.isTemp) {
      setCurrentComment((currentComments) =>
        currentComments.filter((c) => c._id !== comment._id)
      );
    } else {
      await onDelete(comment._id, false);
    }
    setDeleteModalVisible(false);
  };

  const toggleOptions = () => {
    setShowOptions(!showOptions);
  };

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
    <div className="transform-gpu transition-all duration-200 hover:translate-x-1">
      {/* Main comment */}
      <div className="flex items-start space-x-4">
        <img
          src={
            comment.user?.profile?.avatar || "https://i.pravatar.cc/150?img=5"
          }
          alt={comment.user?.name || "User"}
          className="w-10 h-10 rounded-full object-cover border-2 border-white shadow-md"
          loading="lazy"
        />
        <div className="flex-1">
          {isEditing ? (
            <div className=" p-4 rounded-2xl shadow-sm border border-purple-200 transition-colors duration-200">
              <div className="flex justify-between items-center mb-3">
                <p className="font-semibold text-gray-800">
                  {comment.user?.name || "Bạn"}
                </p>
                <span className="text-xs text-gray-500 flex items-center">
                  <Clock size={12} className="mr-1 text-gray-400" />{" "}
                  {formattedTime}
                </span>
              </div>
              <textarea
                className="w-full p-3 border border-gray-200 rounded-lg bg-white resize-none focus:border-purple-300 focus:ring focus:ring-purple-200 focus:ring-opacity-50"
                value={editedContent}
                onChange={(e) => setEditedContent(e.target.value)}
                rows={3}
                placeholder="Nhập bình luận của bạn..."
                autoFocus
              />
              <div className="flex justify-end mt-2 space-x-2">
                <button
                  className="px-3 py-1 text-xs bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-md transition-colors duration-200"
                  onClick={() => {
                    if (comment.isTemp) {
                      setCurrentComment((currentComments) =>
                        currentComments.filter((c) => c._id !== comment._id)
                      );
                    } else {
                      setIsEditing(false);
                      setEditedContent(comment.content);
                    }
                  }}
                >
                  Hủy
                </button>
                <button
                  className="px-3 py-1 text-xs bg-purple-500 hover:bg-purple-600 text-white rounded-md transition-colors duration-200"
                  onClick={handleUpdate}
                >
                  Đăng
                </button>
              </div>
            </div>
          ) : (
            <>
              <div className=" p-4 rounded-2xl shadow-sm border border-gray-100 hover:border-purple-200 transition-colors duration-200">
                <div className="flex justify-between items-center mb-2">
                  <p className="font-semibold text-gray-800">
                    {comment.user?.name || "Người dùng"}
                  </p>
                  <div className="flex items-center space-x-2 relative">
                    <span className="text-xs text-gray-500 flex items-center">
                      <Clock size={12} className="mr-1 text-gray-400" />{" "}
                      {formattedTime}
                    </span>
                    <div className="relative">
                      <button
                        className="text-gray-400 hover:text-gray-600 transition-colors"
                        onClick={toggleOptions}
                      >
                        <MoreHorizontal size={16} />
                      </button>

                      {showOptions && (
                        <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg z-10 border border-gray-100">
                          <ul className="py-1">
                            {isOwner ? (
                              <>
                                <li>
                                  <button
                                    className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left"
                                    onClick={() => {
                                      setIsEditing(true);
                                      setShowOptions(false);
                                    }}
                                  >
                                    <Edit size={14} className="mr-2" />
                                    Chỉnh sửa bình luận
                                  </button>
                                </li>
                                <li>
                                  <button
                                    className="flex items-center px-4 py-2 text-sm text-red-600 hover:bg-gray-100 w-full text-left"
                                    onClick={() => {
                                      setDeleteModalVisible(true);
                                      setShowOptions(false);
                                    }}
                                  >
                                    <Trash2 size={14} className="mr-2" />
                                    Xóa bình luận
                                  </button>
                                </li>
                              </>
                            ) : (
                              <li>
                                <button
                                  className="flex items-center px-4 py-2 text-sm text-amber-600 hover:bg-gray-100 w-full text-left"
                                  onClick={() => {
                                    setReportModalVisible(true);
                                    setShowOptions(false);
                                  }}
                                >
                                  <Flag size={14} className="mr-2" />
                                  Báo cáo bình luận
                                </button>
                              </li>
                            )}
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                <p className="text-gray-700 leading-relaxed">
                  {comment.content}
                </p>
              </div>

              <div className="flex items-center mt-3 space-x-6 px-2">
                <button
                  className={`text-xs flex items-center space-x-1.5 ${
                    comment.liked ? "text-pink-500" : "text-gray-500"
                  } hover:text-pink-500 transition-colors duration-200 font-medium`}
                  onClick={() => onLike && onLike(comment._id)}
                >
                  <Heart
                    size={16}
                    fill={comment.liked ? "currentColor" : "none"}
                    className={`${comment.liked ? "animate-heartBeat" : ""}`}
                  />
                  <span>{comment.likes > 0 ? comment.likes : "Like"}</span>
                </button>
                <button
                  className="text-xs text-gray-500 hover:text-purple-500 flex items-center space-x-1.5 transition-colors duration-200 font-medium"
                  onClick={() => onReplyClick(comment._id)}
                >
                  <MessageSquare size={16} />
                  <span>Trả lời</span>
                </button>
                <button className="text-xs text-gray-500 hover:text-blue-500 flex items-center space-x-1.5 transition-colors duration-200 font-medium">
                  <Share2 size={16} />
                  <span>Chia sẻ</span>
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Replies section */}
      {comment.replies && comment.replies.length > 0 && (
        <div className="ml-14 mt-4 pl-6 space-y-4 relative">
          <CommentDecoration replies={comment.replies} />

          {comment.replies.map((replyItem) => (
            <CommentReply
              key={replyItem._id}
              reply={replyItem}
              parentId={comment._id}
              onDelete={onDelete}
              onUpdate={onUpdate}
              onReplyClick={onReplyClick}
              allReplies={comment.replies}
              currentUser={currentUser}
            />
          ))}
        </div>
      )}

      {/* Reply input */}
      {reply === comment._id && (
        <ReplyInput
          parentId={comment._id}
          replyToChild={replyToChild}
          onAddReply={onAddReply}
          replies={comment.replies || []}
        />
      )}

      {/* Modal xác nhận xóa */}
      <CustomModal
        title="Xác nhận xóa"
        isOpen={deleteModalVisible}
        onClose={() => setDeleteModalVisible(false)}
        onConfirm={handleDelete}
        danger={true}
      >
        <p>Bạn có chắc chắn muốn xóa bình luận này?</p>
        <p className="text-gray-500 text-sm mt-2">
          Hành động này không thể hoàn tác.
        </p>
      </CustomModal>

      {/* Modal báo cáo */}
      <ReportCommentModal
        isOpen={reportModalVisible}
        onClose={() => setReportModalVisible(false)}
        comment={comment}
        onSubmitReport={handleSubmitReport}
      />
    </div>
  );
};

export default CommentItem;
