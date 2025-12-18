import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  Search,
  MoreHorizontal,
  Eye,
  Trash2,
  Flag,
  Calendar,
  ChevronLeft,
  ChevronRight,
  X,
  AlertTriangle,
  MessageCircle,
  Heart,
  Reply,
} from 'lucide-react';
import {
  getAllComments,
  moderateComment,
  deleteComment,
} from '../../../redux/actions/adminActions';
import { toast } from 'react-hot-toast';

const getStatusStyle = status => {
  switch (status) {
    case 'active':
      return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400';
    case 'hidden':
    case 'removed':
      return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400';
    case 'flagged':
      return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400';
    default:
      return 'bg-neutral-100 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-400';
  }
};

const getStatusText = status => {
  switch (status) {
    case 'active':
      return 'Hoạt động';
    case 'hidden':
    case 'removed':
      return 'Đã ẩn/xóa';
    case 'flagged':
      return 'Bị báo cáo';
    default:
      return status;
  }
};

export default function Comments() {
  const dispatch = useDispatch();
  const { comments, loading, totalPages } = useSelector(state => state.admin);

  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState(''); // empty string for all
  const [selectedComment, setSelectedComment] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [commentToDelete, setCommentToDelete] = useState(null);
  const [activeDropdown, setActiveDropdown] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      dispatch(
        getAllComments({
          page: currentPage,
          limit: 10,
          search: searchTerm,
          status: filterStatus || undefined,
        })
      );
    }, 500);

    return () => clearTimeout(timer);
  }, [dispatch, currentPage, searchTerm, filterStatus]);

  const handleDelete = async () => {
    if (!commentToDelete) return;
    try {
      await dispatch(
        deleteComment({
          commentId: commentToDelete._id || commentToDelete.id,
          reason: 'Deleted by admin via dashboard',
        })
      ).unwrap();
      toast.success('Đã xóa bình luận');
      setShowDeleteModal(false);
      setCommentToDelete(null);
      dispatch(
        getAllComments({
          page: currentPage,
          limit: 10,
          search: searchTerm,
          status: filterStatus || undefined,
        })
      );
    } catch (error) {
      toast.error('Xóa bình luận thất bại: ' + error);
    }
  };

  const handleToggleStatus = async comment => {
    try {
      // Logic: If active -> remove (hide). If removed -> approve (show)
      const action = comment.isDeleted ? 'approve' : 'remove';
      await dispatch(
        moderateComment({
          commentId: comment._id || comment.id,
          action,
          reason: `Changed status to ${action} by admin`,
        })
      ).unwrap();
      toast.success(`Đã ${action === 'remove' ? 'ẩn' : 'khôi phục'} bình luận`);
      setActiveDropdown(null);
      // Refresh list
      dispatch(
        getAllComments({
          page: currentPage,
          limit: 10,
          search: searchTerm,
          status: filterStatus || undefined,
        })
      );
    } catch (error) {
      toast.error('Thay đổi trạng thái thất bại: ' + error);
    }
  };

  // Helper to safely get display data
  const getCommentData = comment => ({
    id: comment._id || comment.id,
    content: comment.content,
    author: comment.user || {
      name: 'Unknown',
      username: 'unknown',
      avatar: 'https://via.placeholder.com/150',
    },
    postPreview: comment.post?.caption || 'No caption',
    likes: comment.likesCount || 0,
    replies: comment.repliesCount || 0,
    status: comment.isDeleted ? 'hidden' : 'active',
    createdAt: new Date(comment.createdAt).toLocaleString('vi-VN'),
    reports: 0, // Backend needs to provide this if required
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-black dark:text-white">
            Quản lý bình luận
          </h1>
          <p className="text-neutral-500 dark:text-neutral-400 mt-1">
            Quản lý và kiểm duyệt bình luận
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search
            size={18}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400"
          />
          <input
            type="text"
            placeholder="Tìm kiếm nội dung..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-black dark:text-white focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white"
          />
        </div>

        <select
          value={filterStatus}
          onChange={e => setFilterStatus(e.target.value)}
          className="px-4 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-black dark:text-white focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white"
        >
          <option value="">Tất cả trạng thái</option>
          <option value="active">Hoạt động</option>
          <option value="hidden">Đã ẩn/xóa</option>
        </select>
      </div>

      {/* Comments List */}
      <div className="space-y-4">
        {loading ? (
          <div className="text-center py-10">Đang tải...</div>
        ) : !comments || comments.length === 0 ? (
          <div className="text-center py-10 text-neutral-500">
            Không có bình luận nào
          </div>
        ) : (
          comments.map(rawComment => {
            const comment = getCommentData(rawComment);
            return (
              <div
                key={comment.id}
                className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 p-5"
              >
                <div className="flex items-start gap-4">
                  {/* Author Avatar */}
                  <img
                    src={comment.author.avatar}
                    alt={comment.author.name}
                    className="w-10 h-10 rounded-full border-2 border-neutral-200 dark:border-neutral-700 flex-shrink-0"
                  />

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-black dark:text-white">
                            {comment.author.name}
                          </h3>
                          <span className="text-neutral-500 dark:text-neutral-400 text-sm">
                            @{comment.author.username}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 mt-1 text-sm text-neutral-500 dark:text-neutral-400">
                          <Calendar size={14} />
                          {comment.createdAt}
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusStyle(
                            comment.status
                          )}`}
                        >
                          {getStatusText(comment.status)}
                        </span>

                        {/* Actions Dropdown */}
                        <div className="relative">
                          <button
                            onClick={() =>
                              setActiveDropdown(
                                activeDropdown === comment.id
                                  ? null
                                  : comment.id
                              )
                            }
                            className="p-2 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg transition-colors"
                          >
                            <MoreHorizontal
                              size={18}
                              className="text-neutral-500"
                            />
                          </button>

                          {activeDropdown === comment.id && (
                            <div className="absolute right-0 top-full mt-1 w-40 bg-white dark:bg-neutral-800 rounded-xl shadow-lg border border-neutral-200 dark:border-neutral-700 py-1 z-10">
                              <button
                                onClick={() => {
                                  setSelectedComment(comment);
                                  setActiveDropdown(null);
                                }}
                                className="w-full px-4 py-2 text-left text-sm hover:bg-neutral-100 dark:hover:bg-neutral-700 flex items-center gap-2"
                              >
                                <Eye size={16} />
                                Xem chi tiết
                              </button>
                              <button
                                onClick={() => handleToggleStatus(rawComment)}
                                className="w-full px-4 py-2 text-left text-sm hover:bg-neutral-100 dark:hover:bg-neutral-700 flex items-center gap-2"
                              >
                                <Flag size={16} />
                                {comment.status === 'active'
                                  ? 'Ẩn'
                                  : 'Khôi phục'}
                              </button>
                              <button
                                onClick={() => {
                                  setCommentToDelete(rawComment);
                                  setShowDeleteModal(true);
                                  setActiveDropdown(null);
                                }}
                                className="w-full px-4 py-2 text-left text-sm hover:bg-neutral-100 dark:hover:bg-neutral-700 flex items-center gap-2 text-red-600"
                              >
                                <Trash2 size={16} />
                                Xóa
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Comment Content */}
                    <p className="mt-3 text-black dark:text-white">
                      {comment.content}
                    </p>

                    {/* Post Reference */}
                    <div className="mt-3 p-3 bg-neutral-50 dark:bg-neutral-800 rounded-lg border border-neutral-200 dark:border-neutral-700">
                      <p className="text-sm text-neutral-500 dark:text-neutral-400 flex items-center gap-2">
                        <MessageCircle size={14} />
                        Bình luận tại bài viết:
                      </p>
                      <p className="text-sm text-black dark:text-white mt-1 truncate">
                        "{comment.postPreview}"
                      </p>
                    </div>

                    {/* Stats */}
                    <div className="mt-3 flex items-center gap-4 text-sm text-neutral-500 dark:text-neutral-400">
                      <span className="flex items-center gap-1.5">
                        <Heart size={14} />
                        {comment.likes} lượt thích
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button
            disabled={currentPage === 1}
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            className="p-2 rounded-lg border border-neutral-200 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-800 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronLeft size={18} />
          </button>
          <span className="px-4 py-2 text-sm">Trang {currentPage}</span>
          <button
            disabled={currentPage >= (totalPages || 1)}
            onClick={() => setCurrentPage(p => p + 1)}
            className="p-2 rounded-lg border border-neutral-200 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-800 disabled:opacity-50"
          >
            <ChevronRight size={18} />
          </button>
        </div>
      </div>

      {/* View Comment Modal - Simplified for now */}
      {selectedComment && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-neutral-900 rounded-2xl w-full max-w-lg p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold">Chi tiết bình luận</h3>
              <button onClick={() => setSelectedComment(null)}>
                <X size={20} />
              </button>
            </div>
            <p>{selectedComment.content}</p>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-neutral-900 rounded-2xl w-full max-w-md p-6">
            <h2 className="text-xl font-bold mb-4">Xóa bình luận?</h2>
            <p className="mb-6">Hành động này không thể hoàn tác.</p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="flex-1 px-4 py-2 rounded-xl border"
              >
                Hủy
              </button>
              <button
                onClick={handleDelete}
                className="flex-1 px-4 py-2 rounded-xl bg-red-600 text-white"
              >
                Xóa
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
