import { Link, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { User, Settings, Bookmark, Users, Lock, Check } from 'lucide-react';
import { useProfile } from '@/hooks/useUserQuery';
import LoadingSpinner from '@/components/Common/LoadingSpinner';

const menuItems = [
  { id: 'profile', label: 'Profile', icon: User, path: '/profile' },
  {
    id: 'saved',
    label: 'Saved Posts',
    icon: Bookmark,
    path: '/saved',
  },
  {
    id: 'following',
    label: 'Following',
    icon: Users,
    path: '/profile/following',
  },
  { id: 'friends', label: 'Friends', icon: Users, path: '/profile/friends' },
  { id: 'privacy', label: 'Privacy', icon: Lock, path: '/settings/privacy' },
  { id: 'settings', label: 'Settings', icon: Settings, path: '/settings' },
];

const SideBarProfile = () => {
  const location = useLocation();
  const authUser = useSelector(state => state.auth?.user);
  const userId = authUser?._id || authUser?.id;

  const { data: profileData, isLoading } = useProfile(userId);
  const user = profileData?.data || profileData || authUser;

  if (isLoading) {
    return (
      <aside className="w-64 h-fit sticky top-20 p-4 bg-white dark:bg-neutral-900 rounded-xl">
        <div className="flex items-center justify-center py-8">
          <LoadingSpinner size="sm" />
        </div>
      </aside>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <aside className="w-64 h-fit sticky top-20 p-4 bg-white dark:bg-neutral-900 rounded-xl">
      {/* User Info */}
      <div className="flex items-center gap-3 pb-4 bg-neutral-50 dark:bg-neutral-800/30 p-2 rounded-lg mb-4">
        <div className="relative">
          <img
            src={
              user.avatar ||
              `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.username}`
            }
            alt={user.name || user.fullName}
            className="w-12 h-12 rounded-full object-cover"
          />
          {user.isVerified && (
            <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full bg-black dark:bg-white flex items-center justify-center">
              <Check size={8} className="text-white dark:text-black" />
            </div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-black dark:text-white truncate">
            {user.name || user.fullName}
          </p>
          <p className="text-sm text-neutral-500 truncate">@{user.username}</p>
        </div>
      </div>

      {/* Stats */}
      <div className="flex items-center justify-around py-4 bg-neutral-100/50 dark:bg-neutral-800/20 rounded-lg">
        <div className="text-center">
          <p className="font-bold text-black dark:text-white">
            {user.followingCount || user.following?.length || 0}
          </p>
          <p className="text-xs text-neutral-500">Following</p>
        </div>
        <div className="w-px h-8 bg-neutral-200/50 dark:bg-neutral-700/50" />
        <div className="text-center">
          <p className="font-bold text-black dark:text-white">
            {user.followersCount || user.followers?.length || 0}
          </p>
          <p className="text-xs text-neutral-500">Followers</p>
        </div>
      </div>

      {/* Menu Items */}
      <nav className="pt-4 space-y-1">
        {menuItems.map(item => {
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.id}
              to={item.path}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
                isActive
                  ? 'bg-black dark:bg-white text-white dark:text-black'
                  : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 hover:text-black dark:hover:text-white'
              }`}
            >
              <item.icon size={18} />
              <span className="text-sm font-medium">{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
};

export default SideBarProfile;
