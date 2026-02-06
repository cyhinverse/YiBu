import React from 'react';
import {
  MoreHorizontal,
  Eye,
  Trash2,
  Flag,
  Calendar,
  MessageCircle,
  Heart,
  Reply,
  Loader2,
  CheckCircle,
} from 'lucide-react';
import { getStatusStyle, getStatusText } from './CommentsUtils.jsx';

export default function CommentsTable({
  comments,
  loading,
  activeDropdown,
  setActiveDropdown,
  onViewDetails,
  onModerate,
  onDelete,
}) {
  if (loading && comments.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24">
        <Loader2 size={32} className="animate-spin text-[var(--color-text-tertiary)] mb-4" />
        <p className="text-[var(--color-text-secondary)] font-medium text-sm">
          Đang tải bình luận...
        </p>
      </div>
    );
  }

  if (comments.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-32 text-[var(--color-text-secondary)]">
        <div className="w-16 h-16 rounded-full bg-[var(--color-surface-secondary)] flex items-center justify-center mb-4">
          <MessageCircle size={32} />
        </div>
        <p className="font-semibold text-lg text-[var(--color-text-secondary)]">
          Không tìm thấy bình luận nào
        </p>
      </div>
    );
  }


  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="bg-[var(--color-surface-secondary)]">
            <th className="px-4 py-3 text-left text-[11px] font-semibold text-[var(--color-text-tertiary)] uppercase tracking-[0.2em]">
              Tác giả
            </th>
            <th className="px-4 py-3 text-left text-[11px] font-semibold text-[var(--color-text-tertiary)] uppercase tracking-[0.2em] w-[40%]">
              Nội dung
            </th>
            <th className="px-4 py-3 text-left text-[11px] font-semibold text-[var(--color-text-tertiary)] uppercase tracking-[0.2em]">
              Trạng thái
            </th>
            <th className="px-4 py-3 text-left text-[11px] font-semibold text-[var(--color-text-tertiary)] uppercase tracking-[0.2em]">
              Tương tác
            </th>
            <th className="px-4 py-3 text-left text-[11px] font-semibold text-[var(--color-text-tertiary)] uppercase tracking-[0.2em]">
              Thời gian
            </th>
            <th className="px-4 py-3 text-right text-[11px] font-semibold text-[var(--color-text-tertiary)] uppercase tracking-[0.2em]">
              Hành động
            </th>
          </tr>
        </thead>
        <tbody>

          {comments.map(comment => {
            const UserAvatar = comment.user?.avatar;
            const UserName = comment.user?.username || 'Người dùng';
            const UserEmail = comment.user?.email || '';

            return (
              <tr
                key={comment._id || comment.id}
                className="hover:bg-[var(--color-surface-hover)] transition-colors group"
              >

                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <img
                      src={UserAvatar || '/images/default-avatar.png'}
                      alt={`${UserName} avatar`}
                      className="w-10 h-10 rounded-full object-cover bg-[var(--color-surface-secondary)]"
                    />
                    <div>
                      <div className="font-semibold text-sm text-[var(--color-content)]">
                        {UserName}
                      </div>
                      <div className="text-xs text-[var(--color-text-secondary)] font-medium">
                        {UserEmail}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <div className="flex flex-col gap-1.5">
                    <p className="text-sm text-[var(--color-text-secondary)] font-medium line-clamp-2 leading-relaxed">
                      {comment.content}
                    </p>
                    {comment.postId && (
                      <div className="flex items-center gap-1.5 text-[10px] font-medium text-[var(--color-text-tertiary)]">
                        <Reply size={10} />
                        <span>
                          trong bài viết{' '}
                          <span className="text-[var(--color-content)] hover:underline cursor-pointer font-semibold">
                            #{comment.postId._id?.slice(-6) || '...'}
                          </span>
                        </span>
                      </div>
                    )}
                  </div>
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`admin-pill ${getStatusStyle(
                      comment.status || 'active'
                    )}`}
                  >
                    {getStatusText(comment.status || 'active')}
                  </span>

                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-4 text-xs font-medium text-[var(--color-text-secondary)]">
                    <div className="flex items-center gap-1.5" title="Likes">
                      <Heart
                        size={14}
                        className="text-[var(--color-text-tertiary)] group-hover:text-[var(--color-like)] transition-colors"
                      />
                      {comment.likes?.length || 0}
                    </div>
                    <div className="flex items-center gap-1.5" title="Replies">
                      <MessageCircle
                        size={14}
                        className="text-[var(--color-text-tertiary)] group-hover:text-[var(--color-warning)] transition-colors"
                      />
                      {comment.replies?.length || 0}
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1.5 text-xs font-medium text-[var(--color-text-secondary)]">
                    <Calendar size={12} />
                    {comment.createdAt
                      ? new Date(comment.createdAt).toLocaleDateString('vi-VN')
                      : 'N/A'}
                  </div>
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="relative inline-block">
                    <button
                      type="button"
                      onClick={() =>
                        setActiveDropdown(
                          activeDropdown === (comment._id || comment.id)
                            ? null
                            : comment._id || comment.id
                        )
                      }
                      onKeyDown={event => {
                        if (event.key === 'Escape') {
                          setActiveDropdown(null);
                        }
                      }}
                      aria-haspopup="menu"
                      aria-expanded={
                        activeDropdown === (comment._id || comment.id)
                      }
                      aria-label="Tùy chọn"
                      className="p-2 hover:bg-[var(--color-surface-hover)] rounded-lg transition-colors text-[var(--color-text-secondary)]"
                    >
                      <MoreHorizontal size={18} strokeWidth={1.6} />
                    </button>

                      {activeDropdown === (comment._id || comment.id) && (
                        <div
                          role="menu"
                          className="absolute right-0 top-full mt-2 w-48 bg-[var(--color-surface)] rounded-xl py-1.5 z-10 animate-scale-in"
                        >
                        <button
                          type="button"
                          onClick={() => {
                            onViewDetails(comment);
                            setActiveDropdown(null);
                          }}
                          role="menuitem"
                          className="w-full px-4 py-2.5 text-left text-xs font-medium hover:bg-[var(--color-surface-hover)] flex items-center gap-2.5 text-[var(--color-text-secondary)] transition-colors"
                        >
                          <Eye size={16} />
                          Xem chi tiết
                        </button>
                        {(comment.status === 'hidden' ||
                          comment.status === 'flagged') && (
                          <button
                            type="button"
                            onClick={() => {
                              onModerate(comment, 'active');
                              setActiveDropdown(null);
                            }}
                            role="menuitem"
                          className="w-full px-4 py-2.5 text-left text-xs font-medium hover:bg-[var(--color-surface-hover)] flex items-center gap-2.5 text-[var(--color-success)] transition-colors"
                        >
                          <CheckCircle size={16} />
                          Khôi phục
                        </button>
                        )}
                        {comment.status !== 'hidden' && (
                          <button
                            type="button"
                            onClick={() => {
                              onModerate(comment, 'hidden');
                              setActiveDropdown(null);
                            }}
                            role="menuitem"
                            className="w-full px-4 py-2.5 text-left text-xs font-medium hover:bg-[var(--color-surface-hover)] flex items-center gap-2.5 text-[var(--color-warning)] transition-colors"
                          >
                            <Flag size={16} />
                            Ẩn bình luận
                          </button>
                        )}
                        <div className="my-1 mx-2" />
                        <button
                          type="button"
                          onClick={() => {
                            onDelete(comment);
                            setActiveDropdown(null);
                          }}
                          role="menuitem"
                          className="w-full px-4 py-2.5 text-left text-xs font-medium hover:bg-[var(--color-surface-hover)] flex items-center gap-2.5 text-[var(--color-error)] transition-colors"
                        >
                          <Trash2 size={16} />
                          Xóa vĩnh viễn
                        </button>
                      </div>
                    )}
                  </div>

                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
