import { useState, useEffect } from 'react';
import { useDebounce } from '@/hooks/useDebounce';
import {
  Search,
  UserX,
  Check,
  ChevronLeft,
  ChevronRight,
  RefreshCcw,
  Loader2,
} from 'lucide-react';
import { useBannedUsers, useUnbanUser } from '@/hooks/useAdminQuery';

const BannedAccounts = () => {
  /* State */
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearch = useDebounce(searchQuery, 500);
  const [showUnbanModal, setShowUnbanModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);

  // Reset page on search
  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearch]);

  // Queries
  const {
    data: bannedData,
    isLoading: loading,
    refetch: refetchBanned,
  } = useBannedUsers({
    page: currentPage,
    limit: 10,
    search: debouncedSearch || undefined,
  });

  const bannedUsersList = bannedData?.users || bannedData || []; // Adjust based on API structure
  const bannedUsers = Array.isArray(bannedUsersList) ? bannedUsersList : [];
  const pagination = {
    totalPages: bannedData?.totalPages || 1,
    total: bannedData?.totalUsers || 0,
  };

  // Mutations
  const unbanMutation = useUnbanUser();

  const handleUnban = user => {
    setSelectedUser(user);
    setShowUnbanModal(true);
  };

  const confirmUnban = async () => {
    if (!selectedUser) return;
    try {
      await unbanMutation.mutateAsync({ userId: selectedUser._id });
    } catch (error) {
      console.error('Failed to unban user:', error);
    }
    setShowUnbanModal(false);
    setSelectedUser(null);
  };

  const handleRefresh = () => {
    refetchBanned();
  };

  const handlePageChange = newPage => {
    setCurrentPage(newPage);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-neutral-900 dark:text-white tracking-tight">
            Tài khoản bị chặn
          </h2>
          <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">
            Quản lý danh sách người dùng bị khóa truy cập (
            {pagination?.total || bannedUsers.length} người)
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleRefresh}
            disabled={loading}
            className="p-2 bg-neutral-100 dark:bg-neutral-800 rounded-full text-neutral-500 hover:text-black dark:text-neutral-400 dark:hover:text-white transition-colors disabled:opacity-50"
          >
            <RefreshCcw size={20} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="bg-white dark:bg-neutral-900 rounded-3xl p-4 shadow-sm">
        <div className="relative max-w-md w-full">
          <Search
            size={18}
            className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400"
          />
          <input
            type="text"
            placeholder="Tìm kiếm tài khoản bị chặn..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-11 pr-4 py-2.5 bg-neutral-100 dark:bg-neutral-800 border-none rounded-full text-sm font-medium focus:ring-2 focus:ring-neutral-200 dark:focus:ring-neutral-700 outline-none transition-all placeholder:text-neutral-400"
          />
        </div>
      </div>

      {/* Table Card */}
      <div className="bg-white dark:bg-neutral-900 rounded-3xl shadow-sm overflow-hidden">
        {loading && bannedUsers.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-neutral-500">
            <Loader2 size={32} className="animate-spin mb-4" />
            <p className="font-medium">Đang tải dữ liệu...</p>
          </div>
        ) : bannedUsers.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-neutral-500">
            <UserX size={48} className="mb-4 opacity-20" />
            <p className="font-medium">Không có tài khoản nào bị chặn</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-neutral-50/50 dark:bg-neutral-800/20">
                    <th className="text-left px-6 py-4 text-xs font-semibold text-neutral-500 uppercase tracking-wider">
                      Người dùng
                    </th>
                    <th className="text-left px-6 py-4 text-xs font-semibold text-neutral-500 uppercase tracking-wider">
                      Lý do
                    </th>
                    <th className="text-left px-6 py-4 text-xs font-semibold text-neutral-500 uppercase tracking-wider">
                      Thời hạn
                    </th>
                    <th className="text-left px-6 py-4 text-xs font-semibold text-neutral-500 uppercase tracking-wider">
                      Ngày chặn
                    </th>
                    <th className="text-left px-6 py-4 text-xs font-semibold text-neutral-500 uppercase tracking-wider">
                      Người thực thi
                    </th>
                    <th className="text-right px-6 py-4 text-xs font-semibold text-neutral-500 uppercase tracking-wider">
                      Thao tác
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
                  {bannedUsers.map(user => (
                    <tr
                      key={user._id}
                      className="hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={user.avatar || '/images/default-avatar.png'}
                            alt={user.fullName || user.name}
                            className="w-10 h-10 rounded-full object-cover grayscale opacity-70"
                          />
                          <div>
                            <div className="font-bold text-sm text-neutral-900 dark:text-white">
                              {user.fullName || user.name}
                            </div>
                            <div className="text-xs text-neutral-500">
                              {user.email}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300 max-w-[200px] block truncate text-ellipsis">
                          {user.banReason ||
                            user.moderationHistory?.[0]?.reason ||
                            'Không có lý do'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-bold ${
                            user.banDuration === 'Permanent' ||
                            !user.banDuration
                              ? 'bg-rose-50 text-rose-600 border-rose-100 dark:bg-rose-900/20 dark:text-rose-400 dark:border-rose-800'
                              : 'bg-amber-50 text-amber-600 border-amber-100 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-800'
                          }`}
                        >
                          {user.banDuration === 'Permanent' || !user.banDuration
                            ? 'Vĩnh viễn'
                            : user.banDuration}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm font-medium text-neutral-500">
                        {user.bannedAt
                          ? new Date(user.bannedAt).toLocaleDateString('vi-VN')
                          : user.moderationHistory?.[0]?.actionDate
                          ? new Date(
                              user.moderationHistory[0].actionDate
                            ).toLocaleDateString('vi-VN')
                          : 'N/A'}
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm font-medium text-neutral-900 dark:text-white">
                          {user.bannedBy?.fullName ||
                            user.moderationHistory?.[0]?.adminId?.fullName ||
                            'Hệ thống'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => handleUnban(user)}
                          disabled={loading}
                          className="px-3 py-1.5 rounded-lg text-emerald-600 bg-emerald-50 hover:bg-emerald-100 text-xs font-bold transition-colors disabled:opacity-50 flex items-center gap-1.5 ml-auto"
                        >
                          <Check size={14} />
                          Mở chặn
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <div className="flex items-center justify-between px-6 py-4 bg-neutral-50/50 dark:bg-neutral-800/20">
                <span className="text-sm text-neutral-500 font-medium">
                  Trang{' '}
                  <span className="text-neutral-900 dark:text-white font-bold">
                    {currentPage}
                  </span>{' '}
                  / {pagination.totalPages}
                </span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage <= 1 || loading}
                    className="p-2 rounded-lg hover:bg-neutral-200 dark:hover:bg-neutral-700 disabled:opacity-30 text-neutral-600 dark:text-neutral-400 transition-colors"
                  >
                    <ChevronLeft size={18} />
                  </button>
                  <button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage >= pagination.totalPages || loading}
                    className="p-2 rounded-lg hover:bg-neutral-200 dark:hover:bg-neutral-700 disabled:opacity-30 text-neutral-600 dark:text-neutral-400 transition-colors"
                  >
                    <ChevronRight size={18} />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Unban Modal */}
      {showUnbanModal && selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-neutral-900 w-full max-w-md shadow-2xl rounded-3xl p-8 transform animate-in scale-95 duration-200 overflow-hidden">
            <div className="flex flex-col items-center text-center mb-6">
              <div className="w-16 h-16 rounded-2xl bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-6">
                <Check size={32} />
              </div>
              <h3 className="text-xl font-bold text-neutral-900 dark:text-white mb-2">
                Mở chặn người dùng
              </h3>
              <p className="text-sm text-neutral-500 dark:text-neutral-400 leading-relaxed px-4">
                Bạn có chắc chắn muốn khôi phục quyền truy cập cho{' '}
                <span className="text-neutral-900 dark:text-white font-bold">
                  {selectedUser.name}
                </span>
                ? Người dùng sẽ có thể đăng nhập lại ngay lập tức.
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowUnbanModal(false)}
                className="flex-1 px-4 py-3 rounded-xl font-bold text-neutral-700 bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:text-neutral-300 dark:hover:bg-neutral-700 transition-colors"
              >
                Hủy bỏ
              </button>
              <button
                onClick={confirmUnban}
                className="flex-1 px-4 py-3 rounded-xl font-bold text-white bg-emerald-600 hover:bg-emerald-700 transition-colors"
              >
                Xác nhận
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BannedAccounts;
