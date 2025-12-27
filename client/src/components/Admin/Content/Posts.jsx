import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  Search,
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
  Info,
} from 'lucide-react';
import {
  getAllPosts,
  moderatePost,
  approvePost,
  deletePost,
  getAdminPostReports,
} from '../../../redux/actions/adminActions';

const getTypeIcon = type => {
  switch (type) {
    case 'image':
      return <Image size={18} />;
    case 'video':
      return <Video size={18} />;
    default:
      return <FileText size={18} />;
  }
};

const getStatusStyle = status => {
  switch (status) {
    case 'active':
      return 'bg-success/10 text-success border-success/20';
    case 'hidden':
      return 'bg-error/10 text-error border-error/20';
    case 'pending':
      return 'bg-warning/10 text-warning border-warning/20';
    default:
      return 'bg-secondary/10 text-secondary border-secondary/20';
  }
};

export default function Posts() {
  const dispatch = useDispatch();
  const {
    posts: postsList,
    pagination,
    loading,
    currentPostReports,
  } = useSelector(state => state.admin);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [selectedPost, setSelectedPost] = useState(null);
  const [activeTab, setActiveTab] = useState('content');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [postToDelete, setPostToDelete] = useState(null);
  const [activeDropdown, setActiveDropdown] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    const params = {
      page: currentPage,
      limit: 10,
    };
    if (filterStatus !== 'all') params.status = filterStatus;
    if (filterType !== 'all') params.type = filterType;

    dispatch(getAllPosts(params));
  }, [dispatch, currentPage, filterStatus, filterType]);

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

  const handleViewDetails = post => {
    setSelectedPost(post);
    setActiveTab('content');
    dispatch(getAdminPostReports({ postId: post._id || post.id }));
  };

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
          reason: newStatus === 'hidden' ? 'Kiểm duyệt Admin' : undefined,
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
      {loading && posts.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24">
          <Loader2 size={48} className="animate-spin text-primary mb-4" />
          <p className="text-secondary font-bold">Đang tải bài viết...</p>
        </div>
      ) : posts.length === 0 ? (
        <div className="yb-card flex flex-col items-center justify-center py-32 text-secondary">
          <FileText size={64} className="mb-4 opacity-10" />
          <p className="font-bold text-lg">Không tìm thấy bài viết nào</p>
        </div>
      ) : (
        <div className="grid gap-6">
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
                className="yb-card p-6 hover:shadow-xl hover:shadow-primary/5 transition-all duration-300"
              >
                <div className="flex items-start gap-6">
                  {/* Author Avatar */}
                  <img
                    src={author.avatar || '/images/default-avatar.png'}
                    alt={author.name || author.username || 'User'}
                    className="yb-avatar w-16 h-16 border-2 border-surface shadow-md"
                  />

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4 mb-4">
                      <div>
                        <div className="flex items-center gap-3">
                          <h3 className="font-black text-primary text-lg tracking-tight">
                            {author.name || author.username || 'Nặc danh'}
                          </h3>
                          <span className="text-secondary text-sm font-bold">
                            @{author.username || 'user'}
                          </span>
                        </div>
                        <div className="flex items-center gap-4 mt-1.5 text-xs font-black text-secondary/60">
                          <span className="flex items-center gap-1.5">
                            <Calendar size={14} />
                            {post.createdAt
                              ? new Date(post.createdAt).toLocaleString('vi-VN')
                              : 'N/A'}
                          </span>
                          <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-surface-secondary text-secondary">
                            {getTypeIcon(postType)}
                            <span className="capitalize">
                              {postType === 'image'
                                ? 'Hình ảnh'
                                : postType === 'video'
                                ? 'Video'
                                : 'Văn bản'}
                            </span>
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <span
                          className={`yb-badge border font-black uppercase text-[10px] tracking-widest ${getStatusStyle(
                            post.status || 'active'
                          )}`}
                        >
                          {post.status === 'active'
                            ? 'Hoạt động'
                            : post.status === 'hidden'
                            ? 'Đã ẩn'
                            : 'Chờ duyệt'}
                        </span>

                        {(post.reportsCount || post.reports) > 0 && (
                          <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black bg-error/10 text-error border border-error/20 uppercase tracking-widest">
                            <Flag size={12} />
                            {post.reportsCount || post.reports} báo cáo
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
                            className="p-2.5 hover:bg-surface-secondary rounded-xl transition-colors text-secondary"
                          >
                            <MoreHorizontal size={20} />
                          </button>

                          {activeDropdown === (post._id || post.id) && (
                            <div className="absolute right-0 top-full mt-2 w-56 bg-surface rounded-2xl shadow-2xl border border-border py-2 z-10 overflow-hidden animate-scale-in">
                              <button
                                onClick={() => {
                                  handleViewDetails(post);
                                  setActiveDropdown(null);
                                }}
                                className="w-full px-5 py-3 text-left text-sm font-black hover:bg-surface-secondary flex items-center gap-3 text-primary transition-colors"
                              >
                                <Eye size={18} />
                                Chi tiết bài viết
                              </button>
                              {post.status === 'pending' && (
                                <button
                                  onClick={() => handleApprovePost(post)}
                                  className="w-full px-5 py-3 text-left text-sm font-black hover:bg-success/10 flex items-center gap-3 text-success transition-colors"
                                >
                                  <CheckCircle size={18} />
                                  Phê duyệt
                                </button>
                              )}
                              <button
                                onClick={() => handleToggleStatus(post)}
                                className="w-full px-5 py-3 text-left text-sm font-black hover:bg-surface-secondary flex items-center gap-3 text-primary transition-colors"
                              >
                                {post.status === 'active' ? (
                                  <>
                                    <XCircle size={18} className="text-error" />
                                    <span className="text-error">
                                      Ẩn bài viết
                                    </span>
                                  </>
                                ) : (
                                  <>
                                    <CheckCircle
                                      size={18}
                                      className="text-success"
                                    />
                                    <span className="text-success">
                                      Hiện bài viết
                                    </span>
                                  </>
                                )}
                              </button>
                              <div className="h-px bg-border my-2 mx-2" />
                              <button
                                onClick={() => {
                                  setPostToDelete(post);
                                  setShowDeleteModal(true);
                                  setActiveDropdown(null);
                                }}
                                className="w-full px-5 py-3 text-left text-sm font-black hover:bg-error/10 flex items-center gap-3 text-error transition-colors"
                              >
                                <Trash2 size={18} />
                                Xóa bài viết
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Post Content */}
                    <p className="text-primary font-bold text-base leading-relaxed line-clamp-3 mb-5">
                      {post.content || post.caption || 'Không có nội dung'}
                    </p>

                    {/* Media Preview */}
                    {mediaItems.length > 0 && (
                      <div className="flex gap-4 overflow-x-auto pb-4 mb-2 hide-scrollbar">
                        {mediaItems.slice(0, 4).map((media, idx) => {
                          const mediaUrl =
                            typeof media === 'string' ? media : media.url;
                          const isVideo =
                            typeof media === 'object'
                              ? media.type === 'video'
                              : postType === 'video';
                          return (
                            <div
                              key={idx}
                              className="relative flex-shrink-0 w-36 h-36 rounded-2xl overflow-hidden bg-surface-secondary shadow-inner"
                            >
                              <img
                                src={mediaUrl}
                                alt=""
                                className="w-full h-full object-cover"
                              />
                              {isVideo && (
                                <div className="absolute inset-0 flex items-center justify-center bg-black/30 backdrop-blur-[1px]">
                                  <Video
                                    size={36}
                                    className="text-white drop-shadow-xl"
                                  />
                                </div>
                              )}
                            </div>
                          );
                        })}
                        {mediaItems.length > 4 && (
                          <div className="flex-shrink-0 w-36 h-36 rounded-2xl bg-surface-secondary flex items-center justify-center border-2 border-dashed border-border group cursor-pointer hover:border-primary transition-colors">
                            <span className="text-secondary font-black text-xl group-hover:text-primary transition-colors">
                              +{mediaItems.length - 4}
                            </span>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Stats */}
                    <div className="flex items-center gap-8 pt-5 border-t border-border mt-2">
                      <div className="flex items-center gap-2.5 text-xs font-black text-secondary">
                        <div className="p-2 bg-success/10 rounded-xl text-success border border-success/10">
                          <Heart size={16} />
                        </div>
                        {post.likesCount || post.likes || 0} lượt thích
                      </div>
                      <div className="flex items-center gap-2.5 text-xs font-black text-secondary">
                        <div className="p-2 bg-primary/10 rounded-xl text-primary border border-primary/10">
                          <MessageCircle size={16} />
                        </div>
                        {post.commentsCount || post.comments || 0} bình luận
                      </div>
                      <div className="flex items-center gap-2.5 text-xs font-black text-secondary">
                        <div className="p-2 bg-warning/10 rounded-xl text-warning border border-warning/10">
                          <Share2 size={16} />
                        </div>
                        {post.sharesCount || post.shares || 0} chia sẻ
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

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

      {/* View Post Modal */}
      {selectedPost && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="yb-card bg-surface w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl transform animate-scale-in overflow-hidden">
            {/* Modal Header */}
            <div className="p-8 border-b border-border flex items-center justify-between shrink-0 bg-surface-secondary/30">
              <h2 className="text-2xl font-black text-primary tracking-tight">
                Chi tiết bài viết
              </h2>
              <button
                onClick={() => setSelectedPost(null)}
                className="p-2.5 hover:bg-surface-secondary rounded-full transition-colors text-secondary"
              >
                <X size={24} />
              </button>
            </div>

            {/* Tabs */}
            <div className="flex px-8 border-b border-border shrink-0 bg-surface">
              {[
                { id: 'content', label: 'Nội dung', icon: Info },
                { id: 'reports', label: 'Báo cáo', icon: Flag },
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-8 py-4 text-sm font-black transition-all border-b-2 ${
                    activeTab === tab.id
                      ? 'border-primary text-primary'
                      : 'border-transparent text-secondary hover:text-primary'
                  }`}
                >
                  <tab.icon size={18} />
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Modal Content */}
            <div className="p-8 overflow-y-auto bg-surface flex-1">
              {activeTab === 'content' && (
                <div className="space-y-8">
                  {(() => {
                    const author =
                      selectedPost.author || selectedPost.user || {};
                    const mediaItems =
                      selectedPost.media || selectedPost.images || [];
                    return (
                      <>
                        <div className="flex items-center gap-6">
                          <img
                            src={author.avatar || '/images/default-avatar.png'}
                            alt={author.name}
                            className="yb-avatar w-16 h-16 border-2 border-surface shadow-md"
                          />
                          <div>
                            <h3 className="font-black text-xl text-primary tracking-tight">
                              {author.name || author.username}
                            </h3>
                            <p className="text-secondary font-bold">
                              @{author.username} •{' '}
                              <span className="opacity-60">
                                {new Date(
                                  selectedPost.createdAt
                                ).toLocaleString('vi-VN')}
                              </span>
                            </p>
                          </div>
                        </div>

                        <div className="p-8 bg-surface-secondary/50 rounded-3xl border border-border shadow-inner">
                          <p className="text-primary font-bold text-lg leading-relaxed whitespace-pre-wrap">
                            {selectedPost.content ||
                              selectedPost.caption ||
                              'Không có nội dung'}
                          </p>
                        </div>

                        {mediaItems.length > 0 && (
                          <div
                            className={`grid gap-4 ${
                              mediaItems.length > 1
                                ? 'grid-cols-2'
                                : 'grid-cols-1'
                            }`}
                          >
                            {mediaItems.map((media, idx) => (
                              <img
                                key={idx}
                                src={
                                  typeof media === 'string' ? media : media.url
                                }
                                alt=""
                                className="w-full h-80 object-cover rounded-3xl shadow-lg border-2 border-surface"
                              />
                            ))}
                          </div>
                        )}

                        <div className="grid grid-cols-3 gap-6">
                          <div className="text-center p-6 bg-surface-secondary/50 rounded-2xl border border-border/50">
                            <p className="text-[10px] font-black text-secondary uppercase tracking-widest mb-2">
                              Thích
                            </p>
                            <p className="text-3xl font-black text-primary">
                              {selectedPost.likesCount || 0}
                            </p>
                          </div>
                          <div className="text-center p-6 bg-surface-secondary/50 rounded-2xl border border-border/50">
                            <p className="text-[10px] font-black text-secondary uppercase tracking-widest mb-2">
                              Bình luận
                            </p>
                            <p className="text-3xl font-black text-primary">
                              {selectedPost.commentsCount || 0}
                            </p>
                          </div>
                          <div className="text-center p-6 bg-surface-secondary/50 rounded-2xl border border-border/50">
                            <p className="text-[10px] font-black text-secondary uppercase tracking-widest mb-2">
                              Chia sẻ
                            </p>
                            <p className="text-3xl font-black text-primary">
                              {selectedPost.sharesCount || 0}
                            </p>
                          </div>
                        </div>
                      </>
                    );
                  })()}
                </div>
              )}

              {activeTab === 'reports' && (
                <div className="space-y-6">
                  {currentPostReports?.length > 0 ? (
                    currentPostReports.map(report => (
                      <div
                        key={report._id}
                        className="p-6 border border-error/20 bg-error/5 rounded-3xl shadow-sm"
                      >
                        <div className="flex justify-between items-start mb-4">
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-error/20 text-error rounded-xl">
                              <AlertTriangle size={20} />
                            </div>
                            <span className="text-sm font-black text-error uppercase tracking-widest bg-error/10 px-3 py-1 rounded-lg border border-error/20">
                              {report.reason}
                            </span>
                          </div>
                          <span className="text-[10px] font-black text-secondary/60 uppercase tracking-widest">
                            {new Date(report.createdAt).toLocaleDateString(
                              'vi-VN'
                            )}
                          </span>
                        </div>
                        <p className="text-primary font-bold text-sm leading-relaxed mb-6 italic">
                          &quot;
                          {report.description || 'Không có chi tiết bổ sung.'}
                          &quot;
                        </p>
                        <div className="flex items-center gap-3 text-xs font-black text-secondary border-t border-error/10 pt-4">
                          <span className="uppercase tracking-widest opacity-60">
                            Người báo cáo:
                          </span>
                          <div className="flex items-center gap-2 bg-surface px-3 py-1.5 rounded-full border border-border shadow-sm">
                            <img
                              src={
                                report.reporter?.avatar ||
                                '/images/default-avatar.png'
                              }
                              className="w-6 h-6 rounded-full object-cover border border-border shadow-sm"
                            />
                            <span className="text-primary truncate max-w-[150px]">
                              @{report.reporter?.username || 'unknown'}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="flex flex-col items-center justify-center py-20 bg-surface-secondary/20 rounded-3xl border-2 border-dashed border-border/50">
                      <CheckCircle
                        size={64}
                        className="text-success mb-4 opacity-20"
                      />
                      <p className="font-black text-primary mb-1">
                        Nội dung sạch
                      </p>
                      <p className="text-sm font-bold text-secondary">
                        Không có báo cáo nào cho bài viết này.
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-8 border-t border-border bg-surface-secondary/30 flex gap-4 shrink-0">
              <button
                onClick={() => {
                  setPostToDelete(selectedPost);
                  setShowDeleteModal(true);
                }}
                className="yb-btn flex-1 py-4 font-black bg-error hover:bg-error/90 text-white shadow-xl shadow-error/20"
              >
                Xóa bài viết
              </button>
              <button
                onClick={() => setSelectedPost(null)}
                className="yb-btn yb-btn-secondary px-10 py-4 font-black"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {showDeleteModal && postToDelete && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-[60] p-4 animate-fade-in">
          <div className="yb-card bg-surface w-full max-w-md p-10 shadow-2xl transform animate-scale-in text-center">
            <div className="flex flex-col items-center mb-8">
              <div className="w-20 h-20 rounded-3xl bg-error/20 text-error flex items-center justify-center mb-6 shadow-lg shadow-error/10">
                <Trash2 size={36} strokeWidth={3} />
              </div>
              <h2 className="text-2xl font-black text-primary mb-3 tracking-tight">
                Xóa bài viết?
              </h2>
              <p className="text-sm font-bold text-secondary px-4 leading-relaxed">
                Bạn có chắc chắn muốn xóa bài viết này không? Hành động này
                không thể hoàn tác.
              </p>
            </div>

            <div className="flex gap-4">
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setPostToDelete(null);
                }}
                className="yb-btn yb-btn-secondary flex-1 py-4 font-black"
              >
                Hủy bỏ
              </button>
              <button
                onClick={handleDelete}
                disabled={loading}
                className="yb-btn flex-1 py-4 font-black bg-error hover:bg-error/90 text-white shadow-xl shadow-error/20 flex items-center justify-center gap-2"
              >
                {loading && <Loader2 size={20} className="animate-spin" />}
                Xác nhận xóa
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
