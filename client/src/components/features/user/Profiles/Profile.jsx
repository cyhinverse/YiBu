import { useState, useCallback, lazy, Suspense } from 'react';
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
  Share2,
  Loader2,
} from 'lucide-react';
import Post from '../../feed/Posts/Post';
import { useDispatch, useSelector } from 'react-redux';
import {
  useSharedPosts,
  useUserPosts,
  useLikedPosts,
  useSavedPosts,
} from '../../../../hooks/usePostsQuery';
import {
  useProfile,
  useCheckFollow,
  useFollowUser,
  useUnfollowUser,
} from '../../../../hooks/useUserQuery';
import { useCreateConversation } from '../../../../hooks/useMessageQuery';
import { useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';

const FollowList = lazy(() => import('../FollowList/FollowList'));

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
  const [followLoading, setFollowLoading] = useState(false);
  const [showFollowList, setShowFollowList] = useState(null); // 'followers' | 'following' | null
  const dispatch = useDispatch();
  const authUser = useSelector(state => state.auth?.user);
  const { currentUser } = useSelector(state => state.auth);

  const profileId = userId || authUser?._id || currentUser?._id;
  const isOwnProfile =
    !userId || userId === authUser?._id || userId === currentUser?._id;

  // React Query Hooks
  const { data: profileData, isLoading: profileLoading } =
    useProfile(profileId);
  const currentProfile = profileData;

  const { data: followStatusData } = useCheckFollow(profileId, !isOwnProfile);
  const isFollowing = followStatusData?.isFollowing;

  // Posts Query
  const { data: userPostsData, isLoading: isPostsLoading } = useUserPosts(
    activeTab === 'posts' ? profileId : null
  );

  const userPosts =
    userPostsData?.pages?.flatMap(page => page.posts || page) || [];

  // Liked Posts Query (Only for own profile)
  const { data: likedPostsData, isLoading: isLikesLoading } = useLikedPosts(
    activeTab === 'likes' && isOwnProfile
  );

  const likedPosts = likedPostsData?.posts || likedPostsData || [];

  // Saved Posts Query (Only for own profile)
  const { data: savedPostsData, isLoading: isSavedLoading } = useSavedPosts(
    activeTab === 'saved' && isOwnProfile
  );

  const savedPosts = savedPostsData?.posts || savedPostsData || [];

  const queryClient = useQueryClient();

  // React Query for Shared Posts
  const { data: sharedPostsData, isLoading: isSharedLoading } = useSharedPosts(
    activeTab === 'shared' ? profileId : null
  );

  const sharedPosts =
    sharedPostsData?.pages?.flatMap(page => page.posts || page) || [];

  // Mutations
  const followMutation = useFollowUser();
  const unfollowMutation = useUnfollowUser();
  const createConversationMutation = useCreateConversation();

  const handleFollow = useCallback(async () => {
    if (isOwnProfile) return;

    try {
      if (isFollowing) {
        await unfollowMutation.mutateAsync(profileId);
        toast.success('Đã bỏ theo dõi');
      } else {
        await followMutation.mutateAsync(profileId);
        toast.success('Đã theo dõi');
      }
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Thao tác thất bại');
    }
  }, [isFollowing, profileId, isOwnProfile, followMutation, unfollowMutation]);

  const handleMessage = useCallback(async () => {
    try {
      const result = await createConversationMutation.mutateAsync(profileId);
      const conversationId = result?._id || result?.id;

      if (conversationId) {
        navigate(`/messages/${conversationId}`, {
          state: { selectedUser: currentProfile },
        });
      } else {
        navigate(`/messages`, {
          state: { selectedUser: currentProfile, targetUserId: profileId },
        });
      }
    } catch (error) {
      if (error?.response?.data?.message?.includes('already exists')) {
        // Find existing conversation ID if possible or just navigate to messages
        navigate(`/messages`, {
          state: { selectedUser: currentProfile, targetUserId: profileId },
        });
      } else {
        toast.error(
          error?.response?.data?.message || 'Không thể tạo cuộc trò chuyện'
        );
      }
    }
  }, [profileId, navigate, currentProfile, createConversationMutation]);

  // Show loading state
  if (profileLoading) {
    return (
      <div className="w-full max-w-2xl mx-auto flex items-center justify-center py-20">
        <div className="w-8 h-8 border-2 border-neutral-300 border-t-black dark:border-t-white rounded-full animate-spin" />
      </div>
    );
  }

  const tabs = [
    { id: 'posts', label: 'Posts', icon: Grid3X3 },
    { id: 'shared', label: 'Shared', icon: Share2 },
    ...(isOwnProfile
      ? [
          { id: 'likes', label: 'Likes', icon: Heart },
          { id: 'saved', label: 'Saved', icon: Bookmark },
        ]
      : []),
  ];

  const getTabContent = () => {
    switch (activeTab) {
      case 'posts':
        if (isPostsLoading) {
          return (
            <div className="flex items-center justify-center py-16">
              <Loader2 size={32} className="animate-spin text-neutral-400" />
            </div>
          );
        }
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
        return userPosts.map((post, index) => (
          <Post key={post._id || index} data={post} />
        ));

      case 'shared':
        if (isSharedLoading) {
          return (
            <div className="flex items-center justify-center py-16">
              <Loader2 size={32} className="animate-spin text-neutral-400" />
            </div>
          );
        }
        if (!sharedPosts || sharedPosts.length === 0) {
          return (
            <div className="flex flex-col items-center justify-center py-16 text-neutral-500 min-h-[300px]">
              <Share2
                size={48}
                className="mb-4 text-neutral-300 dark:text-neutral-600"
              />
              <p className="text-lg font-medium">No shared posts</p>
              <p className="text-sm mt-1">Posts you share will appear here</p>
            </div>
          );
        }
        return sharedPosts.map((post, index) => (
          <Post key={post._id || index} data={post} />
        ));

      case 'likes':
        if (isLikesLoading) {
          return (
            <div className="flex items-center justify-center py-16">
              <Loader2 size={32} className="animate-spin text-neutral-400" />
            </div>
          );
        }
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
        return Array.isArray(likedPosts)
          ? likedPosts.map((post, index) => (
              <Post key={post._id || index} data={post} />
            ))
          : null;

      case 'saved':
        if (isSavedLoading) {
          return (
            <div className="flex items-center justify-center py-16">
              <Loader2 size={32} className="animate-spin text-neutral-400" />
            </div>
          );
        }
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
        return savedPosts.map((post, index) => (
          <Post key={post._id || index} data={post.post || post} />
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
                  disabled={
                    followMutation.isPending || unfollowMutation.isPending
                  }
                  className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                    followMutation.isPending || unfollowMutation.isPending
                      ? 'opacity-50 cursor-not-allowed'
                      : ''
                  } ${
                    isFollowing
                      ? 'border border-neutral-200 dark:border-neutral-700 text-black dark:text-white hover:border-red-500 hover:text-red-500'
                      : 'bg-black dark:bg-white text-white dark:text-black hover:opacity-90'
                  }`}
                >
                  {followMutation.isPending || unfollowMutation.isPending ? (
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
      <Suspense fallback={null}>
        {showFollowList && (
          <FollowList
            userId={profileId}
            type={showFollowList}
            isOpen={!!showFollowList}
            onClose={() => setShowFollowList(null)}
          />
        )}
      </Suspense>
    </div>
  );
};

export default Profile;
