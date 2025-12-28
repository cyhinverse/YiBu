import { useState } from 'react';
import { useDebounce } from '@/hooks/useDebounce';
import { Search, RefreshCcw, Filter, Plus } from 'lucide-react';
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
    <div className="space-y-6 font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-neutral-900 dark:text-white tracking-tight">
            Quản lý người dùng
          </h2>
          <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">
            Quản lý tài khoản, vai trò và phân quyền hệ thống
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleRefresh}
            className="p-2 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-full text-neutral-500 hover:text-black dark:text-neutral-400 dark:hover:text-white transition-colors"
          >
            <RefreshCcw size={20} className={loading ? 'animate-spin' : ''} />
          </button>

          {/* <button className="flex items-center gap-2 px-4 py-2 bg-black dark:bg-white text-white dark:text-black rounded-full text-sm font-bold shadow-sm hover:opacity-90 transition-opacity">
            <Plus size={18} />
            <span>Thêm mới</span>
          </button> */}
        </div>
      </div>

      {/* Filters & Actions */}
      <div className="bg-white dark:bg-neutral-900 rounded-3xl p-4 border border-neutral-200 dark:border-neutral-800 shadow-sm flex flex-col sm:flex-row gap-4 items-center">
        <div className="relative flex-1 w-full sm:w-auto">
          <Search
            size={18}
            className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400"
          />
          <input
            type="text"
            placeholder="Tìm kiếm theo tên, email..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-11 pr-4 py-2.5 bg-neutral-100 dark:bg-neutral-800 border-none rounded-full text-sm font-medium focus:ring-2 focus:ring-neutral-200 dark:focus:ring-neutral-700 outline-none transition-all placeholder:text-neutral-400"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
          <div className="relative min-w-[160px]">
            <Filter
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500 pointer-events-none"
            />
            <select
              value={filterStatus}
              onChange={e => setFilterStatus(e.target.value)}
              className="w-full pl-9 pr-8 py-2.5 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-full text-sm font-medium text-neutral-700 dark:text-neutral-300 focus:outline-none focus:border-neutral-300 dark:focus:border-neutral-700 cursor-pointer appearance-none hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors"
            >
              <option value="all">Tất cả trạng thái</option>
              <option value="active">Hoạt động</option>
              <option value="pending">Chờ duyệt</option>
              <option value="suspended">Tạm ngưng</option>
              <option value="banned">Bị chặn</option>
            </select>
            {/* Custom arrow for select could be added here if appearance-none is used fully */}
          </div>
        </div>
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
