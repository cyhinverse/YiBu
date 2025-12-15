import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { UserPlus, Check, Users, Loader2 } from 'lucide-react';
import {
  getSuggestions,
  followUser,
  unfollowUser,
} from '../../../../redux/actions/userActions';

const SuggestFriends = () => {
  const dispatch = useDispatch();
  const { suggestions: reduxSuggestions } = useSelector(
    state => state.user || {}
  );

  const [suggestions, setSuggestions] = useState([]);
  const [followedUsers, setFollowedUsers] = useState([]);
  const [loadingStates, setLoadingStates] = useState({});
  const [loading, setLoading] = useState(false);

  // Fetch suggestions on mount
  useEffect(() => {
    const fetchSuggestions = async () => {
      setLoading(true);
      try {
        const result = await dispatch(getSuggestions({ limit: 5 })).unwrap();
        const userList = result.users || result.suggestions || result || [];
        setSuggestions(userList);
      } catch (error) {
        console.error('Failed to fetch suggestions:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchSuggestions();
  }, [dispatch]);

  // Sync with redux state
  useEffect(() => {
    if (reduxSuggestions && Array.isArray(reduxSuggestions)) {
      setSuggestions(reduxSuggestions);
    }
  }, [reduxSuggestions]);

  const handleFollow = useCallback(
    async userId => {
      if (loadingStates[userId]) return;

      setLoadingStates(prev => ({ ...prev, [userId]: true }));

      try {
        const isFollowed = followedUsers.includes(userId);

        if (isFollowed) {
          await dispatch(unfollowUser(userId)).unwrap();
          setFollowedUsers(prev => prev.filter(id => id !== userId));
        } else {
          await dispatch(followUser(userId)).unwrap();
          setFollowedUsers(prev => [...prev, userId]);
        }
      } catch (error) {
        console.error('Follow action failed:', error);
      } finally {
        setLoadingStates(prev => ({ ...prev, [userId]: false }));
      }
    },
    [dispatch, followedUsers, loadingStates]
  );

  if (loading) {
    return (
      <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 overflow-hidden">
        <div className="px-4 py-3 border-b border-neutral-200 dark:border-neutral-800">
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

  if (suggestions.length === 0) {
    return null;
  }

  return (
    <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b border-neutral-200 dark:border-neutral-800">
        <h2 className="font-semibold text-black dark:text-white">
          Suggested for you
        </h2>
        <p className="text-sm text-neutral-500">People you may know</p>
      </div>

      {/* Users List */}
      <div className="divide-y divide-neutral-100 dark:divide-neutral-800">
        {suggestions.map(user => {
          const isFollowed = followedUsers.includes(user._id);
          const isLoading = loadingStates[user._id];
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
                    className="w-12 h-12 rounded-full object-cover border-2 border-neutral-200 dark:border-neutral-700"
                  />
                  {user.isVerified && (
                    <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full bg-black dark:bg-white flex items-center justify-center border-2 border-white dark:border-neutral-900">
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
                      <Users size={12} />
                      {user.mutualFriends} mutual friends
                    </p>
                  )}
                </div>

                {/* Follow Button */}
                <button
                  onClick={() => handleFollow(user._id)}
                  disabled={isLoading}
                  className={`flex items-center gap-1.5 text-sm px-4 py-2 rounded-full font-medium flex-shrink-0 transition-colors ${
                    isLoading ? 'opacity-50 cursor-not-allowed' : ''
                  } ${
                    isFollowed
                      ? 'bg-neutral-100 dark:bg-neutral-800 text-black dark:text-white border border-neutral-200 dark:border-neutral-700'
                      : 'bg-black dark:bg-white text-white dark:text-black'
                  }`}
                >
                  {isLoading ? (
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
        className="block px-4 py-3 text-center text-sm font-medium text-black dark:text-white hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors border-t border-neutral-200 dark:border-neutral-800"
      >
        See all suggestions
      </Link>
    </div>
  );
};

export default SuggestFriends;
