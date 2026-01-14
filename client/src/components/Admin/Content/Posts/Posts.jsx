import { useState, useEffect } from 'react';
import { useDebounce } from '@/hooks/useDebounce';
import {
  Search,
  RefreshCcw,
  ChevronLeft,
  ChevronRight,
  Filter,
} from 'lucide-react';
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
    <div className="space-y-6 font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-neutral-900 dark:text-white tracking-tight">
            Quản lý bài viết
          </h2>
          <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">
            Kiểm duyệt và quản lý nội dung người dùng
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleRefresh}
            className="p-2 bg-neutral-100 dark:bg-neutral-800 rounded-full text-neutral-500 hover:text-black dark:text-neutral-400 dark:hover:text-white transition-colors"
          >
            <RefreshCcw size={20} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-neutral-900 rounded-3xl p-4 shadow-sm flex flex-col md:flex-row gap-4 items-center">
        <div className="relative flex-1 w-full md:w-auto">
          <Search
            size={18}
            className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400"
          />
          <input
            type="text"
            placeholder="Tìm kiếm bài viết..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-11 pr-4 py-2.5 bg-neutral-100 dark:bg-neutral-800 border-none rounded-full text-sm font-medium focus:ring-2 focus:ring-neutral-200 dark:focus:ring-neutral-700 outline-none transition-all placeholder:text-neutral-400"
          />
        </div>
        <div className="flex gap-2 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
          <div className="relative min-w-[140px]">
            <Filter
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500 pointer-events-none"
            />
            <select
              value={filterType}
              onChange={e => setFilterType(e.target.value)}
              className="w-full pl-9 pr-8 py-2.5 bg-neutral-100 dark:bg-neutral-800 rounded-full text-sm font-medium text-neutral-700 dark:text-neutral-300 focus:outline-none focus:ring-2 focus:ring-primary/50 cursor-pointer appearance-none hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors"
            >
              <option value="all">Tất cả loại</option>
              <option value="text">Văn bản</option>
              <option value="image">Hình ảnh</option>
              <option value="video">Video</option>
            </select>
          </div>

          <div className="relative min-w-[150px]">
            <Filter
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500 pointer-events-none"
            />
            <select
              value={filterStatus}
              onChange={e => setFilterStatus(e.target.value)}
              className="w-full pl-9 pr-8 py-2.5 bg-neutral-100 dark:bg-neutral-800 rounded-full text-sm font-medium text-neutral-700 dark:text-neutral-300 focus:outline-none focus:ring-2 focus:ring-primary/50 cursor-pointer appearance-none hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors"
            >
              <option value="all">Tất cả trạng thái</option>
              <option value="active">Hoạt động</option>
              <option value="hidden">Đã ẩn</option>
              <option value="pending">Chờ duyệt</option>
            </select>
          </div>
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
      <div className="flex items-center justify-between px-4 py-2">
        <span className="text-sm text-neutral-500">
          Trang {currentPage} / {pagination?.pages || 1}
        </span>
        <div className="flex items-center gap-2">
          <button
            disabled={currentPage <= 1 || loading}
            onClick={() => handlePageChange(currentPage - 1)}
            className="p-2 rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-600 dark:text-neutral-400 disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
          >
            <ChevronLeft size={20} />
          </button>
          <div className="px-4 py-1.5 bg-black text-white dark:bg-white dark:text-black rounded-full text-sm font-bold shadow-sm">
            {currentPage}
          </div>
          <button
            disabled={currentPage >= (pagination?.pages || 1) || loading}
            onClick={() => handlePageChange(currentPage + 1)}
            className="p-2 rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-600 dark:text-neutral-400 disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
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
