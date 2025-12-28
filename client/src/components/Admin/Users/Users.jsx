import { useState } from 'react';
import { useDebounce } from '@/hooks/useDebounce';
import {
  Search,
  Eye,
  Ban,
  Trash2,
  Check,
  X,
  ChevronLeft,
  ChevronRight,
  UserPlus,
  Loader2,
  RefreshCcw,
  AlertTriangle,
  ShieldOff,
  FileText,
  Flag,
  Info,
  Mail,
  Calendar,
} from 'lucide-react';
import {
  useAdminUsers,
  useDeleteUser,
  useBanUser,
  useUnbanUser,
  useSuspendUser,
  useWarnUser,
  useAdminUserPosts,
  useAdminUserReports,
} from '@/hooks/useAdminQuery'; // useAdminQuery hooks

const StatusBadge = ({ status }) => {
  const styles = {
    active: 'bg-success/10 text-success border-success/20',
    pending: 'bg-warning/10 text-warning border-warning/20',
    suspended: 'bg-secondary/10 text-secondary border-secondary/20',
    banned: 'bg-error/10 text-error border-error/20',
  };

  return (
    <span
      className={`yb-badge border ${
        styles[status] || styles.active
      } font-black`}
    >
      {status === 'active'
        ? 'Hoạt động'
        : status === 'pending'
        ? 'Chờ duyệt'
        : status === 'suspended'
        ? 'Tạm ngưng'
        : 'Bị chặn'}
    </span>
  );
};

const Users = () => {
  /* State */
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterRole] = useState('all');
  const [selectedUser, setSelectedUser] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const debouncedSearch = useDebounce(searchQuery, 500);
  const [activeTab, setActiveTab] = useState('overview');

  const [showActionModal, setShowActionModal] = useState(false);
  const [actionType, setActionType] = useState('');
  const [actionReason, setActionReason] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  // Queries
  const {
    data: usersData,
    isLoading: usersLoading,
    refetch: refetchUsers,
  } = useAdminUsers({
    page: currentPage,
    limit: 10,
    search: debouncedSearch || undefined,
    status: filterStatus !== 'all' ? filterStatus : undefined,
    role: filterRole !== 'all' ? filterRole : undefined,
  });

  const usersList = usersData?.users || [];
  const pagination = { pages: usersData?.totalPages || 1 };

  // User Details Queries
  const { data: postsData } = useAdminUserPosts({
    userId: selectedUser?._id,
    enabled: !!selectedUser,
  });
  const currentUserPosts = postsData?.posts || [];

  const { data: reportsData } = useAdminUserReports({
    userId: selectedUser?._id,
    enabled: !!selectedUser,
  });
  const currentUserReports = reportsData?.reports || [];

  // Mutations
  const deleteMutation = useDeleteUser();
  const banMutation = useBanUser();
  const unbanMutation = useUnbanUser();
  const suspendMutation = useSuspendUser();
  const warnMutation = useWarnUser();

  const loading = usersLoading; // Simplify loading state

  const users = Array.isArray(usersList) ? usersList : [];

  const handleViewUser = user => {
    setSelectedUser(user);
    setActiveTab('overview');
    setShowDetailModal(true);
  };

  const handleBanUser = user => {
    setSelectedUser(user);
    setActionType('ban');
    setShowActionModal(true);
  };

  const handleUnbanUser = user => {
    setSelectedUser(user);
    setActionType('unban');
    setShowActionModal(true);
  };

  const handleWarnUser = user => {
    setSelectedUser(user);
    setActionType('warn');
    setShowActionModal(true);
  };

  const handleDeleteUser = user => {
    setSelectedUser(user);
    setActionType('delete');
    setShowActionModal(true);
  };

  const confirmAction = async () => {
    if (!selectedUser) return;

    try {
      switch (actionType) {
        case 'ban':
          await banMutation.mutateAsync({
            userId: selectedUser._id,
            reason: actionReason,
          });
          break;
        case 'unban':
          await unbanMutation.mutateAsync({ userId: selectedUser._id });
          break;
        case 'suspend':
          await suspendMutation.mutateAsync({
            userId: selectedUser._id,
            days: 7,
            reason: actionReason,
          });
          break;
        case 'warn':
          await warnMutation.mutateAsync({
            userId: selectedUser._id,
            reason: actionReason,
          });
          break;
        case 'delete':
          await deleteMutation.mutateAsync(selectedUser._id);
          break;
      }
    } catch (error) {
      console.error(`Failed to ${actionType} user:`, error);
    }

    setShowActionModal(false);
    setActionReason('');
  };

  const handleRefresh = () => {
    refetchUsers();
  };

  const handlePageChange = newPage => {
    setCurrentPage(newPage);
  };

  return (
    <div className="space-y-8 font-sans">
      {/* Header */}
      {/* Header */}
      <div className="yb-card p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-surface-secondary/30">
        <div>
          <h2 className="text-2xl font-black text-primary tracking-tight">
            Quản lý người dùng
          </h2>
          <p className="text-sm text-secondary font-medium mt-1">
            Quản lý tài khoản, vai trò và phân quyền người dùng
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

      {/* Filters & Actions */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1 group">
          <Search
            size={20}
            className="absolute left-4 top-1/2 -translate-y-1/2 text-secondary group-focus-within:text-primary transition-colors"
          />
          <input
            type="text"
            placeholder="Tìm kiếm người dùng theo tên, email..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="yb-input pl-12 w-full text-sm"
          />
        </div>
        <select
          value={filterStatus}
          onChange={e => setFilterStatus(e.target.value)}
          className="yb-input px-6 py-3 text-sm font-bold min-w-[180px]"
        >
          <option value="all">Tất cả trạng thái</option>
          <option value="active">Hoạt động</option>
          <option value="pending">Chờ duyệt</option>
          <option value="suspended">Tạm ngưng</option>
          <option value="banned">Bị chặn</option>
        </select>
      </div>

      {/* Table Card */}
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
                            ? new Date(user.createdAt).toLocaleDateString(
                                'vi-VN'
                              )
                            : 'N/A'}
                        </span>
                      </td>
                      <td className="px-8 py-4">
                        <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-all">
                          <button
                            onClick={() => handleViewUser(user)}
                            className="p-2 rounded-xl text-secondary hover:bg-surface-hover hover:text-primary transition-colors"
                            title="Xem chi tiết"
                          >
                            <Eye size={18} />
                          </button>
                          {user.status === 'banned' ? (
                            <button
                              onClick={() => handleUnbanUser(user)}
                              className="p-2 rounded-xl text-success hover:bg-success/10 transition-colors"
                              title="Gỡ chặn"
                            >
                              <ShieldOff size={18} />
                            </button>
                          ) : (
                            <>
                              <button
                                onClick={() => handleWarnUser(user)}
                                className="p-2 rounded-xl text-warning hover:bg-warning/10 transition-colors"
                                title="Cảnh báo"
                              >
                                <AlertTriangle size={18} />
                              </button>
                              <button
                                onClick={() => handleBanUser(user)}
                                className="p-2 rounded-xl text-error hover:bg-error/10 transition-colors"
                                title="Chặn người dùng"
                              >
                                <Ban size={18} />
                              </button>
                            </>
                          )}
                          <button
                            onClick={() => handleDeleteUser(user)}
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
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage <= 1}
                  className="yb-btn yb-btn-secondary p-2.5 disabled:opacity-30 shadow-sm"
                >
                  <ChevronLeft size={18} />
                </button>
                <div className="px-4 py-2 bg-surface rounded-xl border border-border text-sm font-black text-primary shadow-sm">
                  {currentPage}
                </div>
                <button
                  onClick={() => handlePageChange(currentPage + 1)}
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

      {/* User Detail Modal */}
      {showDetailModal && selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md p-4 animate-fade-in">
          <div className="yb-card bg-surface w-full max-w-3xl shadow-2xl max-h-[85vh] flex flex-col overflow-hidden transform animate-scale-in">
            {/* Modal Header */}
            <div className="p-8 border-b border-border shrink-0 bg-surface-secondary/30">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-6">
                  <img
                    src={selectedUser.avatar || '/images/default-avatar.png'}
                    alt={selectedUser.name}
                    className="yb-avatar w-24 h-24 border-4 border-surface shadow-xl"
                  />
                  <div>
                    <h3 className="text-2xl font-black text-primary flex items-center gap-3 tracking-tight">
                      {selectedUser.name}
                      <StatusBadge status={selectedUser.status || 'active'} />
                    </h3>
                    <p className="text-secondary font-bold mt-1">
                      @{selectedUser.username}
                    </p>
                    <div className="flex items-center gap-4 mt-4 text-xs font-bold text-secondary">
                      <span className="flex items-center gap-1.5">
                        <Mail size={14} /> {selectedUser.email}
                      </span>
                      <span className="flex items-center gap-1.5">
                        <Calendar size={14} /> Tham gia{' '}
                        {new Date(selectedUser.createdAt).toLocaleDateString(
                          'vi-VN'
                        )}
                      </span>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => setShowDetailModal(false)}
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
                        {selectedUser.role || 'Thành viên'}
                      </p>
                    </div>
                    <div className="p-6 bg-surface-secondary/50 rounded-2xl border border-border/50 shadow-inner">
                      <p className="text-[10px] font-black text-secondary uppercase tracking-widest mb-2">
                        Bài viết
                      </p>
                      <p className="text-lg font-black text-primary">
                        {selectedUser.postsCount || 0}
                      </p>
                    </div>
                    <div className="p-6 bg-surface-secondary/50 rounded-2xl border border-border/50 shadow-inner">
                      <p className="text-[10px] font-black text-secondary uppercase tracking-widest mb-2">
                        Theo dõi
                      </p>
                      <p className="text-lg font-black text-primary">
                        {(selectedUser.followersCount || 0).toLocaleString()}
                      </p>
                    </div>
                  </div>

                  <div className="p-6 bg-surface-secondary/50 rounded-2xl border border-border/50 shadow-inner">
                    <p className="text-[10px] font-black text-secondary uppercase tracking-widest mb-3">
                      Giới thiệu
                    </p>
                    <p className="text-sm font-bold text-primary leading-relaxed">
                      {selectedUser.bio || 'Chưa có thông tin giới thiệu.'}
                    </p>
                  </div>
                </div>
              )}

              {activeTab === 'posts' && (
                <div className="space-y-4">
                  {currentUserPosts?.length > 0 ? (
                    currentUserPosts.map(post => (
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
                            {post.content ||
                              post.caption ||
                              'Không có nội dung'}
                          </p>
                          <div className="flex items-center gap-4 text-xs font-black text-secondary">
                            <span className="bg-surface-secondary px-2.5 py-1 rounded-lg">
                              {new Date(post.createdAt).toLocaleDateString(
                                'vi-VN'
                              )}
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
                  {currentUserReports?.length > 0 ? (
                    currentUserReports.map(report => (
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
                            {new Date(report.createdAt).toLocaleDateString(
                              'vi-VN'
                            )}
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
                onClick={() => setShowDetailModal(false)}
                className="yb-btn yb-btn-secondary px-8 py-3"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Action Modal (Ban/Unban/Suspend/Warn/Delete) */}
      {showActionModal && selectedUser && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-fade-in">
          <div className="yb-card bg-surface w-full max-w-md shadow-2xl p-10 overflow-hidden transform animate-scale-in">
            <div className="flex flex-col items-center text-center mb-8">
              <div
                className={`w-20 h-20 rounded-3xl flex items-center justify-center mb-6 shadow-lg ${
                  actionType === 'unban'
                    ? 'bg-success/20 text-success'
                    : actionType === 'warn'
                    ? 'bg-warning/20 text-warning'
                    : 'bg-error/20 text-error'
                }`}
              >
                {actionType === 'unban' ? (
                  <Check size={36} strokeWidth={3} />
                ) : actionType === 'warn' ? (
                  <AlertTriangle size={36} strokeWidth={3} />
                ) : (
                  <Ban size={36} strokeWidth={3} />
                )}
              </div>
              <h3 className="text-2xl font-black text-primary capitalize mb-3 tracking-tight">
                {actionType === 'ban'
                  ? 'Chặn người dùng'
                  : actionType === 'unban'
                  ? 'Gỡ chặn'
                  : actionType === 'warn'
                  ? 'Cảnh báo'
                  : 'Xóa người dùng'}
              </h3>
              <p className="text-sm font-bold text-secondary leading-relaxed px-4">
                {actionType === 'ban' &&
                  `Bạn có chắc chắn muốn chặn ${selectedUser.name}? Quyền truy cập sẽ bị thu hồi ngay lập tức.`}
                {actionType === 'unban' &&
                  `Khôi phục quyền truy cập cho ${selectedUser.name}?`}
                {actionType === 'warn' &&
                  `Gửi cảnh báo chính thức cho ${selectedUser.name}?`}
                {actionType === 'delete' &&
                  `Xóa vĩnh viễn ${selectedUser.name}? Hành động này không thể hoàn tác.`}
              </p>
            </div>

            {['ban', 'suspend', 'warn'].includes(actionType) && (
              <div className="mb-8">
                <label className="text-[10px] font-black text-secondary uppercase tracking-widest block mb-2.5 ml-1">
                  {actionType === 'warn'
                    ? 'Nội dung cảnh báo'
                    : 'Lý do thực hiện'}
                </label>
                <textarea
                  value={actionReason}
                  onChange={e => setActionReason(e.target.value)}
                  placeholder="Nhập chi tiết tại đây..."
                  className="yb-input w-full p-4 h-32 resize-none text-sm font-bold"
                />
              </div>
            )}

            <div className="flex gap-4">
              <button
                onClick={() => {
                  setShowActionModal(false);
                  setActionReason('');
                }}
                className="yb-btn yb-btn-secondary flex-1 py-4 font-black"
              >
                Hủy bỏ
              </button>
              <button
                onClick={confirmAction}
                disabled={loading}
                className={`yb-btn flex-1 py-4 font-black flex items-center justify-center gap-2 shadow-xl ${
                  actionType === 'unban'
                    ? 'bg-success hover:bg-success/90 text-white shadow-success/20'
                    : actionType === 'warn'
                    ? 'bg-warning hover:bg-warning/90 text-white shadow-warning/20'
                    : 'bg-error hover:bg-error/90 text-white shadow-error/20'
                } disabled:opacity-50`}
              >
                {loading && <Loader2 size={18} className="animate-spin" />}
                Xác nhận
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Users;
