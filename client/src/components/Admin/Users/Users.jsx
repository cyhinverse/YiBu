import { useState } from 'react';
import { useDebounce } from '@/hooks/useDebounce';
import { Search, RefreshCcw, Filter } from 'lucide-react';
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

  const deleteMutation = useDeleteUser();
  const banMutation = useBanUser();
  const unbanMutation = useUnbanUser();
  const suspendMutation = useSuspendUser();
  const warnMutation = useWarnUser();

  const loading = usersLoading;
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

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-neutral-800 dark:text-white">
            Quản lý người dùng
          </h2>
          <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-0.5">
            Quản lý tài khoản và phân quyền
          </p>
        </div>
        <button
          onClick={() => refetchUsers()}
          className="p-2 bg-neutral-100 dark:bg-neutral-800 rounded-xl text-neutral-500 hover:text-neutral-700 dark:hover:text-white transition-colors"
        >
          <RefreshCcw
            size={18}
            strokeWidth={1.5}
            className={loading ? 'animate-spin' : ''}
          />
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-neutral-900 rounded-2xl p-4 shadow-sm flex flex-col sm:flex-row gap-3 items-center">
        <div className="relative flex-1 w-full">
          <Search
            size={16}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400"
          />
          <input
            type="text"
            placeholder="Tìm theo tên, email..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-neutral-50 dark:bg-neutral-800 border-none rounded-xl text-sm focus:ring-2 focus:ring-neutral-200 dark:focus:ring-neutral-700 outline-none placeholder:text-neutral-400"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:flex-none">
            <Filter
              size={14}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none"
            />
            <select
              value={filterStatus}
              onChange={e => setFilterStatus(e.target.value)}
              className="w-full sm:w-auto pl-8 pr-8 py-2.5 bg-neutral-100 dark:bg-neutral-800 rounded-xl text-sm font-medium text-neutral-600 dark:text-neutral-300 focus:outline-none appearance-none cursor-pointer"
            >
              <option value="all">Tất cả</option>
              <option value="active">Hoạt động</option>
              <option value="pending">Chờ duyệt</option>
              <option value="suspended">Tạm ngưng</option>
              <option value="banned">Bị chặn</option>
            </select>
          </div>
        </div>
      </div>

      {/* Table */}
      <UsersTable
        users={users}
        loading={usersLoading}
        currentPage={currentPage}
        pagination={pagination}
        onPageChange={newPage => setCurrentPage(newPage)}
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
