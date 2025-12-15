import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import {
  Search,
  TrendingUp,
  Hash,
  UserPlus,
  Check,
  X,
  Flame,
  Users,
  Image,
  Loader2,
} from 'lucide-react';
import toast from 'react-hot-toast';
import {
  getTrendingHashtags,
  getExploreFeed,
  searchPosts,
} from '../../redux/actions/postActions';
import {
  getSuggestions,
  followUser,
  unfollowUser,
  searchUsers,
} from '../../redux/actions/userActions';
import { useDebounce } from '../../hooks/useDebounce';

const formatNumber = num => {
  if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
  if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
  return num?.toString() || '0';
};

const Explore = () => {
  const dispatch = useDispatch();
  const { currentUser } = useSelector(state => state.auth);
  const {
    trendingHashtags,
    posts: explorePosts,
    searchResults: postSearchResults,
    loading: postsLoading,
  } = useSelector(state => state.post);
  const {
    suggestions,
    searchResults,
    loading: usersLoading,
  } = useSelector(state => state.user);

  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('trending');
  const [followingIds, setFollowingIds] = useState(new Set());
  const [loadingIds, setLoadingIds] = useState(new Set());

  const debouncedSearch = useDebounce(searchQuery, 500);

  // Load initial data
  useEffect(() => {
    dispatch(getTrendingHashtags(10));
    dispatch(getSuggestions(10));
    dispatch(getExploreFeed({ page: 1, limit: 18 }));
  }, [dispatch]);

  // Handle search
  useEffect(() => {
    if (debouncedSearch.trim()) {
      dispatch(searchUsers({ query: debouncedSearch, page: 1, limit: 20 }));
      dispatch(searchPosts({ query: debouncedSearch, page: 1, limit: 20 }));
    }
  }, [debouncedSearch, dispatch]);

  // Get people list - search results or suggestions (ensure array)
  const peopleList = Array.isArray(
    debouncedSearch.trim() ? searchResults : suggestions
  )
    ? debouncedSearch.trim()
      ? searchResults
      : suggestions
    : [];

  const handleFollow = useCallback(
    async userId => {
      if (loadingIds.has(userId)) return;

      setLoadingIds(prev => new Set([...prev, userId]));
      const isCurrentlyFollowing = followingIds.has(userId);

      try {
        if (isCurrentlyFollowing) {
          await dispatch(unfollowUser(userId)).unwrap();
          setFollowingIds(prev => {
            const newSet = new Set(prev);
            newSet.delete(userId);
            return newSet;
          });
          toast.success('Đã bỏ theo dõi');
        } else {
          await dispatch(followUser(userId)).unwrap();
          setFollowingIds(prev => new Set([...prev, userId]));
          toast.success('Đã theo dõi');
        }
      } catch (error) {
        toast.error(error || 'Thao tác thất bại');
      } finally {
        setLoadingIds(prev => {
          const newSet = new Set(prev);
          newSet.delete(userId);
          return newSet;
        });
      }
    },
    [dispatch, followingIds, loadingIds]
  );

  const tabs = [
    { id: 'trending', label: 'Trending', icon: TrendingUp },
    { id: 'people', label: 'People', icon: Users },
    { id: 'photos', label: 'Photos', icon: Image },
  ];

  // Get hashtags array - handle both array and object with data property
  const hashtagsArray = Array.isArray(trendingHashtags)
    ? trendingHashtags
    : trendingHashtags?.data || [];

  return (
    <div className="max-w-2xl mx-auto">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white/80 dark:bg-neutral-900/80 backdrop-blur-md border-b border-neutral-200 dark:border-neutral-800">
        <div className="px-4 py-3">
          <h1 className="text-xl font-bold text-black dark:text-white mb-4">
            Explore
          </h1>

          {/* Search */}
          <div className="relative mb-4">
            <Search
              size={18}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400"
            />
            <input
              type="text"
              placeholder="Search topics, people, posts..."
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
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 flex items-center justify-center gap-2 py-2 text-sm font-medium rounded-lg transition-colors ${
                  activeTab === tab.id
                    ? 'bg-black dark:bg-white text-white dark:text-black'
                    : 'text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-800'
                }`}
              >
                <tab.icon size={16} />
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        {/* Trending Tab */}
        {activeTab === 'trending' && (
          <div className="space-y-2">
            {postsLoading && !hashtagsArray?.length ? (
              <div className="flex justify-center py-8">
                <Loader2 className="w-8 h-8 animate-spin text-neutral-400" />
              </div>
            ) : hashtagsArray?.length === 0 ? (
              <div className="text-center py-8 text-neutral-500">
                <TrendingUp size={32} className="mx-auto mb-2 opacity-50" />
                <p>Không có hashtag nổi bật</p>
              </div>
            ) : (
              hashtagsArray.map((item, index) => (
                <Link
                  key={item._id || item.tag}
                  to={`/explore/tag/${item.tag?.replace('#', '')}`}
                  className="flex items-center gap-4 p-3 rounded-xl hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
                >
                  <span className="text-lg font-bold text-neutral-300 dark:text-neutral-600 w-6">
                    {index + 1}
                  </span>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <Hash size={16} className="text-neutral-400" />
                      <span className="font-semibold text-black dark:text-white">
                        {item.tag?.replace('#', '')}
                      </span>
                      {index < 3 && (
                        <Flame size={14} className="text-orange-500" />
                      )}
                    </div>
                    <p className="text-sm text-neutral-500">
                      {formatNumber(item.count || item.posts)} posts
                    </p>
                  </div>
                </Link>
              ))
            )}
          </div>
        )}

        {/* People Tab */}
        {activeTab === 'people' && (
          <div className="space-y-2">
            {usersLoading && !peopleList?.length ? (
              <div className="flex justify-center py-8">
                <Loader2 className="w-8 h-8 animate-spin text-neutral-400" />
              </div>
            ) : peopleList?.length === 0 ? (
              <div className="text-center py-8 text-neutral-500">
                <Users size={32} className="mx-auto mb-2 opacity-50" />
                <p>
                  {debouncedSearch
                    ? 'Không tìm thấy người dùng'
                    : 'Không có gợi ý'}
                </p>
              </div>
            ) : (
              peopleList.map(user => {
                const isFollowed =
                  followingIds.has(user._id) || user.isFollowing;
                const isLoading = loadingIds.has(user._id);
                const isSelf = user._id === currentUser?._id;
                return (
                  <div
                    key={user._id}
                    className="flex items-center gap-3 p-3 rounded-xl hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
                  >
                    <Link
                      to={`/profile/${user.username}`}
                      className="relative flex-shrink-0"
                    >
                      <img
                        src={
                          user.avatar ||
                          `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.username}`
                        }
                        alt={user.name}
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
                    <div className="flex-1 min-w-0">
                      <Link
                        to={`/profile/${user.username}`}
                        className="font-medium text-black dark:text-white hover:underline truncate block"
                      >
                        {user.name || user.username}
                      </Link>
                      <p className="text-sm text-neutral-500 truncate">
                        @{user.username}
                      </p>
                      <p className="text-sm text-neutral-600 dark:text-neutral-400 truncate">
                        {formatNumber(user.followersCount || user.followers)}{' '}
                        followers
                      </p>
                    </div>
                    {!isSelf && (
                      <button
                        onClick={() => handleFollow(user._id)}
                        disabled={isLoading}
                        className={`flex items-center gap-1.5 text-sm px-4 py-2 rounded-full font-medium transition-colors ${
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
                    )}
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* Photos Tab */}
        {activeTab === 'photos' && (
          <div className="grid grid-cols-3 gap-1">
            {postsLoading && !explorePosts?.length ? (
              <div className="col-span-3 flex justify-center py-8">
                <Loader2 className="w-8 h-8 animate-spin text-neutral-400" />
              </div>
            ) : explorePosts?.length === 0 ? (
              <div className="col-span-3 text-center py-8 text-neutral-500">
                <Image size={32} className="mx-auto mb-2 opacity-50" />
                <p>Không có bài viết</p>
              </div>
            ) : (
              (explorePosts || []).map(post => (
                <Link
                  key={post._id}
                  to={`/post/${post._id}`}
                  className="relative aspect-square group overflow-hidden rounded-lg"
                >
                  <img
                    src={
                      post.images?.[0] ||
                      post.image ||
                      'https://via.placeholder.com/400'
                    }
                    alt=""
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <span className="text-white font-medium">
                      ♥ {formatNumber(post.likesCount || post.likes || 0)}
                    </span>
                  </div>
                </Link>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Explore;
