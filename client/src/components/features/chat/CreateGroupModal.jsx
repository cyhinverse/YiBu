import { Search, X, Loader2, Check } from 'lucide-react';

const CreateGroupModal = ({
  isOpen,
  onClose,
  groupName,
  setGroupName,
  searchQuery,
  onSearchChange,
  searchResults,
  selectedUsers,
  onToggleUser,
  isSearching,
  onSubmit,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
      <div className="bg-white dark:bg-neutral-900 rounded-3xl w-full max-w-md overflow-hidden flex flex-col max-h-[90vh] shadow-2xl border border-neutral-200 dark:border-neutral-800">
        <div className="p-5 border-b border-neutral-200 dark:border-neutral-800 flex justify-between items-center bg-white dark:bg-neutral-900">
          <h2 className="text-xl font-bold text-black dark:text-white">
            Tạo nhóm mới
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-full transition-colors"
          >
            <X size={20} className="text-neutral-500" />
          </button>
        </div>

        <div className="p-6 space-y-6 flex-1 overflow-hidden flex flex-col">
          {/* Group Name */}
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-neutral-700 dark:text-neutral-300">
              Tên nhóm
            </label>
            <input
              type="text"
              value={groupName}
              onChange={e => setGroupName(e.target.value)}
              placeholder="Nhập tên nhóm của bạn..."
              className="w-full px-4 py-3 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-800 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all text-black dark:text-white"
            />
          </div>

          {/* User Search */}
          <div className="flex-1 flex flex-col min-h-0 space-y-2">
            <label className="block text-sm font-semibold text-neutral-700 dark:text-neutral-300">
              Thêm thành viên
            </label>
            <div className="relative mb-2">
              <Search
                size={18}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400"
              />
              <input
                type="text"
                value={searchQuery}
                onChange={e => onSearchChange(e.target.value)}
                placeholder="Tìm kiếm bạn bè..."
                className="w-full pl-11 pr-4 py-3 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-800 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all text-sm text-black dark:text-white"
              />
            </div>

            {/* Selected Users Chips */}
            {selectedUsers.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-2 max-h-24 overflow-y-auto py-1">
                {selectedUsers.map(user => (
                  <div
                    key={user._id}
                    className="flex items-center gap-1.5 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 px-3 py-1.5 rounded-full text-xs font-medium border border-blue-100 dark:border-blue-900/30"
                  >
                    <span>{user.name}</span>
                    <button
                      onClick={() => onToggleUser(user)}
                      className="hover:text-blue-800 dark:hover:text-blue-200"
                    >
                      <X size={12} />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Search Results Area */}
            <div className="flex-1 overflow-y-auto custom-scrollbar border border-neutral-100 dark:border-neutral-800 rounded-2xl bg-neutral-50/50 dark:bg-neutral-800/20">
              {isSearching ? (
                <div className="flex flex-col items-center justify-center p-8 space-y-2">
                  <Loader2
                    className="animate-spin text-blue-500"
                    size={24}
                  />
                  <span className="text-xs text-neutral-500">Đang tìm kiếm...</span>
                </div>
              ) : searchResults.length > 0 ? (
                <div className="divide-y divide-neutral-100 dark:divide-neutral-800">
                  {searchResults.map(user => {
                    const isSelected = selectedUsers.some(
                      u => u._id === user._id
                    );
                    return (
                      <div
                        key={user._id}
                        onClick={() => onToggleUser(user)}
                        className={`p-3 flex items-center justify-between cursor-pointer hover:bg-blue-50 dark:hover:bg-blue-900/10 transition-colors ${
                          isSelected ? 'bg-blue-50 dark:bg-blue-900/10' : ''
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <img
                            src={
                              user.avatar || 'https://via.placeholder.com/150'
                            }
                            alt=""
                            className="w-10 h-10 rounded-full object-cover border border-neutral-200 dark:border-neutral-700"
                          />
                          <div>
                            <p className="text-sm font-semibold text-black dark:text-white">
                              {user.name}
                            </p>
                            <p className="text-xs text-neutral-500">
                              @{user.username}
                            </p>
                          </div>
                        </div>
                        {isSelected && (
                          <div className="bg-blue-600 text-white rounded-full p-1">
                            <Check size={14} />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                searchQuery && (
                  <div className="flex flex-col items-center justify-center p-8 text-center">
                    <p className="text-sm text-neutral-500">
                      Không tìm thấy người dùng nào phù hợp
                    </p>
                  </div>
                )
              )}
            </div>
          </div>
        </div>

        <div className="p-5 border-t border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-800/30 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-5 py-2.5 text-sm font-semibold text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200 dark:hover:bg-neutral-700 rounded-xl transition-all"
          >
            Hủy
          </button>
          <button
            onClick={onSubmit}
            disabled={!groupName.trim() || selectedUsers.length < 2}
            className="px-6 py-2.5 text-sm font-semibold bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-blue-500/30"
          >
            Tạo nhóm
          </button>
        </div>
      </div>
    </div>
  );
};

export default CreateGroupModal;
