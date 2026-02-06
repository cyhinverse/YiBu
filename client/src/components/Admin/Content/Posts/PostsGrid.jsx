import React from 'react';
import {
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
  FileText,
} from 'lucide-react';
import {
  getPostTypeIcon as getTypeIcon,
  getPostStatusStyle as getStatusStyle,
} from '@/utils/postUtils';

const VIDEO_EXTENSIONS = /\.(mp4|webm|mov|m4v|m3u8|ogg)$/i;

const isVideoUrl = url => {
  if (!url) return false;
  if (VIDEO_EXTENSIONS.test(url)) return true;
  return /\/video\/upload\//i.test(url) || /resource_type=video/i.test(url);
};

const getMediaUrl = media => {
  if (!media) return '';
  if (typeof media === 'string') return media;
  return (
    media.url ||
    media.secure_url ||
    media.secureUrl ||
    media.path ||
    media.src ||
    media.location ||
    media.preview ||
    media.thumbnail ||
    ''
  );
};

const getMediaType = (media, url) => {
  const rawType =
    media?.type ||
    media?.mediaType ||
    media?.resource_type ||
    media?.resourceType ||
    media?.format;
  if (typeof rawType === 'string') {
    const type = rawType.toLowerCase();
    if (type.startsWith('video')) return 'video';
    if (type === 'image') return 'image';
  }
  const mime = media?.mimetype || media?.mimeType || media?.mime_type;
  if (typeof mime === 'string' && mime.startsWith('video/')) return 'video';
  if (typeof media?.duration === 'number' && media.duration > 0) return 'video';
  if (media?.thumbnail || media?.poster) return 'video';
  if (isVideoUrl(url)) return 'video';
  return 'image';
};

const normalizeMediaItem = media => {
  const url = getMediaUrl(media);
  if (!url) return null;
  return {
    ...media,
    url,
    type: getMediaType(media, url),
  };
};

export default function PostsGrid({
  loading,
  posts,
  activeDropdown,
  setActiveDropdown,
  onViewDetails,
  onToggleStatus,
  onDelete,
  onViewReports,
}) {
  if (loading && posts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24">
        <Loader2 size={40} className="animate-spin text-[var(--color-text-secondary)] mb-4" />
        <p className="text-[var(--color-text-secondary)] font-medium">
          Đang tải bài viết...
        </p>
      </div>
    );
  }

  if (posts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-32 text-[var(--color-text-secondary)]">
        <FileText size={64} className="mb-4 opacity-10" />
        <p className="font-medium text-lg">Không tìm thấy bài viết nào</p>
      </div>
    );
  }

  return (
    <div className="grid gap-4">

      {posts.map(post => {
        const author = post.author || post.user || {};
        const rawMediaItems = post.media || post.images || [];
        const mediaItems = rawMediaItems
          .map(normalizeMediaItem)
          .filter(Boolean);
        const hasMedia = mediaItems.length > 0;
        const postType =
          post.type ||
          (hasMedia ? (mediaItems[0]?.type === 'video' ? 'video' : 'image') : 'text');

        return (
          <div
            key={post._id || post.id}
            className="admin-card p-4 hover:shadow-md transition-all duration-300"
          >
            <div className="flex items-start gap-4">
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
                      <h3 className="font-semibold text-[var(--color-content)] text-base">
                        {author.name || author.username || 'Nặc danh'}
                      </h3>
                      <span className="text-[var(--color-text-secondary)] text-sm">
                        @{author.username || 'user'}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 mt-1 text-xs font-medium text-[var(--color-text-secondary)]">
                      <span className="flex items-center gap-1">
                        <Calendar size={12} strokeWidth={1.5} />
                        {post.createdAt
                          ? new Date(post.createdAt).toLocaleDateString('vi-VN')
                          : 'N/A'}
                      </span>
                      <span className="admin-chip">
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
                      className={`admin-pill ${getStatusStyle(
                        post.status || 'active'
                      )}`}
                    >
                      {post.status === 'active'
                        ? 'Hoạt động'
                        : post.status === 'hidden'
                        ? 'Đã ẩn'
                        : post.status === 'flagged'
                        ? 'Bị gắn cờ'
                        : post.status === 'deleted'
                        ? 'Đã xóa'
                        : 'Không xác định'}
                    </span>

                    {(post.reportsCount || post.reports) > 0 && (
                      <button
                        type="button"
                        onClick={() => onViewReports(post)}
                        onKeyDown={event => {
                          if (event.key === 'Escape') {
                            event.currentTarget.blur();
                          }
                        }}
                        className="admin-pill bg-rose-50 text-rose-600 dark:bg-rose-900/20 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-900/40 transition-colors"
                      >
                        <Flag size={12} />
                        {post.reportsCount || post.reports}
                      </button>
                    )}

                    {/* Actions Dropdown */}
                    <div className="relative">
                      <button
                        type="button"
                        onClick={() =>
                          setActiveDropdown(
                            activeDropdown === (post._id || post.id)
                              ? null
                              : post._id || post.id
                          )
                        }
                        onKeyDown={event => {
                          if (event.key === 'Escape') {
                            setActiveDropdown(null);
                          }
                        }}
                        aria-haspopup="menu"
                        aria-expanded={
                          activeDropdown === (post._id || post.id)
                        }
                        aria-label="Tùy chọn"
                        className="p-2 hover:bg-[var(--color-surface-hover)] rounded-full transition-colors text-[var(--color-text-secondary)]"
                      >
                        <MoreHorizontal size={20} strokeWidth={1.6} />
                      </button>


                      {activeDropdown === (post._id || post.id) && (
                        <div
                          role="menu"
                          className="absolute right-0 top-full mt-2 w-48 bg-[var(--color-surface)] rounded-xl shadow-xl py-1.5 z-10 overflow-hidden animate-scale-in border border-[var(--color-border)]"
                        >
                          <button
                            type="button"
                            onClick={() => {
                              onViewDetails(post);
                              setActiveDropdown(null);
                            }}
                            role="menuitem"
                            className="w-full px-4 py-2.5 text-left text-sm font-medium hover:bg-[var(--color-surface-hover)] flex items-center gap-2.5 text-[var(--color-text-secondary)] transition-colors"
                          >
                            <Eye size={16} />
                            Chi tiết bài viết
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              onToggleStatus(post);
                              setActiveDropdown(null);
                            }}
                            role="menuitem"
                            className="w-full px-4 py-2.5 text-left text-sm font-medium hover:bg-[var(--color-surface-hover)] flex items-center gap-2.5 text-[var(--color-text-secondary)] transition-colors"
                          >
                            {post.status === 'active' ? (
                              <>
                                <XCircle size={16} className="text-rose-500" />
                                <span className="text-rose-500">Ẩn bài viết</span>
                              </>
                            ) : (
                              <>
                                <CheckCircle size={16} className="text-emerald-500" />
                                <span className="text-emerald-500">Hiện bài viết</span>
                              </>
                            )}
                          </button>
                          <div className="h-px bg-[var(--color-border)] my-1 mx-2" />
                          <button
                            type="button"
                            onClick={() => {
                              onDelete(post);
                              setActiveDropdown(null);
                            }}
                            role="menuitem"
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
                <p className="text-[var(--color-text-secondary)] text-sm leading-relaxed line-clamp-3 mb-4">
                  {post.content || post.caption || 'Không có nội dung'}
                </p>

                {/* Stats */}
                <div className="flex items-center gap-4 pt-4 bg-[var(--color-surface-secondary)] mt-2 px-3 py-2 rounded-xl">
                  <div className="flex items-center gap-2 text-xs font-medium text-[var(--color-text-secondary)]">
                    <Heart size={14} className="text-[var(--color-text-tertiary)]" />
                    {post.likesCount || post.likes || 0}
                  </div>
                  <div className="flex items-center gap-2 text-xs font-medium text-[var(--color-text-secondary)]">
                    <MessageCircle size={14} className="text-[var(--color-text-tertiary)]" />
                    {post.commentsCount || post.comments || 0}
                  </div>
                  <div className="flex items-center gap-2 text-xs font-medium text-[var(--color-text-secondary)]">
                    <Share2 size={14} className="text-[var(--color-text-tertiary)]" />
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
