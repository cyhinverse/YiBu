import React from 'react';
import {
  Image,
  Video,
  FileText,
  Calendar,
  Heart,
  MessageCircle,
  Share2,
  Flag,
  MoreHorizontal,
  Eye,
  CheckCircle,
  XCircle,
  Trash2,
  Loader2,
} from 'lucide-react';

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

export default function PostsGrid({
  loading,
  posts,
  activeDropdown,
  setActiveDropdown,
  onViewDetails,
  onApprove,
  onToggleStatus,
  onDelete,
  onViewReports,
}) {
  if (loading && posts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24">
        <Loader2 size={48} className="animate-spin text-primary mb-4" />
        <p className="text-secondary font-bold">Đang tải bài viết...</p>
      </div>
    );
  }

  if (posts.length === 0) {
    return (
      <div className="yb-card flex flex-col items-center justify-center py-32 text-secondary">
        <FileText size={64} className="mb-4 opacity-10" />
        <p className="font-bold text-lg">Không tìm thấy bài viết nào</p>
      </div>
    );
  }

  return (
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
                      <button
                        onClick={() => onViewReports(post)}
                        className="flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black bg-error/10 text-error border border-error/20 uppercase tracking-widest hover:bg-error/20 transition-colors"
                      >
                        <Flag size={12} />
                        {post.reportsCount || post.reports} báo cáo
                      </button>
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
                              onViewDetails(post);
                              setActiveDropdown(null);
                            }}
                            className="w-full px-5 py-3 text-left text-sm font-black hover:bg-surface-secondary flex items-center gap-3 text-primary transition-colors"
                          >
                            <Eye size={18} />
                            Chi tiết bài viết
                          </button>
                          {post.status === 'pending' && (
                            <button
                              onClick={() => {
                                onApprove(post);
                                setActiveDropdown(null);
                              }}
                              className="w-full px-5 py-3 text-left text-sm font-black hover:bg-success/10 flex items-center gap-3 text-success transition-colors"
                            >
                              <CheckCircle size={18} />
                              Phê duyệt
                            </button>
                          )}
                          <button
                            onClick={() => {
                              onToggleStatus(post);
                              setActiveDropdown(null);
                            }}
                            className="w-full px-5 py-3 text-left text-sm font-black hover:bg-surface-secondary flex items-center gap-3 text-primary transition-colors"
                          >
                            {post.status === 'active' ? (
                              <>
                                <XCircle size={18} className="text-error" />
                                <span className="text-error">Ẩn bài viết</span>
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
                              onDelete(post);
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
  );
}
