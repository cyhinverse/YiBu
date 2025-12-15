import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { UserPlus, Check, Loader2 } from 'lucide-react';
import {
  followUser,
  unfollowUser,
} from '../../../../redux/actions/userActions';
import toast from 'react-hot-toast';

const TopUser = ({ users = [], loading = false }) => {
  const dispatch = useDispatch();
  const { user: currentUser } = useSelector(state => state.auth);
  const [followingIds, setFollowingIds] = useState(new Set());
  const [loadingIds, setLoadingIds] = useState(new Set());

  const handleFollow = async (e, userId, isFollowed) => {
    e.preventDefault();
    e.stopPropagation();

    if (loadingIds.has(userId)) return;

    setLoadingIds(prev => new Set(prev).add(userId));

    try {
      if (isFollowed) {
        const result = await dispatch(unfollowUser(userId));
        if (unfollowUser.fulfilled.match(result)) {
          setFollowingIds(prev => {
            const next = new Set(prev);
            next.delete(userId);
            return next;
          });
          toast.success('Đã bỏ theo dõi');
        }
      } else {
        const result = await dispatch(followUser(userId));
        if (followUser.fulfilled.match(result)) {
          setFollowingIds(prev => new Set(prev).add(userId));
          toast.success('Đã theo dõi');
        }
      }
    } catch (error) {
      toast.error('Có lỗi xảy ra');
    } finally {
      setLoadingIds(prev => {
        const next = new Set(prev);
        next.delete(userId);
        return next;
      });
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-4">
        <Loader2 className="w-5 h-5 animate-spin text-neutral-400" />
      </div>
    );
  }

  if (!users || users.length === 0) {
    return (
      <p className="text-center text-xs text-neutral-400 py-4">
        Không có gợi ý
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-1">
      {users.map(user => {
        const isFollowed = followingIds.has(user._id) || user.isFollowing;
        const isLoading = loadingIds.has(user._id);
        const isSelf = currentUser?._id === user._id;

        return (
          <Link
            key={user._id}
            to={`/profile/${user._id}`}
            className="px-2 py-2 rounded-xl hover:bg-neutral-100 dark:hover:bg-neutral-800 cursor-pointer transition-all flex items-center gap-3 group"
          >
            {/* Avatar */}
            <div className="relative flex-shrink-0">
              <img
                src={
                  user.avatar ||
                  `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.username}`
                }
                alt={user.name || user.username}
                className="w-10 h-10 rounded-full object-cover border-2 border-neutral-200 dark:border-neutral-700"
              />
              {user.isVerified && (
                <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full bg-black dark:bg-white flex items-center justify-center border-2 border-white dark:border-neutral-900">
                  <Check size={8} className="text-white dark:text-black" />
                </div>
              )}
            </div>

            {/* User Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-sm font-medium text-black dark:text-white truncate">
                  {user.name || user.username}
                </span>
              </div>
              <span className="text-xs text-neutral-500 truncate block">
                @{user.username}
              </span>
            </div>

            {/* Follow Button - Hide if self */}
            {!isSelf && (
              <button
                onClick={e => handleFollow(e, user._id, isFollowed)}
                disabled={isLoading}
                className={`flex items-center gap-1 text-xs px-3 py-1.5 rounded-full font-medium flex-shrink-0 transition-colors disabled:opacity-50 ${
                  isFollowed
                    ? 'bg-neutral-100 dark:bg-neutral-800 text-black dark:text-white border border-neutral-200 dark:border-neutral-700'
                    : 'bg-black dark:bg-white text-white dark:text-black'
                }`}
              >
                {isLoading ? (
                  <Loader2 size={12} className="animate-spin" />
                ) : isFollowed ? (
                  <>
                    <Check size={12} />
                    <span>Following</span>
                  </>
                ) : (
                  <>
                    <UserPlus size={12} />
                    <span>Follow</span>
                  </>
                )}
              </button>
            )}
          </Link>
        );
      })}
    </div>
  );
};

export default TopUser;
