import React, { useState } from 'react';
import { X, Info, Flag, Video, AlertTriangle, CheckCircle } from 'lucide-react';

export default function PostDetailModal({
  post,
  isOpen,
  onClose,
  reports,
  onToggleStatus,
  onDelete,
}) {
  const [activeTab, setActiveTab] = useState('content');

  if (!isOpen || !post) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-fade-in">
      <div className="yb-card bg-surface w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl transform animate-scale-in overflow-hidden">
        {/* Modal Header */}
        <div className="p-8 border-b border-border flex items-center justify-between shrink-0 bg-surface-secondary/30">
          <h2 className="text-2xl font-black text-primary tracking-tight">
            Chi tiết bài viết
          </h2>
          <button
            onClick={onClose}
            className="p-2.5 hover:bg-surface-secondary rounded-full transition-colors text-secondary"
          >
            <X size={24} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex px-8 border-b border-border shrink-0 bg-surface">
          {[
            { id: 'content', label: 'Nội dung', icon: Info },
            { id: 'reports', label: 'Báo cáo', icon: Flag },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-8 py-4 text-sm font-black transition-all border-b-2 ${
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
          {activeTab === 'content' && (
            <div className="space-y-8">
              {(() => {
                const author = post.author || post.user || {};
                const mediaItems = post.media || post.images || [];
                return (
                  <>
                    <div className="flex items-center gap-6">
                      <img
                        src={author.avatar || '/images/default-avatar.png'}
                        alt={author.name}
                        className="yb-avatar w-16 h-16 border-2 border-surface shadow-md"
                      />
                      <div>
                        <h3 className="font-black text-xl text-primary tracking-tight">
                          {author.name || author.username}
                        </h3>
                        <p className="text-secondary font-bold">
                          @{author.username} •{' '}
                          <span className="opacity-60">
                            {new Date(post.createdAt).toLocaleString('vi-VN')}
                          </span>
                        </p>
                      </div>
                    </div>

                    <div className="p-8 bg-surface-secondary/50 rounded-3xl border border-border shadow-inner">
                      <p className="text-primary font-bold text-lg leading-relaxed whitespace-pre-wrap">
                        {post.content || post.caption || 'Không có nội dung'}
                      </p>
                    </div>

                    {mediaItems.length > 0 && (
                      <div
                        className={`grid gap-4 ${
                          mediaItems.length > 1 ? 'grid-cols-2' : 'grid-cols-1'
                        }`}
                      >
                        {mediaItems.map((media, idx) => (
                          <img
                            key={idx}
                            src={typeof media === 'string' ? media : media.url}
                            alt=""
                            className="w-full h-80 object-cover rounded-3xl shadow-lg border-2 border-surface"
                          />
                        ))}
                      </div>
                    )}

                    <div className="grid grid-cols-3 gap-6">
                      <div className="text-center p-6 bg-surface-secondary/50 rounded-2xl border border-border/50">
                        <p className="text-[10px] font-black text-secondary uppercase tracking-widest mb-2">
                          Thích
                        </p>
                        <p className="text-3xl font-black text-primary">
                          {post.likesCount || 0}
                        </p>
                      </div>
                      <div className="text-center p-6 bg-surface-secondary/50 rounded-2xl border border-border/50">
                        <p className="text-[10px] font-black text-secondary uppercase tracking-widest mb-2">
                          Bình luận
                        </p>
                        <p className="text-3xl font-black text-primary">
                          {post.commentsCount || 0}
                        </p>
                      </div>
                      <div className="text-center p-6 bg-surface-secondary/50 rounded-2xl border border-border/50">
                        <p className="text-[10px] font-black text-secondary uppercase tracking-widest mb-2">
                          Chia sẻ
                        </p>
                        <p className="text-3xl font-black text-primary">
                          {post.sharesCount || 0}
                        </p>
                      </div>
                    </div>
                  </>
                );
              })()}
            </div>
          )}

          {activeTab === 'reports' && (
            <div className="space-y-6">
              {reports?.length > 0 ? (
                reports.map(report => (
                  <div
                    key={report._id}
                    className="p-6 border border-error/20 bg-error/5 rounded-3xl shadow-sm"
                  >
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-error/20 text-error rounded-xl">
                          <AlertTriangle size={20} />
                        </div>
                        <span className="text-sm font-black text-error uppercase tracking-widest bg-error/10 px-3 py-1 rounded-lg border border-error/20">
                          {report.reason}
                        </span>
                      </div>
                      <span className="text-[10px] font-black text-secondary/60 uppercase tracking-widest">
                        {new Date(report.createdAt).toLocaleDateString('vi-VN')}
                      </span>
                    </div>
                    <p className="text-primary font-bold text-sm leading-relaxed mb-6 italic">
                      &quot;
                      {report.description || 'Không có chi tiết bổ sung.'}
                      &quot;
                    </p>
                    <div className="flex items-center gap-3 text-xs font-black text-secondary border-t border-error/10 pt-4">
                      <span className="uppercase tracking-widest opacity-60">
                        Người báo cáo:
                      </span>
                      <div className="flex items-center gap-2 bg-surface px-3 py-1.5 rounded-full border border-border shadow-sm">
                        <img
                          src={
                            report.reporter?.avatar ||
                            '/images/default-avatar.png'
                          }
                          className="w-6 h-6 rounded-full object-cover border border-border shadow-sm"
                        />
                        <span className="text-primary truncate max-w-[150px]">
                          @{report.reporter?.username || 'unknown'}
                        </span>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="flex flex-col items-center justify-center py-20 bg-surface-secondary/20 rounded-3xl border-2 border-dashed border-border/50">
                  <CheckCircle
                    size={64}
                    className="text-success mb-4 opacity-20"
                  />
                  <p className="font-black text-primary mb-1">Nội dung sạch</p>
                  <p className="text-sm font-bold text-secondary">
                    Không có báo cáo nào cho bài viết này.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-8 border-t border-border bg-surface-secondary/30 flex gap-4 shrink-0">
          <button
            onClick={() => {
              onToggleStatus(post);
            }}
            className={`yb-btn flex-1 py-4 font-black shadow-xl ${
              post.status === 'active'
                ? 'bg-error hover:bg-error/90 text-white shadow-error/20'
                : 'bg-success hover:bg-success/90 text-white shadow-success/20'
            }`}
          >
            {post.status === 'active' ? 'Ẩn bài viết' : 'Hiện bài viết'}
          </button>
          <button
            onClick={() => {
              onDelete(post);
            }}
            className="yb-btn flex-1 py-4 font-black bg-neutral-800 hover:bg-neutral-900 text-white shadow-xl"
          >
            Xóa bài viết
          </button>
          <button
            onClick={onClose}
            className="yb-btn yb-btn-secondary px-10 py-4 font-black"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
}
