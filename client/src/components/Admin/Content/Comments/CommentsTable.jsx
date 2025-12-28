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
  XCircle,
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
        <Loader2 size={48} className="animate-spin text-primary mb-4" />
        <p className="text-secondary font-bold">Đang tải bình luận...</p>
      </div>
    );
  }

  if (comments.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-32 text-secondary">
        <MessageCircle size={64} className="mb-4 opacity-10" />
        <p className="font-bold text-lg">Không tìm thấy bình luận nào</p>
      </div>
    );
  }

  return (
    <div className="bg-surface rounded-3xl border border-border shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border bg-surface-secondary/30">
              <th className="px-6 py-4 text-left text-xs font-black text-secondary uppercase tracking-widest">
                Tác giả
              </th>
              <th className="px-6 py-4 text-left text-xs font-black text-secondary uppercase tracking-widest w-[40%]">
                Nội dung
              </th>
              <th className="px-6 py-4 text-left text-xs font-black text-secondary uppercase tracking-widest">
                Trạng thái
              </th>
              <th className="px-6 py-4 text-left text-xs font-black text-secondary uppercase tracking-widest">
                Tương tác
              </th>
              <th className="px-6 py-4 text-left text-xs font-black text-secondary uppercase tracking-widest">
                Thời gian
              </th>
              <th className="px-6 py-4 text-right text-xs font-black text-secondary uppercase tracking-widest">
                Hành động
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {comments.map(comment => {
              const UserAvatar = comment.user?.avatar;
              const UserName = comment.user?.username || 'Người dùng';
              const UserEmail = comment.user?.email || '';

              return (
                <tr
                  key={comment._id || comment.id}
                  className="hover:bg-surface-secondary/30 transition-colors"
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <img
                          src={UserAvatar || '/images/default-avatar.png'}
                          alt=""
                          className="w-10 h-10 rounded-xl object-cover border border-border shadow-sm"
                        />
                        {/* {comment.user?.role === 'admin' && (
                            <div className="absolute -bottom-1 -right-1 bg-primary text-white p-0.5 rounded-full border-2 border-surface">
                              <Shield size={10} />
                            </div>
                          )} */}
                      </div>
                      <div>
                        <div className="font-bold text-sm text-primary">
                          {UserName}
                        </div>
                        <div className="text-xs text-secondary font-medium">
                          {UserEmail}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col gap-1">
                      <p className="text-sm text-primary font-medium line-clamp-2 leading-relaxed">
                        {comment.content}
                      </p>
                      {comment.postId && (
                        <div className="flex items-center gap-1 text-[10px] font-bold text-secondary">
                          <Reply size={10} />
                          <span>
                            Trả lời trong bài viết{' '}
                            <span className="text-primary hover:underline cursor-pointer">
                              #{comment.postId._id?.slice(-6) || '...'}
                            </span>
                          </span>
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`inline-flex items-center px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wide border ${getStatusStyle(
                        comment.status || 'active'
                      )}`}
                    >
                      {getStatusText(comment.status || 'active')}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-4 text-xs font-bold text-secondary">
                      <div className="flex items-center gap-1.5" title="Likes">
                        <Heart size={14} className="text-rose-500" />
                        {comment.likes?.length || 0}
                      </div>
                      <div
                        className="flex items-center gap-1.5"
                        title="Replies"
                      >
                        <MessageCircle size={14} className="text-blue-500" />
                        {comment.replies?.length || 0}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-1.5 text-xs font-medium text-secondary">
                      <Calendar size={12} />
                      {comment.createdAt
                        ? new Date(comment.createdAt).toLocaleDateString(
                            'vi-VN'
                          )
                        : 'N/A'}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="relative inline-block">
                      <button
                        onClick={() =>
                          setActiveDropdown(
                            activeDropdown === (comment._id || comment.id)
                              ? null
                              : comment._id || comment.id
                          )
                        }
                        className="p-2 hover:bg-surface-secondary rounded-lg transition-colors text-secondary"
                      >
                        <MoreHorizontal size={18} />
                      </button>

                      {activeDropdown === (comment._id || comment.id) && (
                        <div className="absolute right-0 top-full mt-2 w-48 bg-surface rounded-xl shadow-xl border border-border py-1 z-10 animate-scale-in">
                          <button
                            onClick={() => {
                              onViewDetails(comment);
                              setActiveDropdown(null);
                            }}
                            className="w-full px-4 py-2.5 text-left text-xs font-bold hover:bg-surface-secondary flex items-center gap-2 text-primary transition-colors"
                          >
                            <Eye size={14} />
                            Xem chi tiết
                          </button>
                          {(comment.status === 'hidden' ||
                            comment.status === 'flagged') && (
                            <button
                              onClick={() => {
                                onModerate(comment, 'active');
                                setActiveDropdown(null);
                              }}
                              className="w-full px-4 py-2.5 text-left text-xs font-bold hover:bg-emerald-50 dark:hover:bg-emerald-900/10 flex items-center gap-2 text-emerald-600 transition-colors"
                            >
                              <CheckCircle size={14} />
                              Khôi phục
                            </button>
                          )}
                          {comment.status !== 'hidden' && (
                            <button
                              onClick={() => {
                                onModerate(comment, 'hidden');
                                setActiveDropdown(null);
                              }}
                              className="w-full px-4 py-2.5 text-left text-xs font-bold hover:bg-amber-50 dark:hover:bg-amber-900/10 flex items-center gap-2 text-amber-600 transition-colors"
                            >
                              <Flag size={14} />
                              Ẩn bình luận
                            </button>
                          )}
                          <div className="h-px bg-border my-1 mx-2" />
                          <button
                            onClick={() => {
                              onDelete(comment);
                              setActiveDropdown(null);
                            }}
                            className="w-full px-4 py-2.5 text-left text-xs font-bold hover:bg-rose-50 dark:hover:bg-rose-900/10 flex items-center gap-2 text-rose-600 transition-colors"
                          >
                            <Trash2 size={14} />
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
    </div>
  );
}
