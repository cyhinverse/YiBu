import {
  Eye,
  ShieldOff,
  AlertTriangle,
  Ban,
  Trash2,
  Check,
  UserPlus,
  Loader2,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import StatusBadge from './StatusBadge';

const UsersTable = ({
  users,
  loading,
  currentPage,
  pagination,
  onPageChange,
  onViewUser,
  onBanUser,
  onUnbanUser,
  onWarnUser,
  onDeleteUser,
}) => {
  return (
    <div className="yb-card overflow-hidden">
      {loading && users.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24">
          <Loader2 size={48} className="animate-spin text-primary mb-4" />
          <p className="text-secondary font-bold">Đang tải người dùng...</p>
        </div>
      ) : users.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-secondary">
          <UserPlus size={64} className="mb-4 opacity-10" />
          <p className="font-bold">Không tìm thấy người dùng phù hợp</p>
        </div>
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b border-border bg-surface-secondary/50">
                  <th className="text-left px-8 py-5 text-xs font-black text-secondary uppercase tracking-widest">
                    Người dùng
                  </th>
                  <th className="text-left px-6 py-5 text-xs font-black text-secondary uppercase tracking-widest">
                    Vai trò
                  </th>
                  <th className="text-left px-6 py-5 text-xs font-black text-secondary uppercase tracking-widest">
                    Trạng thái
                  </th>
                  <th className="text-left px-6 py-5 text-xs font-black text-secondary uppercase tracking-widest">
                    Hoạt động
                  </th>
                  <th className="text-left px-6 py-5 text-xs font-black text-secondary uppercase tracking-widest">
                    Tham gia
                  </th>
                  <th className="text-right px-8 py-5 text-xs font-black text-secondary uppercase tracking-widest">
                    Thao tác
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
                {users.map(user => (
                  <tr
                    key={user._id}
                    className="hover:bg-surface-secondary/50 transition-colors group"
                  >
                    <td className="px-8 py-4">
                      <div className="flex items-center gap-4">
                        <div className="relative">
                          <img
                            src={user.avatar || '/images/default-avatar.png'}
                            alt={user.name}
                            className="yb-avatar w-12 h-12 border-2 border-surface shadow-md"
                          />
                          {user.isVerified && (
                            <div className="absolute -bottom-1 -right-1 bg-accent text-white p-0.5 rounded-full border-2 border-surface">
                              <Check size={8} strokeWidth={4} />
                            </div>
                          )}
                        </div>
                        <div>
                          <div className="font-black text-primary">
                            {user.name || 'Người dùng YiBu'}
                          </div>
                          <div className="text-xs font-bold text-secondary">
                            @{user.username || 'username'}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="yb-badge bg-surface-secondary text-primary font-black uppercase text-[10px] tracking-wider">
                        {user.role || 'thành viên'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge status={user.status || 'active'} />
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="text-sm font-black text-primary">
                          {user.postsCount || 0} bài viết
                        </span>
                        <span className="text-xs font-bold text-secondary">
                          {(user.followersCount || 0).toLocaleString()} người
                          theo dõi
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm font-bold text-secondary">
                        {user.createdAt
                          ? new Date(user.createdAt).toLocaleDateString('vi-VN')
                          : 'N/A'}
                      </span>
                    </td>
                    <td className="px-8 py-4">
                      <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-all">
                        <button
                          onClick={() => onViewUser(user)}
                          className="p-2 rounded-xl text-secondary hover:bg-surface-hover hover:text-primary transition-colors"
                          title="Xem chi tiết"
                        >
                          <Eye size={18} />
                        </button>
                        {user.status === 'banned' ? (
                          <button
                            onClick={() => onUnbanUser(user)}
                            className="p-2 rounded-xl text-success hover:bg-success/10 transition-colors"
                            title="Gỡ chặn"
                          >
                            <ShieldOff size={18} />
                          </button>
                        ) : (
                          <>
                            <button
                              onClick={() => onWarnUser(user)}
                              className="p-2 rounded-xl text-warning hover:bg-warning/10 transition-colors"
                              title="Cảnh báo"
                            >
                              <AlertTriangle size={18} />
                            </button>
                            <button
                              onClick={() => onBanUser(user)}
                              className="p-2 rounded-xl text-error hover:bg-error/10 transition-colors"
                              title="Chặn người dùng"
                            >
                              <Ban size={18} />
                            </button>
                          </>
                        )}
                        <button
                          onClick={() => onDeleteUser(user)}
                          className="p-2 rounded-xl text-error hover:bg-error/10 transition-colors"
                          title="Xóa người dùng"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between px-8 py-6 border-t border-border bg-surface-secondary/20">
            <span className="text-sm font-bold text-secondary">
              Trang {currentPage} / {pagination?.pages || 1}
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => onPageChange(currentPage - 1)}
                disabled={currentPage <= 1}
                className="yb-btn yb-btn-secondary p-2.5 disabled:opacity-30 shadow-sm"
              >
                <ChevronLeft size={18} />
              </button>
              <div className="px-4 py-2 bg-surface rounded-xl border border-border text-sm font-black text-primary shadow-sm">
                {currentPage}
              </div>
              <button
                onClick={() => onPageChange(currentPage + 1)}
                disabled={currentPage >= (pagination?.pages || 1)}
                className="yb-btn yb-btn-secondary p-2.5 disabled:opacity-30 shadow-sm"
              >
                <ChevronRight size={18} />
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default UsersTable;
