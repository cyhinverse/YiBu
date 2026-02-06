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
  MoreVertical,
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
    <div className="flex flex-col h-full">

      {loading && users.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-24">
                  <Loader2 size={40} className="animate-spin text-[var(--color-text-secondary)] mb-4" />
                  <p className="text-[var(--color-text-secondary)] font-medium">
                    Đang tải danh sách người dùng...
                  </p>
                </div>
              ) : users.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-24 text-[var(--color-text-secondary)]">
                  <div className="w-20 h-20 bg-[var(--color-surface-secondary)] rounded-full flex items-center justify-center mb-4">
                    <UserPlus size={40} className="opacity-50" />
                  </div>
                  <p className="font-medium">Không tìm thấy người dùng phù hợp</p>
                </div>
              ) : (

        <>
          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full">
              <thead>
                <tr className="bg-[var(--color-surface-secondary)]">
                  <th className="text-left px-5 py-3 text-[11px] font-semibold text-[var(--color-text-tertiary)] uppercase tracking-[0.2em]">
                    Người dùng
                  </th>
                  <th className="text-left px-5 py-3 text-[11px] font-semibold text-[var(--color-text-tertiary)] uppercase tracking-[0.2em]">
                    Vai trò
                  </th>
                  <th className="text-left px-5 py-3 text-[11px] font-semibold text-[var(--color-text-tertiary)] uppercase tracking-[0.2em]">
                    Trạng thái
                  </th>
                  <th className="text-left px-5 py-3 text-[11px] font-semibold text-[var(--color-text-tertiary)] uppercase tracking-[0.2em]">
                    Hoạt động
                  </th>
                  <th className="text-left px-5 py-3 text-[11px] font-semibold text-[var(--color-text-tertiary)] uppercase tracking-[0.2em]">
                    Tham gia
                  </th>
                  <th className="text-right px-5 py-3 text-[11px] font-semibold text-[var(--color-text-tertiary)] uppercase tracking-[0.2em]">
                    Thao tác
                  </th>
                </tr>

              </thead>
              <tbody className="divide-y divide-[var(--color-border)]">
                {users.map(user => (
                  <tr
                    key={user._id}
                    className="group hover:bg-[var(--color-surface-hover)] transition-colors"
                  >

                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="relative">
                          <img
                            src={user.avatar || '/images/default-avatar.png'}
                            alt={
                              user.name || user.username
                                ? `${user.name || user.username} avatar`
                                : 'User avatar'
                            }
                            className="w-10 h-10 rounded-full object-cover"
                          />
                          {user.isVerified && (
                            <div className="absolute -bottom-0.5 -right-0.5 bg-blue-500 text-white p-0.5 rounded-full border-2 border-white dark:border-neutral-900">
                              <Check size={8} strokeWidth={3} />
                            </div>
                          )}
                        </div>
                        <div>
                          <div className="font-semibold text-[var(--color-content)] text-sm">
                            {user.name || 'Người dùng YiBu'}
                          </div>
                          <div className="text-xs text-[var(--color-text-tertiary)]">
                            @{user.username || 'username'}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                        <span
                          className={`admin-pill ${
                            user.role === 'admin'
                              ? 'bg-[var(--color-primary)] text-[var(--color-primary-foreground)]'
                              : 'bg-[var(--color-surface-secondary)] text-[var(--color-text-secondary)]'
                          }`}
                        >
                          {user.role || 'thành viên'}
                        </span>

                    </td>
                    <td className="px-5 py-3.5">
                      <StatusBadge status={user.status || 'active'} />
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex flex-col gap-0.5">
                        <span className="text-sm font-medium text-[var(--color-text-secondary)]">
                          {user.postsCount || 0} bài viết
                        </span>
                        <span className="text-xs text-[var(--color-text-tertiary)]">
                          {(user.followersCount || 0).toLocaleString()}{' '}
                          followers
                        </span>
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="text-sm text-[var(--color-text-secondary)]">
                        {user.createdAt
                          ? new Date(user.createdAt).toLocaleDateString('vi-VN')
                          : 'N/A'}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          type="button"
                          onClick={() => onViewUser(user)}
                          onKeyDown={event => {
                            if (event.key === 'Escape') {
                              event.currentTarget.blur();
                            }
                          }}
                          className="p-1.5 rounded-lg text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-hover)] hover:text-[var(--color-content)] transition-colors"
                          title="Xem chi tiết"
                          aria-label="Xem chi tiết người dùng"
                        >
                          <Eye size={18} strokeWidth={1.6} />
                        </button>

                        {user.status === 'banned' ? (
                          <button
                            type="button"
                            onClick={() => onUnbanUser(user)}
                            className="p-1.5 rounded-lg text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-colors"
                            title="Gỡ chặn"
                            aria-label="Gỡ chặn người dùng"
                          >
                            <ShieldOff size={18} strokeWidth={1.6} />
                          </button>
                        ) : (
                          <>
                            <button
                              type="button"
                              onClick={() => onWarnUser(user)}
                              className="p-1.5 rounded-lg text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-900/20 transition-colors"
                              title="Cảnh báo"
                              aria-label="Cảnh báo người dùng"
                            >
                              <AlertTriangle size={18} strokeWidth={1.6} />
                            </button>
                            <button
                              type="button"
                              onClick={() => onBanUser(user)}
                              className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 transition-colors"
                              title="Chặn người dùng"
                              aria-label="Chặn người dùng"
                            >
                              <Ban size={18} strokeWidth={1.6} />
                            </button>
                          </>
                        )}

                        <button
                          type="button"
                          onClick={() => onDeleteUser(user)}
                          className="p-1.5 rounded-lg text-neutral-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/20 transition-colors"
                          title="Xóa người dùng"
                          aria-label="Xóa người dùng"
                        >
                          <Trash2 size={18} strokeWidth={1.6} />
                        </button>

                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
            <div className="flex items-center justify-between px-5 py-3 bg-[var(--color-surface-secondary)]">
              <span className="text-sm text-[var(--color-text-secondary)]">
                Trang {currentPage} / {pagination?.pages || 1}
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => onPageChange(currentPage - 1)}
                  disabled={currentPage <= 1}
                  className="p-2 rounded-lg hover:bg-[var(--color-surface-hover)] text-[var(--color-text-secondary)] disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
                >
                  <ChevronLeft size={18} />
                </button>
                <div className="px-3 py-1 bg-[var(--color-primary)] text-[var(--color-primary-foreground)] rounded-lg text-sm font-semibold shadow-sm">
                  {currentPage}
                </div>
                <button
                  type="button"
                  onClick={() => onPageChange(currentPage + 1)}
                  disabled={currentPage >= (pagination?.pages || 1)}
                  className="p-2 rounded-lg hover:bg-[var(--color-surface-hover)] text-[var(--color-text-secondary)] disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
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
