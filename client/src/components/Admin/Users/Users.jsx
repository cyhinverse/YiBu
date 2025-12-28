import { useState } from 'react';
import { useDebounce } from '@/hooks/useDebounce';
import { Search, RefreshCcw } from 'lucide-react';
import {
  useAdminUsers,
  useDeleteUser,
  useBanUser,
  useUnbanUser,
  useSuspendUser,
  useWarnUser,
  useAdminUserPosts,
  useAdminUserReports,
} from '@/hooks/useAdminQuery';

import UsersTable from './UsersTable';
import UserDetailModal from './UserDetailModal';
import AdminActionModal from './AdminActionModal';

const Users = () => {
  /* State */
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterRole] = useState('all');
  const [selectedUser, setSelectedUser] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const debouncedSearch = useDebounce(searchQuery, 500);

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

      {/* Users Table */}
      <UsersTable
        users={users}
        loading={usersLoading}
        currentPage={currentPage}
        pagination={pagination}
        onPageChange={handlePageChange}
        onViewUser={handleViewUser}
        onBanUser={handleBanUser}
        onUnbanUser={handleUnbanUser}
        onWarnUser={handleWarnUser}
        onDeleteUser={handleDeleteUser}
      />

      {/* User Detail Modal */}
      {showDetailModal && selectedUser && (
        <UserDetailModal
          user={selectedUser}
          onClose={() => setShowDetailModal(false)}
          posts={currentUserPosts}
          reports={currentUserReports}
        />
      )}

      {/* Action Modal */}
      {showActionModal && selectedUser && (
        <AdminActionModal
          isOpen={showActionModal}
          actionType={actionType}
          targetName={selectedUser.name}
          reason={actionReason}
          onReasonChange={setActionReason}
          onConfirm={confirmAction}
          onCancel={() => {
            setShowActionModal(false);
            setActionReason('');
          }}
          loading={loading}
        />
      )}
    </div>
  );
};

export default Users;
