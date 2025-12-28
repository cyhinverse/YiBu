import { useState, useEffect, useCallback, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { Users, UserPlus, Check, Search, X, Loader2 } from 'lucide-react';
import {
  useFollowers,
  useFollowing,
  useFollowUser,
  useUnfollowUser,
} from '@/hooks/useUserQuery';
import toast from 'react-hot-toast';

const FollowingUser = () => {
  const authUser = useSelector(state => state.auth?.user);

  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('following');

  // React Query hooks
  const { data: followersData, isLoading: followersLoading } = useFollowers(
    authUser?._id
  );
  const { data: followingData, isLoading: followingLoading } = useFollowing(
    authUser?._id
  );

  const followMutation = useFollowUser();
  const unfollowMutation = useUnfollowUser();

  const users = useMemo(() => {
    if (activeTab === 'followers') {
      return followersData || [];
    }
    return followingData || [];
  }, [activeTab, followersData, followingData]);

  const loading =
    activeTab === 'followers' ? followersLoading : followingLoading;

  // Handle follow/unfollow
  const handleToggleFollow = useCallback(
    async (targetUserId, isFollowing) => {
      try {
        if (isFollowing) {
          await unfollowMutation.mutateAsync(targetUserId);
          toast.success('Đã bỏ theo dõi');
        } else {
          await followMutation.mutateAsync(targetUserId);
          toast.success('Đã theo dõi');
        }
      } catch (error) {
        toast.error(error?.response?.data?.message || 'Thao tác thất bại');
      }
    },
    [followMutation, unfollowMutation]
  );

  // Filter users by search
  const filteredUsers = useMemo(() => {
    return users.filter(
      user =>
        user.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.fullName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.username?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [users, searchQuery]);

  return (
    <div className="max-w-2xl mx-auto">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white/80 dark:bg-neutral-900/80 backdrop-blur-md border-b border-neutral-200 dark:border-neutral-800">
        <div className="px-4 py-3">
          <div className="flex items-center gap-3 mb-4">
            <Users size={24} className="text-black dark:text-white" />
            <h1 className="text-lg font-bold text-black dark:text-white">
              {activeTab === 'following' ? 'Following' : 'Followers'}
            </h1>
          </div>

          {/* Search */}
          <div className="relative mb-3">
            <Search
              size={18}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400"
            />
            <input
              type="text"
              placeholder={`Search ${activeTab}...`}
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-10 py-2.5 rounded-full bg-neutral-100 dark:bg-neutral-800 text-black dark:text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-neutral-300 dark:focus:ring-neutral-600"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-neutral-200 dark:hover:bg-neutral-700"
              >
                <X size={14} className="text-neutral-500" />
              </button>
            )}
          </div>

          {/* Tabs */}
          <div className="flex gap-1">
            <button
              onClick={() => setActiveTab('following')}
              className={`flex-1 py-2 text-sm font-medium rounded-lg transition-colors ${
                activeTab === 'following'
                  ? 'bg-black dark:bg-white text-white dark:text-black'
                  : 'text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-800'
              }`}
            >
              Following
            </button>
            <button
              onClick={() => setActiveTab('followers')}
              className={`flex-1 py-2 text-sm font-medium rounded-lg transition-colors ${
                activeTab === 'followers'
                  ? 'bg-black dark:bg-white text-white dark:text-black'
                  : 'text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-800'
              }`}
            >
              Followers
            </button>
          </div>
        </div>
      </div>

      {/* Users List */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 size={32} className="animate-spin text-neutral-400" />
        </div>
      ) : filteredUsers.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-neutral-500">
          <Users size={48} className="mb-4 text-neutral-300" />
          <h2 className="text-lg font-semibold text-black dark:text-white mb-2">
            {searchQuery
              ? 'No users found'
              : activeTab === 'following'
              ? 'Not following anyone'
              : 'No followers yet'}
          </h2>
          <p className="text-sm">
            {searchQuery
              ? 'Try a different search'
              : 'Start connecting with people'}
          </p>
        </div>
      ) : (
        <div className="divide-y divide-neutral-200 dark:divide-neutral-800">
          {filteredUsers.map(user => {
            const isFollowingUser =
              activeTab === 'following' ? true : user.isFollowing;
            const mutationLoading =
              (followMutation.isPending || unfollowMutation.isPending) &&
              (followMutation.variables === user._id ||
                unfollowMutation.variables === user._id);

            return (
              <div
                key={user._id}
                className="px-4 py-3 hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  {/* Avatar */}
                  <Link
                    to={`/profile/${user._id}`}
                    className="relative flex-shrink-0"
                  >
                    <img
                      src={
                        user.avatar ||
                        `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.username}`
                      }
                      alt={user.name || user.username}
                      className="w-12 h-12 rounded-full object-cover border-2 border-neutral-200 dark:border-neutral-700"
                    />
                    {user.isVerified && (
                      <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full bg-black dark:bg-white flex items-center justify-center border-2 border-white dark:border-neutral-900">
                        <Check
                          size={8}
                          className="text-white dark:text-black"
                        />
                      </div>
                    )}
                  </Link>

                  {/* User Info */}
                  <div className="flex-1 min-w-0">
                    <Link
                      to={`/profile/${user._id}`}
                      className="font-medium text-black dark:text-white hover:underline truncate block"
                    >
                      {user.fullName || user.name || user.username}
                    </Link>
                    <p className="text-sm text-neutral-500 truncate">
                      @{user.username}
                    </p>
                    {user.bio && (
                      <p className="text-sm text-neutral-600 dark:text-neutral-400 truncate">
                        {user.bio}
                      </p>
                    )}
                  </div>

                  {/* Follow Button - Don't show for self */}
                  {user._id !== authUser?._id && (
                    <button
                      onClick={() =>
                        handleToggleFollow(user._id, isFollowingUser)
                      }
                      disabled={mutationLoading}
                      className={`flex items-center gap-1.5 text-sm px-4 py-2 rounded-full font-medium flex-shrink-0 transition-colors ${
                        mutationLoading ? 'opacity-50 cursor-not-allowed' : ''
                      } ${
                        isFollowingUser
                          ? 'bg-neutral-100 dark:bg-neutral-800 text-black dark:text-white border border-neutral-200 dark:border-neutral-700 hover:border-red-500 hover:text-red-500'
                          : 'bg-black dark:bg-white text-white dark:text-black'
                      }`}
                    >
                      {mutationLoading ? (
                        <Loader2 size={14} className="animate-spin" />
                      ) : isFollowingUser ? (
                        <>
                          <Check size={14} />
                          Following
                        </>
                      ) : (
                        <>
                          <UserPlus size={14} />
                          Follow
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default FollowingUser;
