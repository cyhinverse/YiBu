import React, { useEffect, useState } from 'react';
import {
  X,
  Info,
  Flag,
  Video,
  AlertTriangle,
  CheckCircle,
  Heart,
  MessageCircle,
  Share2,
} from 'lucide-react';

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

export default function PostDetailModal({
  post,
  isOpen,
  onClose,
  reports,
  onToggleStatus,
  onDelete,
}) {
  const [activeTab, setActiveTab] = useState('content');

  useEffect(() => {
    if (!isOpen) return undefined;
    const handleKeyDown = event => {
      if (event.key === 'Escape') {
        onClose?.();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !post) return null;

  const handleKeyDown = event => {
    if (event.key === 'Escape') {
      onClose?.();
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/45 dark:bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in"
      role="dialog"
      aria-modal="true"
      tabIndex={-1}
      onKeyDown={handleKeyDown}
    >
      <div
        className="yb-card w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl rounded-2xl transform animate-scale-in overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="px-4 py-3.5 bg-[var(--color-surface-secondary)] flex items-center justify-between shrink-0">
          <h2 className="text-lg font-semibold text-[var(--color-content)] tracking-tight">
            Chi tiết bài viết
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="yb-btn yb-btn-ghost p-2 rounded-full text-[var(--color-text-secondary)] hover:text-[var(--color-content)] hover:bg-[var(--color-surface-hover)]"
            aria-label="Đóng"
          >
            <X size={20} />
          </button>
        </div>


        {/* Tabs */}
        <div className="flex px-5 shrink-0">
          {[
            { id: 'content', label: 'Nội dung', icon: Info },
            { id: 'reports', label: 'Báo cáo', icon: Flag },
          ].map(tab => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-5 py-3.5 text-sm font-semibold transition-all border-b-2 ${
                activeTab === tab.id
                  ? 'border-[var(--color-content)] text-[var(--color-content)]'
                  : 'border-transparent text-[var(--color-text-secondary)] hover:text-[var(--color-content)]'
              }`}
            >
              <tab.icon size={16} />
              {tab.label}
            </button>
          ))}
        </div>


        {/* Modal Content */}
        <div className="p-4 overflow-y-auto flex-1 custom-scrollbar">
          {activeTab === 'content' && (
            <div className="space-y-5">
              {(() => {
                const author = post.author || post.user || {};
                const rawMediaItems = post.media || post.images || [];
                const mediaItems = rawMediaItems
                  .map(normalizeMediaItem)
                  .filter(Boolean);
                return (
                  <>
                    <div className="flex items-center gap-4">
                      <img
                        src={author.avatar || '/images/default-avatar.png'}
                        alt={author.name || author.username || 'Author avatar'}
                        className="w-12 h-12 yb-avatar shadow-sm"
                      />
                      <div>
                        <h3 className="font-bold text-lg text-[var(--color-content)] tracking-tight">
                          {author.name || author.username}
                        </h3>
                        <p className="text-sm text-[var(--color-text-secondary)] font-medium">
                          @{author.username} •{' '}
                          <span className="text-[var(--color-text-tertiary)]">
                            {new Date(post.createdAt).toLocaleString('vi-VN')}
                          </span>
                        </p>
                      </div>
                    </div>

                    <div className="yb-card p-4 bg-[var(--color-surface-secondary)]">
                      <p className="text-[var(--color-content)] font-medium text-base leading-relaxed whitespace-pre-wrap">
                        {post.content || post.caption || 'Không có nội dung'}
                      </p>
                    </div>

                    {mediaItems.length > 0 && (
                      <div
                        className={`grid gap-3 ${
                          mediaItems.length > 1 ? 'grid-cols-2' : 'grid-cols-1'
                        }`}
                      >
                        {mediaItems.map((media, idx) => (
                          <div
                            key={idx}
                            className="relative group rounded-2xl overflow-hidden border border-[var(--color-border)] bg-[var(--color-surface)] shadow-sm"
                          >
                            {media.type === 'video' ? (
                              <video
                                src={media.url}
                                poster={media.thumbnail || media.poster || media.preview}
                                controls
                                preload="metadata"
                                playsInline
                                className="w-full h-64 object-cover"
                              />
                            ) : (
                              <img
                                src={media.url}
                                alt={`Post media ${idx + 1}`}
                                className="w-full h-64 object-cover transition-transform duration-500 group-hover:scale-105"
                              />
                            )}
                            {media.type === 'video' && (
                              <div className="absolute top-3 left-3 yb-badge bg-[var(--color-surface)]/90 text-[var(--color-content)] shadow">
                                <Video size={12} />
                                Video
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}

                    <div className="grid grid-cols-3 gap-4">
                      <div className="yb-card flex flex-col items-center justify-center p-4 bg-[var(--color-surface-secondary)] shadow-sm">
                        <span className="text-[10px] font-bold text-[var(--color-text-tertiary)] uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
                          <Heart size={12} /> Thích
                        </span>
                        <span className="text-xl font-black text-[var(--color-content)]">
                          {post.likesCount || 0}
                        </span>
                      </div>
                      <div className="yb-card flex flex-col items-center justify-center p-4 bg-[var(--color-surface-secondary)] shadow-sm">
                        <span className="text-[10px] font-bold text-[var(--color-text-tertiary)] uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
                          <MessageCircle size={12} /> Bình luận
                        </span>
                        <span className="text-xl font-black text-[var(--color-content)]">
                          {post.commentsCount || 0}
                        </span>
                      </div>
                      <div className="yb-card flex flex-col items-center justify-center p-4 bg-[var(--color-surface-secondary)] shadow-sm">
                        <span className="text-[10px] font-bold text-[var(--color-text-tertiary)] uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
                          <Share2 size={12} /> Chia sẻ
                        </span>
                        <span className="text-xl font-black text-[var(--color-content)]">
                          {post.sharesCount || 0}
                        </span>
                      </div>
                    </div>
                  </>
                );
              })()}
            </div>
          )}

          {activeTab === 'reports' && (
            <div className="space-y-4">
              {reports?.length > 0 ? (
                reports.map(report => (
                  <div
                    key={report._id}
                    className="yb-card p-4 bg-[var(--color-surface-secondary)]"
                  >
                    <div className="flex justify-between items-center mb-3">
                      <div className="flex items-center gap-2.5">
                        <span className="yb-badge bg-[var(--color-warning)]/15 text-[var(--color-warning)] font-bold">
                          <AlertTriangle size={12} className="mr-1.5" />
                          {report.reason}
                        </span>
                      </div>
                      <span className="text-[10px] font-bold text-[var(--color-text-tertiary)] uppercase tracking-widest">
                        {new Date(report.createdAt).toLocaleDateString('vi-VN')}
                      </span>
                    </div>
                    <p className="text-[var(--color-text-secondary)] font-medium text-sm leading-relaxed mb-4 italic p-3 bg-[var(--color-surface)] rounded-xl border border-[var(--color-border)]">
                      "{report.description || 'Không có chi tiết bổ sung.'}"
                    </p>
                    <div className="flex items-center gap-2">
                      <img
                        src={
                          report.reporter?.avatar ||
                          '/images/default-avatar.png'
                        }
                        alt={`${
                          report.reporter?.username || 'Reporter'
                        } avatar`}
                        className="w-5 h-5 yb-avatar object-cover"
                      />
                      <span className="text-xs font-bold text-[var(--color-text-secondary)]">
                        Báo cáo bởi{' '}
                        <span className="text-[var(--color-content)]">
                          @{report.reporter?.username || 'unknown'}
                        </span>
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="flex flex-col items-center justify-center py-16 bg-[var(--color-surface-secondary)] rounded-2xl shadow-sm border border-dashed border-[var(--color-border)]">
                  <div className="w-16 h-16 rounded-full bg-[var(--color-success)]/15 flex items-center justify-center mb-4 text-[var(--color-success)]">
                    <CheckCircle size={32} />
                  </div>
                  <p className="font-bold text-[var(--color-content)] mb-1">
                    Nội dung sạch
                  </p>
                  <p className="text-sm font-medium text-[var(--color-text-secondary)]">
                    Không có báo cáo nào cho bài viết này.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-[var(--color-surface-secondary)] flex gap-3 shrink-0">
          <button
            type="button"
            onClick={() => {
              onToggleStatus(post);
            }}
            className={`yb-btn flex-1 py-3 rounded-xl font-bold text-sm shadow-lg transition-all ${
              post.status === 'active'
                ? 'bg-[var(--color-warning)] text-[var(--color-text-inverse)] hover:opacity-90'
                : 'bg-[var(--color-success)] text-[var(--color-text-inverse)] hover:opacity-90'
            }`}
          >
            {post.status === 'active' ? 'Ẩn bài viết' : 'Hiện bài viết'}
          </button>
          <button
            type="button"
            onClick={() => {
              onDelete(post);
            }}
            className="yb-btn flex-1 py-3 rounded-xl font-bold text-sm bg-[var(--color-error)] text-[var(--color-text-inverse)] hover:opacity-90 transition-all"
          >
            Xóa bài viết
          </button>
          <button
            type="button"
            onClick={onClose}
            className="yb-btn yb-btn-secondary px-8 py-3 rounded-xl font-bold text-sm shadow-sm"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
}
