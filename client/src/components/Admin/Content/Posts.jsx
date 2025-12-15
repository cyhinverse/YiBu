import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  Search,
  Filter,
  MoreHorizontal,
  Eye,
  Trash2,
  Flag,
  Image,
  Video,
  FileText,
  Heart,
  MessageCircle,
  Share2,
  Calendar,
  ChevronLeft,
  ChevronRight,
  X,
  AlertTriangle,
  RefreshCcw,
  Loader2,
  CheckCircle,
  XCircle,
} from 'lucide-react';
import {
  getAllPosts,
  moderatePost,
  approvePost,
  deletePost,
} from '../../../redux/actions/adminActions';

const getTypeIcon = type => {
  switch (type) {
    case 'image':
      return <Image size={16} />;
    case 'video':
      return <Video size={16} />;
    default:
      return <FileText size={16} />;
  }
};

const getStatusStyle = status => {
  switch (status) {
    case 'active':
      return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400';
    case 'hidden':
      return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400';
    case 'pending':
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
      return 'Đã ẩn';
    case 'pending':
      return 'Chờ duyệt';
    default:
      return status;
  }
};

export default function Posts() {
  const dispatch = useDispatch();
  const {
    posts: postsList,
    pagination,
    loading,
  } = useSelector(state => state.admin);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [selectedPost, setSelectedPost] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [postToDelete, setPostToDelete] = useState(null);
  const [activeDropdown, setActiveDropdown] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);

  // Fetch posts on mount and when filters change
  useEffect(() => {
    const params = {
      page: currentPage,
      limit: 10,
    };
    if (filterStatus !== 'all') params.status = filterStatus;
    if (filterType !== 'all') params.type = filterType;

    dispatch(getAllPosts(params));
  }, [dispatch, currentPage, filterStatus, filterType]);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchTerm !== undefined) {
        const params = {
          page: 1,
          limit: 10,
          search: searchTerm || undefined,
        };
        if (filterStatus !== 'all') params.status = filterStatus;
        if (filterType !== 'all') params.type = filterType;
        dispatch(getAllPosts(params));
        setCurrentPage(1);
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const posts = Array.isArray(postsList) ? postsList : [];

  const handleDelete = async () => {
    if (!postToDelete) return;
    try {
      await dispatch(deletePost(postToDelete._id || postToDelete.id)).unwrap();
      dispatch(getAllPosts({ page: currentPage, limit: 10 }));
    } catch (error) {
      console.error('Failed to delete post:', error);
    }
    setShowDeleteModal(false);
    setPostToDelete(null);
  };

  const handleToggleStatus = async post => {
    const newStatus = post.status === 'active' ? 'hidden' : 'active';
    try {
      await dispatch(
        moderatePost({
          postId: post._id || post.id,
          action: newStatus === 'hidden' ? 'hide' : 'approve',
          reason: newStatus === 'hidden' ? 'Admin moderation' : undefined,
        })
      ).unwrap();
      dispatch(getAllPosts({ page: currentPage, limit: 10 }));
    } catch (error) {
      console.error('Failed to moderate post:', error);
    }
    setActiveDropdown(null);
  };

  const handleApprovePost = async post => {
    try {
      await dispatch(approvePost(post._id || post.id)).unwrap();
      dispatch(getAllPosts({ page: currentPage, limit: 10 }));
    } catch (error) {
      console.error('Failed to approve post:', error);
    }
    setActiveDropdown(null);
  };

  const handleRefresh = () => {
    dispatch(getAllPosts({ page: currentPage, limit: 10 }));
  };

  const handlePageChange = newPage => {
    setCurrentPage(newPage);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-black dark:text-white">
            Quản lý bài viết
          </h1>
          <p className="text-neutral-500 dark:text-neutral-400 mt-1">
            {pagination?.total || posts.length} bài viết
          </p>
        </div>
        <button
          onClick={handleRefresh}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 bg-neutral-100 dark:bg-neutral-800 rounded-lg font-medium text-sm hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors disabled:opacity-50"
        >
          <RefreshCcw size={16} className={loading ? 'animate-spin' : ''} />
          Refresh
        </button>
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
            placeholder="Tìm kiếm bài viết..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-black dark:text-white focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white"
          />
        </div>

        <div className="flex gap-3">
          <select
            value={filterType}
            onChange={e => setFilterType(e.target.value)}
            className="px-4 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-black dark:text-white focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white"
          >
            <option value="all">Tất cả loại</option>
            <option value="text">Văn bản</option>
            <option value="image">Hình ảnh</option>
            <option value="video">Video</option>
          </select>

          <select
            value={filterStatus}
            onChange={e => setFilterStatus(e.target.value)}
            className="px-4 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-black dark:text-white focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white"
          >
            <option value="all">Tất cả trạng thái</option>
            <option value="active">Hoạt động</option>
            <option value="hidden">Đã ẩn</option>
            <option value="pending">Chờ duyệt</option>
          </select>
        </div>
      </div>

      {/* Posts Grid */}
      {loading && posts.length === 0 ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 size={24} className="animate-spin text-neutral-400" />
        </div>
      ) : posts.length === 0 ? (
        <div className="text-center py-12 text-neutral-500">
          Không có bài viết nào
        </div>
      ) : (
        <div className="grid gap-4">
          {posts.map(post => {
            const author = post.author || post.user || {};
            const mediaItems = post.media || post.images || [];
            const hasMedia = mediaItems.length > 0;
            const postType =
              post.type ||
              (hasMedia
                ? mediaItems[0]?.type === 'video'
                  ? 'video'
                  : 'image'
                : 'text');

            return (
              <div
                key={post._id || post.id}
                className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 p-5"
              >
                <div className="flex items-start gap-4">
                  {/* Author Avatar */}
                  <img
                    src={author.avatar || '/images/default-avatar.png'}
                    alt={author.name || author.username || 'User'}
                    className="w-12 h-12 rounded-full border-2 border-neutral-200 dark:border-neutral-700"
                  />

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-black dark:text-white">
                            {author.name || author.username || 'Unknown'}
                          </h3>
                          <span className="text-neutral-500 dark:text-neutral-400 text-sm">
                            @{author.username || 'user'}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 mt-1 text-sm text-neutral-500 dark:text-neutral-400">
                          <span className="flex items-center gap-1">
                            <Calendar size={14} />
                            {post.createdAt
                              ? new Date(post.createdAt).toLocaleString()
                              : 'N/A'}
                          </span>
                          <span className="flex items-center gap-1">
                            {getTypeIcon(postType)}
                            {postType === 'image'
                              ? 'Hình ảnh'
                              : postType === 'video'
                              ? 'Video'
                              : 'Văn bản'}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusStyle(
                            post.status || 'active'
                          )}`}
                        >
                          {getStatusText(post.status || 'active')}
                        </span>

                        {(post.reportsCount || post.reports) > 0 && (
                          <span className="flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">
                            <Flag size={12} />
                            {post.reportsCount || post.reports}
                          </span>
                        )}

                        {/* Actions Dropdown */}
                        <div className="relative">
                          <button
                            onClick={() =>
                              setActiveDropdown(
                                activeDropdown === (post._id || post.id)
                                  ? null
                                  : post._id || post.id
                              )
                            }
                            className="p-2 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg transition-colors"
                          >
                            <MoreHorizontal
                              size={18}
                              className="text-neutral-500"
                            />
                          </button>

                          {activeDropdown === (post._id || post.id) && (
                            <div className="absolute right-0 top-full mt-1 w-44 bg-white dark:bg-neutral-800 rounded-xl shadow-lg border border-neutral-200 dark:border-neutral-700 py-1 z-10">
                              <button
                                onClick={() => {
                                  setSelectedPost(post);
                                  setActiveDropdown(null);
                                }}
                                className="w-full px-4 py-2 text-left text-sm hover:bg-neutral-100 dark:hover:bg-neutral-700 flex items-center gap-2"
                              >
                                <Eye size={16} />
                                Xem chi tiết
                              </button>
                              {post.status === 'pending' && (
                                <button
                                  onClick={() => handleApprovePost(post)}
                                  className="w-full px-4 py-2 text-left text-sm hover:bg-neutral-100 dark:hover:bg-neutral-700 flex items-center gap-2 text-green-600"
                                >
                                  <CheckCircle size={16} />
                                  Phê duyệt
                                </button>
                              )}
                              <button
                                onClick={() => handleToggleStatus(post)}
                                className="w-full px-4 py-2 text-left text-sm hover:bg-neutral-100 dark:hover:bg-neutral-700 flex items-center gap-2"
                              >
                                {post.status === 'active' ? (
                                  <XCircle size={16} />
                                ) : (
                                  <CheckCircle size={16} />
                                )}
                                {post.status === 'active'
                                  ? 'Ẩn bài'
                                  : 'Hiện bài'}
                              </button>
                              <button
                                onClick={() => {
                                  setPostToDelete(post);
                                  setShowDeleteModal(true);
                                  setActiveDropdown(null);
                                }}
                                className="w-full px-4 py-2 text-left text-sm hover:bg-neutral-100 dark:hover:bg-neutral-700 flex items-center gap-2 text-red-600"
                              >
                                <Trash2 size={16} />
                                Xóa bài
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Post Content */}
                    <p className="mt-3 text-black dark:text-white line-clamp-2">
                      {post.content || post.caption || 'No content'}
                    </p>

                    {/* Media Preview */}
                    {mediaItems.length > 0 && (
                      <div className="mt-3 flex gap-2 overflow-x-auto">
                        {mediaItems.slice(0, 3).map((media, idx) => {
                          const mediaUrl =
                            typeof media === 'string' ? media : media.url;
                          const isVideo =
                            typeof media === 'object'
                              ? media.type === 'video'
                              : postType === 'video';
                          return (
                            <div
                              key={idx}
                              className="relative flex-shrink-0 w-24 h-24 rounded-lg overflow-hidden bg-neutral-100 dark:bg-neutral-800"
                            >
                              <img
                                src={mediaUrl}
                                alt=""
                                className="w-full h-full object-cover"
                              />
                              {isVideo && (
                                <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                                  <Video size={24} className="text-white" />
                                </div>
                              )}
                            </div>
                          );
                        })}
                        {mediaItems.length > 3 && (
                          <div className="flex-shrink-0 w-24 h-24 rounded-lg bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center">
                            <span className="text-neutral-500 dark:text-neutral-400 font-medium">
                              +{mediaItems.length - 3}
                            </span>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Stats */}
                    <div className="mt-4 flex items-center gap-6 text-sm text-neutral-500 dark:text-neutral-400">
                      <span className="flex items-center gap-1.5">
                        <Heart size={16} />
                        {post.likesCount || post.likes || 0}
                      </span>
                      <span className="flex items-center gap-1.5">
                        <MessageCircle size={16} />
                        {post.commentsCount || post.comments || 0}
                      </span>
                      <span className="flex items-center gap-1.5">
                        <Share2 size={16} />
                        {post.sharesCount || post.shares || 0}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-neutral-500 dark:text-neutral-400">
          Page {currentPage} of {pagination?.pages || 1} (
          {pagination?.total || posts.length} posts)
        </p>
        <div className="flex items-center gap-2">
          <button
            disabled={currentPage <= 1}
            onClick={() => handlePageChange(currentPage - 1)}
            className="p-2 rounded-lg border border-neutral-200 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-800 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronLeft size={18} />
          </button>
          <span className="px-4 py-2 text-sm">Trang {currentPage}</span>
          <button
            disabled={currentPage >= (pagination?.pages || 1)}
            onClick={() => handlePageChange(currentPage + 1)}
            className="p-2 rounded-lg border border-neutral-200 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-800 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronRight size={18} />
          </button>
        </div>
      </div>

      {/* View Post Modal */}
      {selectedPost && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-neutral-900 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-black dark:text-white">
                  Chi tiết bài viết
                </h2>
                <button
                  onClick={() => setSelectedPost(null)}
                  className="p-2 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg"
                >
                  <X size={20} />
                </button>
              </div>

              {(() => {
                const author = selectedPost.author || selectedPost.user || {};
                const mediaItems =
                  selectedPost.media || selectedPost.images || [];
                return (
                  <>
                    <div className="flex items-center gap-3 mb-4">
                      <img
                        src={author.avatar || '/images/default-avatar.png'}
                        alt={author.name || author.username || 'User'}
                        className="w-12 h-12 rounded-full border-2 border-neutral-200 dark:border-neutral-700"
                      />
                      <div>
                        <h3 className="font-semibold text-black dark:text-white">
                          {author.name || author.username || 'Unknown'}
                        </h3>
                        <p className="text-sm text-neutral-500 dark:text-neutral-400">
                          @{author.username || 'user'} •{' '}
                          {selectedPost.createdAt
                            ? new Date(selectedPost.createdAt).toLocaleString()
                            : 'N/A'}
                        </p>
                      </div>
                    </div>

                    <p className="text-black dark:text-white mb-4">
                      {selectedPost.content ||
                        selectedPost.caption ||
                        'No content'}
                    </p>

                    {mediaItems.length > 0 && (
                      <div className="grid grid-cols-2 gap-2 mb-4">
                        {mediaItems.map((media, idx) => {
                          const mediaUrl =
                            typeof media === 'string' ? media : media.url;
                          return (
                            <img
                              key={idx}
                              src={mediaUrl}
                              alt=""
                              className="w-full h-48 object-cover rounded-lg"
                            />
                          );
                        })}
                      </div>
                    )}

                    <div className="flex items-center gap-6 text-neutral-500 dark:text-neutral-400 border-t border-neutral-200 dark:border-neutral-700 pt-4">
                      <span className="flex items-center gap-1.5">
                        <Heart size={18} />{' '}
                        {selectedPost.likesCount || selectedPost.likes || 0}{' '}
                        lượt thích
                      </span>
                      <span className="flex items-center gap-1.5">
                        <MessageCircle size={18} />{' '}
                        {selectedPost.commentsCount ||
                          selectedPost.comments ||
                          0}{' '}
                        bình luận
                      </span>
                      <span className="flex items-center gap-1.5">
                        <Share2 size={18} />{' '}
                        {selectedPost.sharesCount || selectedPost.shares || 0}{' '}
                        chia sẻ
                      </span>
                    </div>
                  </>
                );
              })()}
            </div>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {showDeleteModal && postToDelete && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-neutral-900 rounded-2xl w-full max-w-md p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 rounded-full bg-red-100 dark:bg-red-900/30">
                <AlertTriangle size={24} className="text-red-600" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-black dark:text-white">
                  Xóa bài viết
                </h2>
                <p className="text-neutral-500 dark:text-neutral-400 text-sm">
                  Hành động này không thể hoàn tác
                </p>
              </div>
            </div>

            <p className="text-neutral-600 dark:text-neutral-400 mb-6">
              Bạn có chắc chắn muốn xóa bài viết của{' '}
              <strong className="text-black dark:text-white">
                {postToDelete?.author?.name ||
                  postToDelete?.user?.name ||
                  postToDelete?.user?.username ||
                  'this user'}
              </strong>
              ?
            </p>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setPostToDelete(null);
                }}
                className="flex-1 px-4 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
              >
                Hủy
              </button>
              <button
                onClick={handleDelete}
                disabled={loading}
                className="flex-1 px-4 py-2.5 rounded-xl bg-red-600 text-white hover:bg-red-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {loading && <Loader2 size={16} className="animate-spin" />}
                Xóa
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
