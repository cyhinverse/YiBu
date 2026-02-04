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
  Shield,
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

  if (!isOpen || !post) return null;

  useEffect(() => {
    const handleKeyDown = event => {
      if (event.key === 'Escape') {
        onClose?.();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

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
        className="bg-white dark:bg-neutral-900 w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl rounded-2xl transform animate-scale-in overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="px-4 py-3.5 bg-neutral-100/50 dark:bg-neutral-800/40 flex items-center justify-between shrink-0">
          <h2 className="text-lg font-semibold text-neutral-900 dark:text-white tracking-tight">
            Chi tiết bài viết
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-full transition-colors text-neutral-500"
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
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-5 py-3.5 text-sm font-bold transition-all border-b-2 ${
                activeTab === tab.id
                  ? 'border-neutral-900 dark:border-white text-neutral-900 dark:text-white'
                  : 'border-transparent text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300'
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
                        className="w-14 h-12 rounded-full border border-neutral-200 dark:border-neutral-700 shadow-sm"
                      />
                      <div>
                        <h3 className="font-bold text-lg text-neutral-900 dark:text-white tracking-tight">
                          {author.name || author.username}
                        </h3>
                        <p className="text-sm text-neutral-500 font-medium">
                          @{author.username} •{' '}
                          <span className="opacity-60">
                            {new Date(post.createdAt).toLocaleString('vi-VN')}
                          </span>
                        </p>
                      </div>
                    </div>

                    <div className="p-4 bg-neutral-100 dark:bg-neutral-800/50 rounded-2xl">
                      <p className="text-neutral-800 dark:text-neutral-200 font-medium text-base leading-relaxed whitespace-pre-wrap">
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
                            className="relative group rounded-2xl overflow-hidden shadow-sm"
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
                              <div className="absolute top-3 left-3 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-black/60 text-white shadow">
                                <Video size={12} />
                                Video
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}

                    <div className="grid grid-cols-3 gap-4">
                      <div className="flex flex-col items-center justify-center p-4 bg-neutral-100 dark:bg-neutral-800 rounded-2xl shadow-sm">
                        <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
                          <Heart size={12} /> Thích
                        </span>
                        <span className="text-xl font-black text-neutral-900 dark:text-white">
                          {post.likesCount || 0}
                        </span>
                      </div>
                      <div className="flex flex-col items-center justify-center p-4 bg-neutral-100 dark:bg-neutral-800 rounded-2xl shadow-sm">
                        <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
                          <MessageCircle size={12} /> Bình luận
                        </span>
                        <span className="text-xl font-black text-neutral-900 dark:text-white">
                          {post.commentsCount || 0}
                        </span>
                      </div>
                      <div className="flex flex-col items-center justify-center p-4 bg-neutral-100 dark:bg-neutral-800 rounded-2xl shadow-sm">
                        <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
                          <Share2 size={12} /> Chia sẻ
                        </span>
                        <span className="text-xl font-black text-neutral-900 dark:text-white">
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
                    className="p-4 rounded-2xl bg-neutral-100/50 dark:bg-neutral-800/20"
                  >
                    <div className="flex justify-between items-center mb-3">
                      <div className="flex items-center gap-2.5">
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400">
                          <AlertTriangle size={12} className="mr-1.5" />
                          {report.reason}
                        </span>
                      </div>
                      <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">
                        {new Date(report.createdAt).toLocaleDateString('vi-VN')}
                      </span>
                    </div>
                    <p className="text-neutral-700 dark:text-neutral-300 font-medium text-sm leading-relaxed mb-4 italic p-3 bg-white dark:bg-neutral-900 rounded-xl">
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
                        className="w-5 h-5 rounded-full object-cover"
                      />
                      <span className="text-xs font-bold text-neutral-500">
                        Báo cáo bởi{' '}
                        <span className="text-neutral-900 dark:text-white">
                          @{report.reporter?.username || 'unknown'}
                        </span>
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="flex flex-col items-center justify-center py-16 bg-neutral-50/50 dark:bg-neutral-800/20 rounded-2xl shadow-sm">
                  <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-900/20 flex items-center justify-center mb-4 text-emerald-500">
                    <CheckCircle size={32} />
                  </div>
                  <p className="font-bold text-neutral-900 dark:text-white mb-1">
                    Nội dung sạch
                  </p>
                  <p className="text-sm font-medium text-neutral-500">
                    Không có báo cáo nào cho bài viết này.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-neutral-100/50 dark:bg-neutral-800/40 flex gap-3 shrink-0">
          <button
            onClick={() => {
              onToggleStatus(post);
            }}
            className={`flex-1 py-3 rounded-xl font-bold text-white shadow-lg transition-all text-sm ${
              post.status === 'active'
                ? 'bg-amber-600 hover:bg-amber-700'
                : 'bg-emerald-600 hover:bg-emerald-700'
            }`}
          >
            {post.status === 'active' ? 'Ẩn bài viết' : 'Hiện bài viết'}
          </button>
          <button
            onClick={() => {
              onDelete(post);
            }}
            className="flex-1 py-3 rounded-xl font-bold bg-neutral-900 dark:bg-neutral-800 hover:bg-neutral-800 dark:hover:bg-neutral-700 text-white transition-all text-sm"
          >
            Xóa bài viết
          </button>
          <button
            onClick={onClose}
            className="px-8 py-3 rounded-xl font-bold bg-white dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-700 transition-colors text-sm shadow-sm"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
}
