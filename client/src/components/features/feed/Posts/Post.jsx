import {
  useState,
  useCallback,
  useMemo,
  lazy,
  Suspense,
  useEffect,
  useRef,
  memo,
} from 'react';
import { createPortal } from 'react-dom';
import { useSelector } from 'react-redux';
import {
  MoreHorizontal,
  Heart,
  MessageCircle,
  Send,
  Bookmark,
  Eye,
  X,
  Loader2,
  Flag,
  Trash2,
  Edit3,
  EyeOff,
  Link2,
  Share2,
} from 'lucide-react';
import { notify } from '@/utils/notify';
import LoadingSpinner from '@/components/Common/LoadingSpinner';
import {
  useToggleLike,
  useToggleSave,
  useDeletePost,
  useSharePost,
} from '@/hooks/usePostsQuery';
import UserProfilePreview from '@/components/Common/UserProfilePreview';
import { formatCount, formatPostTime as formatTime } from '@/utils/postUtils';
import VideoPlayer from './VideoPlayer';

// Lazy load modals
const CommentModal = lazy(() =>
  import('../Comment/CommentModal').then(module => ({
    default: module.default,
  }))
);
const ReportModal = lazy(() =>
  import('../../report/ReportModal').then(module => ({
    default: module.default,
  }))
);
const ModelPost = lazy(() => import('./ModelPost'));
const VideoModal = lazy(() => import('@/components/Common/VideoModal'));

const DEFAULT_USER = {
  name: 'Unknown User',
  username: 'unknown',
  avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=default',
};

const VIDEO_EXTENSIONS = /\.(mp4|webm|mov|m4v|m3u8|ogg)$/i;

const isVideoUrl = url => {
  if (!url) return false;
  if (VIDEO_EXTENSIONS.test(url)) return true;
  return (
    /\/video\/upload\//i.test(url) ||
    /resource_type=video/i.test(url) ||
    /\/videos?\//i.test(url)
  );
};

const buildCloudinaryUrl = (publicId, type) => {
  const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
  if (!cloudName || !publicId) return null;
  const resourceType = type === 'video' ? 'video' : 'image';
  const cleanId = publicId.replace(/^\/+/, '');
  return `https://res.cloudinary.com/${cloudName}/${resourceType}/upload/${cleanId}`;
};

const ensureAbsoluteUrl = (url, type) => {
  if (!url) return url;
  if (/^(blob:|data:|https?:)/i.test(url)) return url;

  const cloudinaryUrl = buildCloudinaryUrl(url, type);
  if (cloudinaryUrl) return cloudinaryUrl;

  const base =
    import.meta.env.VITE_API_BASE_URL ||
    (typeof window !== 'undefined' ? window.location.origin : '');
  if (!base) return url;
  if (url.startsWith('/')) return `${base}${url}`;
  return `${base}/${url}`;
};

const getMediaType = item => {
  const rawType =
    item?.type ||
    item?.mediaType ||
    item?.resource_type ||
    item?.resourceType ||
    item?.format;
  if (typeof rawType === 'string') {
    const type = rawType.toLowerCase();
    if (type.startsWith('video')) return 'video';
    if (type === 'image') return 'image';
    if (VIDEO_EXTENSIONS.test(`file.${type}`)) return 'video';
  }
  if (typeof item?.duration === 'number' && item.duration > 0) {
    return 'video';
  }
  if (item?.thumbnail) {
    return 'video';
  }
  const mime = item?.mimetype || item?.mimeType || item?.mime_type;
  if (typeof mime === 'string' && mime.startsWith('video/')) {
    return 'video';
  }
  return null;
};

const normalizeMediaItem = item => {
  if (!item) return null;
  if (typeof item === 'string') {
    const url = item;
    return { url, type: isVideoUrl(url) ? 'video' : 'image' };
  }

  const rawUrl =
    item.url ||
    item.path ||
    item.secure_url ||
    item.secureUrl ||
    item.secureURL ||
    item.location ||
    item.src ||
    item.fileUrl ||
    item.fileURL ||
    item.preview ||
    item.thumbnail ||
    item.publicId ||
    item.public_id;

  const url =
    typeof rawUrl === 'string'
      ? rawUrl
      : rawUrl?.url ||
        rawUrl?.secure_url ||
        rawUrl?.secureUrl ||
        rawUrl?.path ||
        rawUrl?.src ||
        rawUrl?.location ||
        '';

  if (!url || typeof url !== 'string') return null;

  const inferredType = getMediaType(item) || (isVideoUrl(url) ? 'video' : null);
  const resolvedUrl = ensureAbsoluteUrl(url, inferredType);
  const type =
    inferredType || (isVideoUrl(resolvedUrl) ? 'video' : 'image');
  return { ...item, url: resolvedUrl, type };
};

const arePostPropsEqual = (prev, next) => {
  if (prev.onDelete !== next.onDelete) return false;
  if (prev.onOpenComments !== next.onOpenComments) return false;
  if (prev.onOptionsToggle !== next.onOptionsToggle) return false;
  if (prev.data === next.data) return true;

  const prevData = prev.data;
  const nextData = next.data;

  if (!prevData || !nextData) return prevData === nextData;
  if (prevData._id !== nextData._id) return false;
  if (prevData.updatedAt !== nextData.updatedAt) return false;
  if (prevData.caption !== nextData.caption) return false;

  const prevLikeCount = prevData.likeCount ?? prevData.likesCount;
  const nextLikeCount = nextData.likeCount ?? nextData.likesCount;
  if (prevLikeCount !== nextLikeCount) return false;

  const prevCommentCount = prevData.commentCount ?? prevData.commentsCount;
  const nextCommentCount = nextData.commentCount ?? nextData.commentsCount;
  if (prevCommentCount !== nextCommentCount) return false;

  if (prevData.isLiked !== nextData.isLiked) return false;
  if (prevData.isSaved !== nextData.isSaved) return false;
  if (prevData.viewCount !== nextData.viewCount) return false;

  const prevMediaCount = Array.isArray(prevData.media) ? prevData.media.length : 0;
  const nextMediaCount = Array.isArray(nextData.media) ? nextData.media.length : 0;
  if (prevMediaCount !== nextMediaCount) return false;

  const prevUser = prevData.user;
  const nextUser = nextData.user;
  if (prevUser || nextUser) {
    const prevUserId = prevUser?._id || prevUser?.id;
    const nextUserId = nextUser?._id || nextUser?.id;
    if (prevUserId !== nextUserId) return false;
    if (prevUser?.name !== nextUser?.name) return false;
    if (prevUser?.username !== nextUser?.username) return false;
    if (prevUser?.avatar !== nextUser?.avatar) return false;
    if (prevUser?.verified !== nextUser?.verified) return false;
  }

  return true;
};

const Post = ({ data, onDelete, onOpenComments, onOptionsToggle }) => {
  const { user: authUser } = useSelector(state => state.auth);

  const [isLiked, setIsLiked] = useState(data?.isLiked || false);
  const [isSaved, setIsSaved] = useState(data?.isSaved || false);
  const [likeCount, setLikeCount] = useState(
    data?.likeCount || data?.likesCount || 0
  );

  const { mutate: toggleLike, isPending: likeLoading } = useToggleLike();
  const { mutate: toggleSave, isPending: saveLoading } = useToggleSave();
  const { mutateAsync: deletePostMutation, isPending: deletePending } =
    useDeletePost();
  const { mutateAsync: sharePostMutation, isPending: sharePending } =
    useSharePost();

  useEffect(() => {
    setIsLiked(data?.isLiked || false);
    setIsSaved(data?.isSaved || false);
    setLikeCount(data?.likeCount || data?.likesCount || 0);
  }, [
    data?._id,
    data?.isLiked,
    data?.isSaved,
    data?.likeCount,
    data?.likesCount,
  ]);

  const [showOptions, setShowOptions] = useState(false);
  const [showImage, setShowImage] = useState(null);
  const [showVideo, setShowVideo] = useState(null);
  const [showComments, setShowComments] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const optionsRef = useRef(null);

  const isOwner = authUser?._id === data?.user?._id;

  const user = useMemo(() => data?.user || DEFAULT_USER, [data?.user]);

  const normalizedMedia = useMemo(() => {
    const rawMedia = Array.isArray(data?.media) ? data.media : [];
    return rawMedia.map(normalizeMediaItem).filter(Boolean);
  }, [data?.media]);

  const mediaCount = useMemo(() => normalizedMedia.length, [normalizedMedia]);

  const mediaItems = useMemo(
    () => normalizedMedia.slice(0, 4),
    [normalizedMedia]
  );

  const handleLike = useCallback(() => {
    if (likeLoading || !data?._id) return;

    const prevLiked = isLiked;
    const prevCount = likeCount;

    // Optimistic update
    setIsLiked(!isLiked);
    setLikeCount(isLiked ? likeCount - 1 : likeCount + 1);

    toggleLike(data._id, {
      onError: error => {
        // Revert on failure
        setIsLiked(prevLiked);
        setLikeCount(prevCount);
        notify.error(error?.response?.data?.message || 'Thao tác thất bại');
      },
    });
  }, [data?._id, isLiked, likeCount, likeLoading, toggleLike]);

  const handleSave = useCallback(() => {
    if (saveLoading || !data?._id) return;

    const prevSaved = isSaved;

    // Optimistic update
    setIsSaved(!isSaved);

    toggleSave(
      { postId: data._id, isSaved: prevSaved },
      {
        onSuccess: () => {
          notify.success(!prevSaved ? 'Đã lưu bài viết' : 'Đã bỏ lưu bài viết');
        },
        onError: error => {
          // Revert on failure
          setIsSaved(prevSaved);
          notify.error(error?.response?.data?.message || 'Thao tác thất bại');
        },
      }
    );
  }, [data?._id, isSaved, saveLoading, toggleSave]);

  const handleDelete = useCallback(async () => {
    if (deletePending || !data?._id) return;

    try {
      await deletePostMutation(data._id);
      notify.success('Đã xóa bài viết');
      setShowDeleteConfirm(false);
      onOptionsToggle?.(data._id, false);
      setShowOptions(false);
      // Notify parent to remove from list
      onDelete?.(data._id);
    } catch (error) {
      notify.error(error?.response?.data?.message || 'Xóa bài viết thất bại');
    }
  }, [deletePending, data?._id, onDelete, deletePostMutation, onOptionsToggle]);

  const handleShare = useCallback(async () => {
    if (sharePending || !data?._id) return;

    try {
      await sharePostMutation({ postId: data._id });
      notify.success('Đã chia sẻ bài viết');
      onOptionsToggle?.(data._id, false);
      setShowOptions(false);
    } catch (error) {
      notify.error(error?.response?.data?.message || 'Chia sẻ thất bại');
    }
  }, [sharePending, data?._id, sharePostMutation, onOptionsToggle]);

  const handleCopyLink = useCallback(() => {
    const url = `${window.location.origin}/post/${data?._id}`;
    navigator.clipboard.writeText(url);
    notify.success('Đã sao chép link');
    onOptionsToggle?.(data?._id, false);
    setShowOptions(false);
  }, [data?._id, onOptionsToggle]);

  const closeOptions = useCallback(() => {
    setShowOptions(false);
    onOptionsToggle?.(data?._id, false);
  }, [data?._id, onOptionsToggle]);

  const toggleOptions = useCallback(() => {
    setShowOptions(prev => {
      const next = !prev;
      onOptionsToggle?.(data?._id, next);
      return next;
    });
  }, [data?._id, onOptionsToggle]);

  useEffect(() => {
    if (!showOptions) return;
    const handleClickOutside = e => {
      if (optionsRef.current && !optionsRef.current.contains(e.target)) {
        closeOptions();
      }
    };
    const handleKeyDown = e => {
      if (e.key === 'Escape') closeOptions();
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [showOptions, closeOptions]);

  const handleOpenComments = useCallback(() => {
    if (!data?._id) return;
    if (onOpenComments) {
      onOpenComments(data._id);
      return;
    }
    setShowComments(true);
  }, [data?._id, onOpenComments]);

  if (!data)
    return (
      <div className="p-4 text-center text-neutral-500">
        No post data available
      </div>
    );

  return (
    <article className="rounded-2xl p-4 bg-white dark:bg-neutral-900 hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors">
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <UserProfilePreview
          userId={user._id || user.id}
          triggerSelector="[data-profile-preview-trigger]"
        >
          <div className="flex items-center gap-3">
            <div className="relative group cursor-pointer">
              <img
                className="w-11 h-11 rounded-full object-cover"
                src={user.avatar}
                alt={user.name}
                loading="lazy"
                decoding="async"
              />
              <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full border-2 border-white dark:border-neutral-900 opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span
                  data-profile-preview-trigger
                  className="font-semibold text-content dark:text-white hover:underline cursor-pointer"
                >
                  {user.name}
                </span>
                {user.verified && (
                  <div className="w-4 h-4 rounded-full bg-primary flex items-center justify-center">
                    <svg
                      width="10"
                      height="10"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                      className="text-primary-foreground"
                    >
                      <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
                    </svg>
                  </div>
                )}
              </div>
              <div className="flex items-center gap-1.5 text-sm text-secondary">
                <span data-profile-preview-trigger>@{user.username}</span>
                <span>•</span>
                <span>{formatTime(data.createdAt)}</span>
              </div>
            </div>
          </div>
        </UserProfilePreview>

        <div className="relative" ref={optionsRef}>
          <button
            onClick={toggleOptions}
            className="p-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-400 hover:text-content dark:hover:text-white transition-all"
          >
            <MoreHorizontal size={18} />
          </button>

          {showOptions && (
            <div className="absolute right-0 mt-2 w-52 bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 shadow-xl overflow-hidden z-40">
              {/* Owner actions */}
              {isOwner && (
                <>
                  <button
                    onClick={() => {
                      setShowEditModal(true);
                      closeOptions();
                    }}
                    className="w-full px-4 py-3 flex items-center gap-3 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-content dark:text-white"
                  >
                    <Edit3 size={18} />
                    Edit post
                  </button>
                  <button
                    onClick={() => {
                      setShowDeleteConfirm(true);
                      closeOptions();
                    }}
                    className="w-full px-4 py-3 flex items-center gap-3 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-red-500"
                  >
                    <Trash2 size={18} />
                    Delete post
                  </button>
                </>
              )}

              {/* Report - only for non-owners */}
              {!isOwner && (
                <button
                  onClick={() => {
                    setShowReportModal(true);
                    closeOptions();
                  }}
                  className="w-full px-4 py-3 flex items-center gap-3 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-red-500"
                >
                  <Flag size={18} />
                  Report post
                </button>
              )}

              <button
                onClick={handleShare}
                disabled={sharePending}
                className="w-full px-4 py-3 flex items-center gap-3 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-content dark:text-white"
              >
                <Share2 size={18} />
                {sharePending ? 'Sharing...' : 'Share post'}
              </button>

              <button
                onClick={handleCopyLink}
                className="w-full px-4 py-3 flex items-center gap-3 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-content dark:text-white"
              >
                <Link2 size={18} />
                Copy link
              </button>

              {!isOwner && (
                <button
                  onClick={closeOptions}
                  className="w-full px-4 py-3 flex items-center gap-3 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-content dark:text-white"
                >
                  <EyeOff size={18} />
                  Hide post
                </button>
              )}

              <button
                onClick={closeOptions}
                className="w-full px-4 py-3 text-left hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-500"
              >
                Cancel
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      {data.caption && (
        <p className="text-content dark:text-white leading-relaxed mb-3 whitespace-pre-wrap break-words">
          {data.caption}
        </p>
      )}

      {/* Media */}
      {mediaItems.length > 0 && (
        <div
          className={`rounded-xl overflow-hidden mb-3 ${
            mediaCount === 1 ? '' : 'grid gap-1'
          } ${mediaCount === 2 ? 'grid-cols-2' : ''} ${
            mediaCount >= 3 ? 'grid-cols-2' : ''
          }`}
        >
          {mediaItems.map((item, index) => {
            const frameClass =
              mediaCount === 1
                ? 'max-h-[450px]'
                : mediaCount === 2
                  ? 'aspect-video'
                  : 'aspect-square';
            return (
              <div
                key={index}
                className={`relative overflow-hidden ${
                  mediaCount === 3 && index === 0 ? 'row-span-2' : ''
                } ${frameClass}`}
              >
              {item.type === 'video' ? (
                <VideoPlayer
                  src={item.url}
                  onExpand={() => setShowVideo(item.url)}
                  isGrid={mediaCount > 1}
                />
              ) : (
                <img
                  className={`w-full h-full object-cover cursor-pointer hover:scale-105 transition-transform duration-300 ${
                    mediaCount === 1 ? 'max-h-[450px]' : ''
                  }`}
                  src={item.url}
                  alt={`Post media ${index + 1}`}
                  loading="lazy"
                  decoding="async"
                  onClick={() => setShowImage(item.url)}
                />
              )}
              {mediaCount > 4 && index === 3 && (
                <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center">
                  <span className="text-white text-2xl font-bold">
                    +{mediaCount - 4}
                  </span>
                </div>
              )}
              </div>
            );
          })}
        </div>
      )}

      {/* Stats Row */}
      <div className="flex items-center gap-4 py-2 mb-2 text-sm text-neutral-400">
        <span className="flex items-center gap-1">
          <Eye size={14} />
          {formatCount(data.viewCount || 0)} views
        </span>
      </div>

      {/* Divider */}
      <div className="h-px bg-neutral-100 dark:bg-neutral-800/50 mb-3" />

      {/* Action Buttons */}
      <div className="flex items-center justify-between">
        {/* Left Actions */}
        <div className="flex items-center gap-1">
          {/* Like */}
          <button
            onClick={handleLike}
            disabled={likeLoading}
            className={`flex items-center gap-2 px-3 py-2 rounded-full transition-all ${
              likeLoading ? 'opacity-50 cursor-not-allowed' : ''
            } ${
              isLiked
                ? 'text-red-500 bg-red-50 dark:bg-red-500/10'
                : 'text-neutral-500 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10'
            }`}
          >
            {likeLoading ? (
              <Loader2 size={18} className="animate-spin" />
            ) : (
              <Heart size={18} className={isLiked ? 'fill-current' : ''} />
            )}
            {likeCount > 0 && (
              <span className="text-sm font-medium">
                {formatCount(likeCount)}
              </span>
            )}
          </button>

          {/* Comment */}
          <button
            onClick={handleOpenComments}
            className="flex items-center gap-2 px-3 py-2 rounded-full text-neutral-500 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-500/10 transition-all"
          >
            <MessageCircle size={18} />
            {(data.commentCount || data.commentsCount || 0) > 0 && (
              <span className="text-sm font-medium">
                {formatCount(data.commentCount || data.commentsCount || 0)}
              </span>
            )}
          </button>

          {/* Share */}
          <button
            onClick={handleShare}
            disabled={sharePending}
            className={`flex items-center gap-2 px-3 py-2 rounded-full text-neutral-500 hover:text-green-500 hover:bg-green-50 dark:hover:bg-green-500/10 transition-all ${
              sharePending ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            {sharePending ? (
              <Loader2 size={18} className="animate-spin" />
            ) : (
              <Send size={18} />
            )}
          </button>
        </div>

        {/* Right Actions */}
        <button
          onClick={handleSave}
          disabled={saveLoading}
          className={`p-2 rounded-full transition-all ${
            saveLoading ? 'opacity-50 cursor-not-allowed' : ''
          } ${
            isSaved
              ? 'text-yellow-500 bg-yellow-50 dark:bg-yellow-500/10'
              : 'text-neutral-500 hover:text-yellow-500 hover:bg-yellow-50 dark:hover:bg-yellow-500/10'
          }`}
        >
          {saveLoading ? (
            <Loader2 size={18} className="animate-spin" />
          ) : (
            <Bookmark size={18} className={isSaved ? 'fill-current' : ''} />
          )}
        </button>
      </div>

      {/* Image Modal */}
      {showImage &&
        typeof document !== 'undefined' &&
        createPortal(
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/90"
            onClick={() => setShowImage(null)}
          >
            <img
              src={showImage}
              alt="Full view"
              className="max-w-[90vw] max-h-[90vh] rounded-xl object-contain"
              onClick={e => e.stopPropagation()}
            />
            <button
              className="absolute top-4 right-4 bg-white/10 backdrop-blur-sm text-white p-2.5 rounded-xl hover:bg-white/20 transition-colors"
              onClick={() => setShowImage(null)}
            >
              <X size={20} />
            </button>
          </div>,
          document.body
        )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
          onClick={() => setShowDeleteConfirm(false)}
        >
          <div
            className="w-full max-w-sm bg-white dark:bg-neutral-900 rounded-2xl overflow-hidden p-6"
            onClick={e => e.stopPropagation()}
          >
            <h3 className="text-lg font-semibold text-content dark:text-white mb-2">
              Delete Post?
            </h3>
            <p className="text-sm text-neutral-500 mb-6">
              This action cannot be undone. The post will be permanently
              removed.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 px-4 py-2.5 rounded-full bg-neutral-100 dark:bg-neutral-800 text-content dark:text-white text-sm font-medium hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={deletePending}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-full bg-red-500 text-white text-sm font-medium hover:bg-red-600 transition-colors"
              >
                {deletePending ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <>
                    <Trash2 size={16} />
                    Delete
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Report Modal */}
      {showReportModal && (
        <Suspense fallback={<LoadingSpinner fullScreen />}>
          <ReportModal
            isOpen={showReportModal}
            onClose={() => setShowReportModal(false)}
            targetId={data?._id}
            targetType="post"
          />
        </Suspense>
      )}

      {/* Edit Post Modal */}
      {showEditModal && (
        <Suspense fallback={<LoadingSpinner fullScreen />}>
          <ModelPost
            closeModal={() => setShowEditModal(false)}
            editPost={data}
          />
        </Suspense>
      )}

      {/* Comments Modal Placeholder */}
      {showComments && (
        <Suspense fallback={<LoadingSpinner fullScreen />}>
          <CommentModal
            onClose={() => setShowComments(false)}
            postId={data?._id}
          />
        </Suspense>
      )}

      {/* Video Modal */}
      {showVideo && (
        <Suspense fallback={<LoadingSpinner fullScreen />}>
          <VideoModal videoUrl={showVideo} onClose={() => setShowVideo(null)} />
        </Suspense>
      )}
    </article>
  );
};

export default memo(Post, arePostPropsEqual);
