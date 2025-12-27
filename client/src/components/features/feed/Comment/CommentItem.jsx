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
                   text-sm focus:outline-none focus:ring-2 focus:ring-primary 
                   disabled:opacity-50"
        />
        <button
          onClick={handleSubmit}
          disabled={!value.trim() || isSubmitting}
          className={`p-2.5 rounded-full transition-all duration-200 ${
            value.trim() && !isSubmitting
              ? 'bg-primary text-primary-foreground hover:opacity-80'
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
      await onDelete(comment._id, depth > 0);
      setShowDeleteConfirm(false);
    }, [comment._id, onDelete, depth]);

    const handleReply = useCallback(() => {
      onReply(comment._id, comment.user?.name || 'người dùng');
    }, [comment._id, comment.user?.name, onReply]);

    const handleLike = useCallback(() => {
      onLike(comment._id, isLiked);
    }, [comment._id, isLiked, onLike]);

    return (
      <div
        className={`relative group/comment ${depth > 0 ? 'ml-12 mt-3' : ''}`}
      >
        {/* Soft Thread Guide - Only visible on hover */}
        {depth > 0 && (
          <div className="absolute -left-6 top-0 bottom-0 w-px bg-transparent group-hover/comment:bg-neutral-200 dark:group-hover/comment:bg-neutral-800 transition-colors" />
        )}

        {/* Main Comment */}
        <div className="flex gap-3 relative z-10">
          {/* Avatar - using Design System class */}
          <div className="relative">
            <img
              src={
                comment.user?.profile?.avatar ||
                `https://api.dicebear.com/7.x/avataaars/svg?seed=${comment.user?._id}`
              }
              alt=""
              className={`yb-avatar bg-white dark:bg-neutral-800 object-cover flex-shrink-0 ${
                depth > 0 ? 'w-8 h-8' : 'w-10 h-10'
              }`}
            />
          </div>

          <div className="flex-1 min-w-0">
            {/* Comment Content */}
            {isEditing ? (
              <div className="bg-neutral-100 dark:bg-neutral-800 rounded-2xl p-3 animate-scale-in">
                <textarea
                  value={editValue}
                  onChange={e => setEditValue(e.target.value)}
                  className="w-full bg-transparent text-[var(--color-content)] text-sm 
                           resize-none focus:outline-none font-sans"
                  rows={2}
                  autoFocus
                />
                <div className="flex justify-end gap-2 mt-2">
                  <button
                    onClick={() => {
                      setIsEditing(false);
                      setEditValue(comment.content);
                    }}
                    className="px-3 py-1 text-xs font-medium text-[var(--color-text-tertiary)] 
                             hover:bg-[var(--color-surface-hover)] rounded-lg transition-all"
                  >
                    Hủy
                  </button>
                  <button
                    onClick={handleEdit}
                    disabled={!editValue.trim()}
                    className="px-3 py-1 text-xs font-medium bg-[var(--color-primary)] text-[var(--color-primary-foreground)]
                             rounded-lg hover:opacity-90 disabled:opacity-50 transition-all"
                  >
                    Lưu
                  </button>
                </div>
              </div>
            ) : (
              <div className="group/content">
                <div className="bg-[var(--color-surface-secondary)] rounded-[1.25rem] px-4 py-3 inline-block max-w-full hover-lift">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[13px] font-semibold text-[var(--color-content)]">
                      {comment.user?.name || 'Người dùng'}
                    </span>
                    {comment.user?.verified && (
                      <span className="text-blue-500">
                        <svg
                          width="12"
                          height="12"
                          viewBox="0 0 24 24"
                          fill="currentColor"
                        >
                          <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
                        </svg>
                      </span>
                    )}
                    <span className="text-[11px] text-[var(--color-text-tertiary)] ml-1">
                      {timeAgo}
                    </span>
                  </div>
                  <p className="text-[14px] text-[var(--color-text-secondary)] leading-relaxed break-words font-normal">
                    {comment.content}
                  </p>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-4 mt-1.5 px-3">
                  <button
                    onClick={handleLike}
                    className={`flex items-center gap-1.5 text-xs font-medium transition-colors ${
                      isLiked
                        ? 'text-[var(--color-like)]'
                        : 'text-[var(--color-text-tertiary)] hover:text-[var(--color-like)]'
                    }`}
                  >
                    {isLiked ? 'Đã thích' : 'Thích'}
                    {likeCount > 0 && (
                      <span className="text-[11px]">{likeCount}</span>
                    )}
                  </button>

                  <button
                    onClick={handleReply}
                    className="text-xs font-medium text-[var(--color-text-tertiary)] 
                             hover:text-[var(--color-text-secondary)] transition-colors"
                  >
                    Trả lời
                  </button>

                  <div className="relative opacity-0 group-hover/content:opacity-100 transition-opacity">
                    <button
                      onClick={() => setShowOptions(!showOptions)}
                      className="p-1 rounded-full hover:bg-[var(--color-surface-hover)] transition-colors"
                    >
                      <MoreHorizontal
                        size={14}
                        className="text-[var(--color-text-tertiary)]"
                      />
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
              </div>
            )}

            {/* Reply Input */}
            {isReplying && (
              <div className="mt-3 flex items-start gap-3 animate-fade-in pl-1">
                <div className="flex-1">
                  <CommentInput
                    onSubmit={content => onAddReply(content, comment._id)}
                    placeholder={`Trả lời ${replyingTo.username}...`}
                    autoFocus
                  />
                </div>
                <button
                  onClick={onCancelReply}
                  className="p-2 text-[var(--color-text-tertiary)] hover:text-[var(--color-text-secondary)]"
                >
                  <X size={16} />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Replies Container - Pure whitespace, no borders */}
        {comment.replies?.length > 0 && (
          <div className="relative">
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

        {/* Delete Modal - Keeps original style as it's functional */}
        {showDeleteConfirm && (
          /* ... existing modal code ... */
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-fade-in"
            onClick={() => setShowDeleteConfirm(false)}
          >
            <div
              className="yb-card p-6 w-full max-w-sm mx-4 shadow-2xl animate-scale-in"
              onClick={e => e.stopPropagation()}
            >
              <h3 className="text-lg font-semibold text-[var(--color-content)]">
                Xóa bình luận?
              </h3>
              <p className="text-sm text-[var(--color-text-tertiary)] mt-2">
                Bạn có chắc muốn xóa bình luận này không?
              </p>
              <div className="flex justify-end gap-3 mt-6">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="yb-btn yb-btn-ghost text-sm px-4 py-2"
                >
                  Hủy
                </button>
                <button
                  onClick={handleDelete}
                  className="yb-btn bg-red-500 hover:bg-red-600 text-white text-sm px-4 py-2 shadow-sm"
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
