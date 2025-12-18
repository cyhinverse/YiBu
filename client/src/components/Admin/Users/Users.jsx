import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  Search,
  Filter,
  MoreHorizontal,
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
} from 'lucide-react';
import {
  getAllUsers,
  deleteUser,
  banUser,
  unbanUser,
  suspendUser,
  warnUser,
} from '../../../redux/actions/adminActions';

const StatusBadge = ({ status }) => {
  const styles = {
    active:
      'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400',
    pending:
      'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400',
    suspended: 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400',
    banned: 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400',
  };

  return (
    <span
      className={`inline-block px-2 py-1 text-xs font-medium rounded-full capitalize ${
        styles[status] || styles.active
      }`}
    >
      {status}
    </span>
  );
};

const Users = () => {
  const dispatch = useDispatch();
  const {
    users: usersList,
    pagination,
    loading,
  } = useSelector(state => state.admin);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterRole] = useState('all');
  const [selectedUser, setSelectedUser] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  const [showActionModal, setShowActionModal] = useState(false);
  const [actionType, setActionType] = useState('');
  const [actionReason, setActionReason] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  // Fetch users on mount and when filters change
  useEffect(() => {
    const params = {
      page: currentPage,
      limit: 10,
    };
    if (searchQuery) params.search = searchQuery;
    if (filterStatus !== 'all') params.status = filterStatus;
    if (filterRole !== 'all') params.role = filterRole;

    dispatch(getAllUsers(params));
  }, [dispatch, currentPage, filterStatus, filterRole, searchQuery]);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery !== undefined) {
        const params = {
          page: 1,
          limit: 10,
          search: searchQuery || undefined,
        };
        if (filterStatus !== 'all') params.status = filterStatus;
        if (filterRole !== 'all') params.role = filterRole;
        dispatch(getAllUsers(params));
        setCurrentPage(1);
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [searchQuery, filterStatus, filterRole, dispatch]);

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
          await dispatch(
            banUser({ userId: selectedUser._id, reason: actionReason })
          ).unwrap();
          break;
        case 'unban':
          await dispatch(unbanUser({ userId: selectedUser._id })).unwrap();
          break;
        case 'suspend':
          await dispatch(
            suspendUser({
              userId: selectedUser._id,
              days: 7,
              reason: actionReason,
            })
          ).unwrap();
          break;
        case 'warn':
          await dispatch(
            warnUser({ userId: selectedUser._id, reason: actionReason })
          ).unwrap();
          break;
        case 'delete':
          await dispatch(deleteUser(selectedUser._id)).unwrap();
          break;
      }
      // Refresh users list
      dispatch(getAllUsers({ page: currentPage, limit: 10 }));
    } catch (error) {
      console.error(`Failed to ${actionType} user:`, error);
    }

    setShowActionModal(false);
    setActionReason('');
  };

  const handleRefresh = () => {
    dispatch(getAllUsers({ page: currentPage, limit: 10 }));
  };

  const handlePageChange = newPage => {
    setCurrentPage(newPage);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-black dark:text-white">
            Users
          </h2>
          <p className="text-sm text-neutral-500 mt-1">
            Manage and monitor user accounts (
            {pagination?.total || users.length} total)
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleRefresh}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-neutral-100 dark:bg-neutral-800 rounded-lg font-medium text-sm hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors disabled:opacity-50"
          >
            <RefreshCcw size={16} className={loading ? 'animate-spin' : ''} />
            Refresh
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search
            size={18}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400"
          />
          <input
            type="text"
            placeholder="Search users..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-black dark:text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-neutral-300 dark:focus:ring-neutral-600"
          />
        </div>
        <select
          value={filterStatus}
          onChange={e => setFilterStatus(e.target.value)}
          className="px-4 py-2.5 rounded-lg bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-black dark:text-white focus:outline-none focus:ring-2 focus:ring-neutral-300 dark:focus:ring-neutral-600"
        >
          <option value="all">All Status</option>
          <option value="active">Active</option>
          <option value="pending">Pending</option>
          <option value="suspended">Suspended</option>
          <option value="banned">Banned</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 overflow-hidden">
        {loading && users.length === 0 ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 size={24} className="animate-spin text-neutral-400" />
          </div>
        ) : users.length === 0 ? (
          <div className="text-center py-12 text-neutral-500">
            No users found
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-neutral-200 dark:border-neutral-800">
                    <th className="text-left px-6 py-4 text-sm font-medium text-neutral-500">
                      User
                    </th>
                    <th className="text-left px-6 py-4 text-sm font-medium text-neutral-500">
                      Role
                    </th>
                    <th className="text-left px-6 py-4 text-sm font-medium text-neutral-500">
                      Status
                    </th>
                    <th className="text-left px-6 py-4 text-sm font-medium text-neutral-500">
                      Posts
                    </th>
                    <th className="text-left px-6 py-4 text-sm font-medium text-neutral-500">
                      Joined
                    </th>
                    <th className="text-right px-6 py-4 text-sm font-medium text-neutral-500">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800">
                  {users.map(user => (
                    <tr
                      key={user._id}
                      className="hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={user.avatar || '/images/default-avatar.png'}
                            alt={user.name || user.username}
                            className="w-10 h-10 rounded-full object-cover"
                          />
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-black dark:text-white">
                                {user.name || user.username}
                              </span>
                              {user.isVerified && (
                                <div className="w-4 h-4 rounded-full bg-black dark:bg-white flex items-center justify-center">
                                  <Check
                                    size={10}
                                    className="text-white dark:text-black"
                                  />
                                </div>
                              )}
                            </div>
                            <span className="text-sm text-neutral-500">
                              @{user.username}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-black dark:text-white capitalize">
                          {user.role || 'user'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <StatusBadge status={user.status || 'active'} />
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-black dark:text-white">
                          {user.postsCount || user.posts || 0}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-neutral-500">
                          {user.createdAt
                            ? new Date(user.createdAt).toLocaleDateString()
                            : 'N/A'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => handleViewUser(user)}
                            className="p-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
                            title="View Details"
                          >
                            <Eye size={16} className="text-neutral-500" />
                          </button>
                          {user.status === 'banned' ? (
                            <button
                              onClick={() => handleUnbanUser(user)}
                              className="p-2 rounded-lg hover:bg-green-100 dark:hover:bg-green-900/20 transition-colors"
                              title="Unban User"
                            >
                              <ShieldOff size={16} className="text-green-500" />
                            </button>
                          ) : (
                            <>
                              <button
                                onClick={() => handleWarnUser(user)}
                                className="p-2 rounded-lg hover:bg-yellow-100 dark:hover:bg-yellow-900/20 transition-colors"
                                title="Warn User"
                              >
                                <AlertTriangle
                                  size={16}
                                  className="text-yellow-500"
                                />
                              </button>
                              <button
                                onClick={() => handleBanUser(user)}
                                className="p-2 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/20 transition-colors"
                                title="Ban User"
                              >
                                <Ban size={16} className="text-red-500" />
                              </button>
                            </>
                          )}
                          <button
                            onClick={() => handleDeleteUser(user)}
                            className="p-2 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/20 transition-colors"
                            title="Delete User"
                          >
                            <Trash2 size={16} className="text-red-500" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-between px-6 py-4 border-t border-neutral-200 dark:border-neutral-800">
              <span className="text-sm text-neutral-500">
                Page {currentPage} of {pagination?.pages || 1} (
                {pagination?.total || users.length} total)
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage <= 1}
                  className="p-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronLeft size={18} className="text-neutral-500" />
                </button>
                <span className="px-3 py-1 text-sm font-medium text-black dark:text-white">
                  {currentPage}
                </span>
                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage >= (pagination?.pages || 1)}
                  className="p-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronRight size={18} className="text-neutral-500" />
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* User Detail Modal */}
      {showDetailModal && selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white dark:bg-neutral-900 rounded-2xl w-full max-w-lg mx-4 shadow-xl">
            <div className="flex items-center justify-between p-6 border-b border-neutral-200 dark:border-neutral-800">
              <h3 className="text-lg font-bold text-black dark:text-white">
                User Details
              </h3>
              <button
                onClick={() => setShowDetailModal(false)}
                className="p-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800"
              >
                <X size={20} className="text-neutral-500" />
              </button>
            </div>
            <div className="p-6 space-y-6">
              <div className="flex items-center gap-4">
                <img
                  src={selectedUser.avatar || '/images/default-avatar.png'}
                  alt={selectedUser.name || selectedUser.username}
                  className="w-20 h-20 rounded-full object-cover"
                />
                <div>
                  <h4 className="text-xl font-bold text-black dark:text-white">
                    {selectedUser.name || selectedUser.username}
                  </h4>
                  <p className="text-neutral-500">@{selectedUser.username}</p>
                  <StatusBadge status={selectedUser.status || 'active'} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-neutral-50 dark:bg-neutral-800 rounded-lg">
                  <span className="text-xs text-neutral-500 block mb-1">
                    Email
                  </span>
                  <span className="text-sm text-black dark:text-white">
                    {selectedUser.email || 'N/A'}
                  </span>
                </div>
                <div className="p-4 bg-neutral-50 dark:bg-neutral-800 rounded-lg">
                  <span className="text-xs text-neutral-500 block mb-1">
                    Role
                  </span>
                  <span className="text-sm text-black dark:text-white capitalize">
                    {selectedUser.role || 'user'}
                  </span>
                </div>
                <div className="p-4 bg-neutral-50 dark:bg-neutral-800 rounded-lg">
                  <span className="text-xs text-neutral-500 block mb-1">
                    Posts
                  </span>
                  <span className="text-sm text-black dark:text-white">
                    {selectedUser.postsCount || selectedUser.posts || 0}
                  </span>
                </div>
                <div className="p-4 bg-neutral-50 dark:bg-neutral-800 rounded-lg">
                  <span className="text-xs text-neutral-500 block mb-1">
                    Followers
                  </span>
                  <span className="text-sm text-black dark:text-white">
                    {(
                      selectedUser.followersCount ||
                      selectedUser.followers ||
                      0
                    ).toLocaleString()}
                  </span>
                </div>
              </div>
              {selectedUser.bio && (
                <div className="p-4 bg-neutral-50 dark:bg-neutral-800 rounded-lg">
                  <span className="text-xs text-neutral-500 block mb-1">
                    Bio
                  </span>
                  <span className="text-sm text-black dark:text-white">
                    {selectedUser.bio}
                  </span>
                </div>
              )}
            </div>
            <div className="flex justify-end gap-3 p-6 border-t border-neutral-200 dark:border-neutral-800">
              <button
                onClick={() => setShowDetailModal(false)}
                className="px-4 py-2 rounded-lg border border-neutral-200 dark:border-neutral-700 text-black dark:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Action Modal (Ban/Unban/Suspend/Warn/Delete) */}
      {showActionModal && selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white dark:bg-neutral-900 rounded-2xl w-full max-w-md mx-4 shadow-xl">
            <div className="p-6">
              <h3 className="text-lg font-bold text-black dark:text-white mb-2 capitalize">
                {actionType} User
              </h3>
              <p className="text-neutral-500 mb-4">
                {actionType === 'ban' && (
                  <>
                    Are you sure you want to ban{' '}
                    <span className="font-medium text-black dark:text-white">
                      {selectedUser.name || selectedUser.username}
                    </span>
                    ? They will no longer be able to access their account.
                  </>
                )}
                {actionType === 'unban' && (
                  <>
                    Are you sure you want to unban{' '}
                    <span className="font-medium text-black dark:text-white">
                      {selectedUser.name || selectedUser.username}
                    </span>
                    ? They will regain access to their account.
                  </>
                )}
                {actionType === 'suspend' && (
                  <>
                    Are you sure you want to suspend{' '}
                    <span className="font-medium text-black dark:text-white">
                      {selectedUser.name || selectedUser.username}
                    </span>{' '}
                    for 7 days?
                  </>
                )}
                {actionType === 'warn' && (
                  <>
                    Send a warning to{' '}
                    <span className="font-medium text-black dark:text-white">
                      {selectedUser.name || selectedUser.username}
                    </span>
                    .
                  </>
                )}
                {actionType === 'delete' && (
                  <>
                    Are you sure you want to permanently delete{' '}
                    <span className="font-medium text-black dark:text-white">
                      {selectedUser.name || selectedUser.username}
                    </span>
                    &apos;s account? This action cannot be undone.
                  </>
                )}
              </p>
              {(actionType === 'ban' ||
                actionType === 'suspend' ||
                actionType === 'warn') && (
                <div className="mb-4">
                  <label className="text-sm text-neutral-500 block mb-2">
                    {actionType === 'warn' ? 'Warning Message' : 'Reason'}
                  </label>
                  <textarea
                    value={actionReason}
                    onChange={e => setActionReason(e.target.value)}
                    placeholder={
                      actionType === 'warn'
                        ? 'Enter warning message...'
                        : 'Enter reason...'
                    }
                    className="w-full px-4 py-2.5 rounded-lg bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-black dark:text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-neutral-300 dark:focus:ring-neutral-600 resize-none"
                    rows={3}
                  />
                </div>
              )}
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => {
                    setShowActionModal(false);
                    setActionReason('');
                  }}
                  className="px-4 py-2 rounded-lg border border-neutral-200 dark:border-neutral-700 text-black dark:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmAction}
                  disabled={loading}
                  className={`px-4 py-2 rounded-lg text-white flex items-center gap-2 ${
                    actionType === 'unban'
                      ? 'bg-green-500 hover:bg-green-600'
                      : actionType === 'warn'
                      ? 'bg-yellow-500 hover:bg-yellow-600'
                      : 'bg-red-500 hover:bg-red-600'
                  } disabled:opacity-50`}
                >
                  {loading && <Loader2 size={16} className="animate-spin" />}
                  Confirm {actionType}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Users;
