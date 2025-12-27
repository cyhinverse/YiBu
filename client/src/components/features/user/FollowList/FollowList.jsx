import { useEffect, useState, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { X, UserPlus, Check, Loader2, Users } from 'lucide-react';
import {
  getFollowers,
  getFollowing,
  followUser,
  unfollowUser,
} from '../../../../redux/actions/userActions';

const FollowList = ({ userId, type = 'followers', isOpen, onClose }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [followingStates, setFollowingStates] = useState({});
  const [loadingStates, setLoadingStates] = useState({});

  const authUser = useSelector(state => state.auth?.user);

  useEffect(() => {
    const fetchUsers = async () => {
      if (!isOpen || !userId) return;

      setLoading(true);
      try {
        const action = type === 'followers' ? getFollowers : getFollowing;
        const result = await dispatch(action({ userId })).unwrap();
        const userList =
          result.users || result.followers || result.following || result || [];
        setUsers(userList);

        // Initialize following states
        const states = {};
        userList.forEach(user => {
          states[user._id] = user.isFollowing || false;
        });
        setFollowingStates(states);
      } catch (error) {
        console.error('Failed to fetch users:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, [dispatch, userId, type, isOpen]);

  const handleFollow = useCallback(
    async targetUserId => {
      if (loadingStates[targetUserId]) return;

      setLoadingStates(prev => ({ ...prev, [targetUserId]: true }));

      try {
        const isCurrentlyFollowing = followingStates[targetUserId];

        if (isCurrentlyFollowing) {
          await dispatch(unfollowUser(targetUserId)).unwrap();
        } else {
          await dispatch(followUser(targetUserId)).unwrap();
        }

        setFollowingStates(prev => ({
          ...prev,
          [targetUserId]: !isCurrentlyFollowing,
        }));
      } catch (error) {
        console.error('Follow action failed:', error);
      } finally {
        setLoadingStates(prev => ({ ...prev, [targetUserId]: false }));
      }
    },
    [dispatch, followingStates, loadingStates]
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
              {users.map(user => (
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

                  {user._id !== authUser?._id &&
                    !(type === 'following' && followingStates[user._id]) && (
                      <button
                        onClick={() => handleFollow(user._id)}
                        disabled={loadingStates[user._id]}
                        className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                          loadingStates[user._id]
                            ? 'opacity-50 cursor-not-allowed'
                            : ''
                        } ${
                          followingStates[user._id]
                            ? 'border border-neutral-200 dark:border-neutral-700 text-black dark:text-white hover:border-red-500 hover:text-red-500'
                            : 'bg-primary text-primary-foreground hover:opacity-90'
                        }`}
                      >
                        {loadingStates[user._id] ? (
                          <Loader2 size={14} className="animate-spin" />
                        ) : followingStates[user._id] ? (
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
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FollowList;
