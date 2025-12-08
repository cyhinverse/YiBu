import React, { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useLocation } from "react-router-dom";
import { Save, Flag, X, Trash, AlertTriangle } from "lucide-react";
import { toast } from "react-hot-toast";
import { deletePost, reportPost as reportPostAction } from "../../../../redux/actions/postActions";
import { savePost, unsavePost } from "../../../../redux/actions/savePostActions";
import { removePostLocal } from "../../../../redux/slices/PostSlice";
import { setSavedStatusLocal as setSavedStatus } from "../../../../redux/slices/SavePostSlice";

const PostOption = ({ postId, postUserId, show }) => {
  const dispatch = useDispatch();
  const location = useLocation();
  const currentUser = useSelector((state) => state.auth?.user);
  const savedStatus = useSelector(
    (state) => state.savePost?.savedStatus?.[postId] || false
  );
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportReason, setReportReason] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const getCurrentUserId = () => {
    if (!currentUser) return null;
    if (currentUser._id) return currentUser._id;
    if (currentUser.id) return currentUser.id;
    if (currentUser.user?._id) return currentUser.user._id;
    if (currentUser.user?.id) return currentUser.user.id;

    return null;
  };

  const currentUserId = getCurrentUserId();

  const isProfilePage = location.pathname.includes("/profile");

  const isCurrentUserPost =
    currentUserId && postUserId && currentUserId === postUserId;

  let options = [
    {
      id: "save",
      label: savedStatus ? "Bỏ lưu bài viết" : "Lưu bài viết",
      icon: <Save size={16} />,
    },
    { id: "report", label: "Báo cáo", icon: <Flag size={16} /> },
    { id: "hide", label: "Ẩn bài viết", icon: <X size={16} /> },
  ];

  if (isProfilePage && isCurrentUserPost) {
    options.push({
      id: "delete",
      label: "Xóa bài viết",
      icon: <Trash size={16} />,
    });
  }

  const handleSavePost = async () => {
    try {
      setIsLoading(true);
      if (!postId) {
        throw new Error("ID bài viết không hợp lệ");
      }

      const action = savedStatus ? unsavePost(postId) : savePost(postId);
      const response = await dispatch(action).unwrap();

      const responseCode = response.code || (response.data && response.data.code);

      if (responseCode === 1) {
        dispatch(
          setSavedStatus({
            postId,
            status: !savedStatus,
          })
        );
        toast.success(savedStatus ? "Đã bỏ lưu bài viết" : "Đã lưu bài viết");
      } else {
        console.error("Lỗi khi lưu bài viết:", response);
        toast.error(response?.message || "Có lỗi xảy ra");
      }
    } catch (error) {
      console.error("Lỗi khi lưu/bỏ lưu bài viết:", error);
      toast.error(
        error.message || "Có lỗi xảy ra khi lưu bài viết"
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleReportSubmit = async () => {
    if (!reportReason.trim()) {
      toast.error("Vui lòng nhập lý do báo cáo");
      return;
    }

    try {
      setIsLoading(true);
      const response = await dispatch(reportPostAction({ postId, reason: reportReason })).unwrap();

      if (response && response.code === 1) {
        // dispatch(reportPost({ postId, reason: reportReason })); // No such reducer, thunk handles it? 
        // Actually reportPost thunk returns data, but usage implies we want to update local state? 
        // PostSlice currently doesn't handle reportPost.fulfilled. 
        // If reporting implies hiding or flagging, we might need a reducer. 
        // But for now, removing the invalid dispatch is the priority.
        toast.success("Báo cáo bài viết thành công");
      } else {
        toast.error(response?.message || "Báo cáo bài viết thất bại");
      }
    } catch (error) {
      console.error("Lỗi khi báo cáo bài viết:", error);
      // dispatch(reportPost({ postId, reason: reportReason }));
      toast.success("Đã ghi nhận báo cáo của bạn");
    } finally {
      setIsLoading(false);
      setShowReportModal(false);
    }
  };

  const handleHidePost = () => {
    try {
      // Logic from legacy service: save to localStorage
      // We do it here directly as services are removed
      const hiddenPosts = JSON.parse(localStorage.getItem('hiddenPosts')) || [];
      if (!hiddenPosts.includes(postId)) {
        hiddenPosts.push(postId);
        localStorage.setItem('hiddenPosts', JSON.stringify(hiddenPosts));
      }

      dispatch(removePostLocal(postId));
      toast.success("Đã ẩn bài viết");
    } catch (error) {
      console.error("Lỗi khi ẩn bài viết:", error);
      toast.error("Có lỗi xảy ra khi ẩn bài viết");
    }
  };

  const handleDeletePost = async () => {
    try {
      setIsLoading(true);
      await dispatch(deletePost(postId)).unwrap();
      toast.success("Xóa bài viết thành công");
      // dispatch(removePost(postId)); // Handled by extraReducers
    } catch (error) {
      console.error("Error deleting post:", error);
      toast.error("Xóa bài viết thất bại");
    } finally {
      setIsLoading(false);
    }
  };

  const handleOptionClick = async (optionId) => {
    switch (optionId) {
      case "save":
        await handleSavePost();
        break;
      case "report":
        setShowReportModal(true);
        break;
      case "hide":
        handleHidePost();
        break;
      case "delete":
        await handleDeletePost();
        break;
      default:
        break;
    }
  };

  return (
    <>
      <div
        className={`flex flex-col shadow-xl h-fit w-[180px] absolute z-30 top-5 right-5 rounded-md gap-0.5 items-center justify-center transition-all duration-200 ease-out border border-gray-300 bg-white
        ${
          show
            ? "opacity-100 scale-100"
            : "opacity-0 scale-90 pointer-events-none"
        }`}
      >
        {options.map((op) => (
          <div
            key={op.id}
            className={`w-full px-4 h-[40px] border-b border-gray-300 flex items-center cursor-pointer hover:bg-gray-100 ${
              op.id === "delete" ? "text-red-500" : ""
            }`}
            onClick={() => handleOptionClick(op.id)}
          >
            <span className="mr-2">{op.icon}</span>
            {op.label}
          </div>
        ))}
      </div>

      {showReportModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium flex items-center">
                <AlertTriangle size={20} className="mr-2 text-yellow-500" />
                Báo cáo bài viết
              </h3>
              <button
                onClick={() => setShowReportModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={20} />
              </button>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">
                Lý do báo cáo:
              </label>
              <textarea
                className="w-full border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                rows="4"
                placeholder="Hãy mô tả chi tiết về lý do bạn báo cáo bài viết này..."
                value={reportReason}
                onChange={(e) => setReportReason(e.target.value)}
              ></textarea>
            </div>

            <div className="flex justify-end space-x-2">
              <button
                onClick={() => setShowReportModal(false)}
                className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-100"
                disabled={isLoading}
              >
                Hủy
              </button>
              <button
                onClick={handleReportSubmit}
                className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600"
                disabled={isLoading}
              >
                {isLoading ? "Đang xử lý..." : "Gửi báo cáo"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default PostOption;
