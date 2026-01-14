import { useState, useCallback, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { UserPlus, Check, Users, Loader2 } from 'lucide-react';
import {
  useSuggestions,
  useFollowUser,
  useUnfollowUser,
} from '@/hooks/useUserQuery';
import toast from 'react-hot-toast';

const SuggestFriends = () => {
  // React Query hooks
  const { data: suggestionsData, isLoading: suggestionsLoading } =
    useSuggestions(5);
  const followMutation = useFollowUser();
  const unfollowMutation = useUnfollowUser();

  const [followedUsers, setFollowedUsers] = useState([]);

  const suggestions = useMemo(() => {
    return suggestionsData || [];
  }, [suggestionsData]);

  const handleFollow = useCallback(
    async userId => {
      const isFollowed = followedUsers.includes(userId);

      try {
        if (isFollowed) {
          await unfollowMutation.mutateAsync(userId);
          setFollowedUsers(prev => prev.filter(id => id !== userId));
          toast.success('Đã bỏ theo dõi');
        } else {
          await followMutation.mutateAsync(userId);
          setFollowedUsers(prev => [...prev, userId]);
          toast.success('Đã theo dõi');
        }
      } catch (error) {
        toast.error(error?.response?.data?.message || 'Thao tác thất bại');
      }
    },
    [followedUsers, followMutation, unfollowMutation]
  );

  if (suggestionsLoading) {
    return (
      <div className="bg-white dark:bg-neutral-900 rounded-xl overflow-hidden">
        <div className="px-4 py-3 bg-neutral-50 dark:bg-neutral-800/50">
          <h2 className="font-semibold text-black dark:text-white">
            Suggested for you
          </h2>
          <p className="text-sm text-neutral-500">People you may know</p>
        </div>
        <div className="flex items-center justify-center py-12">
          <Loader2 size={24} className="animate-spin text-neutral-400" />
        </div>
      </div>
    );
  }

  if (!suggestions || suggestions.length === 0) {
    return null;
  }

  return (
    <div className="bg-white dark:bg-neutral-900 rounded-xl overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 bg-neutral-50 dark:bg-neutral-800/50">
        <h2 className="font-semibold text-black dark:text-white">
          Suggested for you
        </h2>
        <p className="text-sm text-neutral-500">People you may know</p>
      </div>

      {/* Users List */}
      <div className="divide-y divide-neutral-50 dark:divide-neutral-800/50">
        {suggestions.map(user => {
          const isFollowed = followedUsers.includes(user._id);
          const mutationLoading =
            (followMutation.isPending || unfollowMutation.isPending) &&
            (followMutation.variables === user._id ||
              unfollowMutation.variables === user._id);

          return (
            <div
              key={user._id}
              className="px-4 py-3 hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors"
            >
              <div className="flex items-start gap-3">
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
                    className="w-12 h-12 rounded-full object-cover"
                  />
                  {user.isVerified && (
                    <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full bg-black dark:bg-white flex items-center justify-center">
                      <Check size={8} className="text-white dark:text-black" />
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
                    <p className="text-sm text-neutral-600 dark:text-neutral-400 truncate mt-0.5">
                      {user.bio}
                    </p>
                  )}
                  {user.mutualFriends > 0 && (
                    <p className="flex items-center gap-1 text-xs text-neutral-500 mt-1">
                      <span className="flex items-center gap-1">
                        <Users size={12} />
                        {user.mutualFriends} mutual friends
                      </span>
                    </p>
                  )}
                </div>

                {/* Follow Button */}
                <button
                  onClick={() => handleFollow(user._id)}
                  disabled={mutationLoading}
                  className={`flex items-center gap-1.5 text-sm px-4 py-2 rounded-full font-medium flex-shrink-0 transition-colors ${
                    mutationLoading ? 'opacity-50 cursor-not-allowed' : ''
                  } ${
                    isFollowed
                      ? 'bg-neutral-200 dark:bg-neutral-800 text-black dark:text-white'
                      : 'bg-black dark:bg-white text-white dark:text-black'
                  }`}
                >
                  {mutationLoading ? (
                    <Loader2 size={14} className="animate-spin" />
                  ) : isFollowed ? (
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
              </div>
            </div>
          );
        })}
      </div>

      {/* See All Link */}
      <Link
        to="/explore/people"
        className="block px-4 py-3 text-center text-sm font-medium text-black dark:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800/50 transition-colors"
      >
        See all suggestions
      </Link>
    </div>
  );
};

export default SuggestFriends;
