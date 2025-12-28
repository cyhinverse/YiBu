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
        <Loader2 size={32} className="animate-spin text-neutral-400 mb-4" />
        <p className="text-neutral-500 font-medium text-sm">
          Đang tải bình luận...
        </p>
      </div>
    );
  }

  if (comments.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-32 text-neutral-400">
        <div className="w-16 h-16 rounded-full bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center mb-4">
          <MessageCircle size={32} />
        </div>
        <p className="font-bold text-lg text-neutral-600 dark:text-neutral-300">
          Không tìm thấy bình luận nào
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-neutral-100 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-800/20">
            <th className="px-6 py-4 text-left text-xs font-bold text-neutral-500 uppercase tracking-wider">
              Tác giả
            </th>
            <th className="px-6 py-4 text-left text-xs font-bold text-neutral-500 uppercase tracking-wider w-[40%]">
              Nội dung
            </th>
            <th className="px-6 py-4 text-left text-xs font-bold text-neutral-500 uppercase tracking-wider">
              Trạng thái
            </th>
            <th className="px-6 py-4 text-left text-xs font-bold text-neutral-500 uppercase tracking-wider">
              Tương tác
            </th>
            <th className="px-6 py-4 text-left text-xs font-bold text-neutral-500 uppercase tracking-wider">
              Thời gian
            </th>
            <th className="px-6 py-4 text-right text-xs font-bold text-neutral-500 uppercase tracking-wider">
              Hành động
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
          {comments.map(comment => {
            const UserAvatar = comment.user?.avatar;
            const UserName = comment.user?.username || 'Người dùng';
            const UserEmail = comment.user?.email || '';

            return (
              <tr
                key={comment._id || comment.id}
                className="hover:bg-neutral-50/50 dark:hover:bg-neutral-800/30 transition-colors group"
              >
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <img
                      src={UserAvatar || '/images/default-avatar.png'}
                      alt=""
                      className="w-10 h-10 rounded-full object-cover border border-neutral-200 dark:border-neutral-700 shadow-sm"
                    />
                    <div>
                      <div className="font-bold text-sm text-neutral-900 dark:text-white">
                        {UserName}
                      </div>
                      <div className="text-xs text-neutral-500 font-medium">
                        {UserEmail}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex flex-col gap-1.5">
                    <p className="text-sm text-neutral-700 dark:text-neutral-300 font-medium line-clamp-2 leading-relaxed">
                      {comment.content}
                    </p>
                    {comment.postId && (
                      <div className="flex items-center gap-1.5 text-[10px] font-medium text-neutral-400">
                        <Reply size={10} />
                        <span>
                          trong bài viết{' '}
                          <span className="text-neutral-700 dark:text-neutral-300 hover:underline cursor-pointer font-bold">
                            #{comment.postId._id?.slice(-6) || '...'}
                          </span>
                        </span>
                      </div>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span
                    className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide border ${getStatusStyle(
                      comment.status || 'active'
                    )}`}
                  >
                    {getStatusText(comment.status || 'active')}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-4 text-xs font-medium text-neutral-500">
                    <div className="flex items-center gap-1.5" title="Likes">
                      <Heart
                        size={14}
                        className="text-neutral-400 group-hover:text-rose-500 transition-colors"
                      />
                      {comment.likes?.length || 0}
                    </div>
                    <div className="flex items-center gap-1.5" title="Replies">
                      <MessageCircle
                        size={14}
                        className="text-neutral-400 group-hover:text-amber-500 transition-colors"
                      />
                      {comment.replies?.length || 0}
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-1.5 text-xs font-medium text-neutral-500">
                    <Calendar size={12} />
                    {comment.createdAt
                      ? new Date(comment.createdAt).toLocaleDateString('vi-VN')
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
                      className="p-2 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg transition-colors text-neutral-500"
                    >
                      <MoreHorizontal size={18} />
                    </button>

                    {activeDropdown === (comment._id || comment.id) && (
                      <div className="absolute right-0 top-full mt-2 w-48 bg-white dark:bg-neutral-900 rounded-xl shadow-xl border border-neutral-200 dark:border-neutral-800 py-1.5 z-10 animate-scale-in">
                        <button
                          onClick={() => {
                            onViewDetails(comment);
                            setActiveDropdown(null);
                          }}
                          className="w-full px-4 py-2.5 text-left text-xs font-medium hover:bg-neutral-50 dark:hover:bg-neutral-800 flex items-center gap-2.5 text-neutral-700 dark:text-neutral-300 transition-colors"
                        >
                          <Eye size={16} />
                          Xem chi tiết
                        </button>
                        {(comment.status === 'hidden' ||
                          comment.status === 'flagged') && (
                          <button
                            onClick={() => {
                              onModerate(comment, 'active');
                              setActiveDropdown(null);
                            }}
                            className="w-full px-4 py-2.5 text-left text-xs font-medium hover:bg-neutral-50 dark:hover:bg-neutral-800 flex items-center gap-2.5 text-emerald-600 transition-colors"
                          >
                            <CheckCircle size={16} />
                            Khôi phục
                          </button>
                        )}
                        {comment.status !== 'hidden' && (
                          <button
                            onClick={() => {
                              onModerate(comment, 'hidden');
                              setActiveDropdown(null);
                            }}
                            className="w-full px-4 py-2.5 text-left text-xs font-medium hover:bg-neutral-50 dark:hover:bg-neutral-800 flex items-center gap-2.5 text-amber-600 transition-colors"
                          >
                            <Flag size={16} />
                            Ẩn bình luận
                          </button>
                        )}
                        <div className="h-px bg-neutral-100 dark:bg-neutral-800 my-1 mx-2" />
                        <button
                          onClick={() => {
                            onDelete(comment);
                            setActiveDropdown(null);
                          }}
                          className="w-full px-4 py-2.5 text-left text-xs font-medium hover:bg-neutral-50 dark:hover:bg-neutral-800 flex items-center gap-2.5 text-rose-600 transition-colors"
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
