import { useId, useState, useEffect } from 'react';
import { useDebounce } from '@/hooks/useDebounce';
import {
  Search,
  RefreshCcw,
  ChevronDown,
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
import AdminPagination from '@/components/Admin/Shared/AdminPagination.jsx';

export default function Posts() {
  const postsSearchId = useId();
  const postsTypeId = useId();
  const postsStatusId = useId();

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
  }, [debouncedSearch, filterType, filterStatus]);

  // Queries
  const {
    data: postsData,
    isLoading: postsLoading,
    refetch: refetchPosts,
  } = useAdminPosts({
    page: currentPage,
    limit: 10,
    status: filterStatus !== 'all' ? filterStatus : undefined,
    type: filterType !== 'all' ? filterType : undefined,
  });

  const postsList = Array.isArray(postsData?.posts)
    ? postsData.posts
    : Array.isArray(postsData?.data)
    ? postsData.data
    : [];
  const normalizedSearch = debouncedSearch.trim().toLowerCase();
  const isLocalSearching = Boolean(normalizedSearch);
  const filteredPosts = isLocalSearching
    ? postsList.filter(post => {
        const searchableText = [
          post.content,
          post.caption,
          post.user?.name,
          post.user?.username,
          post.author?.name,
          post.author?.username,
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();
        return searchableText.includes(normalizedSearch);
      })
    : postsList;
  const pagination = {
    pages: isLocalSearching
      ? 1
      : postsData?.totalPages || postsData?.pages || 1,
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

  const posts = Array.isArray(filteredPosts) ? filteredPosts : [];

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
      action: post.status === 'active' ? 'hide' : 'unhide',
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
        reason:
          moderateAction.reason ||
          (moderateAction.action === 'hide' ? 'Ẩn bởi quản trị' : ''),
      });
      setShowModerateModal(false);
      setSelectedPost(null);
    } catch (error) {
      console.error('Failed to moderate post:', error);
    }
  };

  const handleRefresh = () => {
    refetchPosts();
  };

  const handlePageChange = newPage => {
    setCurrentPage(newPage);
  };

  return (
    <div className="admin-page">
      {/* Header */}
      <div className="admin-card p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--color-text-tertiary)]">
            Nội dung
          </p>
          <h2 className="text-2xl font-semibold text-[var(--color-content)]">
            Quản lý bài viết
          </h2>
          <p className="text-sm text-[var(--color-text-secondary)] mt-1">
            Giám sát và xử lý báo cáo nội dung
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleRefresh}
            onKeyDown={event => {
              if (event.key === 'Escape') {
                event.currentTarget.blur();
              }
            }}
            className="p-2 rounded-lg bg-[var(--color-surface-secondary)] text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-hover)] transition-colors"
            aria-label="Làm mới bài viết"
          >
            <RefreshCcw size={20} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="admin-card p-4 flex flex-col md:flex-row gap-3 md:items-center">
        <div className="relative flex-1 w-full">
          <label htmlFor={postsSearchId} className="sr-only">
            Tìm kiếm bài viết
          </label>
          <Search
            size={16}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--color-text-tertiary)]"
          />
          <input
            id={postsSearchId}
            type="text"
            placeholder="Tìm kiếm bài viết..."
            value={searchTerm}
            aria-label="Search posts"
            onChange={e => setSearchTerm(e.target.value)}
            className="admin-input w-full pl-10"
          />
        </div>
        <div className="flex gap-2 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
          <div className="relative min-w-[160px]">
            <label htmlFor={postsTypeId} className="sr-only">
              Lọc loại bài viết
            </label>
            <Filter
              size={16}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--color-text-tertiary)] pointer-events-none"
            />
            <select
              id={postsTypeId}
              value={filterType}
              onChange={e => setFilterType(e.target.value)}
              className="admin-select w-full pl-9 pr-9 appearance-none cursor-pointer"
            >
              <option value="all">Tất cả loại</option>
              <option value="text">Văn bản</option>
              <option value="image">Hình ảnh</option>
              <option value="video">Video</option>
            </select>
            <ChevronDown
              size={16}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-text-tertiary)] pointer-events-none"
            />
          </div>

          <div className="relative min-w-[180px]">
            <label htmlFor={postsStatusId} className="sr-only">
              Lọc trạng thái bài viết
            </label>
            <Filter
              size={16}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--color-text-tertiary)] pointer-events-none"
            />
            <select
              id={postsStatusId}
              value={filterStatus}
              onChange={e => setFilterStatus(e.target.value)}
              className="admin-select w-full pl-9 pr-9 appearance-none cursor-pointer"
            >
              <option value="all">Tất cả trạng thái</option>
              <option value="active">Hoạt động</option>
              <option value="hidden">Đã ẩn</option>
              <option value="flagged">Bị gắn cờ</option>
              <option value="deleted">Đã xóa</option>
            </select>
            <ChevronDown
              size={16}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-text-tertiary)] pointer-events-none"
            />
          </div>
        </div>
      </div>

      {/* Posts Grid */}
      <div className="admin-card p-4">
        <PostsGrid
          loading={loading}
          posts={posts}
          activeDropdown={activeDropdown}
          setActiveDropdown={setActiveDropdown}
          onViewDetails={handleViewDetails}
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
      </div>

      {/* Pagination */}
      <AdminPagination
        currentPage={currentPage}
        totalPages={pagination?.pages || 1}
        canPrev={currentPage > 1 && !loading}
        canNext={currentPage < (pagination?.pages || 1) && !loading}
        onPrev={() => handlePageChange(currentPage - 1)}
        onNext={() => handlePageChange(currentPage + 1)}
      />


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
