import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  MapPin,
  Link as LinkIcon,
  Calendar,
  MoreHorizontal,
  UserPlus,
  Check,
  X,
  MessageCircle,
  Grid3X3,
  Heart,
  Bookmark,
  Loader2,
} from 'lucide-react';
import Post from '../../feed/Posts/Post';
import FollowList from '../FollowList/FollowList';
import { useDispatch, useSelector } from 'react-redux';
import {
  getProfile,
  followUser,
  unfollowUser,
  checkFollowStatus,
} from '../../../../redux/actions/userActions';
import { createConversation } from '../../../../redux/actions/messageActions';
import { getPostsByUser } from '../../../../redux/actions/postActions';
import { getMyLikedPosts } from '../../../../redux/actions/likeActions';
import { getSavedPosts } from '../../../../redux/actions/savePostActions';
import toast from 'react-hot-toast';

const formatNumber = num => {
  if (num == null) return '0';
  if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
  if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
  return num.toString();
};

const Profile = () => {
  const { userId } = useParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('posts');
  const [isFollowing, setIsFollowing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);
  const [likedPosts, setLikedPosts] = useState([]);
  const [savedPosts, setSavedPosts] = useState([]);
  const [tabLoading, setTabLoading] = useState(false);
  const [showFollowList, setShowFollowList] = useState(null); // 'followers' | 'following' | null
  const dispatch = useDispatch();
  const authUser = useSelector(state => state.auth?.user);
  const { currentUser } = useSelector(state => state.auth);
  const { currentProfile, loading, followStatus } = useSelector(
    state => state.user || {}
  );
  const { userPosts } = useSelector(state => state.post || {});
  const profileId = userId || authUser?._id || currentUser?._id;
  const isOwnProfile =
    !userId || userId === authUser?._id || userId === currentUser?._id;

  useEffect(() => {
    if (profileId) {
      dispatch(getProfile(profileId));
      dispatch(getPostsByUser({ userId: profileId }));
      // Check follow status if not own profile
      if (!isOwnProfile) {
        dispatch(checkFollowStatus(profileId));
      }
    }
  }, [profileId, dispatch, isOwnProfile]);

  // Fetch tab data when switching tabs
  useEffect(() => {
    const fetchTabData = async () => {
      if (!isOwnProfile) return; // Only owner can see likes/saved

      setTabLoading(true);
      try {
        if (activeTab === 'likes') {
          const result = await dispatch(getMyLikedPosts()).unwrap();
          setLikedPosts(result.posts || result || []);
        } else if (activeTab === 'saved') {
          const result = await dispatch(getSavedPosts()).unwrap();
          setSavedPosts(result.posts || result || []);
        }
      } catch (error) {
        console.error('Failed to fetch tab data:', error);
      } finally {
        setTabLoading(false);
      }
    };

    if (activeTab !== 'posts') {
      fetchTabData();
    }
  }, [activeTab, dispatch, isOwnProfile]);

  // Update following state from Redux
  useEffect(() => {
    if (followStatus?.isFollowing !== undefined) {
      setIsFollowing(followStatus.isFollowing);
    } else if (currentProfile?.isFollowing !== undefined) {
      setIsFollowing(currentProfile.isFollowing);
    }
  }, [followStatus, currentProfile]);

  const handleFollow = useCallback(async () => {
    if (followLoading || isOwnProfile) return;
    setFollowLoading(true);

    try {
      if (isFollowing) {
        await dispatch(unfollowUser(profileId)).unwrap();
        setIsFollowing(false);
        toast.success('Đã bỏ theo dõi');
      } else {
        await dispatch(followUser(profileId)).unwrap();
        setIsFollowing(true);
        toast.success('Đã theo dõi');
      }
      dispatch(getProfile(profileId));
    } catch (error) {
      toast.error(error || 'Thao tác thất bại');
    } finally {
      setFollowLoading(false);
    }
  }, [dispatch, isFollowing, profileId, followLoading, isOwnProfile]);

  const handleMessage = useCallback(async () => {
    try {
      const result = await dispatch(createConversation(profileId)).unwrap();
      if (result.data) {
        navigate(`/messages/${result.data._id}`, {
          state: { selectedUser: currentProfile },
        });
      }
    } catch (error) {
      // If conversation already exists, navigate to it
      if (error.includes('already exists')) {
        navigate(`/messages/${profileId}`, {
          state: { selectedUser: currentProfile },
        });
      } else {
        toast.error(error || 'Không thể tạo cuộc trò chuyện');
      }
    }
  }, [dispatch, profileId, navigate, currentProfile]);

  // Show loading state
  if (loading) {
    return (
      <div className="w-full max-w-2xl mx-auto flex items-center justify-center py-20">
        <div className="w-8 h-8 border-2 border-neutral-300 border-t-black dark:border-t-white rounded-full animate-spin" />
      </div>
    );
  }

  const tabs = [
    { id: 'posts', label: 'Posts', icon: Grid3X3 },
    ...(isOwnProfile
      ? [
          { id: 'likes', label: 'Likes', icon: Heart },
          { id: 'saved', label: 'Saved', icon: Bookmark },
        ]
      : []),
  ];

  // Get posts to display based on active tab
  const getTabContent = () => {
    if (tabLoading) {
      return (
        <div className="flex items-center justify-center py-16">
          <Loader2 size={32} className="animate-spin text-neutral-400" />
        </div>
      );
    }

    switch (activeTab) {
      case 'posts':
        if (!userPosts || userPosts.length === 0) {
          return (
            <div className="flex flex-col items-center justify-center py-16 text-neutral-500 min-h-[300px]">
              <Grid3X3
                size={48}
                className="mb-4 text-neutral-300 dark:text-neutral-600"
              />
              <p className="text-lg font-medium">No posts yet</p>
              <p className="text-sm mt-1">Posts will appear here</p>
            </div>
          );
        }
        return userPosts.map(post => <Post key={post._id} data={post} />);

      case 'likes':
        if (!likedPosts || likedPosts.length === 0) {
          return (
            <div className="flex flex-col items-center justify-center py-16 text-neutral-500 min-h-[300px]">
              <Heart
                size={48}
                className="mb-4 text-neutral-300 dark:text-neutral-600"
              />
              <p className="text-lg font-medium">No liked posts yet</p>
              <p className="text-sm mt-1">Posts you like will appear here</p>
            </div>
          );
        }
        return likedPosts.map(post => <Post key={post._id} data={post} />);

      case 'saved':
        if (!savedPosts || savedPosts.length === 0) {
          return (
            <div className="flex flex-col items-center justify-center py-16 text-neutral-500 min-h-[300px]">
              <Bookmark
                size={48}
                className="mb-4 text-neutral-300 dark:text-neutral-600"
              />
              <p className="text-lg font-medium">No saved posts yet</p>
              <p className="text-sm mt-1">Save posts to view them later</p>
            </div>
          );
        }
        return savedPosts.map(post => (
          <Post key={post._id} data={post.post || post} />
        ));

      default:
        return null;
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto">
      {/* Cover Image */}
      <div className="h-48 bg-neutral-100 dark:bg-neutral-800 relative">
        <img
          src={
            currentProfile?.cover?.trim()
              ? currentProfile.cover
              : 'https://cdn2.fptshop.com.vn/unsafe/Uploads/images/tin-tuc/168364/Originals/meme-con-meo%20(1).jpg'
          }
          alt="Cover"
          className="w-full h-full object-cover"
        />
        {/* Avatar - positioned at bottom of cover */}
        <div className="absolute -bottom-16 left-4">
          <img
            src={currentProfile?.avatar}
            alt={currentProfile?.username}
            className="w-32 h-32 rounded-full object-cover border-4 border-white dark:border-neutral-900 bg-white dark:bg-neutral-900"
          />
        </div>
      </div>

      {/* Profile Header */}
      <div className="px-4 pb-4 pt-20 border-b border-neutral-200 dark:border-neutral-800">
        {/* Actions */}
        <div className="flex justify-end mb-4">
          <div className="flex items-center gap-2">
            {isOwnProfile ? (
              <button className="px-4 py-2 rounded-full border border-neutral-200 dark:border-neutral-700 text-black dark:text-white text-sm font-medium hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors">
                Edit Profile
              </button>
            ) : (
              <>
                <button className="p-2 rounded-full border border-neutral-200 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors">
                  <MoreHorizontal size={18} className="text-neutral-500" />
                </button>
                <button
                  onClick={handleMessage}
                  className="p-2 rounded-full border border-neutral-200 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
                >
                  <MessageCircle size={18} className="text-neutral-500" />
                </button>
                <button
                  onClick={handleFollow}
                  disabled={followLoading}
                  className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                    followLoading ? 'opacity-50 cursor-not-allowed' : ''
                  } ${
                    isFollowing
                      ? 'border border-neutral-200 dark:border-neutral-700 text-black dark:text-white hover:border-red-500 hover:text-red-500'
                      : 'bg-black dark:bg-white text-white dark:text-black hover:opacity-90'
                  }`}
                >
                  {followLoading ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : isFollowing ? (
                    <>
                      <Check size={16} />
                      Following
                    </>
                  ) : (
                    <>
                      <UserPlus size={16} />
                      Follow
                    </>
                  )}
                </button>
              </>
            )}
          </div>
        </div>

        {/* User Info */}
        <div className="space-y-3">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-black dark:text-white">
                {currentProfile?.name}
              </h1>
              {currentProfile?.isVerified ? (
                <div className="w-4 h-4 rounded-full bg-black dark:bg-white flex items-center justify-center">
                  <Check size={12} className="text-white dark:text-black" />
                </div>
              ) : (
                <div className="w-4 h-4 rounded-full bg-black dark:bg-white flex items-center justify-center">
                  <X size={12} className="text-white dark:text-black" />
                </div>
              )}
            </div>
            <p className="text-neutral-500">@{currentProfile?.username}</p>
          </div>

          {currentProfile?.bio && currentProfile?.bio.trim() !== '' ? (
            <p className="text-black dark:text-white whitespace-pre-line">
              {currentProfile?.bio}
            </p>
          ) : (
            <p className="text-black dark:text-white whitespace-pre-line">
              Software Developer | Tech Enthusiast | Coffee Lover ☕\nBuilding
              awesome things with code.
            </p>
          )}

          {/* Meta Info */}
          <div className="flex flex-wrap items-center gap-4 text-sm text-neutral-500">
            {currentProfile?.location && (
              <span className="flex items-center gap-1">
                <MapPin size={14} />
                {currentProfile?.location}
              </span>
            )}
            {currentProfile?.website && (
              <a
                href={currentProfile?.website}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-black dark:text-white hover:underline"
              >
                <LinkIcon size={14} />
                {currentProfile?.website.replace('https://', '')}
              </a>
            )}
            <span className="flex items-center gap-1">
              <Calendar size={14} />
              Joined {currentProfile?.createdAt?.slice(0, 7)}
            </span>
          </div>

          {/* Stats */}
          <div className="flex items-center gap-4">
            <button
              onClick={() => setShowFollowList('following')}
              className="hover:underline"
            >
              <span className="font-bold text-black dark:text-white">
                {formatNumber(currentProfile?.followingCount)}
              </span>{' '}
              <span className="text-neutral-500">Following</span>
            </button>
            <button
              onClick={() => setShowFollowList('followers')}
              className="hover:underline"
            >
              <span className="font-bold text-black dark:text-white">
                {formatNumber(currentProfile?.followersCount)}
              </span>{' '}
              <span className="text-neutral-500">Followers</span>
            </button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-neutral-200 dark:border-neutral-800">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 flex items-center justify-center gap-2 py-4 text-sm font-medium transition-colors relative ${
              activeTab === tab.id
                ? 'text-black dark:text-white'
                : 'text-neutral-500 hover:text-black dark:hover:text-white'
            }`}
          >
            <tab.icon size={16} />
            {tab.label}
            {activeTab === tab.id && (
              <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-12 h-1 bg-primary rounded-full" />
            )}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="p-4 space-y-4 min-h-[400px]">{getTabContent()}</div>

      {/* Follow List Modal */}
      <FollowList
        userId={profileId}
        type={showFollowList}
        isOpen={!!showFollowList}
        onClose={() => setShowFollowList(null)}
      />
    </div>
  );
};

export default Profile;
