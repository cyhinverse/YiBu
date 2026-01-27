import { useState, useRef, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { Search, X, UserPlus, Check, Loader2 } from 'lucide-react';
import { useSearchUsers } from '@/hooks/useSearchQuery';
import { useFollowUser, useUnfollowUser } from '@/hooks/useUserQuery';
import toast from 'react-hot-toast';

const SearchUser = ({ isOpen, onClose }) => {
  const { user: currentUser } = useSelector(state => state.auth);

  const [searchQuery, setSearchQuery] = useState('');
  const searchInputRef = useRef(null);
  const modalRef = useRef(null);
  const [debouncedSearch, setDebouncedSearch] = useState('');

  const followMutation = useFollowUser();
  const unfollowMutation = useUnfollowUser();

  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isOpen]);

  useEffect(() => {
    const handleClickOutside = event => {
      if (modalRef.current && !modalRef.current.contains(event.target)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const { data: searchResults, isLoading: loading } = useSearchUsers({
    query: debouncedSearch,
    page: 1,
    limit: 10,
  });

  const handleFollow = useCallback(
    async (e, userId, isCurrentlyFollowing) => {
      e.preventDefault();
      e.stopPropagation();

      try {
        if (isCurrentlyFollowing) {
          await unfollowMutation.mutateAsync(userId);
          toast.success('Đã bỏ theo dõi');
        } else {
          await followMutation.mutateAsync(userId);
          toast.success('Đã theo dõi');
        }
      } catch (error) {
        toast.error(error?.response?.data?.message || 'Thao tác thất bại');
      }
    },
    [followMutation, unfollowMutation]
  );

  const handleClearSearch = () => {
    setSearchQuery('');
  };

  const users =
    searchResults?.users || searchResults?.data || searchResults || [];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-start justify-center bg-black/50 backdrop-blur-sm pt-[10vh]">
      <div
        ref={modalRef}
        className="w-full max-w-[600px] bg-white dark:bg-neutral-900 rounded-2xl shadow-2xl flex flex-col max-h-[70vh] overflow-hidden mx-4"
      >
        {/* Search Header */}
        <div className="p-4 border-b border-neutral-200 dark:border-neutral-800">
          <div className="relative">
            <Search
              size={18}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400"
            />
            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search users..."
              className="w-full pl-10 pr-10 py-3 rounded-full bg-neutral-100 dark:bg-neutral-800 text-black dark:text-white placeholder:text-neutral-400 text-sm focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white"
            />
            {searchQuery && (
              <button
                onClick={handleClearSearch}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-neutral-200 dark:hover:bg-neutral-700"
              >
                <X size={16} className="text-neutral-400" />
              </button>
            )}
          </div>
        </div>

        {/* Search Results */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="p-8 text-center">
              <Loader2 className="w-6 h-6 animate-spin mx-auto text-neutral-400" />
            </div>
          ) : users.length === 0 ? (
            <div className="p-8 text-center">
              {searchQuery ? (
                <>
                  <Search size={32} className="mx-auto text-neutral-300 mb-2" />
                  <p className="text-neutral-500 text-sm">No users found</p>
                </>
              ) : (
                <>
                  <Search size={32} className="mx-auto text-neutral-300 mb-2" />
                  <p className="text-neutral-500 text-sm">
                    Search for users by name or username
                  </p>
                </>
              )}
            </div>
          ) : (
            users.map(user => {
              const isFollowed = user.isFollowing;
              const isMutationLoading =
                (followMutation.isPending &&
                  followMutation.variables === user._id) ||
                (unfollowMutation.isPending &&
                  unfollowMutation.variables === user._id);
              const isSelf = currentUser?._id === user._id;

              return (
                <Link
                  key={user._id}
                  to={`/profile/${user._id}`}
                  onClick={onClose}
                  className="flex items-center gap-3 p-4 hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors"
                >
                  {/* Avatar */}
                  <img
                    src={
                      user.avatar ||
                      `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.username}`
                    }
                    alt={user.name || user.username}
                    className="w-12 h-12 rounded-full object-cover border-2 border-neutral-200 dark:border-neutral-700"
                  />

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-black dark:text-white truncate">
                        {user.name || user.fullName || user.username}
                      </span>
                    </div>
                    <p className="text-sm text-neutral-500 truncate">
                      @{user.username}
                    </p>
                    {user.bio && (
                      <p className="text-xs text-neutral-400 truncate mt-0.5">
                        {user.bio}
                      </p>
                    )}
                  </div>

                  {/* Follow Button - Don't show for self */}
                  {!isSelf && (
                    <button
                      onClick={e => handleFollow(e, user._id, isFollowed)}
                      disabled={isMutationLoading}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                        isMutationLoading ? 'opacity-50 cursor-not-allowed' : ''
                      } ${
                        isFollowed
                          ? 'bg-neutral-100 dark:bg-neutral-800 text-black dark:text-white border border-neutral-200 dark:border-neutral-700'
                          : 'bg-primary text-primary-foreground'
                      }`}
                    >
                      {isMutationLoading ? (
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
                  )}
                </Link>
              );
            })
          )}
        </div>

        {/* Close Button */}
        <div className="p-4 border-t border-neutral-200 dark:border-neutral-800">
          <button
            onClick={onClose}
            className="w-full py-2.5 rounded-full bg-neutral-100 dark:bg-neutral-800 text-black dark:text-white text-sm font-medium hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default SearchUser;
