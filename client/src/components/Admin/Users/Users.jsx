import { useState } from "react";
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
} from "lucide-react";

// Fake users data
const FAKE_USERS = [
  {
    _id: "u1",
    name: "Sarah Chen",
    username: "sarahchen",
    email: "sarah@example.com",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=sarah",
    role: "user",
    status: "active",
    posts: 45,
    followers: 1234,
    joinedDate: "Jan 15, 2024",
    isVerified: true,
  },
  {
    _id: "u2",
    name: "Mike Johnson",
    username: "mikej",
    email: "mike@example.com",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=mike",
    role: "user",
    status: "active",
    posts: 23,
    followers: 567,
    joinedDate: "Feb 20, 2024",
    isVerified: false,
  },
  {
    _id: "u3",
    name: "Emma Wilson",
    username: "emmaw",
    email: "emma@example.com",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=emma",
    role: "moderator",
    status: "active",
    posts: 89,
    followers: 2345,
    joinedDate: "Dec 10, 2023",
    isVerified: true,
  },
  {
    _id: "u4",
    name: "Alex Kim",
    username: "alexk",
    email: "alex@example.com",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=alex",
    role: "user",
    status: "pending",
    posts: 12,
    followers: 234,
    joinedDate: "Mar 5, 2024",
    isVerified: false,
  },
  {
    _id: "u5",
    name: "Jessica Lee",
    username: "jessical",
    email: "jessica@example.com",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=jessica",
    role: "user",
    status: "suspended",
    posts: 67,
    followers: 890,
    joinedDate: "Nov 22, 2023",
    isVerified: true,
  },
];

const StatusBadge = ({ status }) => {
  const styles = {
    active:
      "bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400",
    pending:
      "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400",
    suspended: "bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400",
    banned: "bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400",
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
  const [users, setUsers] = useState(FAKE_USERS);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [selectedUser, setSelectedUser] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showBanModal, setShowBanModal] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.username.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus =
      filterStatus === "all" || user.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const handleViewUser = (user) => {
    setSelectedUser(user);
    setShowDetailModal(true);
  };

  const handleBanUser = (user) => {
    setSelectedUser(user);
    setShowBanModal(true);
  };

  const confirmBan = () => {
    setUsers((prev) =>
      prev.map((u) =>
        u._id === selectedUser._id ? { ...u, status: "banned" } : u
      )
    );
    setShowBanModal(false);
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
            Manage and monitor user accounts
          </p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-black dark:bg-white text-white dark:text-black rounded-lg font-medium text-sm hover:opacity-90 transition-opacity">
          <UserPlus size={18} />
          Add User
        </button>
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
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-black dark:text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-neutral-300 dark:focus:ring-neutral-600"
          />
        </div>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
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
              {filteredUsers.map((user) => (
                <tr
                  key={user._id}
                  className="hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors"
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <img
                        src={user.avatar}
                        alt={user.name}
                        className="w-10 h-10 rounded-full object-cover"
                      />
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-black dark:text-white">
                            {user.name}
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
                      {user.role}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <StatusBadge status={user.status} />
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-black dark:text-white">
                      {user.posts}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-neutral-500">
                      {user.joinedDate}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => handleViewUser(user)}
                        className="p-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
                        title="View"
                      >
                        <Eye size={16} className="text-neutral-500" />
                      </button>
                      <button
                        onClick={() => handleBanUser(user)}
                        className="p-2 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/20 transition-colors"
                        title="Ban"
                      >
                        <Ban size={16} className="text-red-500" />
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
            Showing {filteredUsers.length} of {users.length} users
          </span>
          <div className="flex items-center gap-2">
            <button className="p-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 disabled:opacity-50">
              <ChevronLeft size={18} className="text-neutral-500" />
            </button>
            <span className="px-3 py-1 text-sm font-medium text-black dark:text-white">
              1
            </span>
            <button className="p-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 disabled:opacity-50">
              <ChevronRight size={18} className="text-neutral-500" />
            </button>
          </div>
        </div>
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
                  src={selectedUser.avatar}
                  alt={selectedUser.name}
                  className="w-20 h-20 rounded-full object-cover"
                />
                <div>
                  <h4 className="text-xl font-bold text-black dark:text-white">
                    {selectedUser.name}
                  </h4>
                  <p className="text-neutral-500">@{selectedUser.username}</p>
                  <StatusBadge status={selectedUser.status} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-neutral-50 dark:bg-neutral-800 rounded-lg">
                  <span className="text-xs text-neutral-500 block mb-1">
                    Email
                  </span>
                  <span className="text-sm text-black dark:text-white">
                    {selectedUser.email}
                  </span>
                </div>
                <div className="p-4 bg-neutral-50 dark:bg-neutral-800 rounded-lg">
                  <span className="text-xs text-neutral-500 block mb-1">
                    Role
                  </span>
                  <span className="text-sm text-black dark:text-white capitalize">
                    {selectedUser.role}
                  </span>
                </div>
                <div className="p-4 bg-neutral-50 dark:bg-neutral-800 rounded-lg">
                  <span className="text-xs text-neutral-500 block mb-1">
                    Posts
                  </span>
                  <span className="text-sm text-black dark:text-white">
                    {selectedUser.posts}
                  </span>
                </div>
                <div className="p-4 bg-neutral-50 dark:bg-neutral-800 rounded-lg">
                  <span className="text-xs text-neutral-500 block mb-1">
                    Followers
                  </span>
                  <span className="text-sm text-black dark:text-white">
                    {selectedUser.followers.toLocaleString()}
                  </span>
                </div>
              </div>
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

      {/* Ban User Modal */}
      {showBanModal && selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white dark:bg-neutral-900 rounded-2xl w-full max-w-md mx-4 shadow-xl">
            <div className="p-6">
              <h3 className="text-lg font-bold text-black dark:text-white mb-2">
                Ban User
              </h3>
              <p className="text-neutral-500 mb-6">
                Are you sure you want to ban{" "}
                <span className="font-medium text-black dark:text-white">
                  {selectedUser.name}
                </span>
                ? They will no longer be able to access their account.
              </p>
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setShowBanModal(false)}
                  className="px-4 py-2 rounded-lg border border-neutral-200 dark:border-neutral-700 text-black dark:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmBan}
                  className="px-4 py-2 rounded-lg bg-red-500 text-white hover:bg-red-600"
                >
                  Ban User
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
