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
    <div className="bg-white dark:bg-neutral-900 rounded-3xl border border-neutral-200 dark:border-neutral-800 shadow-sm overflow-hidden flex flex-col h-full">
      {loading && users.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24">
          <Loader2 size={40} className="animate-spin text-neutral-500 mb-4" />
          <p className="text-neutral-500 font-medium">
            Đang tải danh sách người dùng...
          </p>
        </div>
      ) : users.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-neutral-400">
          <div className="w-20 h-20 bg-neutral-100 dark:bg-neutral-800 rounded-full flex items-center justify-center mb-4">
            <UserPlus size={40} className="opacity-50" />
          </div>
          <p className="font-medium">Không tìm thấy người dùng phù hợp</p>
        </div>
      ) : (
        <>
          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full">
              <thead>
                <tr className="border-b border-neutral-100 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-800/30">
                  <th className="text-left px-6 py-4 text-xs font-semibold text-neutral-500 uppercase tracking-wider">
                    Người dùng
                  </th>
                  <th className="text-left px-6 py-4 text-xs font-semibold text-neutral-500 uppercase tracking-wider">
                    Vai trò
                  </th>
                  <th className="text-left px-6 py-4 text-xs font-semibold text-neutral-500 uppercase tracking-wider">
                    Trạng thái
                  </th>
                  <th className="text-left px-6 py-4 text-xs font-semibold text-neutral-500 uppercase tracking-wider">
                    Hoạt động
                  </th>
                  <th className="text-left px-6 py-4 text-xs font-semibold text-neutral-500 uppercase tracking-wider">
                    Tham gia
                  </th>
                  <th className="text-right px-6 py-4 text-xs font-semibold text-neutral-500 uppercase tracking-wider">
                    Thao tác
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
                {users.map(user => (
                  <tr
                    key={user._id}
                    className="group hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="relative">
                          <img
                            src={user.avatar || '/images/default-avatar.png'}
                            alt={user.name}
                            className="w-10 h-10 rounded-full object-cover border border-neutral-200 dark:border-neutral-700"
                          />
                          {user.isVerified && (
                            <div className="absolute -bottom-0.5 -right-0.5 bg-blue-500 text-white p-0.5 rounded-full border-2 border-white dark:border-neutral-900">
                              <Check size={8} strokeWidth={3} />
                            </div>
                          )}
                        </div>
                        <div>
                          <div className="font-semibold text-neutral-900 dark:text-white text-sm">
                            {user.name || 'Người dùng YiBu'}
                          </div>
                          <div className="text-xs text-neutral-500">
                            @{user.username || 'username'}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-2.5 py-1 rounded-full text-xs font-medium border ${
                          user.role === 'admin'
                            ? 'bg-purple-50 text-purple-700 border-purple-100 dark:bg-purple-900/20 dark:text-purple-300 dark:border-purple-800'
                            : 'bg-neutral-100 text-neutral-600 border-neutral-200 dark:bg-neutral-800 dark:text-neutral-400 dark:border-neutral-700'
                        }`}
                      >
                        {user.role || 'thành viên'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge status={user.status || 'active'} />
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-0.5">
                        <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                          {user.postsCount || 0} bài viết
                        </span>
                        <span className="text-xs text-neutral-500">
                          {(user.followersCount || 0).toLocaleString()}{' '}
                          followers
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-neutral-600 dark:text-neutral-400">
                        {user.createdAt
                          ? new Date(user.createdAt).toLocaleDateString('vi-VN')
                          : 'N/A'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => onViewUser(user)}
                          className="p-1.5 rounded-lg text-neutral-500 hover:bg-neutral-100 hover:text-black dark:hover:bg-neutral-800 dark:hover:text-white transition-colors"
                          title="Xem chi tiết"
                        >
                          <Eye size={18} />
                        </button>

                        {user.status === 'banned' ? (
                          <button
                            onClick={() => onUnbanUser(user)}
                            className="p-1.5 rounded-lg text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-colors"
                            title="Gỡ chặn"
                          >
                            <ShieldOff size={18} />
                          </button>
                        ) : (
                          <>
                            <button
                              onClick={() => onWarnUser(user)}
                              className="p-1.5 rounded-lg text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-900/20 transition-colors"
                              title="Cảnh báo"
                            >
                              <AlertTriangle size={18} />
                            </button>
                            <button
                              onClick={() => onBanUser(user)}
                              className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 transition-colors"
                              title="Chặn người dùng"
                            >
                              <Ban size={18} />
                            </button>
                          </>
                        )}

                        <button
                          onClick={() => onDeleteUser(user)}
                          className="p-1.5 rounded-lg text-neutral-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/20 transition-colors"
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
          <div className="flex items-center justify-between px-6 py-4 border-t border-neutral-100 dark:border-neutral-800">
            <span className="text-sm text-neutral-500">
              Trang {currentPage} / {pagination?.pages || 1}
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => onPageChange(currentPage - 1)}
                disabled={currentPage <= 1}
                className="p-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-600 dark:text-neutral-400 disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
              >
                <ChevronLeft size={18} />
              </button>
              <div className="px-3 py-1 bg-black text-white dark:bg-white dark:text-black rounded-lg text-sm font-bold shadow-sm">
                {currentPage}
              </div>
              <button
                onClick={() => onPageChange(currentPage + 1)}
                disabled={currentPage >= (pagination?.pages || 1)}
                className="p-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-600 dark:text-neutral-400 disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
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
