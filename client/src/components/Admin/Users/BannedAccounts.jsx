import { useState, useEffect } from 'react';
import { useDebounce } from '../../../hooks/useDebounce';
// import { useDispatch, useSelector } from 'react-redux';
import {
  Search,
  UserX,
  Check,
  X,
  ChevronLeft,
  ChevronRight,
  RefreshCcw,
  Loader2,
} from 'lucide-react';
import { useBannedUsers, useUnbanUser } from '../../../hooks/useAdminQuery';

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
    <div className="space-y-8 font-sans">
      {/* Header */}
      <div className="yb-card p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-surface-secondary/30">
        <div>
          <h2 className="text-2xl font-black text-primary tracking-tight">
            Tài khoản bị chặn
          </h2>
          <p className="text-sm text-secondary font-medium mt-1">
            Quản lý danh sách người dùng bị khóa truy cập (
            {pagination?.total || bannedUsers.length} người)
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleRefresh}
            disabled={loading}
            className="yb-btn yb-btn-primary p-2.5 shadow-lg shadow-primary/10"
          >
            <RefreshCcw size={20} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="relative group max-w-md">
        <Search
          size={20}
          className="absolute left-4 top-1/2 -translate-y-1/2 text-secondary group-focus-within:text-primary transition-colors"
        />
        <input
          type="text"
          placeholder="Tìm kiếm tài khoản bị chặn..."
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          className="yb-input pl-12 w-full text-sm"
        />
      </div>

      {/* Table Card */}
      <div className="yb-card overflow-hidden">
        {loading && bannedUsers.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24">
            <Loader2 size={48} className="animate-spin text-primary mb-4" />
            <p className="text-secondary font-bold">Đang tải dữ liệu...</p>
          </div>
        ) : bannedUsers.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-secondary">
            <UserX size={64} className="mb-4 opacity-10" />
            <p className="font-bold">Không có tài khoản nào bị chặn</p>
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
                      Lý do
                    </th>
                    <th className="text-left px-6 py-5 text-xs font-black text-secondary uppercase tracking-widest">
                      Thời hạn
                    </th>
                    <th className="text-left px-6 py-5 text-xs font-black text-secondary uppercase tracking-widest">
                      Ngày chặn
                    </th>
                    <th className="text-left px-6 py-5 text-xs font-black text-secondary uppercase tracking-widest">
                      Người thực thi
                    </th>
                    <th className="text-right px-8 py-5 text-xs font-black text-secondary uppercase tracking-widest">
                      Thao tác
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
                  {bannedUsers.map(user => (
                    <tr
                      key={user._id}
                      className="hover:bg-surface-secondary/50 transition-colors group"
                    >
                      <td className="px-8 py-4">
                        <div className="flex items-center gap-4">
                          <img
                            src={user.avatar || '/images/default-avatar.png'}
                            alt={user.fullName || user.name}
                            className="yb-avatar w-12 h-12 border-2 border-surface opacity-60 grayscale"
                          />
                          <div>
                            <div className="font-black text-primary">
                              {user.fullName || user.name}
                            </div>
                            <div className="text-xs font-bold text-secondary">
                              {user.email}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm font-bold text-primary max-w-[200px] block truncate">
                          {user.banReason ||
                            user.moderationHistory?.[0]?.reason ||
                            'Không có lý do'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`yb-badge font-black uppercase text-[10px] tracking-wider ${
                            user.banDuration === 'Permanent' ||
                            !user.banDuration
                              ? 'bg-error/10 text-error border border-error/20'
                              : 'bg-warning/10 text-warning border border-warning/20'
                          }`}
                        >
                          {user.banDuration === 'Permanent' || !user.banDuration
                            ? 'Vĩnh viễn'
                            : user.banDuration}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm font-bold text-secondary">
                        {user.bannedAt
                          ? new Date(user.bannedAt).toLocaleDateString('vi-VN')
                          : user.moderationHistory?.[0]?.actionDate
                          ? new Date(
                              user.moderationHistory[0].actionDate
                            ).toLocaleDateString('vi-VN')
                          : 'N/A'}
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm font-black text-primary">
                          {user.bannedBy?.fullName ||
                            user.moderationHistory?.[0]?.adminId?.fullName ||
                            'Hệ thống'}
                        </span>
                      </td>
                      <td className="px-8 py-4 text-right">
                        <button
                          onClick={() => handleUnban(user)}
                          disabled={loading}
                          className="yb-btn yb-btn-secondary px-4 py-2 text-xs font-black shadow-sm group-hover:bg-success group-hover:text-white transition-all border-success/30"
                        >
                          <div className="flex items-center gap-2">
                            <Check size={14} strokeWidth={3} />
                            Mở chặn
                          </div>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-between px-8 py-6 border-t border-border bg-surface-secondary/20">
              <span className="text-sm font-bold text-secondary">
                Trang {currentPage} / {pagination?.totalPages || 1}
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage <= 1 || loading}
                  className="yb-btn yb-btn-secondary p-2.5 disabled:opacity-30 shadow-sm"
                >
                  <ChevronLeft size={18} />
                </button>
                <div className="px-4 py-2 bg-surface rounded-xl border border-border text-sm font-black text-primary shadow-sm">
                  {currentPage}
                </div>
                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={
                    currentPage >= (pagination?.totalPages || 1) || loading
                  }
                  className="yb-btn yb-btn-secondary p-2.5 disabled:opacity-30 shadow-sm"
                >
                  <ChevronRight size={18} />
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Unban Modal */}
      {showUnbanModal && selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-fade-in">
          <div className="yb-card bg-surface w-full max-w-md shadow-2xl p-10 overflow-hidden transform animate-scale-in">
            <div className="flex flex-col items-center text-center mb-8">
              <div className="w-20 h-20 rounded-3xl bg-success/20 text-success flex items-center justify-center mb-6 shadow-lg">
                <Check size={36} strokeWidth={3} />
              </div>
              <h3 className="text-2xl font-black text-primary mb-3 tracking-tight">
                Mở chặn người dùng
              </h3>
              <p className="text-sm font-bold text-secondary leading-relaxed px-4">
                Bạn có chắc chắn muốn khôi phục quyền truy cập cho{' '}
                <span className="text-primary font-black">
                  {selectedUser.name}
                </span>
                ? Người dùng sẽ có thể đăng nhập lại sau khi được mở chặn.
              </p>
            </div>

            <div className="flex gap-4">
              <button
                onClick={() => setShowUnbanModal(false)}
                className="yb-btn yb-btn-secondary flex-1 py-4 font-black"
              >
                Hủy bỏ
              </button>
              <button
                onClick={confirmUnban}
                className="yb-btn flex-1 py-4 font-black bg-success hover:bg-success/90 text-white shadow-xl shadow-success/20"
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
