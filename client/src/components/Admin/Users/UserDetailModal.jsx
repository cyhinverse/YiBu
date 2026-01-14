import { useState } from 'react';
import {
  X,
  Mail,
  Calendar,
  Info,
  FileText,
  Flag,
  ShieldOff,
} from 'lucide-react';
import StatusBadge from './StatusBadge';

const UserDetailModal = ({ user, onClose, posts, reports }) => {
  const [activeTab, setActiveTab] = useState('overview');

  if (!user) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-neutral-900 w-full max-w-3xl shadow-2xl max-h-[85vh] flex flex-col rounded-3xl overflow-hidden">
        {/* Modal Header */}
        <div className="p-6 shrink-0 bg-neutral-100/50 dark:bg-neutral-800/40">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-5">
              <img
                src={user.avatar || '/images/default-avatar.png'}
                alt={user.name}
                className="w-20 h-20 rounded-full object-cover"
              />
              <div>
                <h3 className="text-2xl font-bold text-neutral-900 dark:text-white flex items-center gap-3 tracking-tight">
                  {user.name}
                  <StatusBadge status={user.status || 'active'} />
                </h3>
                <p className="text-neutral-500 font-medium mt-1">
                  @{user.username}
                </p>
                <div className="flex items-center gap-4 mt-3 text-xs font-bold text-neutral-400 uppercase tracking-wide">
                  <span className="flex items-center gap-1.5">
                    <Mail size={14} /> {user.email}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Calendar size={14} /> Tham gia{' '}
                    {new Date(user.createdAt).toLocaleDateString('vi-VN')}
                  </span>
                </div>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors text-neutral-500"
            >
              <X size={24} />
            </button>
          </div>
        </div>
        {/* Tabs */}
        <div className="flex px-6 bg-white dark:bg-neutral-900 shrink-0">
          {[
            { id: 'overview', label: 'Tổng quan', icon: Info },
            { id: 'posts', label: 'Bài viết', icon: FileText },
            { id: 'reports', label: 'Báo cáo', icon: Flag },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-6 py-4 text-sm font-bold transition-all border-b-2 ${
                activeTab === tab.id
                  ? 'border-neutral-900 text-neutral-900 dark:border-white dark:text-white'
                  : 'border-transparent text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300'
              }`}
            >
              <tab.icon size={18} />
              {tab.label}
            </button>
          ))}
        </div>
        {/* Modal Content */}
        <div className="p-8 overflow-y-auto flex-1">
          {activeTab === 'overview' && (
            <div className="space-y-6">
              <div className="grid grid-cols-3 gap-4">
                <div className="p-5 bg-neutral-100 dark:bg-neutral-800/50 rounded-2xl">
                  <p className="text-xs font-bold text-neutral-500 uppercase tracking-wider mb-2">
                    Vai trò
                  </p>
                  <p className="text-lg font-bold text-neutral-900 dark:text-white capitalize">
                    {user.role || 'Thành viên'}
                  </p>
                </div>
                <div className="p-5 bg-neutral-100 dark:bg-neutral-800/50 rounded-2xl">
                  <p className="text-xs font-bold text-neutral-500 uppercase tracking-wider mb-2">
                    Bài viết
                  </p>
                  <p className="text-lg font-bold text-neutral-900 dark:text-white">
                    {user.postsCount || 0}
                  </p>
                </div>
                <div className="p-5 bg-neutral-100 dark:bg-neutral-800/50 rounded-2xl">
                  <p className="text-xs font-bold text-neutral-500 uppercase tracking-wider mb-2">
                    Theo dõi
                  </p>
                  <p className="text-lg font-bold text-neutral-900 dark:text-white">
                    {(user.followersCount || 0).toLocaleString()}
                  </p>
                </div>
              </div>

              <div className="p-6 bg-neutral-100 dark:bg-neutral-800/50 rounded-2xl">
                <p className="text-xs font-bold text-neutral-500 uppercase tracking-wider mb-3">
                  Giới thiệu
                </p>
                <p className="text-sm font-medium text-neutral-700 dark:text-neutral-300 leading-relaxed">
                  {user.bio || 'Chưa có thông tin giới thiệu.'}
                </p>
              </div>
            </div>
          )}

          {activeTab === 'posts' && (
            <div className="space-y-4">
              {posts?.length > 0 ? (
                posts.map(post => (
                  <div
                    key={post._id}
                    className="flex gap-5 p-4 rounded-2xl hover:bg-neutral-100 dark:hover:bg-neutral-800/50 transition-all bg-neutral-50 dark:bg-neutral-800/20"
                  >
                    {post.media?.[0] && (
                      <img
                        src={post.media[0].url}
                        alt="Post"
                        className="w-20 h-20 rounded-xl object-cover shadow-sm bg-neutral-100 dark:bg-neutral-800"
                      />
                    )}
                    <div className="flex-1">
                      <p className="text-neutral-900 dark:text-white font-medium line-clamp-2 mb-3">
                        {post.content || post.caption || 'Không có nội dung'}
                      </p>
                      <div className="flex items-center gap-4 text-xs font-bold text-neutral-400">
                        <span className="bg-neutral-100 dark:bg-neutral-800 px-2.5 py-1 rounded-lg text-neutral-600 dark:text-neutral-300">
                          {new Date(post.createdAt).toLocaleDateString('vi-VN')}
                        </span>
                        <span>{post.likesCount} Thích</span>
                        <span>{post.commentsCount} Bình luận</span>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-16 bg-neutral-50 dark:bg-neutral-800/20 rounded-2xl border border-dashed border-neutral-200 dark:border-neutral-700">
                  <FileText
                    size={40}
                    className="mx-auto text-neutral-400 mb-3"
                  />
                  <p className="text-neutral-500 font-medium">
                    Không có bài viết nào.
                  </p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'reports' && (
            <div className="space-y-4">
              {reports?.length > 0 ? (
                reports.map(report => (
                  <div
                    key={report._id}
                    className="p-5 border border-rose-100 dark:border-rose-900/30 bg-rose-50/50 dark:bg-rose-900/10 rounded-2xl"
                  >
                    <div className="flex justify-between items-start mb-4">
                      <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-100 dark:bg-rose-900/40 text-rose-600 dark:text-rose-400 text-[10px] font-bold uppercase tracking-wider">
                        <Flag size={12} />
                        {report.reason}
                      </span>
                      <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">
                        {new Date(report.createdAt).toLocaleDateString('vi-VN')}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <span className="font-bold text-neutral-500">
                        Người báo cáo:
                      </span>
                      <span className="font-bold text-neutral-900 dark:text-white">
                        {report.reporter?.username || 'Ẩn danh'}
                      </span>
                    </div>
                    <div className="mt-4 pt-4 border-t border-rose-100 dark:border-rose-900/20 flex items-center justify-between">
                      <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">
                        Trạng thái
                      </span>
                      <span className="text-xs font-bold text-rose-600 dark:text-rose-400 uppercase">
                        {report.status}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-16 bg-emerald-50/50 dark:bg-emerald-900/10 rounded-2xl border border-dashed border-emerald-200 dark:border-emerald-900/30">
                  <ShieldOff
                    size={40}
                    className="mx-auto text-emerald-400 mb-3"
                  />
                  <p className="text-emerald-600 dark:text-emerald-400 font-bold">
                    Hồ sơ sạch. Không có báo cáo nào.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
        <div className="p-6 bg-neutral-100/50 dark:bg-neutral-800/40 flex justify-end shrink-0">
          <button
            onClick={onClose}
            className="px-6 py-2.5 rounded-xl font-bold text-neutral-600 bg-white hover:bg-neutral-50 dark:bg-neutral-800 dark:text-neutral-300 dark:hover:bg-neutral-700 transition-colors"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};

export default UserDetailModal;
