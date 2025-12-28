import { useCallback, useMemo } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { X, UserPlus, Check, Loader2, Users } from 'lucide-react';
import {
  useFollowers,
  useFollowing,
  useFollowUser,
  useUnfollowUser,
} from '../../../../hooks/useUserQuery';
import toast from 'react-hot-toast';

const FollowList = ({ userId, type = 'followers', isOpen, onClose }) => {
  const navigate = useNavigate();
  const authUser = useSelector(state => state.auth?.user);

  // React Query hooks
  const { data: followersData, isLoading: followersLoading } = useFollowers(
    type === 'followers' && isOpen ? userId : null
  );
  const { data: followingData, isLoading: followingLoading } = useFollowing(
    type === 'following' && isOpen ? userId : null
  );

  const followMutation = useFollowUser();
  const unfollowMutation = useUnfollowUser();

  const users = useMemo(() => {
    if (type === 'followers') return followersData || [];
    return followingData || [];
  }, [type, followersData, followingData]);

  const loading = type === 'followers' ? followersLoading : followingLoading;

  const handleFollow = useCallback(
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

  const handleUserClick = user => {
    navigate(`/profile/${user._id}`);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md bg-white dark:bg-neutral-900 rounded-2xl shadow-xl overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-neutral-200 dark:border-neutral-800">
          <h2 className="text-base font-semibold text-black dark:text-white">
            {type === 'followers' ? 'Followers' : 'Following'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
          >
            <X size={18} className="text-neutral-400" />
          </button>
        </div>

        {/* Content */}
        <div className="max-h-[60vh] overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 size={32} className="animate-spin text-neutral-400" />
            </div>
          ) : users.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-neutral-500">
              <Users
                size={48}
                className="mb-4 text-neutral-300 dark:text-neutral-600"
              />
              <p className="text-base font-medium">
                {type === 'followers'
                  ? 'No followers yet'
                  : 'Not following anyone'}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-neutral-100 dark:divide-neutral-800">
              {users.map(user => {
                const isFollowingUser =
                  user.isFollowing ||
                  (type === 'following' && userId === authUser?._id);
                const mutationLoading =
                  (followMutation.isPending || unfollowMutation.isPending) &&
                  (followMutation.variables === user._id ||
                    unfollowMutation.variables === user._id);

                return (
                  <div
                    key={user._id}
                    className="flex items-center justify-between p-4 hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors"
                  >
                    <div
                      className="flex items-center gap-3 flex-1 cursor-pointer"
                      onClick={() => handleUserClick(user)}
                    >
                      <img
                        src={
                          user.avatar ||
                          `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.username}`
                        }
                        alt={user.username}
                        className="w-12 h-12 rounded-full object-cover border border-neutral-200 dark:border-neutral-700"
                      />
                      <div className="min-w-0">
                        <p className="font-semibold text-black dark:text-white truncate">
                          {user.fullName || user.name || user.username}
                        </p>
                        <p className="text-sm text-neutral-500 truncate">
                          @{user.username}
                        </p>
                      </div>
                    </div>

                    {user._id !== authUser?._id && (
                      <button
                        onClick={() => handleFollow(user._id, isFollowingUser)}
                        disabled={mutationLoading}
                        className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                          mutationLoading ? 'opacity-50 cursor-not-allowed' : ''
                        } ${
                          isFollowingUser
                            ? 'border border-neutral-200 dark:border-neutral-700 text-black dark:text-white hover:border-red-500 hover:text-red-500'
                            : 'bg-black dark:bg-white text-white dark:text-black hover:opacity-90'
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
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FollowList;
