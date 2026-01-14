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
      return <Image size={16} strokeWidth={1.5} />;
    case 'video':
      return <Video size={16} strokeWidth={1.5} />;
    default:
      return <FileText size={16} strokeWidth={1.5} />;
  }
};

const getStatusStyle = status => {
  switch (status) {
    case 'active':
      return 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400';
    case 'hidden':
      return 'bg-rose-50 text-rose-600 dark:bg-rose-900/20 dark:text-rose-400';
    case 'pending':
      return 'bg-amber-50 text-amber-600 dark:bg-amber-900/20 dark:text-amber-400';
    default:
      return 'bg-neutral-50 text-neutral-600 dark:bg-neutral-800/50 dark:text-neutral-400';
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
        <Loader2 size={40} className="animate-spin text-neutral-500 mb-4" />
        <p className="text-neutral-500 font-medium">Đang tải bài viết...</p>
      </div>
    );
  }

  if (posts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-32 text-neutral-400">
        <FileText size={64} className="mb-4 opacity-10" />
        <p className="font-medium text-lg">Không tìm thấy bài viết nào</p>
      </div>
    );
  }

  return (
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
            className="bg-white dark:bg-neutral-900 rounded-3xl p-5 shadow-sm hover:shadow-md transition-all duration-300"
          >
            <div className="flex items-start gap-5">
              {/* Author Avatar */}
              <img
                src={author.avatar || '/images/default-avatar.png'}
                alt={author.name || author.username || 'User'}
                className="w-12 h-12 rounded-full object-cover"
              />

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-4 mb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-neutral-900 dark:text-white text-base">
                        {author.name || author.username || 'Nặc danh'}
                      </h3>
                      <span className="text-neutral-500 text-sm">
                        @{author.username || 'user'}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 mt-1 text-xs font-medium text-neutral-500">
                      <span className="flex items-center gap-1">
                        <Calendar size={12} strokeWidth={1.5} />
                        {post.createdAt
                          ? new Date(post.createdAt).toLocaleDateString('vi-VN')
                          : 'N/A'}
                      </span>
                      <span className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400">
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

                  <div className="flex items-center gap-2">
                    <span
                      className={`px-2.5 py-1 rounded-full text-xs font-medium ${getStatusStyle(
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
                        className="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-rose-50 text-rose-600 dark:bg-rose-900/20 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-900/40 transition-colors"
                      >
                        <Flag size={12} />
                        {post.reportsCount || post.reports}
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
                        className="p-2 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-full transition-colors text-neutral-500"
                      >
                        <MoreHorizontal size={20} />
                      </button>

                      {activeDropdown === (post._id || post.id) && (
                        <div className="absolute right-0 top-full mt-2 w-48 bg-white dark:bg-neutral-900 rounded-xl shadow-xl py-1.5 z-10 overflow-hidden animate-scale-in">
                          <button
                            onClick={() => {
                              onViewDetails(post);
                              setActiveDropdown(null);
                            }}
                            className="w-full px-4 py-2.5 text-left text-sm font-medium hover:bg-neutral-50 dark:hover:bg-neutral-800 flex items-center gap-2.5 text-neutral-700 dark:text-neutral-200 transition-colors"
                          >
                            <Eye size={16} />
                            Chi tiết bài viết
                          </button>
                          {post.status === 'pending' && (
                            <button
                              onClick={() => {
                                onApprove(post);
                                setActiveDropdown(null);
                              }}
                              className="w-full px-4 py-2.5 text-left text-sm font-medium hover:bg-emerald-50 dark:hover:bg-emerald-900/20 flex items-center gap-2.5 text-emerald-600 dark:text-emerald-400 transition-colors"
                            >
                              <CheckCircle size={16} />
                              Phê duyệt
                            </button>
                          )}
                          <button
                            onClick={() => {
                              onToggleStatus(post);
                              setActiveDropdown(null);
                            }}
                            className="w-full px-4 py-2.5 text-left text-sm font-medium hover:bg-neutral-50 dark:hover:bg-neutral-800 flex items-center gap-2.5 text-neutral-700 dark:text-neutral-200 transition-colors"
                          >
                            {post.status === 'active' ? (
                              <>
                                <XCircle size={16} className="text-rose-500" />
                                <span className="text-rose-500">
                                  Ẩn bài viết
                                </span>
                              </>
                            ) : (
                              <>
                                <CheckCircle
                                  size={16}
                                  className="text-emerald-500"
                                />
                                <span className="text-emerald-500">
                                  Hiện bài viết
                                </span>
                              </>
                            )}
                          </button>
                          <div className="h-px bg-neutral-100 dark:bg-neutral-800 my-1 mx-2" />
                          <button
                            onClick={() => {
                              onDelete(post);
                              setActiveDropdown(null);
                            }}
                            className="w-full px-4 py-2.5 text-left text-sm font-medium hover:bg-rose-50 dark:hover:bg-rose-900/20 flex items-center gap-2.5 text-rose-500 transition-colors"
                          >
                            <Trash2 size={16} />
                            Xóa bài viết
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Post Content */}
                <p className="text-neutral-700 dark:text-neutral-300 text-sm leading-relaxed line-clamp-3 mb-4">
                  {post.content || post.caption || 'Không có nội dung'}
                </p>

                {/* Media Preview */}
                {mediaItems.length > 0 && (
                  <div className="flex gap-3 overflow-x-auto pb-2 mb-2 hide-scrollbar">
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
                          className="relative flex-shrink-0 w-24 h-24 rounded-xl overflow-hidden bg-neutral-100 dark:bg-neutral-800"
                        >
                          <img
                            src={mediaUrl}
                            alt=""
                            className="w-full h-full object-cover"
                          />
                          {isVideo && (
                            <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                              <Video
                                size={24}
                                className="text-white drop-shadow-md"
                              />
                            </div>
                          )}
                        </div>
                      );
                    })}
                    {mediaItems.length > 4 && (
                      <div className="flex-shrink-0 w-24 h-24 rounded-xl bg-neutral-50 dark:bg-neutral-800 flex items-center justify-center text-neutral-500 font-medium">
                        +{mediaItems.length - 4}
                      </div>
                    )}
                  </div>
                )}

                {/* Stats */}
                <div className="flex items-center gap-6 pt-4 bg-neutral-50/10 dark:bg-neutral-800/10 mt-2 px-2 rounded-xl">
                  <div className="flex items-center gap-2 text-xs font-medium text-neutral-500">
                    <Heart size={14} className="text-neutral-400" />
                    {post.likesCount || post.likes || 0}
                  </div>
                  <div className="flex items-center gap-2 text-xs font-medium text-neutral-500">
                    <MessageCircle size={14} className="text-neutral-400" />
                    {post.commentsCount || post.comments || 0}
                  </div>
                  <div className="flex items-center gap-2 text-xs font-medium text-neutral-500">
                    <Share2 size={14} className="text-neutral-400" />
                    {post.sharesCount || post.shares || 0}
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
