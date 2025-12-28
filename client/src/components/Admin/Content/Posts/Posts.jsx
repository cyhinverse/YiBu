import { useState, useEffect } from 'react';
import { useDebounce } from '@/hooks/useDebounce';
import { Search, RefreshCcw, ChevronLeft, ChevronRight } from 'lucide-react';
import {
  useAdminPosts,
  useDeletePost,
  useModeratePost,
  useAdminPostReports,
} from '@/hooks/useAdminQuery';
import PostsGrid from './PostsGrid';
import PostDetailModal from './PostDetailModal';
import {
  DeletePostModal,
  ModeratePostModal,
  PostReportsModal,
} from './PostActionModal';

export default function Posts() {
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearch = useDebounce(searchTerm, 500);
  const [currentPage, setCurrentPage] = useState(1);
  const [filterType, setFilterType] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [selectedPost, setSelectedPost] = useState(null);
  const [activeDropdown, setActiveDropdown] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [postToDelete, setPostToDelete] = useState(null);
  const [showReportsModal, setShowReportsModal] = useState(false);
  const [showModerateModal, setShowModerateModal] = useState(false);
  const [moderateAction, setModerateAction] = useState({
    action: '',
    reason: '',
  });

  // Reset page on search
  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearch]);

  // Queries
  const {
    data: postsData,
    isLoading: postsLoading,
    refetch: refetchPosts,
  } = useAdminPosts({
    page: currentPage,
    limit: 10,
    search: debouncedSearch || undefined,
    status: filterStatus !== 'all' ? filterStatus : undefined,
    type: filterType !== 'all' ? filterType : undefined,
  });

  const postsList = Array.isArray(postsData?.posts)
    ? postsData.posts
    : Array.isArray(postsData?.data)
    ? postsData.data
    : [];
  const pagination = {
    pages: postsData?.totalPages || postsData?.pages || 1,
  };

  // Post Reports Query
  const { data: reportsData } = useAdminPostReports({
    postId: selectedPost?._id || selectedPost?.id,
  });
  const currentPostReports = reportsData?.reports || [];

  // Mutations
  const deleteMutation = useDeletePost();
  const moderateMutation = useModeratePost();

  const loading = postsLoading;

  const posts = Array.isArray(postsList) ? postsList : [];

  const handleViewDetails = post => {
    setSelectedPost(post);
  };

  const handleDelete = async () => {
    if (!postToDelete) return;
    try {
      await deleteMutation.mutateAsync(postToDelete._id || postToDelete.id);
    } catch (error) {
      console.error('Failed to delete post:', error);
    }
    setShowDeleteModal(false);
    setPostToDelete(null);
  };

  const handleToggleStatus = post => {
    setSelectedPost(post);
    setModerateAction({
      action: post.status === 'active' ? 'hide' : 'approve',
      reason: '',
    });
    setShowModerateModal(true);
    setActiveDropdown(null);
  };

  const handleModerateSubmit = async () => {
    if (!selectedPost) return;
    try {
      await moderateMutation.mutateAsync({
        postId: selectedPost._id || selectedPost.id,
        action: moderateAction.action,
        reason: moderateAction.reason || 'Kiểm duyệt Admin',
      });
      setShowModerateModal(false);
      setSelectedPost(null);
    } catch (error) {
      console.error('Failed to moderate post:', error);
    }
  };

  const handleApprovePost = post => {
    setSelectedPost(post);
    setModerateAction({
      action: 'approve',
      reason: '',
    });
    setShowModerateModal(true);
    setActiveDropdown(null);
  };

  const handleRefresh = () => {
    refetchPosts();
  };

  const handlePageChange = newPage => {
    setCurrentPage(newPage);
  };

  return (
    <div className="space-y-8 font-sans">
      {/* Header */}
      <div className="yb-card p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-surface-secondary/30">
        <div>
          <h2 className="text-2xl font-black text-primary tracking-tight">
            Quản lý bài viết
          </h2>
          <p className="text-sm text-secondary font-medium mt-1">
            Kiểm duyệt và quản lý nội dung người dùng
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
            placeholder="Tìm kiếm bài viết..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="yb-input pl-12 w-full text-sm"
          />
        </div>

        <div className="flex gap-3">
          <select
            value={filterType}
            onChange={e => setFilterType(e.target.value)}
            className="yb-input px-4 min-w-[140px] text-sm font-bold cursor-pointer"
          >
            <option value="all">Tất cả loại</option>
            <option value="text">Văn bản</option>
            <option value="image">Hình ảnh</option>
            <option value="video">Video</option>
          </select>

          <select
            value={filterStatus}
            onChange={e => setFilterStatus(e.target.value)}
            className="yb-input px-4 min-w-[140px] text-sm font-bold cursor-pointer"
          >
            <option value="all">Tất cả trạng thái</option>
            <option value="active">Hoạt động</option>
            <option value="hidden">Đã ẩn</option>
            <option value="pending">Chờ duyệt</option>
          </select>
        </div>
      </div>

      {/* Posts Grid */}
      <PostsGrid
        loading={loading}
        posts={posts}
        activeDropdown={activeDropdown}
        setActiveDropdown={setActiveDropdown}
        onViewDetails={handleViewDetails}
        onApprove={handleApprovePost}
        onToggleStatus={handleToggleStatus}
        onDelete={post => {
          setPostToDelete(post);
          setShowDeleteModal(true);
        }}
        onViewReports={post => {
          setSelectedPost(post);
          setShowReportsModal(true);
        }}
      />

      {/* Pagination */}
      <div className="yb-card flex items-center justify-between px-8 py-6 bg-surface-secondary/20 border-border">
        <span className="text-sm font-bold text-secondary">
          Trang {currentPage} / {pagination?.pages || 1}
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
            disabled={currentPage >= (pagination?.pages || 1) || loading}
            onClick={() => handlePageChange(currentPage + 1)}
            className="yb-btn yb-btn-secondary p-2.5 disabled:opacity-30 shadow-sm"
          >
            <ChevronRight size={20} />
          </button>
        </div>
      </div>

      {/* Modals */}
      {selectedPost &&
        !showReportsModal &&
        !showModerateModal &&
        !showDeleteModal && (
          <PostDetailModal
            post={selectedPost}
            isOpen={true}
            onClose={() => setSelectedPost(null)}
            reports={currentPostReports}
            onToggleStatus={() => handleToggleStatus(selectedPost)}
            onDelete={() => {
              setPostToDelete(selectedPost);
              setShowDeleteModal(true);
            }}
          />
        )}

      <PostReportsModal
        isOpen={showReportsModal}
        onClose={() => setShowReportsModal(false)}
        reports={currentPostReports}
      />

      <ModeratePostModal
        isOpen={showModerateModal}
        onClose={() => setShowModerateModal(false)}
        onConfirm={handleModerateSubmit}
        loading={moderateMutation.isLoading}
        action={moderateAction.action}
        reason={moderateAction.reason}
        setReason={val => setModerateAction(prev => ({ ...prev, reason: val }))}
      />

      <DeletePostModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleDelete}
        loading={deleteMutation.isLoading}
        post={postToDelete}
      />
    </div>
  );
}
