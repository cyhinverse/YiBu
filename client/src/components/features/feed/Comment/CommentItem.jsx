import { useState, memo, useCallback } from 'react';
import {
  Heart,
  MessageSquare,
  MoreHorizontal,
  Edit2,
  Trash2,
  Send,
  X,
} from 'lucide-react';
import { formatDistanceToNow } from '../../../../utils/dateUtils';

/**
 * CommentInput - Input để thêm comment/reply
 */
const CommentInput = memo(
  ({ onSubmit, placeholder = 'Viết bình luận...', autoFocus = false }) => {
    const [value, setValue] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async () => {
      if (!value.trim() || isSubmitting) return;
      setIsSubmitting(true);
      try {
        await onSubmit(value);
        setValue('');
      } finally {
        setIsSubmitting(false);
      }
    };

    const handleKeyDown = e => {
      if (e.key === 'Enter' && !e.shiftKey && value.trim()) {
        e.preventDefault();
        handleSubmit();
      }
    };

    return (
      <div className="flex items-center gap-2">
        <input
          type="text"
          value={value}
          onChange={e => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          autoFocus={autoFocus}
          disabled={isSubmitting}
          className="flex-1 px-4 py-2.5 rounded-full bg-neutral-100 dark:bg-neutral-800 
                   text-neutral-900 dark:text-white placeholder:text-neutral-400 
                   text-sm focus:outline-none focus:ring-2 focus:ring-neutral-300 
                   dark:focus:ring-neutral-600 disabled:opacity-50"
        />
        <button
          onClick={handleSubmit}
          disabled={!value.trim() || isSubmitting}
          className={`p-2.5 rounded-full transition-all duration-200 ${
            value.trim() && !isSubmitting
              ? 'bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 hover:opacity-80'
              : 'bg-neutral-200 dark:bg-neutral-700 text-neutral-400 cursor-not-allowed'
          }`}
        >
          <Send size={16} />
        </button>
      </div>
    );
  }
);

CommentInput.displayName = 'CommentInput';

/**
 * OptionsMenu - Dropdown menu cho comment actions
 */
const OptionsMenu = memo(({ isOwner, onEdit, onDelete, onClose }) => (
  <div
    className="absolute right-0 top-full mt-1 w-36 bg-white dark:bg-neutral-800 
                  rounded-lg shadow-lg border border-neutral-200 dark:border-neutral-700 
                  py-1 z-20 animate-in fade-in slide-in-from-top-1 duration-150"
  >
    {isOwner ? (
      <>
        <button
          onClick={() => {
            onEdit();
            onClose();
          }}
          className="flex items-center gap-2 w-full px-3 py-2 text-sm text-neutral-700 
                   dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-700"
        >
          <Edit2 size={14} />
          Chỉnh sửa
        </button>
        <button
          onClick={() => {
            onDelete();
            onClose();
          }}
          className="flex items-center gap-2 w-full px-3 py-2 text-sm text-red-600 
                   dark:text-red-400 hover:bg-neutral-100 dark:hover:bg-neutral-700"
        >
          <Trash2 size={14} />
          Xóa
        </button>
      </>
    ) : (
      <button
        onClick={onClose}
        className="flex items-center gap-2 w-full px-3 py-2 text-sm text-neutral-700 
                 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-700"
      >
        Báo cáo
      </button>
    )}
  </div>
));

OptionsMenu.displayName = 'OptionsMenu';

/**
 * CommentItem - Component hiển thị một comment
 */
const CommentItem = memo(
  ({
    comment,
    currentUserId,
    onEdit,
    onDelete,
    onReply,
    onLike,
    replyingTo,
    onAddReply,
    onCancelReply,
    depth = 0,
  }) => {
    const [showOptions, setShowOptions] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [editValue, setEditValue] = useState(comment.content);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

    const isOwner = currentUserId === comment.user?._id;
    const isLiked = comment.likes?.includes?.(currentUserId) || comment.isLiked;
    const likeCount = comment.likeCount || comment.likes?.length || 0;
    const isReplying = replyingTo?.commentId === comment._id;

    const timeAgo = comment.createdAt
      ? formatDistanceToNow(new Date(comment.createdAt))
      : 'Vừa xong';

    const handleEdit = useCallback(async () => {
      if (!editValue.trim()) return;
      const success = await onEdit(comment._id, editValue);
      if (success) setIsEditing(false);
    }, [comment._id, editValue, onEdit]);

    const handleDelete = useCallback(async () => {
      await onDelete(comment._id);
      setShowDeleteConfirm(false);
    }, [comment._id, onDelete]);

    const handleReply = useCallback(() => {
      onReply(comment._id, comment.user?.name || 'người dùng');
    }, [comment._id, comment.user?.name, onReply]);

    const handleLike = useCallback(() => {
      onLike(comment._id, isLiked);
    }, [comment._id, isLiked, onLike]);

    return (
      <div className={`${depth > 0 ? 'ml-10 mt-3' : ''}`}>
        {/* Main Comment */}
        <div className="flex gap-3">
          {/* Avatar */}
          <img
            src={
              comment.user?.profile?.avatar ||
              `https://api.dicebear.com/7.x/avataaars/svg?seed=${comment.user?._id}`
            }
            alt=""
            className="w-8 h-8 rounded-full object-cover flex-shrink-0"
          />

          <div className="flex-1 min-w-0">
            {/* Comment Content */}
            {isEditing ? (
              <div className="bg-neutral-100 dark:bg-neutral-800 rounded-2xl p-3">
                <textarea
                  value={editValue}
                  onChange={e => setEditValue(e.target.value)}
                  className="w-full bg-transparent text-sm text-neutral-900 dark:text-white 
                           resize-none focus:outline-none"
                  rows={2}
                  autoFocus
                />
                <div className="flex justify-end gap-2 mt-2">
                  <button
                    onClick={() => {
                      setIsEditing(false);
                      setEditValue(comment.content);
                    }}
                    className="px-3 py-1 text-xs text-neutral-600 dark:text-neutral-400 
                             hover:bg-neutral-200 dark:hover:bg-neutral-700 rounded-md"
                  >
                    Hủy
                  </button>
                  <button
                    onClick={handleEdit}
                    disabled={!editValue.trim()}
                    className="px-3 py-1 text-xs bg-neutral-900 dark:bg-white text-white 
                             dark:text-neutral-900 rounded-md hover:opacity-80 
                             disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Lưu
                  </button>
                </div>
              </div>
            ) : (
              <div className="bg-neutral-100 dark:bg-neutral-800 rounded-2xl px-3 py-2">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-medium text-neutral-900 dark:text-white">
                    {comment.user?.name || 'Người dùng'}
                  </span>
                  <div className="flex items-center gap-1 relative">
                    <span className="text-xs text-neutral-500">{timeAgo}</span>
                    <button
                      onClick={() => setShowOptions(!showOptions)}
                      className="p-1 rounded-full hover:bg-neutral-200 dark:hover:bg-neutral-700"
                    >
                      <MoreHorizontal size={14} className="text-neutral-500" />
                    </button>
                    {showOptions && (
                      <OptionsMenu
                        isOwner={isOwner}
                        onEdit={() => setIsEditing(true)}
                        onDelete={() => setShowDeleteConfirm(true)}
                        onClose={() => setShowOptions(false)}
                      />
                    )}
                  </div>
                </div>
                <p className="text-sm text-neutral-700 dark:text-neutral-300 mt-0.5 break-words">
                  {comment.content}
                </p>
              </div>
            )}

            {/* Actions */}
            {!isEditing && (
              <div className="flex items-center gap-4 mt-1 px-2">
                <button
                  onClick={handleLike}
                  className={`flex items-center gap-1 text-xs font-medium transition-colors ${
                    isLiked
                      ? 'text-red-500'
                      : 'text-neutral-500 hover:text-red-500'
                  }`}
                >
                  <Heart size={14} fill={isLiked ? 'currentColor' : 'none'} />
                  {likeCount > 0 && likeCount}
                </button>
                <button
                  onClick={handleReply}
                  className="flex items-center gap-1 text-xs font-medium text-neutral-500 
                           hover:text-neutral-700 dark:hover:text-neutral-300"
                >
                  <MessageSquare size={14} />
                  Trả lời
                </button>
              </div>
            )}

            {/* Reply Input */}
            {isReplying && (
              <div className="mt-2 flex items-center gap-2">
                <div className="flex-1">
                  <CommentInput
                    onSubmit={content => onAddReply(content, comment._id)}
                    placeholder={`Trả lời ${replyingTo.username}...`}
                    autoFocus
                  />
                </div>
                <button
                  onClick={onCancelReply}
                  className="p-2 text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300"
                >
                  <X size={16} />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Replies */}
        {comment.replies?.length > 0 && (
          <div className="mt-2">
            {comment.replies.map(reply => (
              <CommentItem
                key={reply._id}
                comment={reply}
                currentUserId={currentUserId}
                onEdit={onEdit}
                onDelete={onDelete}
                onReply={onReply}
                onLike={onLike}
                replyingTo={replyingTo}
                onAddReply={onAddReply}
                onCancelReply={onCancelReply}
                depth={depth + 1}
              />
            ))}
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {showDeleteConfirm && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
            onClick={() => setShowDeleteConfirm(false)}
          >
            <div
              className="bg-white dark:bg-neutral-900 rounded-xl p-6 w-full max-w-sm mx-4 
                        shadow-xl"
              onClick={e => e.stopPropagation()}
            >
              <h3 className="text-lg font-semibold text-neutral-900 dark:text-white">
                Xóa bình luận?
              </h3>
              <p className="text-sm text-neutral-500 mt-2">
                Hành động này không thể hoàn tác.
              </p>
              <div className="flex justify-end gap-2 mt-4">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="px-4 py-2 text-sm text-neutral-700 dark:text-neutral-300 
                           hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg"
                >
                  Hủy
                </button>
                <button
                  onClick={handleDelete}
                  className="px-4 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700"
                >
                  Xóa
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }
);

CommentItem.displayName = 'CommentItem';

export { CommentItem, CommentInput };
export default CommentItem;
