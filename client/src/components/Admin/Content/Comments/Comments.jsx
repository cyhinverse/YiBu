import { useState, useEffect } from 'react';
import { useDebounce } from '@/hooks/useDebounce';
import { Search, RefreshCcw, ChevronLeft, ChevronRight } from 'lucide-react';
import {
  useAdminComments,
  useModerateComment,
  useDeleteCommentAdmin,
} from '@/hooks/useAdminQuery';
import { toast } from 'react-hot-toast';

import CommentsTable from './CommentsTable';
import { DeleteCommentModal, CommentDetailModal } from './CommentActionModal';

export default function Comments() {
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearch = useDebounce(searchTerm, 500);
  const [filterStatus, setFilterStatus] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [activeDropdown, setActiveDropdown] = useState(null);
  const [selectedComment, setSelectedComment] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [commentToDelete, setCommentToDelete] = useState(null);

  // Reset page on search
  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearch]);

  // Query
  const {
    data: commentsData,
    isLoading: loading,
    refetch,
  } = useAdminComments({
    page: currentPage,
    limit: 10,
    search: debouncedSearch || undefined,
    status: filterStatus || undefined,
  });

  const { mutate: moderateComment } = useModerateComment();
  const { mutate: deleteComment, isLoading: isDeleting } =
    useDeleteCommentAdmin();

  const comments = Array.isArray(commentsData?.comments)
    ? commentsData.comments
    : Array.isArray(commentsData?.data)
    ? commentsData.data
    : [];
  const totalPages = commentsData?.totalPages || 1;

  const handleDelete = () => {
    if (!commentToDelete) return;
    deleteComment(
      {
        commentId: commentToDelete._id || commentToDelete.id,
        reason: 'Xóa bởi quản trị viên qua bảng điều khiển',
      },
      {
        onSuccess: () => {
          setShowDeleteModal(false);
          setCommentToDelete(null);
          toast.success('Đã xóa bình luận thành công');
        },
        onError: () => {
          toast.error('Có lỗi xảy ra khi xóa bình luận');
        },
      }
    );
  };

  const handleModerate = (comment, status) => {
    moderateComment({
      commentId: comment._id || comment.id,
      action: status === 'active' ? 'restore' : 'hide',
      reason: 'Kiểm duyệt bởi quản trị viên',
    });
  };

  const handleViewDetails = comment => {
    setSelectedComment(comment);
    setShowDetailModal(true);
  };

  const handlePageChange = newPage => {
    setCurrentPage(newPage);
  };

  const handleRefresh = () => {
    refetch();
  };

  return (
    <div className="space-y-8 font-sans">
      {/* Header */}
      <div className="yb-card p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-surface-secondary/30">
        <div>
          <h2 className="text-2xl font-black text-primary tracking-tight">
            Quản lý bình luận
          </h2>
          <p className="text-sm text-secondary font-medium mt-1">
            Kiểm duyệt và quản lý tương tác người dùng
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleRefresh}
            disabled={loading}
            className="yb-btn yb-btn-primary p-2.5 shadow-lg shadow-primary/10"
          >
            <RefreshCcw size={20} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col lg:flex-row gap-4">
        <div className="relative flex-1 group">
          <Search
            size={20}
            className="absolute left-4 top-1/2 -translate-y-1/2 text-secondary group-focus-within:text-primary transition-colors"
          />
          <input
            type="text"
            placeholder="Tìm kiếm nội dung, tác giả..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="yb-input pl-12 w-full text-sm"
          />
        </div>

        <div className="flex gap-3">
          <select
            value={filterStatus}
            onChange={e => setFilterStatus(e.target.value)}
            className="yb-input px-4 min-w-[140px] text-sm font-bold cursor-pointer"
          >
            <option value="">Tất cả trạng thái</option>
            <option value="active">Hoạt động</option>
            <option value="hidden">Đã ẩn</option>
            <option value="flagged">Bị báo cáo</option>
          </select>
        </div>
      </div>

      {/* Comments Table */}
      <CommentsTable
        comments={comments}
        loading={loading}
        activeDropdown={activeDropdown}
        setActiveDropdown={setActiveDropdown}
        onViewDetails={handleViewDetails}
        onModerate={handleModerate}
        onDelete={comment => {
          setCommentToDelete(comment);
          setShowDeleteModal(true);
        }}
      />

      {/* Pagination */}
      <div className="yb-card flex items-center justify-between px-8 py-6 bg-surface-secondary/20 border-border">
        <span className="text-sm font-bold text-secondary">
          Trang {currentPage} / {totalPages}
        </span>
        <div className="flex items-center gap-3">
          <button
            disabled={currentPage <= 1 || loading}
            onClick={() => handlePageChange(currentPage - 1)}
            className="yb-btn yb-btn-secondary p-2.5 disabled:opacity-30 shadow-sm"
          >
            <ChevronLeft size={20} />
          </button>
          <div className="px-5 py-2.5 bg-surface rounded-xl border border-border text-sm font-black text-primary shadow-sm min-w-[3rem] text-center">
            {currentPage}
          </div>
          <button
            disabled={currentPage >= totalPages || loading}
            onClick={() => handlePageChange(currentPage + 1)}
            className="yb-btn yb-btn-secondary p-2.5 disabled:opacity-30 shadow-sm"
          >
            <ChevronRight size={20} />
          </button>
        </div>
      </div>

      {/* Modals */}
      <CommentDetailModal
        isOpen={showDetailModal}
        onClose={() => setShowDetailModal(false)}
        comment={selectedComment}
      />

      <DeleteCommentModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleDelete}
        loading={isDeleting}
        comment={commentToDelete}
      />
    </div>
  );
}
