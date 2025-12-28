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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md p-4 animate-fade-in">
      <div className="yb-card bg-surface w-full max-w-3xl shadow-2xl max-h-[85vh] flex flex-col overflow-hidden transform animate-scale-in">
        {/* Modal Header */}
        <div className="p-8 border-b border-border shrink-0 bg-surface-secondary/30">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-6">
              <img
                src={user.avatar || '/images/default-avatar.png'}
                alt={user.name}
                className="yb-avatar w-24 h-24 border-4 border-surface shadow-xl"
              />
              <div>
                <h3 className="text-2xl font-black text-primary flex items-center gap-3 tracking-tight">
                  {user.name}
                  <StatusBadge status={user.status || 'active'} />
                </h3>
                <p className="text-secondary font-bold mt-1">
                  @{user.username}
                </p>
                <div className="flex items-center gap-4 mt-4 text-xs font-bold text-secondary">
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
              className="p-2.5 rounded-full hover:bg-surface-secondary transition-colors text-secondary"
            >
              <X size={24} />
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex px-8 border-b border-border shrink-0 bg-surface">
          {[
            { id: 'overview', label: 'Tổng quan', icon: Info },
            { id: 'posts', label: 'Bài viết', icon: FileText },
            { id: 'reports', label: 'Báo cáo', icon: Flag },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-6 py-4 text-sm font-black transition-all border-b-2 ${
                activeTab === tab.id
                  ? 'border-primary text-primary'
                  : 'border-transparent text-secondary hover:text-primary'
              }`}
            >
              <tab.icon size={18} />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Modal Content */}
        <div className="p-8 overflow-y-auto bg-surface flex-1">
          {activeTab === 'overview' && (
            <div className="space-y-6">
              <div className="grid grid-cols-3 gap-4">
                <div className="p-6 bg-surface-secondary/50 rounded-2xl border border-border/50 shadow-inner">
                  <p className="text-[10px] font-black text-secondary uppercase tracking-widest mb-2">
                    Vai trò
                  </p>
                  <p className="text-lg font-black text-primary capitalize">
                    {user.role || 'Thành viên'}
                  </p>
                </div>
                <div className="p-6 bg-surface-secondary/50 rounded-2xl border border-border/50 shadow-inner">
                  <p className="text-[10px] font-black text-secondary uppercase tracking-widest mb-2">
                    Bài viết
                  </p>
                  <p className="text-lg font-black text-primary">
                    {user.postsCount || 0}
                  </p>
                </div>
                <div className="p-6 bg-surface-secondary/50 rounded-2xl border border-border/50 shadow-inner">
                  <p className="text-[10px] font-black text-secondary uppercase tracking-widest mb-2">
                    Theo dõi
                  </p>
                  <p className="text-lg font-black text-primary">
                    {(user.followersCount || 0).toLocaleString()}
                  </p>
                </div>
              </div>

              <div className="p-6 bg-surface-secondary/50 rounded-2xl border border-border/50 shadow-inner">
                <p className="text-[10px] font-black text-secondary uppercase tracking-widest mb-3">
                  Giới thiệu
                </p>
                <p className="text-sm font-bold text-primary leading-relaxed">
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
                    className="flex gap-5 p-5 border border-border/50 rounded-2xl hover:bg-surface-secondary/50 transition-all group"
                  >
                    {post.media?.[0] && (
                      <img
                        src={post.media[0].url}
                        alt="Post"
                        className="w-24 h-24 rounded-2xl object-cover shadow-md border-2 border-surface"
                      />
                    )}
                    <div className="flex-1">
                      <p className="text-primary font-bold line-clamp-2 mb-3">
                        {post.content || post.caption || 'Không có nội dung'}
                      </p>
                      <div className="flex items-center gap-4 text-xs font-black text-secondary">
                        <span className="bg-surface-secondary px-2.5 py-1 rounded-lg">
                          {new Date(post.createdAt).toLocaleDateString('vi-VN')}
                        </span>
                        <span>{post.likesCount} Thích</span>
                        <span>{post.commentsCount} Bình luận</span>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-16 bg-surface-secondary/20 rounded-2xl border-2 border-dashed border-border/50">
                  <FileText
                    size={48}
                    className="mx-auto text-secondary/20 mb-3"
                  />
                  <p className="text-secondary font-bold">
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
                    className="p-6 border border-error/20 bg-error/5 rounded-2xl shadow-sm"
                  >
                    <div className="flex justify-between items-start mb-4">
                      <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-error/10 text-error text-[10px] font-black uppercase tracking-widest border border-error/20">
                        <Flag size={12} />
                        {report.reason}
                      </span>
                      <span className="text-[10px] font-black text-secondary/60 uppercase tracking-widest">
                        {new Date(report.createdAt).toLocaleDateString('vi-VN')}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <span className="font-black text-secondary">
                        Người báo cáo:
                      </span>
                      <span className="font-black text-primary">
                        {report.reporter?.username || 'Ẩn danh'}
                      </span>
                    </div>
                    <div className="mt-4 pt-4 border-t border-error/10 flex items-center justify-between">
                      <span className="text-[10px] font-black text-secondary uppercase tracking-widest">
                        Trạng thái
                      </span>
                      <span className="yb-badge bg-error/20 text-error font-black uppercase">
                        {report.status}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-16 bg-success/5 rounded-2xl border-2 border-dashed border-success/20">
                  <ShieldOff
                    size={48}
                    className="mx-auto text-success/20 mb-3"
                  />
                  <p className="text-success font-black">
                    Hồ sơ sạch. Không có báo cáo nào.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="p-6 border-t border-border bg-surface-secondary/30 flex justify-end shrink-0">
          <button
            onClick={onClose}
            className="yb-btn yb-btn-secondary px-8 py-3"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};

export default UserDetailModal;
