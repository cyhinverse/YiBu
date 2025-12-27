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
  Loader2,
  RefreshCcw,
  CheckCircle,
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
      return 'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800';
    case 'hidden':
    case 'removed':
      return 'bg-rose-100 text-rose-700 border-rose-200 dark:bg-rose-900/30 dark:text-rose-400 dark:border-rose-800';
    case 'flagged':
      return 'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800';
    default:
      return 'bg-neutral-100 text-neutral-700 border-neutral-200 dark:bg-neutral-800 dark:text-neutral-400 dark:border-neutral-700';
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
          reason: 'Xóa bởi quản trị viên qua bảng điều khiển',
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
          reason: `Thay đổi trạng thái thành ${action} bởi quản trị viên`,
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

  const handleRefresh = () => {
    dispatch(
      getAllComments({
        page: currentPage,
        limit: 10,
        search: searchTerm,
        status: filterStatus || undefined,
      })
    );
  };

  // Helper to safely get display data
  const getCommentData = comment => ({
    id: comment._id || comment.id,
    content: comment.content,
    author: comment.user || {
      name: 'Ẩn danh',
      username: 'unknown',
      avatar: '/images/default-avatar.png',
    },
    postPreview: comment.post?.caption || 'Không có mô tả',
    likes: comment.likesCount || 0,
    replies: comment.repliesCount || 0,
    status: comment.isDeleted ? 'hidden' : 'active',
    createdAt: new Date(comment.createdAt).toLocaleString('vi-VN'),
    reports: 0,
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="yb-card p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-neutral-900 to-neutral-600 dark:from-white dark:to-neutral-400 bg-clip-text text-transparent">
            Quản lý bình luận
          </h1>
          <p className="text-sm text-neutral-500 mt-1">
            Theo dõi và kiểm duyệt các cuộc thảo luận trên nền tảng
          </p>
        </div>
        <button
          onClick={handleRefresh}
          disabled={loading}
          className="yb-btn yb-btn-primary h-11 w-11 !p-0 flex items-center justify-center"
          title="Lầm mới"
        >
          <RefreshCcw size={20} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search
            size={18}
            className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400"
          />
          <input
            type="text"
            placeholder="Tìm kiếm nội dung bình luận..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="yb-input pl-11"
          />
        </div>

        <select
          value={filterStatus}
          onChange={e => setFilterStatus(e.target.value)}
          className="yb-input min-w-[180px] cursor-pointer"
        >
          <option value="">Tất cả trạng thái</option>
          <option value="active">Hoạt động</option>
          <option value="hidden">Đã ẩn/xóa</option>
        </select>
      </div>

      {/* Comments List */}
      <div className="grid gap-4">
        {loading && (!comments || comments.length === 0) ? (
          <div className="yb-card py-20 flex flex-col items-center justify-center">
            <Loader2
              size={40}
              className="animate-spin text-neutral-900 dark:text-white mb-4"
            />
            <p className="text-neutral-500 font-medium">
              Đang tải bình luận...
            </p>
          </div>
        ) : !comments || comments.length === 0 ? (
          <div className="yb-card py-20 flex flex-col items-center justify-center text-neutral-500">
            <div className="w-20 h-20 rounded-full bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center mb-4">
              <MessageCircle size={40} className="opacity-20" />
            </div>
            <p className="font-bold text-lg text-neutral-900 dark:text-white">
              Không tìm thấy bình luận nào
            </p>
            <p className="text-sm">Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm</p>
          </div>
        ) : (
          comments.map(rawComment => {
            const comment = getCommentData(rawComment);
            return (
              <div
                key={comment.id}
                className="yb-card p-6 group hover:shadow-md transition-all duration-300"
              >
                <div className="flex items-start gap-4">
                  {/* Author Avatar */}
                  <img
                    src={comment.author.avatar || '/images/default-avatar.png'}
                    alt={comment.author.name}
                    className="yb-avatar w-12 h-12 !rounded-2xl border-2 border-white dark:border-neutral-800 shadow-sm flex-shrink-0"
                  />

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4 mb-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-bold text-neutral-900 dark:text-white">
                            {comment.author.name}
                          </h3>
                          <span className="text-neutral-500 dark:text-neutral-400 text-sm">
                            @{comment.author.username}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 mt-1 text-[10px] font-black uppercase tracking-widest text-neutral-400">
                          <span className="flex items-center gap-1.5">
                            <Calendar size={12} />
                            {comment.createdAt}
                          </span>
                          <span className="px-1.5 py-0.5 rounded bg-neutral-100 dark:bg-neutral-800 font-mono">
                            ID: {comment.id?.slice(-6) || '...'}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <span
                          className={`px-3 py-1 rounded-full text-[10px] font-black border uppercase tracking-widest ${getStatusStyle(
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
                            className="p-2 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-xl transition-colors text-neutral-400 hover:text-neutral-900 dark:hover:text-white"
                          >
                            <MoreHorizontal size={18} />
                          </button>

                          {activeDropdown === comment.id && (
                            <div className="absolute right-0 top-full mt-2 w-48 bg-white dark:bg-neutral-900 rounded-2xl shadow-xl border border-neutral-100 dark:border-neutral-800 py-2 z-20 overflow-hidden animate-scale-in">
                              <button
                                onClick={() => {
                                  setSelectedComment(comment);
                                  setActiveDropdown(null);
                                }}
                                className="w-full px-4 py-2 text-left text-sm font-bold hover:bg-neutral-50 dark:hover:bg-neutral-800/50 flex items-center gap-3 text-neutral-700 dark:text-neutral-300"
                              >
                                <Eye size={16} />
                                Chi tiết
                              </button>
                              <button
                                onClick={() => handleToggleStatus(rawComment)}
                                className="w-full px-4 py-2 text-left text-sm font-bold hover:bg-neutral-50 dark:hover:bg-neutral-800/50 flex items-center gap-3 text-neutral-700 dark:text-neutral-300"
                              >
                                {comment.status === 'active' ? (
                                  <>
                                    <XCircle
                                      size={16}
                                      className="text-amber-500"
                                    />
                                    <span>Ẩn bình luận</span>
                                  </>
                                ) : (
                                  <>
                                    <CheckCircle
                                      size={16}
                                      className="text-emerald-500"
                                    />
                                    <span>Khôi phục</span>
                                  </>
                                )}
                              </button>
                              <div className="h-px bg-neutral-100 dark:bg-neutral-800 my-1" />
                              <button
                                onClick={() => {
                                  setCommentToDelete(rawComment);
                                  setShowDeleteModal(true);
                                  setActiveDropdown(null);
                                }}
                                className="w-full px-4 py-2 text-left text-sm font-bold hover:bg-rose-50 dark:hover:bg-rose-900/10 flex items-center gap-3 text-rose-600"
                              >
                                <Trash2 size={16} />
                                Xóa vĩnh viễn
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Comment Content */}
                    <div className="bg-neutral-50/50 dark:bg-neutral-900/50 p-4 rounded-2xl border border-neutral-100 dark:border-neutral-800 mb-4">
                      <p className="text-neutral-700 dark:text-neutral-200 leading-relaxed italic">
                        "{comment.content}"
                      </p>
                    </div>

                    {/* Post Reference & Stats */}
                    <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-neutral-100 dark:border-neutral-800">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="p-2 rounded-lg bg-neutral-100 dark:bg-neutral-800 text-neutral-500 dark:text-neutral-400">
                          <MessageCircle size={14} />
                        </div>
                        <div className="min-w-0">
                          <p className="text-[10px] font-black text-neutral-400 uppercase tracking-widest mb-0.5">
                            Bài viết gốc
                          </p>
                          <p className="text-xs font-bold text-neutral-900 dark:text-white truncate">
                            {comment.postPreview}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-rose-50 dark:bg-rose-900/10 text-rose-600 dark:text-rose-400 text-xs font-black border border-rose-100/50 dark:border-rose-900/30">
                          <Heart
                            size={14}
                            fill="currentColor"
                            fillOpacity={0.1}
                          />
                          {comment.likes}{' '}
                          <span className="hidden sm:inline">thích</span>
                        </div>
                        {comment.replies > 0 && (
                          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-blue-50 dark:bg-blue-900/10 text-blue-600 dark:text-blue-400 text-xs font-black border border-blue-100/50 dark:border-blue-900/30">
                            <Reply size={14} />
                            {comment.replies}{' '}
                            <span className="hidden sm:inline">phản hồi</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Pagination */}
      <div className="yb-card flex items-center justify-between px-6 py-4">
        <span className="text-sm font-bold text-secondary">
          Trang {currentPage} / {totalPages || 1}
        </span>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            disabled={currentPage <= 1 || loading}
            className="w-10 h-10 flex items-center justify-center rounded-xl border border-neutral-200 dark:border-neutral-700 hover:bg-neutral-50 dark:hover:bg-neutral-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all text-neutral-600 dark:text-neutral-400"
          >
            <ChevronLeft size={18} />
          </button>
          <div className="h-10 px-4 bg-neutral-900 dark:bg-white text-white dark:text-black rounded-xl text-sm font-black flex items-center justify-center shadow-lg shadow-neutral-900/10">
            {currentPage}
          </div>
          <button
            onClick={() => setCurrentPage(p => p + 1)}
            disabled={currentPage >= (totalPages || 1) || loading}
            className="w-10 h-10 flex items-center justify-center rounded-xl border border-neutral-200 dark:border-neutral-700 hover:bg-neutral-50 dark:hover:bg-neutral-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all text-neutral-600 dark:text-neutral-400"
          >
            <ChevronRight size={18} />
          </button>
        </div>
      </div>

      {/* View Comment Modal */}
      {selectedComment && (
        <div className="fixed inset-0 bg-neutral-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="yb-card !bg-white dark:!bg-neutral-900 w-full max-w-lg shadow-2xl transform animate-scale-in overflow-hidden border-none text-center">
            <div className="p-6 border-b border-neutral-100 dark:border-neutral-800 flex items-center justify-between bg-neutral-50/50 dark:bg-neutral-800/30">
              <h2 className="text-xl font-black text-neutral-900 dark:text-white uppercase tracking-tight">
                Chi tiết bình luận
              </h2>
              <button
                onClick={() => setSelectedComment(null)}
                className="p-2 hover:bg-neutral-200 dark:hover:bg-neutral-700 rounded-full transition-colors text-neutral-500"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-8">
              <div className="flex flex-col items-center mb-6">
                <img
                  src={selectedComment.author.avatar}
                  alt={selectedComment.author.name}
                  className="yb-avatar w-20 h-20 !rounded-3xl border-4 border-white dark:border-neutral-800 shadow-xl mb-4"
                />
                <h3 className="text-lg font-black text-neutral-900 dark:text-white">
                  {selectedComment.author.name}
                </h3>
                <p className="text-sm text-neutral-500">
                  @{selectedComment.author.username}
                </p>
              </div>

              <div className="bg-neutral-50 dark:bg-neutral-800/50 p-6 rounded-3xl border border-neutral-100 dark:border-neutral-800 mb-6 text-left">
                <p className="text-lg text-neutral-800 dark:text-neutral-100 leading-relaxed italic">
                  "{selectedComment.content}"
                </p>
              </div>

              <div className="flex justify-center gap-6 mb-8">
                <div className="text-center">
                  <p className="text-[10px] font-black text-neutral-400 uppercase tracking-widest mb-1">
                    Thích
                  </p>
                  <p className="text-xl font-black text-rose-500">
                    {selectedComment.likes}
                  </p>
                </div>
                <div className="w-px h-10 bg-neutral-100 dark:bg-neutral-800" />
                <div className="text-center">
                  <p className="text-[10px] font-black text-neutral-400 uppercase tracking-widest mb-1">
                    Thời gian
                  </p>
                  <p className="text-sm font-bold text-neutral-900 dark:text-white">
                    {selectedComment.createdAt}
                  </p>
                </div>
              </div>

              <button
                onClick={() => setSelectedComment(null)}
                className="yb-btn yb-btn-primary w-full py-4 font-black shadow-lg"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-neutral-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="yb-card !bg-white dark:!bg-neutral-900 w-full max-w-md shadow-2xl p-10 overflow-hidden transform animate-scale-in border-none text-center">
            <div className="w-20 h-20 rounded-3xl bg-rose-50 dark:bg-rose-900/20 text-rose-600 flex items-center justify-center mb-6 mx-auto shadow-lg">
              <Trash2 size={36} />
            </div>

            <h2 className="text-2xl font-black text-neutral-900 dark:text-white mb-3 tracking-tight">
              Xóa bình luận?
            </h2>
            <p className="text-sm font-bold text-neutral-500 leading-relaxed mb-8">
              Hành động này sẽ xóa vĩnh viễn bình luận này khỏi hệ thống. Bạn có
              chắc chắn muốn tiếp tục?
            </p>

            <div className="flex gap-4">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="yb-btn yb-btn-secondary flex-1 py-4 font-black"
              >
                Hủy
              </button>
              <button
                onClick={handleDelete}
                className="yb-btn flex-1 py-4 font-black !bg-rose-600 hover:!bg-rose-700 !text-white !border-none shadow-xl shadow-rose-500/20"
              >
                Xác nhận xóa
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
