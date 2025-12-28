import { useState } from 'react';
import {
  UserX,
  VolumeX,
  Search,
  MoreHorizontal,
  Loader2,
  Ban,
  Volume2,
} from 'lucide-react';
import toast from 'react-hot-toast';
import {
  useBlockedUsers,
  useMutedUsers,
  useUnblockUser,
  useUnmuteUser,
} from '@/hooks/useUserQuery';

const BlockedMutedSettings = () => {
  const { data: blockedUsers, isLoading: blockedLoading } = useBlockedUsers();
  const { data: mutedUsers, isLoading: mutedLoading } = useMutedUsers();
  const unblockMutation = useUnblockUser();
  const unmuteMutation = useUnmuteUser();

  const loading = blockedLoading || mutedLoading;

  const [activeTab, setActiveTab] = useState('blocked');
  const [searchQuery, setSearchQuery] = useState('');

  const handleUnblock = async userId => {
    if (!window.confirm('Bạn có chắc muốn bỏ chặn người dùng này?')) return;

    try {
      await unblockMutation.mutateAsync(userId);
      toast.success('Đã bỏ chặn người dùng');
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Không thể bỏ chặn');
    }
  };

  const handleUnmute = async userId => {
    if (!window.confirm('Bạn có chắc muốn bỏ ẩn người dùng này?')) return;

    try {
      await unmuteMutation.mutateAsync(userId);
      toast.success('Đã bỏ ẩn người dùng');
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Không thể bỏ ẩn');
    }
  };

  const filteredBlockedUsers =
    (Array.isArray(blockedUsers) ? blockedUsers : [])?.filter(
      user =>
        user.username?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.fullName?.toLowerCase().includes(searchQuery.toLowerCase())
    ) || [];

  const filteredMutedUsers =
    (Array.isArray(mutedUsers) ? mutedUsers : [])?.filter(
      user =>
        user.username?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.fullName?.toLowerCase().includes(searchQuery.toLowerCase())
    ) || [];

  const UserItem = ({ user, type }) => (
    <div className="flex items-center justify-between p-3 rounded-lg bg-neutral-50 dark:bg-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-700/50 transition-colors">
      <div className="flex items-center gap-3">
        <img
          src={user.avatar || '/images/default-avatar.png'}
          alt={user.username}
          className="w-10 h-10 rounded-full object-cover"
        />
        <div>
          <p className="text-sm font-medium text-black dark:text-white">
            {user.fullName || user.username}
          </p>
          <p className="text-xs text-neutral-500">@{user.username}</p>
        </div>
      </div>
      <button
        onClick={() =>
          type === 'blocked'
            ? handleUnblock(user.id || user._id)
            : handleUnmute(user.id || user._id)
        }
        className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
          type === 'blocked'
            ? 'text-red-600 bg-red-50 hover:bg-red-100 dark:bg-red-900/30 dark:hover:bg-red-900/50'
            : 'text-amber-600 bg-amber-50 hover:bg-amber-100 dark:bg-amber-900/30 dark:hover:bg-amber-900/50'
        }`}
      >
        {type === 'blocked' ? 'Bỏ chặn' : 'Bỏ ẩn'}
      </button>
    </div>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-neutral-400" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-black dark:text-white mb-2">
          Người dùng bị chặn & ẩn
        </h1>
        <p className="text-neutral-500 text-sm">
          Quản lý danh sách người dùng bạn đã chặn hoặc ẩn
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-neutral-200 dark:border-neutral-700">
        <button
          onClick={() => setActiveTab('blocked')}
          className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'blocked'
              ? 'border-black dark:border-white text-black dark:text-white'
              : 'border-transparent text-neutral-500 hover:text-black dark:hover:text-white'
          }`}
        >
          <div className="flex items-center gap-2">
            <Ban size={16} />
            <span>Đã chặn ({blockedUsers?.length || 0})</span>
          </div>
        </button>
        <button
          onClick={() => setActiveTab('muted')}
          className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'muted'
              ? 'border-black dark:border-white text-black dark:text-white'
              : 'border-transparent text-neutral-500 hover:text-black dark:hover:text-white'
          }`}
        >
          <div className="flex items-center gap-2">
            <VolumeX size={16} />
            <span>Đã ẩn ({mutedUsers?.length || 0})</span>
          </div>
        </button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search
          size={18}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400"
        />
        <input
          type="text"
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          placeholder="Tìm kiếm người dùng..."
          className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-black dark:text-white placeholder:text-neutral-400 text-sm focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white"
        />
      </div>

      {/* User List */}
      <div className="space-y-2">
        {activeTab === 'blocked' ? (
          filteredBlockedUsers.length > 0 ? (
            filteredBlockedUsers.map(user => (
              <UserItem key={user.id || user._id} user={user} type="blocked" />
            ))
          ) : (
            <div className="text-center py-12">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center">
                <UserX className="w-8 h-8 text-neutral-400" />
              </div>
              <p className="text-neutral-500 text-sm">
                {searchQuery ? 'Không tìm thấy người dùng' : 'Chưa chặn ai'}
              </p>
            </div>
          )
        ) : filteredMutedUsers.length > 0 ? (
          filteredMutedUsers.map(user => (
            <UserItem key={user.id || user._id} user={user} type="muted" />
          ))
        ) : (
          <div className="text-center py-12">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center">
              <VolumeX className="w-8 h-8 text-neutral-400" />
            </div>
            <p className="text-neutral-500 text-sm">
              {searchQuery ? 'Không tìm thấy người dùng' : 'Chưa ẩn ai'}
            </p>
          </div>
        )}
      </div>

      {/* Info Section */}
      <div className="p-4 rounded-xl bg-neutral-50 dark:bg-neutral-800/50 border border-neutral-200 dark:border-neutral-700">
        <h4 className="text-sm font-medium text-black dark:text-white mb-2">
          Sự khác biệt giữa Chặn và Ẩn
        </h4>
        <div className="space-y-2 text-xs text-neutral-500">
          <div className="flex items-start gap-2">
            <Ban size={14} className="mt-0.5 text-red-500" />
            <p>
              <span className="font-medium text-black dark:text-white">
                Chặn:
              </span>{' '}
              Người dùng không thể xem profile, gửi tin nhắn hoặc tương tác với
              bạn.
            </p>
          </div>
          <div className="flex items-start gap-2">
            <VolumeX size={14} className="mt-0.5 text-amber-500" />
            <p>
              <span className="font-medium text-black dark:text-white">
                Ẩn:
              </span>{' '}
              Bài viết của người dùng sẽ không hiển thị trong feed của bạn,
              nhưng họ vẫn có thể tương tác.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BlockedMutedSettings;
