import { useState } from "react";
import {
  Search,
  UserX,
  Check,
  X,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

// Fake banned users
const FAKE_BANNED_USERS = [
  {
    _id: "b1",
    name: "John Smith",
    username: "johnsmith",
    email: "john@example.com",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=john",
    banReason: "Spam and harassment",
    bannedDate: "Mar 10, 2024",
    bannedBy: "Admin",
    banDuration: "Permanent",
  },
  {
    _id: "b2",
    name: "David Brown",
    username: "davidb",
    email: "david@example.com",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=david",
    banReason: "Posting inappropriate content",
    bannedDate: "Mar 8, 2024",
    bannedBy: "Moderator",
    banDuration: "30 days",
  },
  {
    _id: "b3",
    name: "Lisa Wang",
    username: "lisaw",
    email: "lisa@example.com",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=lisa",
    banReason: "Fake account / Impersonation",
    bannedDate: "Mar 5, 2024",
    bannedBy: "Admin",
    banDuration: "Permanent",
  },
];

const BannedAccounts = () => {
  const [bannedUsers, setBannedUsers] = useState(FAKE_BANNED_USERS);
  const [searchQuery, setSearchQuery] = useState("");
  const [showUnbanModal, setShowUnbanModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);

  const filteredUsers = bannedUsers.filter(
    (user) =>
      user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.username.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleUnban = (user) => {
    setSelectedUser(user);
    setShowUnbanModal(true);
  };

  const confirmUnban = () => {
    setBannedUsers((prev) => prev.filter((u) => u._id !== selectedUser._id));
    setShowUnbanModal(false);
    setSelectedUser(null);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-black dark:text-white">
          Banned Accounts
        </h2>
        <p className="text-sm text-neutral-500 mt-1">
          Manage banned user accounts
        </p>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search
          size={18}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400"
        />
        <input
          type="text"
          placeholder="Search banned users..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-black dark:text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-neutral-300 dark:focus:ring-neutral-600"
        />
      </div>

      {/* Table */}
      {filteredUsers.length === 0 ? (
        <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 p-12 text-center">
          <UserX size={48} className="mx-auto mb-4 text-neutral-300" />
          <h3 className="text-lg font-semibold text-black dark:text-white mb-2">
            No banned users
          </h3>
          <p className="text-neutral-500">
            There are no banned accounts to display
          </p>
        </div>
      ) : (
        <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-neutral-200 dark:border-neutral-800">
                  <th className="text-left px-6 py-4 text-sm font-medium text-neutral-500">
                    User
                  </th>
                  <th className="text-left px-6 py-4 text-sm font-medium text-neutral-500">
                    Reason
                  </th>
                  <th className="text-left px-6 py-4 text-sm font-medium text-neutral-500">
                    Duration
                  </th>
                  <th className="text-left px-6 py-4 text-sm font-medium text-neutral-500">
                    Banned Date
                  </th>
                  <th className="text-left px-6 py-4 text-sm font-medium text-neutral-500">
                    Banned By
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
                          className="w-10 h-10 rounded-full object-cover opacity-50"
                        />
                        <div>
                          <span className="font-medium text-black dark:text-white">
                            {user.name}
                          </span>
                          <span className="text-sm text-neutral-500 block">
                            {user.email}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-black dark:text-white">
                        {user.banReason}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-block px-2 py-1 text-xs font-medium rounded-full ${
                          user.banDuration === "Permanent"
                            ? "bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400"
                            : "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400"
                        }`}
                      >
                        {user.banDuration}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-neutral-500">
                        {user.bannedDate}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-black dark:text-white">
                        {user.bannedBy}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end">
                        <button
                          onClick={() => handleUnban(user)}
                          className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 hover:bg-green-200 dark:hover:bg-green-900/50 transition-colors text-sm font-medium"
                        >
                          <Check size={14} />
                          Unban
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
              {filteredUsers.length} banned accounts
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
      )}

      {/* Unban Modal */}
      {showUnbanModal && selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white dark:bg-neutral-900 rounded-2xl w-full max-w-md mx-4 shadow-xl">
            <div className="p-6">
              <h3 className="text-lg font-bold text-black dark:text-white mb-2">
                Unban User
              </h3>
              <p className="text-neutral-500 mb-6">
                Are you sure you want to unban{" "}
                <span className="font-medium text-black dark:text-white">
                  {selectedUser.name}
                </span>
                ? They will be able to access their account again.
              </p>
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setShowUnbanModal(false)}
                  className="px-4 py-2 rounded-lg border border-neutral-200 dark:border-neutral-700 text-black dark:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmUnban}
                  className="px-4 py-2 rounded-lg bg-green-500 text-white hover:bg-green-600"
                >
                  Unban User
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BannedAccounts;
