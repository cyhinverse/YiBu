import { memo, useCallback } from 'react';
import { X, MessageCircle, Loader2 } from 'lucide-react';
import useComments from '@/hooks/useComments';
import { CommentItem, CommentInput } from './CommentItem';

/**
 * CommentModal - Modal hiển thị danh sách comment của một post
 *
 * @param {string} postId - ID của post
 * @param {function} onClose - Callback đóng modal
 */
const CommentModal = memo(({ postId, onClose }) => {
  const {
    comments,
    loading,
    error,
    totalCount,
    currentUser,
    replyingTo,
    addComment,
    editComment,
    removeComment,
    toggleLike,
    startReply,
    cancelReply,
    refresh,
  } = useComments(postId);

  // Thêm comment mới
  const handleAddComment = useCallback(
    async (content, parentId = null) => {
      await addComment(content, parentId);
      cancelReply();
    },
    [addComment, cancelReply]
  );

  // Đóng modal khi click backdrop
  const handleBackdropClick = useCallback(
    e => {
      if (e.target === e.currentTarget) {
        onClose();
      }
    },
    [onClose]
  );

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      onClick={handleBackdropClick}
    >
      <div
        className="w-full max-w-lg bg-white dark:bg-neutral-900 rounded-2xl flex flex-col 
                   max-h-[80vh] overflow-hidden shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-4 py-3 border-b 
                      border-neutral-200 dark:border-neutral-800"
        >
          <h3 className="font-semibold text-neutral-900 dark:text-white flex items-center gap-2">
            <MessageCircle size={18} />
            Bình luận
            <span className="text-neutral-400 font-normal text-sm">
              ({totalCount})
            </span>
          </h3>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-800 
                     transition-colors"
          >
            <X size={18} className="text-neutral-500" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {/* Loading State */}
          {loading && (
            <div className="flex items-center justify-center py-8">
              <Loader2 size={24} className="animate-spin text-neutral-400" />
            </div>
          )}

          {/* Error State */}
          {error && !loading && (
            <div className="text-center py-8">
              <p className="text-red-500 text-sm">{error}</p>
              <button
                onClick={refresh}
                className="mt-2 text-sm text-neutral-500 hover:text-neutral-700 
                         dark:hover:text-neutral-300 underline"
              >
                Thử lại
              </button>
            </div>
          )}

          {/* Empty State */}
          {!loading && !error && comments.length === 0 && (
            <div className="text-center py-8">
              <MessageCircle
                size={40}
                className="mx-auto text-neutral-300 dark:text-neutral-600 mb-3"
              />
              <p className="text-neutral-500 text-sm">Chưa có bình luận nào</p>
              <p className="text-neutral-400 text-xs mt-1">
                Hãy là người đầu tiên bình luận!
              </p>
            </div>
          )}

          {/* Comments List */}
          {!loading && !error && comments.length > 0 && (
            <div className="space-y-4">
              {comments.map(comment => (
                <CommentItem
                  key={comment._id}
                  comment={comment}
                  currentUserId={currentUser?._id}
                  onEdit={editComment}
                  onDelete={removeComment}
                  onReply={startReply}
                  onLike={toggleLike}
                  replyingTo={replyingTo}
                  onAddReply={handleAddComment}
                  onCancelReply={cancelReply}
                />
              ))}
            </div>
          )}
        </div>

        {/* Input */}
        <div className="p-4 border-t border-neutral-200 dark:border-neutral-800">
          <div className="flex items-center gap-3">
            <img
              src={
                currentUser?.profile?.avatar ||
                `https://api.dicebear.com/7.x/avataaars/svg?seed=${currentUser?._id}`
              }
              alt=""
              className="w-8 h-8 rounded-full object-cover flex-shrink-0"
            />
            <div className="flex-1">
              <CommentInput
                onSubmit={content => handleAddComment(content)}
                placeholder="Viết bình luận..."
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});

CommentModal.displayName = 'CommentModal';

export default CommentModal;
