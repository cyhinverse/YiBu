import { useState, useCallback, lazy, Suspense, useEffect } from 'react';
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
import toast from 'react-hot-toast';
import {
  useToggleLike,
  useToggleSave,
  useDeletePost,
  useSharePost,
} from '@/hooks/usePostsQuery';

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

// Fake post data for component testing
const formatCount = count => {
  if (count >= 1000000) {
    return (count / 1000000).toFixed(1).replace(/\.0$/, '') + 'M';
  }
  if (count >= 1000) {
    return (count / 1000).toFixed(1).replace(/\.0$/, '') + 'K';
  }
  return count.toString();
};

const formatTime = date => {
  const now = new Date();
  const postDate = new Date(date);
  const diffMs = now - postDate;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'now';
  if (diffMins < 60) return `${diffMins}m`;
  if (diffHours < 24) return `${diffHours}h`;
  if (diffDays < 7) return `${diffDays}d`;
  return postDate.toLocaleDateString();
};

const Post = ({ data, onDelete }) => {
  const authUser = useSelector(state => state.auth?.user);

  const [isLiked, setIsLiked] = useState(data?.isLiked || false);
  const [isSaved, setIsSaved] = useState(data?.isSaved || false);
  const [likeCount, setLikeCount] = useState(
    data?.likeCount || data?.likesCount || 0
  );

  // React Query Mutations
  const { mutate: toggleLike, isPending: likeLoading } = useToggleLike();
  const { mutate: toggleSave, isPending: saveLoading } = useToggleSave();
  const { mutateAsync: deletePostMutation, isPending: deletePending } =
    useDeletePost();
  const { mutateAsync: sharePostMutation, isPending: sharePending } =
    useSharePost();
  // Removed dispatch

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
  const [showComments, setShowComments] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  // Removed manual loading states

  const isOwner = authUser?._id === data?.user?._id;

  const user = data?.user || {
    name: 'Unknown User',
    username: 'unknown',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=default',
  };

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
        toast.error(error?.response?.data?.message || 'Thao tác thất bại');
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
        onSuccess: response => {
          toast.success(!prevSaved ? 'Đã lưu bài viết' : 'Đã bỏ lưu bài viết');
        },
        onError: error => {
          // Revert on failure
          setIsSaved(prevSaved);
          toast.error(error?.response?.data?.message || 'Thao tác thất bại');
        },
      }
    );
  }, [data?._id, isSaved, saveLoading, toggleSave]);

  const handleDelete = useCallback(async () => {
    if (deletePending || !data?._id) return;

    try {
      await deletePostMutation(data._id);
      toast.success('Đã xóa bài viết');
      setShowDeleteConfirm(false);
      setShowOptions(false);
      // Notify parent to remove from list
      onDelete?.(data._id);
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Xóa bài viết thất bại');
    }
  }, [deletePending, data?._id, onDelete, deletePostMutation]);

  const handleShare = useCallback(async () => {
    if (sharePending || !data?._id) return;

    try {
      await sharePostMutation({ postId: data._id });
      toast.success('Đã chia sẻ bài viết');
      setShowOptions(false);
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Chia sẻ thất bại');
    }
  }, [sharePending, data?._id, sharePostMutation]);

  const handleCopyLink = useCallback(() => {
    const url = `${window.location.origin}/post/${data?._id}`;
    navigator.clipboard.writeText(url);
    toast.success('Đã sao chép link');
    setShowOptions(false);
  }, [data?._id]);

  if (!data)
    return (
      <div className="p-4 text-center text-neutral-500">
        No post data available
      </div>
    );

  return (
    <article className="rounded-2xl border border-neutral-200 dark:border-neutral-800 p-4 bg-white dark:bg-neutral-900 hover:border-neutral-300 dark:hover:border-neutral-700 transition-colors">
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="relative group">
            <img
              className="w-11 h-11 rounded-full object-cover border-2 border-neutral-200 dark:border-neutral-700"
              src={user.avatar}
              alt={user.name}
            />
            <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full border-2 border-white dark:border-neutral-900 opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-content dark:text-white hover:underline cursor-pointer">
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
              <span>@{user.username}</span>
              <span>•</span>
              <span>{formatTime(data.createdAt)}</span>
            </div>
          </div>
        </div>

        <button
          onClick={() => setShowOptions(!showOptions)}
          className="p-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-400 hover:text-content dark:hover:text-white transition-all"
        >
          <MoreHorizontal size={18} />
        </button>
      </div>

      {/* Content */}
      {data.caption && (
        <p className="text-content dark:text-white leading-relaxed mb-3 whitespace-pre-wrap break-words">
          {data.caption}
        </p>
      )}

      {/* Media */}
      {data.media && data.media.length > 0 && (
        <div
          className={`rounded-xl overflow-hidden mb-3 ${
            data.media.length === 1 ? '' : 'grid gap-1'
          } ${data.media.length === 2 ? 'grid-cols-2' : ''} ${
            data.media.length >= 3 ? 'grid-cols-2' : ''
          }`}
        >
          {data.media.slice(0, 4).map((item, index) => (
            <div
              key={index}
              className={`relative overflow-hidden ${
                data.media.length === 3 && index === 0 ? 'row-span-2' : ''
              } ${data.media.length === 1 ? 'max-h-[450px]' : 'aspect-square'}`}
            >
              {item.type === 'video' ? (
                <video
                  autoPlay
                  playsInline
                  muted
                  loop
                  className="w-full h-full object-cover"
                >
                  <source src={item.url} type="video/mp4" />
                </video>
              ) : (
                <img
                  className={`w-full h-full object-cover cursor-pointer hover:scale-105 transition-transform duration-300 ${
                    data.media.length === 1 ? 'max-h-[450px]' : ''
                  }`}
                  src={item.url}
                  alt={`Post media ${index + 1}`}
                  onClick={() => setShowImage(item.url)}
                />
              )}
              {data.media.length > 4 && index === 3 && (
                <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center">
                  <span className="text-white text-2xl font-bold">
                    +{data.media.length - 4}
                  </span>
                </div>
              )}
            </div>
          ))}
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
      <div className="h-px bg-neutral-200 dark:bg-neutral-800 mb-3" />

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
            onClick={() => setShowComments(true)}
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
      {showImage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90"
          onClick={() => setShowImage(null)}
        >
          <img
            src={showImage}
            alt="Full view"
            className="max-w-[90vw] max-h-[90vh] rounded-xl"
          />
          <button
            className="absolute top-4 right-4 bg-white/10 backdrop-blur-sm text-white p-2.5 rounded-xl hover:bg-white/20 transition-colors"
            onClick={() => setShowImage(null)}
          >
            <X size={20} />
          </button>
        </div>
      )}

      {/* Options Modal */}
      {showOptions && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
          onClick={() => setShowOptions(false)}
        >
          <div
            className="w-full max-w-sm bg-white dark:bg-neutral-900 rounded-2xl overflow-hidden"
            onClick={e => e.stopPropagation()}
          >
            {/* Owner actions */}
            {isOwner && (
              <>
                <button
                  onClick={() => {
                    setShowEditModal(true);
                    setShowOptions(false);
                  }}
                  className="w-full px-4 py-3 flex items-center gap-3 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-black dark:text-white border-b border-neutral-200 dark:border-neutral-800"
                >
                  <Edit3 size={18} />
                  Edit post
                </button>
                <button
                  onClick={() => {
                    setShowDeleteConfirm(true);
                    setShowOptions(false);
                  }}
                  className="w-full px-4 py-3 flex items-center gap-3 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-red-500 border-b border-neutral-200 dark:border-neutral-800"
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
                  setShowOptions(false);
                }}
                className="w-full px-4 py-3 flex items-center gap-3 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-red-500 border-b border-neutral-200 dark:border-neutral-800"
              >
                <Flag size={18} />
                Report post
              </button>
            )}

            <button
              onClick={handleShare}
              disabled={sharePending}
              className="w-full px-4 py-3 flex items-center gap-3 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-black dark:text-white border-b border-neutral-200 dark:border-neutral-800"
            >
              <Share2 size={18} />
              {sharePending ? 'Sharing...' : 'Share post'}
            </button>

            <button
              onClick={handleCopyLink}
              className="w-full px-4 py-3 flex items-center gap-3 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-black dark:text-white border-b border-neutral-200 dark:border-neutral-800"
            >
              <Link2 size={18} />
              Copy link
            </button>

            {!isOwner && (
              <button className="w-full px-4 py-3 flex items-center gap-3 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-black dark:text-white border-b border-neutral-200 dark:border-neutral-800">
                <EyeOff size={18} />
                Hide post
              </button>
            )}

            <button
              onClick={() => setShowOptions(false)}
              className="w-full px-4 py-3 text-left hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-500"
            >
              Cancel
            </button>
          </div>
        </div>
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
            <h3 className="text-lg font-semibold text-black dark:text-white mb-2">
              Delete Post?
            </h3>
            <p className="text-sm text-neutral-500 mb-6">
              This action cannot be undone. The post will be permanently
              removed.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 px-4 py-2.5 rounded-full border border-neutral-200 dark:border-neutral-700 text-black dark:text-white text-sm font-medium hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
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
        <Suspense fallback={null}>
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
        <Suspense fallback={null}>
          <ModelPost
            closeModal={() => setShowEditModal(false)}
            editPost={data}
          />
        </Suspense>
      )}

      {/* Comments Modal Placeholder */}
      {showComments && (
        <Suspense fallback={null}>
          <CommentModal
            onClose={() => setShowComments(false)}
            postId={data?._id}
          />
        </Suspense>
      )}
    </article>
  );
};

export default Post;
